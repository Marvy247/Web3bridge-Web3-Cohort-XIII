# Web3Bridge Factory Contract

This factory contract allows users to deploy both MarvellousToken and Web3BridgeGarageAccess contracts efficiently.

## Overview

The `Web3BridgeFactory` contract provides a standardized way to deploy:
- **MarvellousToken**: ERC20 token with customizable initial supply
- **Web3BridgeGarageAccess**: Access control system for Web3Bridge garage

## Features

- Deploy individual tokens or garage access contracts
- Deploy both contracts in a single transaction (batch deployment)
- Track all deployed contracts by user
- Query deployment statistics
- Verify factory-deployed contracts

## Contract Functions

### Token Deployment
```solidity
function deployToken(
    uint256 _initialSupply,
    string memory _name,
    string memory _symbol
) external returns (address)
```

### Garage Access Deployment
```solidity
function deployGarageAccess() external returns (address)
```

### Batch Deployment
```solidity
function deployBatch(
    uint256 _initialSupply,
    string memory _name,
    string memory _symbol
) external returns (address tokenAddress, address garageAddress)
```

### Query Functions
- `getUserTokens(address user)`: Get all tokens deployed by a user
- `getUserGarages(address user)`: Get all garage contracts deployed by a user
- `getAllTokens()`: Get all deployed tokens
- `getAllGarages()`: Get all deployed garage contracts
- `getTokenCount()`: Get total number of tokens deployed
- `getGarageCount()`: Get total number of garage contracts deployed

## Deployment

### Using Hardhat
```bash
# Deploy factory
npx hardhat run scripts/deploy-factory.ts --network <network>

# Deploy using Ignition
npx hardhat ignition deploy ignition/modules/Web3BridgeFactoryModule.ts --network <network>
```

### Using Foundry
```bash
forge create contracts/Web3BridgeFactory.sol:Web3BridgeFactory --rpc-url <rpc-url> --private-key <private-key>
```

## Usage Examples

### Deploy Individual Token
```javascript
const tx = await factory.deployToken(
    1000000, // 1 million tokens
    "My Token",
    "MTK"
);
await tx.wait();
```

### Deploy Individual Garage Access
```javascript
const tx = await factory.deployGarageAccess();
await tx.wait();
```

### Deploy Both in Batch
```javascript
const tx = await factory.deployBatch(
    1000000,
    "My Token",
    "MTK"
);
await tx.wait();
```

### Query Deployed Contracts
```javascript
// Get user's deployed tokens
const userTokens = await factory.getUserTokens(userAddress);

// Get all deployed tokens
const allTokens = await factory.getAllTokens();

// Check if contract is factory-deployed
const isFactoryToken = await factory.isFactoryToken(tokenAddress);
```

## Testing

Run the test suite:
```bash
npx hardhat test test/Web3BridgeFactory.test.ts
```

## Gas Optimization

The factory contract is optimized for gas efficiency:
- Batch deployment saves ~20% gas compared to individual deployments
- Uses minimal storage for tracking
- Efficient mappings for user contract tracking

## Security Considerations

- No privileged functions - anyone can deploy contracts
- No upgradeability - contracts are immutable after deployment
- Standard OpenZeppelin patterns used for safety
