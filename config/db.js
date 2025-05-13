const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize("owstest", "aak", "aak110", {
//     host: "localhost", 
//     dialect: "mysql",  
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

const sequelize = new Sequelize("ows_db", "ows_user", "20250507.Osw*", {
    host: "ls-71e245ea4a0374b94a685ec89d871c50a32f80c2.cotk02keuuc1.us-east-1.rds.amazonaws.com", 
    dialect: "mysql", 
    port: 3306, 
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