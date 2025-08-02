// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IEmployeeManagement.sol";

contract EmployeeManagement is IEmployeeManagement {
    // State variables
    mapping(address => Employee) private employees;
    mapping(uint256 => address) private employeeIdToAddress;
    address[] private employeeAddresses;
    
    uint256 private nextEmployeeId;
    address private contractOwner;
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != contractOwner) {
            revert Unauthorized();
        }
        _;
    }
    
    modifier employeeExists(address employeeAddress) {
        if (!isEmployee(employeeAddress)) {
            revert EmployeeNotRegistered();
        }
        _;
    }
    
    modifier employeeNotExists(address employeeAddress) {
        if (isEmployee(employeeAddress)) {
            revert EmployeeAlreadyRegistered();
        }
        _;
    }
    

    constructor() {
        contractOwner = msg.sender;
        nextEmployeeId = 1;
    }
    
    // employee management functions
    function registerEmployee(
        address employeeAddress, 
        string memory name, 
        UserType userType
    ) external override onlyOwner employeeNotExists(employeeAddress) {
        Employee memory newEmployee = Employee({
            id: nextEmployeeId,
            name: name,
            userType: userType,
            agreedSalary: 0,
            isEmployed: true,
            totalPaid: 0,
            registrationTime: block.timestamp
        });
        
        employees[employeeAddress] = newEmployee;
        employeeIdToAddress[nextEmployeeId] = employeeAddress;
        employeeAddresses.push(employeeAddress);
        nextEmployeeId++;
        
        emit EmployeeRegistered(employeeAddress, newEmployee.id, name, userType);
    }
    
    function setAgreedSalary(
        address employeeAddress, 
        uint256 amount
    ) external override onlyOwner employeeExists(employeeAddress) {
        if (amount == 0) {
            revert InvalidSalaryAmount();
        }
        
        employees[employeeAddress].agreedSalary = amount;
        
        emit SalaryAgreed(employeeAddress, amount);
    }
    
    function disburseSalary(address employeeAddress) external override employeeExists(employeeAddress) {
        Employee storage employee = employees[employeeAddress];

        if (!employee.isEmployed) {
            revert EmployeeNotEmployed();
        }
        
        if (employee.agreedSalary == 0) {
            revert InvalidSalaryAmount();
        }

        if (address(this).balance < employee.agreedSalary) {
            revert InsufficientContractBalance();
        }
        
        if (employee.totalPaid + employee.agreedSalary > employee.agreedSalary) {
            revert OverPaymentAttempt();
        }
        
        employee.totalPaid += employee.agreedSalary;
        
        payable(employeeAddress).transfer(employee.agreedSalary);
        
        emit SalaryDisbursed(employeeAddress, employee.agreedSalary);
    }
    
    function changeEmploymentStatus(
        address employeeAddress, 
        bool isEmployed
    ) external override onlyOwner employeeExists(employeeAddress) {
        employees[employeeAddress].isEmployed = isEmployed;
        
        emit EmployeeStatusChanged(employeeAddress, isEmployed);
    }
    
    function getEmployee(address employeeAddress) external view override employeeExists(employeeAddress) returns (Employee memory) {
        return employees[employeeAddress];
    }
    
    function getAllEmployees() external view override returns (address[] memory) {
        return employeeAddresses;
    }
    
    function isEmployee(address employeeAddress) public view override returns (bool) {
        return employees[employeeAddress].id != 0;
    }
    
    function getEmployeeCount() external view override returns (uint256) {
        return employeeAddresses.length;
    }
    
    receive() external payable {}
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
