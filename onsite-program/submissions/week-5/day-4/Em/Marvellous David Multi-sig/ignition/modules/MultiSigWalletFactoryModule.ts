import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigWalletFactoryModule = buildModule("MultiSigWalletFactoryModule", (m) => {
  // Deploy the MultiSigWalletFactory contract
  const factory = m.contract("MultiSigWalletFactory", []);
  
  return { factory };
});

export default MultiSigWalletFactoryModule;
