const express = require("express");
const db = require("../config/db");
const router = express.Router();

// ✅ Get all admins
router.get("/admins", (req, res) => {
    db.query("SELECT * FROM admins", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Add an admin
router.post("/admins", (req, res) => {
    const { its_id } = req.body;
    db.query("INSERT INTO admins (its_id) VALUES (?)", [its_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Admin added successfully!" });
    });
});

// ❌ Remove an admin
router.delete("/admins/:its_id", (req, res) => {
    const { its_id } = req.params;
    db.query("DELETE FROM admins WHERE its_id = ?", [its_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Admin removed successfully!" });
    });
});

// ✅ Get all mini-admins
router.get("/mini-admins", (req, res) => {
    db.query("SELECT * FROM mini_admins", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Add a mini-admin
router.post("/mini-admins", (req, res) => {
    const { its_id } = req.body;
    db.query("INSERT INTO mini_admins (its_id) VALUES (?)", [its_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Mini-Admin added successfully!" });
    });
});

// ❌ Remove a mini-admin
router.delete("/mini-admins/:its_id", (req, res) => {
    const { its_id } = req.params;
    db.query("DELETE FROM mini_admins WHERE its_id = ?", [its_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Mini-Admin removed successfully!" });
    });
});

module.exports = router;