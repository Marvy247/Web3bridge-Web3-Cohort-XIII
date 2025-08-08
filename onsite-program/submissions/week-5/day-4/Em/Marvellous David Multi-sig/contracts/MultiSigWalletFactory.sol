// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MultiSigWallet.sol";

contract MultiSigWalletFactory {
    event WalletCreated(
        address indexed wallet,
        address[] owners,
        uint requiredConfirmations
    );

    mapping(address => bool) public isWallet;
    address[] public wallets;

    function createWallet(
        address[] memory _owners,
        uint _requiredConfirmations
    ) public returns (address wallet) {
        MultiSigWallet newWallet = new MultiSigWallet(
            _owners,
            _requiredConfirmations
        );
        
        wallet = address(newWallet);
        isWallet[wallet] = true;
        wallets.push(wallet);
        
        emit WalletCreated(wallet, _owners, _requiredConfirmations);
    }

    function getWallets() public view returns (address[] memory) {
        return wallets;
    }

    function getWalletsCount() public view returns (uint) {
        return wallets.length;
    }
}
