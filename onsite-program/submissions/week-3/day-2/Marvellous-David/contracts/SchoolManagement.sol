// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract SchoolManagement {
    // Enum for student status
    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    
    // Struct for student information
    struct Student {
        uint id;
        string name;
        uint age;
        Status status;
    }
    
    // Array to store students
    Student[] private students;
    
    // Counter for generating unique IDs
    uint private idCounter;
    
    // Events
    event StudentRegistered(uint id, string name, uint age);
    event StudentUpdated(uint id, string name, uint age);
    event StudentDeleted(uint id);
    event StudentStatusChanged(uint id, Status status);
    
    // Constructor
    constructor() {
        idCounter = 1;
    }
    
    // Function to register a new student
    function registerStudent(string memory _name, uint _age) public returns (uint) {
        // Create new student with unique ID
        Student memory newStudent = Student({
            id: idCounter,
            name: _name,
            age: _age,
            status: Status.ACTIVE  // Default status is ACTIVE
        });
        
        // Add student to array
        students.push(newStudent);
        
        // Emit event
        emit StudentRegistered(idCounter, _name, _age);
        
        // Increment ID counter for next student
        idCounter++;
        
        // Return the assigned ID
        return newStudent.id;
    }
    
    // Function to update student details
    function updateStudent(uint _id, string memory _name, uint _age) public {
        // Find student by ID
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                students[i].name = _name;
                students[i].age = _age;
                emit StudentUpdated(_id, _name, _age);
                return;
            }
        }
        
        // If student not found, revert
        revert("Student not found");
    }
    
    // Function to delete a student
    function deleteStudent(uint _id) public {
        // Find student by ID
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                // Emit event before deletion
                emit StudentDeleted(_id);
                
                // Replace the student to delete with the last student
                students[i] = students[students.length - 1];
                
                // Remove the last student (which is now a duplicate)
                students.pop();
                return;
            }
        }
        
        // If student not found, revert
        revert("Student not found");
    }
    
    // Function to change student status
    function changeStudentStatus(uint _id, Status _status) public {
        // Find student by ID
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                students[i].status = _status;
                emit StudentStatusChanged(_id, _status);
                return;
            }
        }
        
        // If student not found, revert
        revert("Student not found");
    }
    
    // Function to get student details by ID
    function getStudent(uint _id) public view returns (Student memory) {
        // Find student by ID
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                return students[i];
            }
        }
        
        // If student not found, revert
        revert("Student not found");
    }
    
    // Function to get all students
    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }
    
    // Function to get total number of students
    function getTotalStudents() public view returns (uint) {
        return students.length;
    }
}
