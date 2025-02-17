const express = require("express");
const db = require("../config/db");
const app = express();
const User = require("../models/user.model"); // Import the User model
const bcrypt = require("bcryptjs");
const router = express.Router();
app.use(express.json()); // Parse JSON requests
const authMiddleware = require("../middleware/authMiddleWare"); // Middleware to protect routes

// Create User
router.post("/user",authMiddleware, async (req, res) => {
    try {
        const { its_id, role, name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            its_id,
            role,
            name,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                its_id: user.its_id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Failed to create user:", error);
        return res.status(500).json({ error: "Failed to create user", details: error.message });
    }
});

// Get All users
router.get("/users",authMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["its_id", "role", "name", "email"]
        });

        return res.status(200).json(users);

    } catch (error) {
        console.error("Failed to fetch users:", error);
        return res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
});

// Get user by ITS
router.get("/user/:itsId",authMiddleware, async (req, res) => {
    try {
        const itsId = req.params.itsId;

        const user = await User.findByPk(itsId, {
            attributes: ["its_id", "role", "name", "email"]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Failed to fetch user:", error);
        return res.status(500).json({ error: "Failed to fetch user", details: error.message });
    }
});

// Update users
router.put("/user/:itsId",authMiddleware, async (req, res) => {
    try {
        const itsId = req.params.itsId;
        const { name, role, email } = req.body;

        const user = await User.findByPk(itsId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.update({ name, role, email });

        return res.status(200).json({ message: "User updated successfully", user });

    } catch (error) {
        console.error("Failed to update user:", error);
        return res.status(500).json({ error: "Failed to update user", details: error.message });
    }
});

// Delete users
router.delete("/user/:itsId",authMiddleware, async (req, res) => {
    try {
        const itsId = req.params.itsId;

        const user = await User.findByPk(itsId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.destroy();
        return res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Failed to delete user:", error);
        return res.status(500).json({ error: "Failed to delete user", details: error.message });
    }
});

module.exports = router;