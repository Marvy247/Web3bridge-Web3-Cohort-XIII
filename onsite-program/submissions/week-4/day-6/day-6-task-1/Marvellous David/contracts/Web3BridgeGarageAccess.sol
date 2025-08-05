// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


contract Web3BridgeGarageAccess {
   
    enum EmployeeRole {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

   
    struct Employee {
        string name;
        EmployeeRole role;
        bool isEmployed;
    }

    mapping(address => Employee) public employees;

    address[] public employeeAddresses;

    // Events
    event EmployeeAdded(address indexed employeeAddress, string name, EmployeeRole role);
    event EmployeeUpdated(address indexed employeeAddress, string name, EmployeeRole role, bool isEmployed);
    event AccessGranted(address indexed employeeAddress, string name);
    event AccessDenied(address indexed employeeAddress, string name, string reason);

    
    function addOrUpdateEmployee(
        address _employeeAddress,
        string memory _name,
        EmployeeRole _role,
        bool _isEmployed
    ) public {
        require(_employeeAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name cannot be empty");

       
        if (bytes(employees[_employeeAddress].name).length == 0) {
            employeeAddresses.push(_employeeAddress);
        }

        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            isEmployed: _isEmployed
        });

        emit EmployeeUpdated(_employeeAddress, _name, _role, _isEmployed);
    }

    function canAccessGarage(address _employeeAddress) public view returns (bool canAccess, string memory reason) {
        Employee memory employee = employees[_employeeAddress];
        
        if (bytes(employee.name).length == 0) {
            return (false, "Employee not found");
        }

        if (!employee.isEmployed) {
            return (false, "Employee is terminated");
        }

        if (
            employee.role == EmployeeRole.MediaTeam ||
            employee.role == EmployeeRole.Mentors ||
            employee.role == EmployeeRole.Managers
        ) {
            return (true, "Access granted - authorized role");
        } else {
            return (false, "Access denied - role does not have garage access");
        }
    }

    function getAllEmployees() public view returns (
        address[] memory addresses,
        string[] memory names,
        EmployeeRole[] memory roles,
        bool[] memory employmentStatus
    ) {
        uint256 length = employeeAddresses.length;
        addresses = new address[](length);
        names = new string[](length);
        roles = new EmployeeRole[](length);
        employmentStatus = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            address empAddr = employeeAddresses[i];
            Employee memory emp = employees[empAddr];
            addresses[i] = empAddr;
            names[i] = emp.name;
            roles[i] = emp.role;
            employmentStatus[i] = emp.isEmployed;
        }
    }

    function getEmployeeDetails(address _employeeAddress) public view returns (
        string memory name,
        EmployeeRole role,
        bool isEmployed
    ) {
        Employee memory employee = employees[_employeeAddress];
        require(bytes(employee.name).length > 0, "Employee not found");
        
        return (employee.name, employee.role, employee.isEmployed);
    }

    function getEmployeeCount() public view returns (uint256 count) {
        return employeeAddresses.length;
    }
}
