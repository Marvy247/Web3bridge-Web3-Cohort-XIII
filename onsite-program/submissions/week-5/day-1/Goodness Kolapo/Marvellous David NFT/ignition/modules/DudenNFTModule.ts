import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DudenNFTModule = buildModule("DudenNFTModule", (m) => {
  const dudenNFT = m.contract("DudenNFT");
  
  return { dudenNFT };
});

export default DudenNFTModule;
