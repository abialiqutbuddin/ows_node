const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

// User Registration
exports.register = async (req, res) => {
    const { username, password, ITS_ID } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        db.query("SELECT * FROM users WHERE username = ?", [username], async (err, result) => {
            if (result.length > 0) {
                return res.status(400).json({ error: "User already exists." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            db.query("INSERT INTO users (username, password, ITS_ID) VALUES (?, ?, ?)", [username, hashedPassword, ITS_ID], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Database error", details: err });
                }
                res.status(201).json({ message: "User registered successfully." });
            });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err });
    }
};

// User Login
exports.login = (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT ITS_ID, username, password, role_id FROM users WHERE username = ?", [username], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ error: "Invalid username or password." });
        }

        const user = result[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ error: "Invalid username or password." });
        }

        // Fetch role details
        db.query("SELECT role_name, permissions FROM roles WHERE id = ?", [user.role_id], (roleErr, roleResult) => {
            if (roleErr || roleResult.length === 0) {
                return res.status(500).json({ error: "Role not found" });
            }

            const role = roleResult[0];

            // Generate JWT with role & ITS_ID
            const token = jwt.sign(
                { ITS_ID: user.ITS_ID, username: user.username, role: role.role_name, permissions: JSON.parse(role.permissions) },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ token, role: role.role_name, permissions: JSON.parse(role.permissions) });
        });
    });
};