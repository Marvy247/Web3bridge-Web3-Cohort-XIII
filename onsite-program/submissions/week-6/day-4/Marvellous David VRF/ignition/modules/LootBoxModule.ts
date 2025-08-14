// This module deploys the LootBox contract with VRF configuration for Sepolia testnet
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VRF_WRAPPER_ADDRESS = "0x195f15F2d49d693cEDc1F7c2d64f41c99E814831";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  console.log("Deploying LootBox with VRF Wrapper:", VRF_WRAPPER_ADDRESS);
  
  const lootBox = m.contract("LootBox", [VRF_WRAPPER_ADDRESS]);

  return { lootBox };
});

export default LootBoxModule;
