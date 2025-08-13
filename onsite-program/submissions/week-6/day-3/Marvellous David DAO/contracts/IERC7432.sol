// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IERC7432
 * @dev Interface for ERC-7432 Non-Fungible Token Roles
 */
interface IERC7432 {
    /**
     * @dev Emitted when a role is granted to a user for a specific NFT
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address user,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    /**
     * @dev Emitted when a role is revoked from a user for a specific NFT
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address user
    );

    /**
     * @dev Grants a role to a user for a specific NFT
     */
    function grantRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external;

    /**
     * @dev Revokes a role from a user for a specific NFT
     */
    function revokeRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external;

    /**
     * @dev Checks if a user has a specific role for an NFT
     */
    function hasRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external view returns (bool);

    /**
     * @dev Returns the role data for a specific NFT and user
     */
    function roleData(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external view returns (uint64 expirationDate, bool revocable, bytes memory data);
}
