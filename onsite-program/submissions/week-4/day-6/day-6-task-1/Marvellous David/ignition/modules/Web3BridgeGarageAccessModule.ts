import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3BridgeGarageAccessModule = buildModule("Web3BridgeGarageAccessModule", (m) => {
  const web3BridgeGarageAccess = m.contract("Web3BridgeGarageAccess");

  return { web3BridgeGarageAccess };
});

export default Web3BridgeGarageAccessModule;
