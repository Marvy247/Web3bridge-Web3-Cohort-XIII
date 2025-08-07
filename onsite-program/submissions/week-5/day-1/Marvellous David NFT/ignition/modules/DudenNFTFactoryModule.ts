import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DudenNFTFactoryModule = buildModule("DudenNFTFactoryModule", (m) => {
  const dudenNFTFactory = m.contract("DudenNFTFactory");

  return { dudenNFTFactory };
});

export default DudenNFTFactoryModule;
