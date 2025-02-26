const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // For password hashing
const User = require("../models/user.model"); // Import User model
const Permission = require("../models/permission.model"); // Import Permission model
const Module = require("../models/module.model"); // Import Module model
const Feature = require("../models/feature.model"); // Import Feature model
const router = express.Router();

// ✅ Login & Get Token with Permissions
router.post("/login", async (req, res) => {
    try {
        const { its_id, password } = req.body;

        if (!its_id || !password) 
            return res.status(400).json({ error: "ITS_ID and password are required" });

        // ✅ Check if user exists
        let user = await User.findOne({ where: { its_id } });

        // ✅ If user does not exist, use ITS_ID = 0 (Default User)
        if (!user) {
            user = await User.findOne({ where: { its_id: "0" } });

            if (!user) return res.status(404).json({ error: "Default user (ITS_ID=0) not found in the system." });

            // ✅ If ITS_ID doesn't exist, return only permissions (skip password check)
            return returnUserPermissions(user, res);
        }

        // ✅ Compare password with hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: "Invalid ITS ID or password" });

        // ✅ Return User & Permissions
        return returnUserPermissions(user, res);

    } catch (err) {
        //console.error("Auth Error:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Function to Fetch User Permissions and Return Response
async function returnUserPermissions(user, res) {
    try {
        // ✅ Get User Permissions (Modules & Features)
        const permissions = await Permission.findAll({
            where: { its_id: user.its_id },
            include: [
                { model: Module, attributes: ["id", "module_name"] },
                { model: Feature, attributes: ["id", "feature_name"] }
            ]
        });

        // ✅ Transform Permissions Data from DB
        let userPermissions = permissions.map(p => ({
            module_id: p.module_id,
            module_name: p.Module?.module_name,
            feature_id: p.feature_id,
            feature_name: p.Feature?.feature_name
        }));

        // ✅ Define Default Permissions for Features 2-6
        const defaultFeatureIds = [2, 3, 4, 5];

        // ✅ Fetch feature details for 2-6 (assuming these exist in DB)
        const defaultFeatures = await Feature.findAll({
            where: { id: defaultFeatureIds },
            attributes: ["id", "feature_name"]
        });

        // ✅ Add Default Features (if they don’t already exist in userPermissions)
        const defaultPermissions = defaultFeatures.map(feature => ({
            module_id: 1, // Assuming default features aren't tied to a specific module
            module_name: "edu_assistance",
            feature_id: feature.id,
            feature_name: feature.feature_name
        }));

        const defaultPermissions2 = defaultFeatures.map(feature => ({
            module_id: 2, // Assuming default features aren't tied to a specific module
            module_name: "admin_panel",
            feature_id: 6,
            feature_name: 'view_requests'
        }));

        // ✅ Merge Both Permissions
        userPermissions = [...userPermissions, ...defaultPermissions, ...defaultPermissions2];

        // ✅ Generate JWT Token
        const tokenPayload = {
            its_id: user.its_id,
            role: user.role,
            name: user.name,
            email: user.email,
            mohalla: user.mohalla,
            umoor: user.umoor,
            permissions: userPermissions
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

        return res.json({
            message: "Login successful!",
            user: tokenPayload,
            token
        });

    } catch (error) {
        console.error("Permission Error:", error.message);
        return res.status(500).json({ error: "Error fetching permissions" });
    }
}

// // ✅ Register New User
// router.post("/register", async (req, res) => {
//     try {
//         const { its_id, role, name, email, password } = req.body;

//         if (!its_id || !name || !email || !password) 
//             return res.status(400).json({ error: "All fields are required" });

//         // ✅ Check if user already exists
//         const existingUser = await User.findOne({ where: { its_id } });
//         if (existingUser) return res.status(400).json({ error: "User already exists" });

//         // ✅ Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // ✅ Create new user
//         const newUser = await User.create({
//             its_id,
//             role: role || "user",
//             name,
//             email,
//             password: hashedPassword
//         });

//         return res.status(201).json({ message: "User registered successfully!" });

//     } catch (err) {
//         console.error("Registration Error:", err.message);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// });

module.exports = router;