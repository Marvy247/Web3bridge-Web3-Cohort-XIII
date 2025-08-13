import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UniswapPermitSwapperModule = buildModule("UniswapPermitSwapperModule", (m) => {
  const uniswapPermitSwapper = m.contract("UniswapPermitSwapper");

  return { uniswapPermitSwapper };
});

export default UniswapPermitSwapperModule;
