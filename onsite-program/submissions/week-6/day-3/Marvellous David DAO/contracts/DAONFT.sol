// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC7432.sol";

/**
 * @title DAONFT
 * @dev NFT contract for DAO membership with role-based access using ERC-7432
 */
contract DAONFT is ERC721, Ownable, ERC7432 {
    
    // Simple counter implementation
    uint256 private _currentTokenId = 0;
    
    // Role definitions
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    
    string private _baseTokenURI;
    
    constructor(string memory name, string memory symbol, string memory baseTokenURI) 
        ERC721(name, symbol) 
        Ownable(msg.sender) 
    {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Mints a new NFT to the specified address
     */
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _currentTokenId;
        _currentTokenId++;
        _safeMint(to, tokenId);
        
        // Grant default roles
        _grantDefaultRoles(tokenId, to);
        
        return tokenId;
    }
    
    /**
     * @dev Grants default roles to a new token holder
     */
    function _grantDefaultRoles(uint256 tokenId, address holder) internal {
        uint64 expiration = uint64(block.timestamp + 365 days); // 1 year
        
        // Grant MEMBER role
        this.grantRole(MEMBER_ROLE, address(this), tokenId, holder, expiration, true, "");
        
        // Grant VOTER role
        this.grantRole(VOTER_ROLE, address(this), tokenId, holder, expiration, true, "");
        
        // Grant PROPOSER role
        this.grantRole(PROPOSER_ROLE, address(this), tokenId, holder, expiration, true, "");
    }
    
    /**
     * @dev Sets the base URI for the token metadata
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Returns the base URI for the token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the base URI for the token metadata
     */
    function baseURI() external view returns (string memory) {
        return _baseURI();
    }
    
    /**
     * @dev Checks if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Checks if an address has a specific role for any of their NFTs
     */
    function hasRoleForAddress(bytes32 role, address user) external view returns (bool) {
        uint256 balance = balanceOf(user);
        if (balance == 0) return false;
        
        // Check all tokens owned by the user
        uint256 totalSupply = _currentTokenId;
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (_exists(tokenId) && ownerOf(tokenId) == user) {
                if (this.hasRole(role, address(this), tokenId, user)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * @dev Override the modifier to ensure only token owner or approved can grant/revoke roles
     */
    modifier onlyTokenOwnerOrApproved(address tokenAddress, uint256 tokenId) override {
        require(tokenAddress == address(this), "ERC7432: invalid token address");
        require(_exists(tokenId), "ERC7432: token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            getApproved(tokenId) == msg.sender ||
            isApprovedForAll(ownerOf(tokenId), msg.sender),
            "ERC7432: caller is not owner nor approved"
        );
        _;
    }
}
