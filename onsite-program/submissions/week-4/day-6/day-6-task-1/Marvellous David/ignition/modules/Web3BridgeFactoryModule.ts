import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3BridgeFactoryModule = buildModule("Web3BridgeFactoryModule", (m) => {
  const factory = m.contract("Web3BridgeFactory");

  return { factory };
});

export default Web3BridgeFactoryModule;
