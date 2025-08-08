// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EventToken} from "./EventToken.sol";
import {BasicNFT} from "./BasicNFT.sol";

contract EventTicketing {
    EventToken public paymentToken;
    BasicNFT public ticketNFT;
    
    address public owner;
    
    struct Event {
        string name;
        uint256 date;
        uint256 price;
        uint256 maxTickets;
        uint256 ticketsSold;
        bool active;
    }
    
    Event public eventInfo;
    
    mapping(address => uint256) public ticketsOwned;
    
    event TicketPurchased(address indexed buyer, uint256 ticketId);
    event EventCancelled();
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier eventActive() {
        require(eventInfo.active, "Event not active");
        _;
    }
    
    constructor(
        address _paymentToken,
        address _ticketNFT,
        string memory _name,
        uint256 _date,
        uint256 _price,
        uint256 _maxTickets
    ) {
        paymentToken = EventToken(_paymentToken);
        ticketNFT = BasicNFT(_ticketNFT);
        owner = msg.sender;
        
        eventInfo = Event({
            name: _name,
            date: _date,
            price: _price,
            maxTickets: _maxTickets,
            ticketsSold: 0,
            active: true
        });
    }
    
    function buyTicket() external eventActive {
        require(eventInfo.ticketsSold < eventInfo.maxTickets, "Sold out");
        require(ticketsOwned[msg.sender] == 0, "Already has ticket");
        
        // Transfer payment tokens
        require(
            paymentToken.transferFrom(msg.sender, owner, eventInfo.price),
            "Payment failed"
        );
        
        // Mint NFT ticket
        uint256 ticketId = ticketNFT.mint(msg.sender);
        
        ticketsOwned[msg.sender] = ticketId;
        eventInfo.ticketsSold++;
        
        emit TicketPurchased(msg.sender, ticketId);
    }
    
    function getTicketCount() external view returns (uint256) {
        return eventInfo.ticketsSold;
    }
    
    function getRemainingTickets() external view returns (uint256) {
        return eventInfo.maxTickets - eventInfo.ticketsSold;
    }
    
    function cancelEvent() external onlyOwner {
        eventInfo.active = false;
        emit EventCancelled();
    }
    
    function withdrawFunds() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        paymentToken.transfer(owner, balance);
    }
}
