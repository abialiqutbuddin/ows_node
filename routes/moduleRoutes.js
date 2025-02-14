const express = require("express");
const db = require("../config/db");
const router = express.Router();

// ✅ Get all modules
router.get("/modules", (req, res) => {
    db.query("SELECT * FROM modules", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Add a module
router.post("/modules", (req, res) => {
    const { module_name } = req.body;
    db.query("INSERT INTO modules (module_name) VALUES (?)", [module_name], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Module added successfully!" });
    });
});

// ✅ Update a module
router.put("/modules/:id", (req, res) => {
    const { module_name } = req.body;
    db.query("UPDATE modules SET module_name = ? WHERE id = ?", [module_name, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Module updated successfully!" });
    });
});

// ❌ Remove a module
router.delete("/modules/:id", (req, res) => {
    db.query("DELETE FROM modules WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Module deleted successfully!" });
    });
});

// ✅ Get all features
router.get("/features", (req, res) => {
    db.query("SELECT f.id, f.feature_name, m.module_name FROM features f JOIN modules m ON f.module_id = m.id", 
    (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ✅ Add a new feature
router.post("/features", (req, res) => {
    const { module_id, feature_name } = req.body;
    db.query("INSERT INTO features (module_id, feature_name) VALUES (?, ?)", 
    [module_id, feature_name], 
    (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Feature added successfully!" });
    });
});

// ✅ Update a feature
router.put("/features/:id", (req, res) => {
    const { feature_name } = req.body;
    db.query("UPDATE features SET feature_name = ? WHERE id = ?", 
    [feature_name, req.params.id], 
    (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Feature updated successfully!" });
    });
});

// ❌ Remove a feature
router.delete("/features/:id", (req, res) => {
    db.query("DELETE FROM features WHERE id = ?", [req.params.id], 
    (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Feature deleted successfully!" });
    });
});


module.exports = router;