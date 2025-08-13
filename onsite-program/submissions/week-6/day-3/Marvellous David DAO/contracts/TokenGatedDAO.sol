// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title TokenGatedDAO
 * @dev DAO governance contract with token-gated voting using ERC-7432 roles
 */
contract TokenGatedDAO is Ownable {
    using Math for uint256;
    
    // DAO NFT contract
    DAONFT public immutable daoNFT;
    
    // Simple counter implementation
    uint256 private _currentProposalId = 0;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address target;
        uint256 value;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }
    
    // Voting configuration
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant PROPOSAL_THRESHOLD = 1;
    uint256 public constant QUORUM_PERCENTAGE = 20;
    uint256 public constant PASS_THRESHOLD = 51;
    
    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public latestProposalIds;
    
    // Events
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        string description,
        address target,
        uint256 value,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    
    // Vote types
    enum VoteType {
        Against,
        For,
        Abstain
    }
    
    constructor(address _daoNFT) Ownable(msg.sender) {
        daoNFT = DAONFT(_daoNFT);
    }
    
    /**
     * @dev Creates a new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        address target,
        uint256 value,
        bytes memory callData
    ) external returns (uint256) {
        require(
            daoNFT.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD,
            "TokenGatedDAO: insufficient NFTs to propose"
        );
        
        uint256 proposalId = _currentProposalId;
        _currentProposalId++;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.target = target;
        proposal.value = value;
        proposal.callData = callData;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        
        latestProposalIds[msg.sender] = proposalId;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            description,
            target,
            value,
            proposal.startTime,
            proposal.endTime
        );
        
        return proposalId;
    }
    
    /**
     * @dev Casts a vote on a proposal
     */
    function castVote(uint256 proposalId, uint8 support) external {
        require(support <= 2, "TokenGatedDAO: invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: proposal does not exist");
        require(block.timestamp >= proposal.startTime, "TokenGatedDAO: voting not started");
        require(block.timestamp <= proposal.endTime, "TokenGatedDAO: voting ended");
        require(!proposal.hasVoted[msg.sender], "TokenGatedDAO: already voted");
        
        uint256 votingPower = daoNFT.balanceOf(msg.sender);
        require(votingPower > 0, "TokenGatedDAO: no voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support == uint8(VoteType.Against)) {
            proposal.againstVotes += votingPower;
        } else if (support == uint8(VoteType.For)) {
            proposal.forVotes += votingPower;
        } else if (support == uint8(VoteType.Abstain)) {
            proposal.abstainVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @dev Executes a proposal if it has passed
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: proposal does not exist");
        require(!proposal.executed, "TokenGatedDAO: proposal already executed");
        require(!proposal.canceled, "TokenGatedDAO: proposal canceled");
        require(block.timestamp > proposal.endTime, "TokenGatedDAO: voting not ended");
        
        require(_quorumReached(proposalId), "TokenGatedDAO: quorum not reached");
        require(_voteSucceeded(proposalId), "TokenGatedDAO: proposal not passed");
        
        proposal.executed = true;
        
        (bool success, ) = proposal.target.call{value: proposal.value}(proposal.callData);
        require(success, "TokenGatedDAO: execution failed");
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancels a proposal
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: proposal does not exist");
        require(!proposal.executed, "TokenGatedDAO: proposal already executed");
        require(!proposal.canceled, "TokenGatedDAO: proposal already canceled");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "TokenGatedDAO: only proposer or owner can cancel"
        );
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    /**
     * @dev Checks if quorum has been reached
     */
    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalSupply = daoNFT.totalSupply();
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        return totalVotes >= (totalSupply * QUORUM_PERCENTAGE) / 100;
    }
    
    /**
     * @dev Checks if the vote has succeeded
     */
    function _voteSucceeded(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.forVotes > proposal.againstVotes;
    }
    
    /**
     * @dev Returns the state of a proposal
     */
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: proposal does not exist");
        
        if (proposal.canceled) return "Canceled";
        if (proposal.executed) return "Executed";
        if (block.timestamp < proposal.startTime) return "Pending";
        if (block.timestamp <= proposal.endTime) return "Active";
        if (!_quorumReached(proposalId)) return "Defeated";
        if (!_voteSucceeded(proposalId)) return "Defeated";
        return "Succeeded";
    }
    
    /**
     * @dev Returns the voting power of an address
     */
    function getVotingPower(address account) external view returns (uint256) {
        return daoNFT.balanceOf(account);
    }
    
    /**
     * @dev Returns the proposal details
     */
    function getProposal(uint256 proposalId) external view returns (ProposalInfo memory) {
        Proposal storage proposal = proposals[proposalId];
        return ProposalInfo({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            target: proposal.target,
            value: proposal.value,
            callData: proposal.callData,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            executed: proposal.executed,
            canceled: proposal.canceled
        });
    }

    /**
     * @dev Struct for proposal information
     */
    struct ProposalInfo {
        uint256 id;
        address proposer;
        string title;
        string description;
        address target;
        uint256 value;
        bytes callData;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }
    
    /**
     * @dev Returns the proposal count
     */
    function proposalCount() external view returns (uint256) {
        return _currentProposalId;
    }
    
    /**
     * @dev Returns the DAO configuration
     */
    function getDAOConfig() external pure returns (
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumPercentage,
        uint256 passThreshold
    ) {
        return (
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_PERCENTAGE,
            PASS_THRESHOLD
        );
    }
}

// Interface for DAONFT
interface DAONFT {
    function balanceOf(address owner) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}
