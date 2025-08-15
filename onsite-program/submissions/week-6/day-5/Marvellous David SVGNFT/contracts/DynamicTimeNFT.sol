// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicTimeNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    struct NFTMetadata {
        string name;
        string description;
        string baseColor;
        uint256 createdAt;
        uint256 lastUpdateTime;
    }

    mapping(uint256 => NFTMetadata) public tokenMetadata;
    mapping(uint256 => uint256) public lastRenderTime;

    uint256 public constant UPDATE_INTERVAL = 1 hours;

    constructor() ERC721("DudeTimeNFT", "DTNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    function mintNFT(
        string memory name,
        string memory description,
        string memory baseColor
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        tokenMetadata[tokenId] = NFTMetadata({
            name: name,
            description: description,
            baseColor: baseColor,
            createdAt: block.timestamp,
            lastUpdateTime: block.timestamp
        });

        lastRenderTime[tokenId] = block.timestamp;

        return tokenId;
    }

    function updateMetadata(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        
        tokenMetadata[tokenId].lastUpdateTime = block.timestamp;
        lastRenderTime[tokenId] = block.timestamp;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        NFTMetadata memory metadata = tokenMetadata[tokenId];
        
        uint256 timeElapsed = block.timestamp - metadata.createdAt;
        uint256 daysElapsed = timeElapsed / 1 days;
        uint256 hoursElapsed = (timeElapsed % 1 days) / 1 hours;
        uint256 minutesElapsed = (timeElapsed % 1 hours) / 1 minutes;
        
        string memory currentTime = string(abi.encodePacked(
            Strings.toString(daysElapsed), "d ",
            Strings.toString(hoursElapsed), "h ",
            Strings.toString(minutesElapsed), "m"
        ));
        
        string memory color = _calculateColor(metadata.baseColor, daysElapsed);
        
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#', color, '"/>',
            '<text x="200" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle">',
            metadata.name,
            '</text>',
            '<text x="200" y="200" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Age: ',
            currentTime,
            '</text>',
            '<text x="200" y="250" font-family="Arial" font-size="14" fill="white" text-anchor="middle">',
            metadata.description,
            '</text>',
            '</svg>'
        );

        bytes memory imageData = abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(svg)
        );

        bytes memory json = abi.encodePacked(
            '{"name":"',
            metadata.name,
            " #",
            Strings.toString(tokenId),
            '","description":"',
            metadata.description,
            '","image":"',
            string(imageData),
            '","attributes":[{"trait_type":"Age","value":"',
            currentTime,
            '"},{"trait_type":"Base Color","value":"#',
            metadata.baseColor,
            '"},{"trait_type":"Created","value":"',
            Strings.toString(metadata.createdAt),
            '"}]}'
        );

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(json)
        ));
    }

    function _calculateColor(string memory baseColor, uint256 daysElapsed) private pure returns (string memory) {
        bytes memory colorBytes = bytes(baseColor);
        if (colorBytes.length != 6) return "000000";
        
        uint256 r = _hexCharToUint(colorBytes[0]) * 16 + _hexCharToUint(colorBytes[1]);
        uint256 g = _hexCharToUint(colorBytes[2]) * 16 + _hexCharToUint(colorBytes[3]);
        uint256 b = _hexCharToUint(colorBytes[4]) * 16 + _hexCharToUint(colorBytes[5]);
        
        uint256 factor = 100 - (daysElapsed % 50);
        if (factor < 30) factor = 30;
        
        r = (r * factor) / 100;
        g = (g * factor) / 100;
        b = (b * factor) / 100;
        
        return string(abi.encodePacked(
            _toHexDigit(r / 16),
            _toHexDigit(r % 16),
            _toHexDigit(g / 16),
            _toHexDigit(g % 16),
            _toHexDigit(b / 16),
            _toHexDigit(b % 16)
        ));
    }

    function _hexCharToUint(bytes1 char) private pure returns (uint256) {
        uint8 c = uint8(char);
        if (c >= 48 && c <= 57) return c - 48;
        if (c >= 65 && c <= 70) return c - 55;
        if (c >= 97 && c <= 102) return c - 87;
        return 0;
    }

    function _toHexDigit(uint256 value) private pure returns (bytes1) {
        require(value < 16, "Invalid hex digit");
        return value < 10 ? bytes1(uint8(value + 48)) : bytes1(uint8(value + 87));
    }

    function _exists(uint256 tokenId) private view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }


}
