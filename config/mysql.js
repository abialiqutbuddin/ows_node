const mysql = require("mysql2");

// Database Connection
const db2 = mysql.createConnection({
  host: "ls-71e245ea4a0374b94a685ec89d871c50a32f80c2.cotk02keuuc1.us-east-1.rds.amazonaws.com",
  port: "3306",
  user: "ows_user",
  password: "20250507.Osw*",  // Add your database password
  database: "ows_db",
});

const db3 = mysql.createConnection({
  host: '36.50.12.171',
  user: 'aak',
  password: 'Aak@110*',
  port: 3308,
  database: "test_aiut",
});

// Connect to the database.
db2.connect(err => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    //process.exit(1);
  }
  console.log("✅ MySQL Connected...");
});

// Connect to the database.
db3.connect(err => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    //process.exit(1);
  }
  console.log("✅ MySQL TEST AIUT Connected...");
});

module.exports = db2.promise(); // 🔁 export promise version directly
module.exports = db3.promise(); // 🔁 export promise version directly
