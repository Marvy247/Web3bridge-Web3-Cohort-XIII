// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MockERC721 is ERC721URIStorage {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, "https://example.com/token.json");
        return tokenId;
    }

    function mintBatch(address to, uint256 amount) external {
        for (uint256 i = 0; i < amount; i++) {
            this.mint(to);
        }
    }
}
