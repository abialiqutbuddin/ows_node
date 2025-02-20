const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize("owstest", "aak", "aak110", {
//     host: "localhost", 
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

const sequelize = new Sequelize("owstest", "aak", "aak110", {
    host: "36.50.12.171", 
    dialect: "mysql", 
    port: 3309, 
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