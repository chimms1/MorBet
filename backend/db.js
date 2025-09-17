const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",   // change if needed
  password: "",   // set your mysql password
  database: "vuln_app"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected!");
});

module.exports = db;
