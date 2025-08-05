import { expect } from "chai";
import { ethers } from "hardhat";
import { Web3BridgeGarageAccess } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Web3BridgeGarageAccess", function () {
  let contract: Web3BridgeGarageAccess;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;

  // Employee roles enum mapping
  const EmployeeRole = {
    MediaTeam: 0,
    Mentors: 1,
    Managers: 2,
    SocialMediaTeam: 3,
    TechnicianSupervisors: 4,
    KitchenStaff: 5
  };

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Web3BridgeGarageAccessFactory = await ethers.getContractFactory("Web3BridgeGarageAccess");
    contract = await Web3BridgeGarageAccessFactory.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Employee Management", function () {
    it("Should add a new employee", async function () {
      await contract.addOrUpdateEmployee(
        addr1.address,
        "John Doe",
        EmployeeRole.MediaTeam,
        true
      );

      const employee = await contract.getEmployeeDetails(addr1.address);
      expect(employee.name).to.equal("John Doe");
      expect(employee.role).to.equal(EmployeeRole.MediaTeam);
      expect(employee.isEmployed).to.be.true;
    });

    it("Should update an existing employee", async function () {
      await contract.addOrUpdateEmployee(
        addr1.address,
        "John Doe",
        EmployeeRole.MediaTeam,
        true
      );

      await contract.addOrUpdateEmployee(
        addr1.address,
        "John Doe Updated",
        EmployeeRole.Managers,
        false
      );

      const employee = await contract.getEmployeeDetails(addr1.address);
      expect(employee.name).to.equal("John Doe Updated");
      expect(employee.role).to.equal(EmployeeRole.Managers);
      expect(employee.isEmployed).to.be.false;
    });

    it("Should emit EmployeeUpdated event when adding/updating employee", async function () {
      await expect(
        contract.addOrUpdateEmployee(addr1.address, "Alice", EmployeeRole.Mentors, true)
      )
        .to.emit(contract, "EmployeeUpdated")
        .withArgs(addr1.address, "Alice", EmployeeRole.Mentors, true);
    });

    it("Should revert when adding employee with empty name", async function () {
      await expect(
        contract.addOrUpdateEmployee(addr1.address, "", EmployeeRole.MediaTeam, true)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should revert when adding employee with zero address", async function () {
      await expect(
        contract.addOrUpdateEmployee(
          ethers.ZeroAddress,
          "Invalid",
          EmployeeRole.MediaTeam,
          true
        )
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Garage Access Control", function () {
    beforeEach(async function () {
      // Add employees with different roles
      await contract.addOrUpdateEmployee(addr1.address, "Media Team Member", EmployeeRole.MediaTeam, true);
      await contract.addOrUpdateEmployee(addr2.address, "Social Media Member", EmployeeRole.SocialMediaTeam, true);
      await contract.addOrUpdateEmployee(addr3.address, "Manager", EmployeeRole.Managers, true);
      await contract.addOrUpdateEmployee(addr4.address, "Terminated Mentor", EmployeeRole.Mentors, false);
    });

    it("Should grant access to Media Team", async function () {
      const [canAccess, reason] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;
      expect(reason).to.equal("Access granted - authorized role");
    });

    it("Should grant access to Mentors", async function () {
      await contract.addOrUpdateEmployee(addr1.address, "Mentor", EmployeeRole.Mentors, true);
      const [canAccess, reason] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;
      expect(reason).to.equal("Access granted - authorized role");
    });

    it("Should grant access to Managers", async function () {
      const [canAccess, reason] = await contract.canAccessGarage(addr3.address);
      expect(canAccess).to.be.true;
      expect(reason).to.equal("Access granted - authorized role");
    });

    it("Should deny access to Social Media Team", async function () {
      const [canAccess, reason] = await contract.canAccessGarage(addr2.address);
      expect(canAccess).to.be.false;
      expect(reason).to.equal("Access denied - role does not have garage access");
    });

    it("Should deny access to Technician Supervisors", async function () {
      await contract.addOrUpdateEmployee(addr2.address, "Technician", EmployeeRole.TechnicianSupervisors, true);
      const [canAccess, reason] = await contract.canAccessGarage(addr2.address);
      expect(canAccess).to.be.false;
      expect(reason).to.equal("Access denied - role does not have garage access");
    });

    it("Should deny access to Kitchen Staff", async function () {
      await contract.addOrUpdateEmployee(addr2.address, "Kitchen Staff", EmployeeRole.KitchenStaff, true);
      const [canAccess, reason] = await contract.canAccessGarage(addr2.address);
      expect(canAccess).to.be.false;
      expect(reason).to.equal("Access denied - role does not have garage access");
    });

    it("Should deny access to terminated employees regardless of role", async function () {
      const [canAccess, reason] = await contract.canAccessGarage(addr4.address);
      expect(canAccess).to.be.false;
      expect(reason).to.equal("Employee is terminated");
    });

    it("Should deny access to non-existent employees", async function () {
      const [canAccess, reason] = await contract.canAccessGarage(
        "0x1234567890123456789012345678901234567890"
      );
      expect(canAccess).to.be.false;
      expect(reason).to.equal("Employee not found");
    });
  });

  describe("Employee List Management", function () {
    it("Should return correct employee count", async function () {
      expect(await contract.getEmployeeCount()).to.equal(0);

      await contract.addOrUpdateEmployee(addr1.address, "Employee 1", EmployeeRole.MediaTeam, true);
      await contract.addOrUpdateEmployee(addr2.address, "Employee 2", EmployeeRole.Managers, true);

      expect(await contract.getEmployeeCount()).to.equal(2);
    });

    it("Should return all employees correctly", async function () {
      await contract.addOrUpdateEmployee(addr1.address, "Alice", EmployeeRole.MediaTeam, true);
      await contract.addOrUpdateEmployee(addr2.address, "Bob", EmployeeRole.Managers, false);
      await contract.addOrUpdateEmployee(addr3.address, "Charlie", EmployeeRole.SocialMediaTeam, true);

      const [addresses, names, roles, employmentStatus] = await contract.getAllEmployees();

      expect(addresses).to.have.length(3);
      expect(names).to.deep.equal(["Alice", "Bob", "Charlie"]);
      expect(roles).to.deep.equal([
        EmployeeRole.MediaTeam,
        EmployeeRole.Managers,
        EmployeeRole.SocialMediaTeam
      ]);
      expect(employmentStatus).to.deep.equal([true, false, true]);
    });

    it("Should handle empty employee list", async function () {
      const [addresses, names, roles, employmentStatus] = await contract.getAllEmployees();
      expect(addresses).to.have.length(0);
      expect(names).to.have.length(0);
      expect(roles).to.have.length(0);
      expect(employmentStatus).to.have.length(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle role changes correctly", async function () {
      // Add as Media Team (has access)
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.MediaTeam, true);
      let [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;

      // Change to Social Media Team (no access)
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.SocialMediaTeam, true);
      [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.false;

      // Change back to Media Team (has access)
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.MediaTeam, true);
      [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;
    });

    it("Should handle employment status changes correctly", async function () {
      // Add as employed Media Team member
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.MediaTeam, true);
      let [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;

      // Terminate employee
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.MediaTeam, false);
      [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.false;

      // Re-employ
      await contract.addOrUpdateEmployee(addr1.address, "John", EmployeeRole.MediaTeam, true);
      [canAccess] = await contract.canAccessGarage(addr1.address);
      expect(canAccess).to.be.true;
    });
  });

  describe("Access Control Matrix", function () {
    const testCases = [
      { role: EmployeeRole.MediaTeam, expectedAccess: true, roleName: "MediaTeam" },
      { role: EmployeeRole.Mentors, expectedAccess: true, roleName: "Mentors" },
      { role: EmployeeRole.Managers, expectedAccess: true, roleName: "Managers" },
      { role: EmployeeRole.SocialMediaTeam, expectedAccess: false, roleName: "SocialMediaTeam" },
      { role: EmployeeRole.TechnicianSupervisors, expectedAccess: false, roleName: "TechnicianSupervisors" },
      { role: EmployeeRole.KitchenStaff, expectedAccess: false, roleName: "KitchenStaff" }
    ];

    testCases.forEach(({ role, expectedAccess, roleName }) => {
      it(`should ${expectedAccess ? "grant" : "deny"} access to ${roleName}`, async function () {
        await contract.addOrUpdateEmployee(addr1.address, roleName, role, true);
        const [canAccess] = await contract.canAccessGarage(addr1.address);
        expect(canAccess).to.equal(expectedAccess);
      });
    });
  });
});
