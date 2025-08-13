// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IERC7432.sol";

/**
 * @title ERC7432
 * @dev Implementation of ERC-7432 Non-Fungible Token Roles
 */
contract ERC7432 is IERC7432 {
    struct RoleInfo {
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    // Mapping from role => tokenAddress => tokenId => user => RoleInfo
    mapping(bytes32 => mapping(address => mapping(uint256 => mapping(address => RoleInfo)))) private _roles;

    // Mapping from role => tokenAddress => tokenId => user => hasRole
    mapping(bytes32 => mapping(address => mapping(uint256 => mapping(address => bool)))) private _hasRole;

    modifier onlyTokenOwnerOrApproved(address tokenAddress, uint256 tokenId) virtual {
        // This should be implemented by the NFT contract
        // For now, we'll allow anyone to grant roles (in a real implementation, this would be restricted)
        _;
    }

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
    ) external override onlyTokenOwnerOrApproved(tokenAddress, tokenId) {
        require(user != address(0), "ERC7432: user is zero address");
        require(expirationDate > block.timestamp, "ERC7432: expiration date must be in future");

        _roles[role][tokenAddress][tokenId][user] = RoleInfo(expirationDate, revocable, data);
        _hasRole[role][tokenAddress][tokenId][user] = true;

        emit RoleGranted(role, tokenAddress, tokenId, user, expirationDate, revocable, data);
    }

    /**
     * @dev Revokes a role from a user for a specific NFT
     */
    function revokeRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external override onlyTokenOwnerOrApproved(tokenAddress, tokenId) {
        require(_hasRole[role][tokenAddress][tokenId][user], "ERC7432: role not granted");
        
        RoleInfo memory roleInfo = _roles[role][tokenAddress][tokenId][user];
        require(roleInfo.revocable, "ERC7432: role is not revocable");

        delete _roles[role][tokenAddress][tokenId][user];
        delete _hasRole[role][tokenAddress][tokenId][user];

        emit RoleRevoked(role, tokenAddress, tokenId, user);
    }

    /**
     * @dev Checks if a user has a specific role for an NFT
     */
    function hasRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external view override returns (bool) {
        if (!_hasRole[role][tokenAddress][tokenId][user]) {
            return false;
        }

        RoleInfo memory roleInfo = _roles[role][tokenAddress][tokenId][user];
        return block.timestamp <= roleInfo.expirationDate;
    }

    /**
     * @dev Returns the role data for a specific NFT and user
     */
    function roleData(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external view override returns (uint64 expirationDate, bool revocable, bytes memory data) {
        RoleInfo memory roleInfo = _roles[role][tokenAddress][tokenId][user];
        return (roleInfo.expirationDate, roleInfo.revocable, roleInfo.data);
    }
}
