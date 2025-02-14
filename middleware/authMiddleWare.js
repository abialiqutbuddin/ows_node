const jwt = require("jsonwebtoken");
const db = require("../config/db");

// 🔹 Authentication & Role-Based Authorization Middleware
const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Extract Token from Authorization Header
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.status(401).json({ error: "Unauthorized: Token required" });

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({ error: "Unauthorized: Invalid token format" });
        }

        const token = tokenParts[1];

        // ✅ Verify JWT Token & Extract ITS-ID and Role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data (its_id & role) to request

        const { its_id, role } = decoded;
        const { method, originalUrl } = req;

        // ✅ Admins Have Full Access
        if (role === "admin") return next();

        // ✅ Mini-Admins Have Role-Based Access
        if (role === "mini-admin") {
            return checkPermissions(its_id, originalUrl, method, next, res);
        }

        // ✅ Normal Users Have Limited Access
        return checkPermissions("0", originalUrl, method, next, res);

    } catch (error) {
        console.error("Middleware Error:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

// 🔹 Function to Check Feature Permissions
const checkPermissions = async (its_id, next, res) => {
    try {
        const [permissionsResult] = await db.promise().query(`
            SELECT f.feature_name FROM permissions p
            JOIN features f ON p.feature_id = f.id
            WHERE p.its_id = ?
        `, [its_id]);

        if (permissionsResult.length > 0) {
            return next(); // ✅ Allow access
        } else {
            return res.status(403).json({ error: "Forbidden: You do not have permission for this API" });
        }
    } catch (err) {
        console.error("Database Error:", err.message);
        return res.status(500).json({ error: "Database error" });
    }
};

module.exports = authMiddleware;