// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DudenNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    string public constant TOKEN_URI = "ipfs://bafkreigwln2u6lxt4qwmb4kj7eogahnoldhsaxugyw4jnikilvtlnd3i4y";

    constructor() ERC721("DUDE", "DDE") Ownable(msg.sender) {}

    function mintNFT(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, TOKEN_URI);
        return tokenId;
    }

    function mintMultipleNFTs(address to, uint256 amount) public onlyOwner {
        for (uint256 i = 0; i < amount; i++) {
            mintNFT(to);
        }
    }
}
