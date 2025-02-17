const express = require("express");
const db = require("../config/db");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleWare"); // Middleware to protect routes

// ✅ Get all API mappings
router.get("/api-endpoints",authMiddleware, (req, res) => {
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

router.get("/get-profile/:itsId",authMiddleware, async (req, res) => {
    const itsId = req.params.itsId;
    console.log("HERE");
    // URL with dynamic `itsId`
    const url = `https://paktalim.com/admin/ws_app/GetProfileEducation/${itsId}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data" });
    }
});

module.exports = router;