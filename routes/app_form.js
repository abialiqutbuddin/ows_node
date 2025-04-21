const express = require("express");
const Student = require("../models/app_form/student.model");

const router = express.Router();

// Insert Student Data
router.post("/add-student", async (req, res) => {
    try {
        const studentData = req.body;
        const newStudent = await Student.create(studentData);
        res.status(201).json({ message: "Student added successfully", student: newStudent });
    } catch (error) {
        res.status(500).json({ message: "Error adding student", error: error.message });
    }
});

module.exports = router;