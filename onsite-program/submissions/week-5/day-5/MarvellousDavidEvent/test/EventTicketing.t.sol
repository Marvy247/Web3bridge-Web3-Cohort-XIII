// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EventTicketing.sol";
import "../src/EventToken.sol";
import "../src/BasicNFT.sol";

contract EventTicketingTest is Test {
    EventTicketing public ticketing;
    EventToken public paymentToken;
    BasicNFT public ticketNFT;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    uint256 public constant INITIAL_SUPPLY = 10000 * 10**18;
    uint256 public constant EVENT_PRICE = 100 * 10**18;
    uint256 public constant EVENT_DATE = 1735689600; // Jan 1, 2025
    uint256 public constant MAX_TICKETS = 100;
    
    function setUp() public {
        // Deploy contracts
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
        
        // Fund test users
        paymentToken.transfer(user1, 1000 * 10**18);
        paymentToken.transfer(user2, 1000 * 10**18);
    }
    
    // Test 1: Constructor sets up event correctly
    function test_Constructor() public {
        assertEq(ticketing.owner(), owner);
        
        (string memory name, uint256 date, uint256 price, uint256 maxTickets, uint256 ticketsSold, bool active) = ticketing.eventInfo();
        
        assertEq(name, "Web3Bridge Conference");
        assertEq(date, EVENT_DATE);
        assertEq(price, EVENT_PRICE);
        assertEq(maxTickets, MAX_TICKETS);
        assertEq(ticketsSold, 0);
        assertTrue(active);
    }
    
    // Test 2: Buy ticket successfully
    function test_BuyTicket() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        uint256 initialBalance = paymentToken.balanceOf(owner);
        
        ticketing.buyTicket();
        
        uint256 finalBalance = paymentToken.balanceOf(owner);
        assertEq(finalBalance - initialBalance, EVENT_PRICE);
        
        assertEq(ticketing.ticketsOwned(user1), 1);
        assertEq(ticketing.getTicketCount(), 1);
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS - 1);
        
        vm.stopPrank();
    }
    
    // Test 3: Cannot buy ticket twice
    function test_CannotBuyTicketTwice() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE * 2);
        
        ticketing.buyTicket();
        
        vm.expectRevert("Already has ticket");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Test 4: Cannot buy ticket when sold out
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
        
        // Try to buy one more
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectRevert("Sold out");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Test 5: Cannot buy ticket when event inactive
    function test_CannotBuyWhenEventInactive() public {
        ticketing.cancelEvent();
        
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectRevert("Event not active");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Test 6: Only owner can cancel event
    function test_OnlyOwnerCanCancelEvent() public {
        vm.startPrank(user1);
        vm.expectRevert("Not owner");
        ticketing.cancelEvent();
        vm.stopPrank();
        
        ticketing.cancelEvent();
        (, , , , , bool active) = ticketing.eventInfo();
        assertFalse(active);
    }
    
    // Test 7: Owner can withdraw funds
    function test_WithdrawFunds() public {
        // Buy some tickets
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        ticketing.buyTicket();
        vm.stopPrank();
        
        vm.startPrank(user2);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        ticketing.buyTicket();
        vm.stopPrank();
        
        uint256 contractBalance = paymentToken.balanceOf(address(ticketing));
        uint256 ownerBalance = paymentToken.balanceOf(owner);
        
        ticketing.withdrawFunds();
        
        assertEq(paymentToken.balanceOf(address(ticketing)), 0);
        assertEq(paymentToken.balanceOf(owner), ownerBalance + contractBalance);
    }
    
    // Test 8: Cannot withdraw when no funds
    function test_CannotWithdrawWhenNoFunds() public {
        vm.expectRevert("No funds to withdraw");
        ticketing.withdrawFunds();
    }
    
    // Test 9: Event emits TicketPurchased event
    function test_EmitsTicketPurchasedEvent() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit TicketPurchased(user1, 1);
        
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Test 10: Event emits EventCancelled event
    function test_EmitsEventCancelledEvent() public {
        vm.expectEmit(true, true, true, true);
        emit EventCancelled();
        
        ticketing.cancelEvent();
    }
    
    // Test 11: Get remaining tickets
    function test_GetRemainingTickets() public {
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS);
        
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        ticketing.buyTicket();
        vm.stopPrank();
        
        assertEq(ticketing.getRemainingTickets(), MAX_TICKETS - 1);
    }
    
    // Test 12: Insufficient payment token approval
    function test_InsufficientApproval() public {
        vm.startPrank(user1);
        paymentToken.approve(address(ticketing), EVENT_PRICE - 1);
        
        vm.expectRevert("Payment failed");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Test 13: Insufficient payment token balance
    function test_InsufficientBalance() public {
        address poorUser = address(0x99);
        vm.startPrank(poorUser);
        paymentToken.approve(address(ticketing), EVENT_PRICE);
        
        vm.expectRevert("Payment failed");
        ticketing.buyTicket();
        
        vm.stopPrank();
    }
    
    // Events for testing
    event TicketPurchased(address indexed buyer, uint256 ticketId);
    event EventCancelled();
}
