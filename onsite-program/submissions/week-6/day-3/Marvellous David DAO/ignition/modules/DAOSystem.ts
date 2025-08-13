import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAOSystemModule = buildModule("DAOSystemModule", (m) => {
  // Deploy DAONFT first
  const daoNFT = m.contract("DAONFT", [
    "Marvellous David DAO",
    "MDD",
    "ipfs://QmYourBaseURI/"
  ]);
  
  // Deploy TokenGatedDAO with DAONFT address
  const tokenGatedDAO = m.contract("TokenGatedDAO", [daoNFT]);
  
  return { daoNFT, tokenGatedDAO };
});

export default DAOSystemModule;
