const mysql = require("mysql2");

// Database Connection
const db2 = mysql.createConnection({
    host: "36.50.12.171",
    port: "3309",
    user: "aak",
    password: "aak110",  // Add your database password
    database: "owstest",
});

//Database Connection
// const db2 = mysql.createConnection({
//     host: "localhost",
//     port: "3306",
//     user: "aak",
//     password: "aak110", 
//     database: "aiut_records",
// });

// Connect to the database.
db2.connect(err => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      //process.exit(1);
    }
    console.log("✅ MySQL Connected...");
  });
  
  module.exports = db2.promise(); // 🔁 export promise version directly