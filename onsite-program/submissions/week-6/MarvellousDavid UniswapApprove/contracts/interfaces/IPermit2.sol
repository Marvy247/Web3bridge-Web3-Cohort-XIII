// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPermit2 {
    struct PermitDetails {
        address token;
        uint160 amount;
        uint48 expiration;
        uint48 nonce;
    }

    struct PermitSingle {
        PermitDetails details;
        address spender;
        uint256 sigDeadline;
    }

    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }

    /// @notice Transfers a token using a signed permit message
    /// @param permit The permit data signed over by the owner
    /// @param owner The owner of the tokens to transfer
    /// @param transferDetails The spender's requested transfer details for the permit
    /// @param signature The signature to verify
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;

    struct PermitTransferFrom {
        PermitDetails permitted;
        address spender;
        uint256 nonce;
        uint256 deadline;
    }

    /// @notice Returns the next nonce for a given owner
    /// @param owner The address to query
    /// @return The next nonce
    function nonceBitmap(address owner, uint256 wordPos) external view returns (uint256);
}
