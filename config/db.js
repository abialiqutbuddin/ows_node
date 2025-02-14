const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "36.50.12.171",  
    user: "aak",      
    password: "aak110", 
    database: "ows",   
    multipleStatements: true
});

// const db = mysql.createConnection({
//     host: "localhost",  // Replace with your host
//     user: "root",       // Replace with your username
//     password: "Abiali46@", // Replace with your password
//     database: "ows",   // Replace with your database name
//     multipleStatements: true
// });

function handleDisconnect() {
    db.connect((err) => {
        if (err) {
            console.error("Database connection failed:", err.stack);
            setTimeout(handleDisconnect, 5000); 
        } else {
            console.log("Connected to MySQL database.");
        }
    });

    db.on("error", (err) => {
        console.error("MySQL error:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.log("Reconnecting to MySQL...");
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

// Keep connection alive
setInterval(() => {
    db.query("SELECT 1", (err) => {
        if (err) {
            console.error("MySQL keep-alive failed:", err);
            handleDisconnect();
        }
    });
}, 60000); 

module.exports = db;