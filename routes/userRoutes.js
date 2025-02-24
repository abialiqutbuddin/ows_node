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
            mohalla,
            umoor,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                its_id: user.its_id,
                role: user.role,
                name: user.name,
                mohalla: user.mohalla,
                umoor:user.umoor,
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
            attributes: ["its_id", "role", "name", "email","mohalla","umoor"]
        });

        return res.status(200).json(users);

    } catch (error) {
        console.error("Failed to fetch users:", error);
        return res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
});

// Get user by ITS
router.post("/user/get", authMiddleware, async (req, res) => {
    try {
        const { its_id } = req.body;

        // Validate input
        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }

        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        // Fetch user
        const user = await User.findByPk(its_id, {
            attributes: ["its_id", "role", "name", "email","mohalla","umoor"]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Update users
router.put("/user/update", authMiddleware, async (req, res) => {
    try {
        const { its_id, name, role, email } = req.body;

        // ✅ Validate input
        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }
        if (name && typeof name !== "string") {
            return res.status(400).json({ error: "'name' must be a string" });
        }
        if (role && !["admin", "mini-admin", "user"].includes(role)) {
            return res.status(400).json({ error: "Invalid 'role'. Allowed values: 'admin', 'mini-admin', 'user'" });
        }
        if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // ✅ Fetch user
        const user = await User.findByPk(its_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Update user details
        await user.update({ name, role, email });

        return res.status(200).json({ message: "User updated successfully", user });

    } catch (error) {
        console.error("Failed to update user:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Delete users
router.delete("/user/delete", authMiddleware, async (req, res) => {
    try {
        const { its_id } = req.body;

        // ✅ Validate input
        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        // ✅ Fetch user
        const user = await User.findByPk(its_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Delete user
        await user.destroy();
        return res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Failed to delete user:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

router.post("/update-password", async (req, res) => {
    try {
        const { its_id, newPassword } = req.body;

        // ✅ Validate input
        if (!its_id || !newPassword) {
            return res.status(400).json({ error: "ITS ID and new password are required" });
        }

        // ✅ Find the User
        let user = await User.findOne({ where: { its_id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Hash the New Password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // ✅ Update & Save Password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error updating password:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/fix-null-umoor", async (req, res) => {
    try {
        // ✅ Update all users where `umoor` is NULL
        const updatedUsers = await User.update(
            { umoor: "" }, // Set `umoor` to an empty string
            { where: { umoor: null } } // Target records where `umoor` is NULL
        );

        return res.status(200).json({
            message: "All NULL umoor values updated successfully!",
            updatedRecords: updatedUsers[0] // Number of records updated
        });
    } catch (error) {
        console.error("Database Error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;