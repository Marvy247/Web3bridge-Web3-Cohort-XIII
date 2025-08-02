// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployeeManagement {
    enum UserType {
        Mentor,
        Admin,
        Security
    }

    struct Employee {
        uint256 id;
        string name;
        UserType userType;
        uint256 agreedSalary;
        bool isEmployed;
        uint256 totalPaid;
        uint256 registrationTime;
    }

    event EmployeeRegistered(address indexed employeeAddress, uint256 employeeId, string name, UserType userType);
    event SalaryAgreed(address indexed employeeAddress, uint256 amount);
    event SalaryDisbursed(address indexed employeeAddress, uint256 amount);
    event EmployeeStatusChanged(address indexed employeeAddress, bool isEmployed);

    error Unauthorized();
    error EmployeeNotRegistered();
    error EmployeeAlreadyRegistered();
    error InvalidSalaryAmount();
    error EmployeeNotEmployed();
    error OverPaymentAttempt();
    error InsufficientContractBalance();

    function registerEmployee(address employeeAddress, string memory name, UserType userType) external;
    function setAgreedSalary(address employeeAddress, uint256 amount) external;
    function disburseSalary(address employeeAddress) external;
    function changeEmploymentStatus(address employeeAddress, bool isEmployed) external;
    function getEmployee(address employeeAddress) external view returns (Employee memory);
    function getAllEmployees() external view returns (address[] memory);
    function isEmployee(address employeeAddress) external view returns (bool);
    function getEmployeeCount() external view returns (uint256);
}
