const { Sequelize } = require("sequelize");

// const db = mysql.createConnection({
//     host: "36.50.12.171",  
//     user: "aak",      
//     password: "aak110", 
//     database: "ows",   
//     multipleStatements: true
// });

// const db = mysql.createConnection({
//     host: "localhost",  // Replace with your host
//     user: "root",       // Replace with your username
//     password: "Abiali46@", // Replace with your password
//     database: "ows",   // Replace with your database name
//     multipleStatements: true
// });

const sequelize = new Sequelize("ows2", "root", "Abiali46@", {
    host: "localhost", 
    dialect: "mysql",  
    dialectOptions: {
        multipleStatements: true, 
    },
    pool: {
        max: 10, // Max connections
        min: 0,
        acquire: 30000, // Maximum time in ms to try getting a connection
        idle: 10000 // Connection timeout when idle
    },
    logging: false // Set to `true` for debugging SQL queries
});

// const sequelize = new Sequelize("ows", "aak", "aak110", {
//     host: "36.50.12.171", 
//     dialect: "mysql",  
//     dialectOptions: {
//         multipleStatements: true, 
//     },
//     pool: {
//         max: 10, // Max connections
//         min: 0,
//         acquire: 30000, // Maximum time in ms to try getting a connection
//         idle: 10000 // Connection timeout when idle
//     },
//     logging: false // Set to `true` for debugging SQL queries
// });

// ✅ Function to check database connection
async function connectToDatabase() {
    try {
        await sequelize.authenticate();
        console.log("✅ Connected to MySQL database.");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        setTimeout(connectToDatabase, 5000); // Retry connection every 5 seconds
    }
}

// ✅ Keep connection alive
setInterval(async () => {
    try {
        await sequelize.query("SELECT 1");
    } catch (err) {
        console.error("❌ MySQL keep-alive failed:", err.message);
        connectToDatabase();
    }
}, 60000); // Run every 60 seconds

// ✅ Initialize database connection
connectToDatabase();

module.exports = sequelize;