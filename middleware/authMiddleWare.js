const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Module = require("../models/module.model");
const Feature = require("../models/feature.model");
const FeatureEndpoint = require("../models/featureEndpoint.model");
const Permission = require("../models/permission.model");

// 🔹 Authentication & Role-Based Authorization Middleware
const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Extract Token from Authorization Header
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.status(401).json({ error: "Unauthorized: Token required" });

        console.log("here");
        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({ error: "Unauthorized: Invalid token format" });
        }

        const token = tokenParts[1];

        // ✅ Verify JWT Token & Extract ITS-ID and Role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        const { its_id, role } = decoded;
        console.log(role);
        const { method, originalUrl } = req;

        // ✅ Admins Have Full Access
        if (role === "admin") return next();

        // ✅ Check User Permissions Based on URL
        return checkPermissions(its_id, originalUrl, next, res);

    } catch (error) {
        console.error("Middleware Error:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

// 🔹 Function to Check Feature Permissions Based on URL
const checkPermissions = async (its_id, originalUrl, next, res) => {
    try {
        let user = await User.findOne({ where: { its_id } });

        // ✅ If user doesn't exist, use default ITS_ID = 0
        if (!user) {
            user = await User.findOne({ where: { its_id: "0" } });

            if (!user) return res.status(404).json({ error: "Default user (ITS_ID=0) not found." });

            its_id = "0"; 
        }

        console.log(originalUrl);

        // ✅ Find Feature for the Requested URL
        const featureEndpoint = await FeatureEndpoint.findOne({
            where: { url_endpoint: originalUrl },
            include: [{ model: Feature }]
        });

        if (!featureEndpoint) return res.status(404).json({ error: "Feature not found for this URL." });

        // ✅ Check if User Has Permission for this Feature
        const permission = await Permission.findOne({
            where: { its_id, feature_id: featureEndpoint.feature_id }
        });

        if (permission) {
            return next(); // ✅ Allow Access
        } else {
            return res.status(403).json({ error: "Forbidden: You do not have permission for this API" });
        }
    } catch (err) {
        console.error("Database Error:", err.message);
        return res.status(500).json({ error: "Database error" });
    }
};

module.exports = authMiddleware;