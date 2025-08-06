// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Web3BridgeGarage {
    
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
        bool exists; 
    }

    
    mapping(address => Employee) private employees;

    
    address[] private employeeAddresses;

   
    address private owner;

    // Events
    event EmployeeAdded(address indexed employeeAddress, string name, EmployeeRole role);
    event EmployeeUpdated(address indexed employeeAddress, string name, EmployeeRole role, bool isEmployed);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier employeeExists(address _employeeAddress) {
        require(employees[_employeeAddress].exists, "Employee does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addOrUpdateEmployee(
        address _employeeAddress,
        string memory _name,
        EmployeeRole _role,
        bool _isEmployed
    ) public onlyOwner {
        
        if (!employees[_employeeAddress].exists) {
            employeeAddresses.push(_employeeAddress);
            employees[_employeeAddress].exists = true;
        }


        employees[_employeeAddress].name = _name;
        employees[_employeeAddress].role = _role;
        employees[_employeeAddress].isEmployed = _isEmployed;

        emit EmployeeUpdated(_employeeAddress, _name, _role, _isEmployed);
    }

    function canAccessGarage(address _employeeAddress) public view employeeExists(_employeeAddress) returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        

        if (!employee.isEmployed) {
            return false;
        }

        return (
            employee.role == EmployeeRole.MediaTeam ||
            employee.role == EmployeeRole.Mentors ||
            employee.role == EmployeeRole.Managers
        );
    }


    function getAllEmployees() public view returns (address[] memory) {
        return employeeAddresses;
    }

    function getEmployee(address _employeeAddress) public view employeeExists(_employeeAddress) returns (Employee memory) {
        return employees[_employeeAddress];
    }

    function getEmployeeCount() public view returns (uint256) {
        return employeeAddresses.length;
    }

    function employeeExistsCheck(address _employeeAddress) public view returns (bool) {
        return employees[_employeeAddress].exists;
    }
}
