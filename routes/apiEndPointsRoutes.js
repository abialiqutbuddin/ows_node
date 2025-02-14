const express = require("express");
const db = require("../config/db");
const router = express.Router();

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

// ✅ Update an API mapping
router.put("/api-endpoints/:id", (req, res) => {
    const { endpoint, method } = req.body;
    db.query("UPDATE api_endpoints SET endpoint = ?, method = ? WHERE id = ?", 
    [endpoint, method, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "API Mapping updated successfully!" });
    });
});

// ❌ Remove an API mapping
router.delete("/api-endpoints/:id", (req, res) => {
    db.query("DELETE FROM api_endpoints WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "API Mapping deleted successfully!" });
    });
});

module.exports = router;