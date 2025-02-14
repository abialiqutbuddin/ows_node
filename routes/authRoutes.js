const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const router = express.Router();

// ✅ Login & Get Token
router.post("/login", async (req, res) => {
    try {
        const { its_id } = req.body;
        if (!its_id) return res.status(400).json({ error: "ITS_ID is required" });

        // ✅ Step 1: Check if ITS_ID is Admin (Admins have full access)
        const [adminResult] = await db.promise().query("SELECT * FROM admins WHERE its_id = ?", [its_id]);
        if (adminResult.length > 0) {
            const token = jwt.sign({ its_id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "24h" });
            return res.json({ its_id, role: "admin", token });
        }

        // ✅ Step 2: Check if ITS_ID is Mini-Admin
        const [miniAdminResult] = await db.promise().query("SELECT * FROM mini_admins WHERE its_id = ?", [its_id]);
        if (miniAdminResult.length > 0) {
            const token = jwt.sign({ its_id, role: "mini-admin" }, process.env.JWT_SECRET, { expiresIn: "24h" });
            return res.json({ its_id, role: "mini-admin", token });
        }

        // ✅ Normal User - Assign Default Permissions (ITS_ID = 0)
        const token = jwt.sign({ its_id: "0", role: "user" }, process.env.JWT_SECRET, { expiresIn: "24h" });
        return res.json({ its_id: "0", role: "user", token });

    } catch (err) {
        console.error("Auth Error:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;