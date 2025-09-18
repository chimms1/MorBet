const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "vuln_appuser",   // change if needed
  password: "vuln_app123",   // set your mysql password
  database: "vuln_app"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected!");
});

module.exports = db;
