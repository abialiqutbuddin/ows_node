const express = require("express");
const db = require("../config/db");
const router = express.Router();

// ✅ Get all permissions
router.get("/permissions", (req, res) => {
    db.query("SELECT * FROM permissions", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Assign permission
router.post("/permissions", (req, res) => {
    const { its_id, feature_id } = req.body;
    db.query("INSERT INTO permissions (its_id, feature_id) VALUES (?, ?)", [its_id, feature_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Permission assigned successfully!" });
    });
});

// ❌ Remove permission
router.delete("/permissions/:id", (req, res) => {
    db.query("DELETE FROM permissions WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Permission removed successfully!" });
    });
});

// ✅ Get all API mappings
router.get("/api-endpoints", (req, res) => {
    db.query("SELECT * FROM api_endpoints", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Add an API mapping
router.post("/api-endpoints", (req, res) => {
    const { feature_id, endpoint, method } = req.body;
    db.query("INSERT INTO api_endpoints (feature_id, endpoint, method) VALUES (?, ?, ?)", 
    [feature_id, endpoint, method], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "API Mapping added successfully!" });
    });
});

module.exports = router;