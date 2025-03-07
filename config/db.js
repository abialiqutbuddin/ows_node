const { Sequelize } = require("sequelize");
const mysql = require("mysql");

const sequelize = new Sequelize("owstest", "aak", "aak110", {
    host: "localhost", 
    dialect: "mysql",  
    dialectOptions: {
        multipleStatements: true, 
    },
    pool: {
        max: 10, 
        min: 0,
        acquire: 30000, 
        idle: 10000 
    },
    logging: false 
});

// Database Connection
// const db2 = mysql.createConnection({
//     host: "36.50.12.171",
//     port: "3309",
//     user: "aak",
//     password: "aak110",  // Add your database password
//     database: "aiut_records",
// });

// Database Connection
const db2 = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "aak",
    password: "aak110", 
    database: "aiut_records",
});

// const sequelize = new Sequelize("owstest", "aak", "aak110", {
//     host: "36.50.12.171", 
//     dialect: "mysql", 
//     port: 3309, 
//     dialectOptions: {
//         multipleStatements: true, 
//     },
//     pool: {
//         max: 10,
//         min: 0,
//         acquire: 30000, 
//         idle: 10000 
//     },
//     logging: false 
// });

// Function to check database connection
async function connectToDatabase() {
    try {
        await sequelize.authenticate();
        console.log("Connected to MySQL database.");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        setTimeout(connectToDatabase, 5000); 
    }
}

db2.connect(err => {
    if (err) throw err;
    console.log("✅ MySQL Connected...");
});

// Keep connection alive
setInterval(async () => {
    try {
        await sequelize.query("SELECT 1");
    } catch (err) {
        console.error("MySQL keep-alive failed:", err.message);
        connectToDatabase();
    }
}, 60000); 

// Initialize database connection
connectToDatabase();

module.exports = sequelize;