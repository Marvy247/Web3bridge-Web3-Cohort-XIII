const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SchoolManagementModule", (m) => {
  const schoolManagement = m.contract("SchoolManagement", []);

  return { schoolManagement };
});
