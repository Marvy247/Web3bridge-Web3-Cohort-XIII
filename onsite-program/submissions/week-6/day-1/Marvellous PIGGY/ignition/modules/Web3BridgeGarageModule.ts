// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3BridgeGarageModule = buildModule("Web3BridgeGarageModule", (m) => {
  const web3BridgeGarage = m.contract("Web3BridgeGarage", []);

  return { web3BridgeGarage };
});

export default Web3BridgeGarageModule;
