// const mysql = require("mysql2");

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "vuln_appuser",   // change if needed
//   password: "vuln_app123",   // set your mysql password
//   database: "vuln_app"
// });

// db.connect(err => {
//   if (err) throw err;
//   console.log("MySQL connected!");
// });

// module.exports = db;


// backend/db.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "db", // service name in docker-compose
  user: process.env.DB_USER || "vuln_appuser",
  password: process.env.DB_PASS || "vuln_app123",
  database: process.env.DB_NAME || "vuln_app"
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
    throw err;
  }
  console.log("MySQL connected!");
});

module.exports = db;
