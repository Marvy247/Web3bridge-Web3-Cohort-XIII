# VRF LootBox Project

A decentralized loot box system using Chainlink VRF for provably fair random rewards on the Sepolia testnet.

## Features
- Provably fair random rewards using Chainlink VRF v2.5
- Support for ERC20, ERC721, and ERC1155 tokens
- Configurable loot boxes with different rewards
- Owner management functions
- Gas-optimized VRF integration

## VRF Configuration (Sepolia Testnet)
- **VRF Wrapper Address**: `0x195f15F2d49d693cEDc1F7c2d64f41c99E814831`
- **VRF Coordinator**: `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B`
- **Key Hash**: `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae`
- **Callback Gas Limit**: 100,000
- **Request Confirmations**: 3
- **Number of Words**: 1

## Prerequisites
- Node.js v18+
- Hardhat
- MetaMask wallet with Sepolia testnet
- Sepolia ETH for gas fees
- LINK tokens for VRF requests

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration:
# - PRIVATE_KEY: Your wallet private key
# - RPC_URL: Sepolia RPC endpoint (e.g., from Alchemy/Infura)
# - ETHERSCAN_API_KEY: For contract verification
```

## Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test test/LootBox.test.ts

# Run tests with coverage
npm run coverage
```

## Deployment

### Option 1: Using Hardhat Ignition (Recommended)
```bash
# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/LootBoxModule.ts --network sepolia --verify
```

### Option 2: Using Deployment Script
```bash
# Deploy using custom script
npx hardhat run scripts/deploy-lootbox.ts --network sepolia
```

### Deployment Verification
After deployment, verify your contract on Etherscan:
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> 0x195f15F2d49d693cEDc1F7c2d64f41c99E814831
```

## Post-Deployment Setup

1. **Fund with LINK tokens**: Send LINK tokens to the deployed contract for VRF requests
2. **Create loot boxes**: Use `createLootBox()` to create new loot boxes
3. **Add rewards**: Use `addReward()` to add rewards to loot boxes
4. **Test functionality**: Open loot boxes and verify random reward distribution

## Example Usage

```javascript
// Create a loot box
await lootBox.createLootBox(
  "Epic Loot Box",
  "Contains rare NFTs and tokens",
  ethers.parseEther("0.01"), // Price in ETH
  1000 // Max supply
);

// Add rewards
await lootBox.addReward(
  lootBoxId,
  0, // TokenType.ERC721
  "0x...", // NFT contract address
  1, // Token ID
  1, // Amount
  100 // Weight
);

// Open loot box
await lootBox.openLootBox(lootBoxId, { value: ethers.parseEther("0.01") });
```

## Network Information
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io

## Troubleshooting

### Common Issues
1. **"Insufficient LINK"**: Ensure the contract has enough LINK tokens for VRF requests
2. **"VRF request failed"**: Check VRF wrapper address and LINK balance
3. **"Gas estimation failed"**: Increase gas limit or check contract state

### Getting Test Tokens
- **Sepolia ETH**: Use faucets like https://sepoliafaucet.com or https://faucet.quicknode.com
- **LINK tokens**: Get from https://faucets.chain.link/

## Security Considerations
- Always test thoroughly on testnet before mainnet deployment
- Use proper access controls for admin functions
- Monitor LINK token balance for VRF operations
- Implement proper reentrancy protection (already included)

## License
MIT
