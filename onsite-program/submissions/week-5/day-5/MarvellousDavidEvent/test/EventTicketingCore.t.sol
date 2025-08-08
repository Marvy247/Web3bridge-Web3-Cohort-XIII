// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EventTicketing.sol";
import "../src/EventToken.sol";
import "../src/BasicNFT.sol";

contract EventTicketingCoreTest is Test {
    EventTicketing public ticketing;
    EventToken public paymentToken;
    BasicNFT public ticketNFT;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    uint256 public constant INITIAL_SUPPLY = 10000 * 10**18;
    uint256 public constant EVENT_PRICE = 100 * 10**18;
    uint256 public constant EVENT_DATE = 1735689600;
    uint256 public constant MAX_TICKETS = 100;
    
    function setUp() public {
        paymentToken = new EventToken(INITIAL_SUPPLY);
        ticketNFT = new BasicNFT();
        
        ticketing = new EventTicketing(
            address(paymentToken),
            address(ticketNFT),
            "Web3Bridge Conference",
            EVENT_DATE,
            EVENT_PRICE,
            MAX_TICKETS
        );
        
        paymentToken.transfer(user1, 1000 * 10**18);
        paymentToken.transfer(user2, 1000 * 10**18);
    }
    
    function test_Constructor() public view {
        assertEq(ticketing.owner(), owner);
        
        (string memory name, uint256 date, uint256 price, uint256 maxTickets, uint256 ticketsSold, bool active) = ticketing.eventInfo();
        
        assertEq(name, "Web3Bridge Conference");
        assertEq(date, EVENT_DATE);
        assertEq(price, EVENT_PRICE);
        assertEq(maxTickets, MAX_TICKETS);
        assertEq(ticketsSold, 0);
        assertTrue(active);
    }
    
    function test_BuyTicket() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        uint256 initialOwnerBalance = paymentToken.balanceOf(owner);
        
        ticketing.buyTicket();
        
        assertEq(paymentToken.balanceOf(owner), initialOwnerBalance + EVENT_PRICE);
        assertEq(ticketing.ticketsOwned(user1), 1);
        assertEq(ticketing.getTicketCount(), 1);
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS - 1);
        
        vm.stopPrank();
    }
    
    function test_CannotBuyTicketTwice() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE * 2);
        
        ticketing.buyTicket();
        
        vm.expectRevert("Already has ticket");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    function test_CannotBuyWhenSoldOut() public {
        // Buy all tickets
        for (uint256 i = 0; i < MAX_TICKETS; i++) {
            address buyer = address(uint160(i + 100));
            paymentToken.transfer(buyer, EVENT_PRICE);
            vm.startPrank(buyer);
            paymentToken.approve(address(ticketing), EVENT_PRICE);
            ticketing.buyTicket();
            vm.stopPrank();
        }
        
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectRevert("Sold out");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    function test_CannotBuyWhenEventInactive() public {
        ticketing.cancelEvent();
        
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectRevert("Event not active");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    function test_OnlyOwnerCanCancelEvent() public {
        vm.startPrank(user1);
        vm.expectRevert("Not owner");
        ticketing.cancelEvent();
        vm.stopPrank();
        
        ticketing.cancelEvent();
        (, , , , , bool active) = ticketing.eventInfo();
        assertFalse(active);
    }
    
    function test_GetRemainingTickets() public {
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS);
        
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        ticketing.buyTicket();
        vm.stopPrank();
        
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS - 1);
    }
    
    function test_EventEmitsTicketPurchased() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit TicketPurchased(user1, 1);
        
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    function test_EventEmitsEventCancelled() public {
        vm.expectEmit(true, true, true, true);
        emit EventCancelled();
        
        ticketing.cancelEvent();
    }
    
    event TicketPurchased(address indexed buyer, uint256 ticketId);
    event EventCancelled();
}
