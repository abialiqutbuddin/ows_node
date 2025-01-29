const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "127.0.0.1",         // Replace with your host
    user: "root",              // Replace with your username
    password: "Abiali46@",     // Replace with your password
    database: "ows",   // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        return;
    }
    console.log("Connected to MySQL database.");
});

module.exports = db;