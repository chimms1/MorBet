const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const db = require("./db");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

function requireLogin(req, res, next) {
  if (!req.cookies.session) return res.redirect("/frontend/login.html");
  next();
}

// Serve static frontend files
app.use("/frontend", express.static("../frontend"));

app.get("/", (req, res) => {
  res.sendFile("login.html", { root: "../frontend" });
});
// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const q = `INSERT INTO users (username, password, wallet) VALUES ('${username}', '${password}', 0)`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.send("User registered! <a href='/frontend/login.html'>Login here</a>");
  });
});

// Login (SQL injection vulnerability)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const q = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.query(q, (err, results) => {
    if (err) return res.send("Error: " + err);
    if (results.length > 0) {
      res.cookie("session",username);
      res.redirect("/frontend/dashboard.html");
    } else {
      res.send("Invalid credentials! <a href = '/frontend/login.html'>Back</a>");
    }
  });
});

// Add Funds
app.post("/addfunds", requireLogin, (req, res) => {
  const amount = parseInt(req.body.amount);
  const user = req.cookies.session;
  const q = `UPDATE users SET wallet = wallet + ${amount} WHERE username='${user}'`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.send("Funds added successfully! <a href='/frontend/dashboard.html'>Back</a>");
  });
});

// Withdraw (CSRF + OS command injection)
app.get("/withdraw", requireLogin, (req, res) => {
  const { account, amount } = req.query;
  if (!account || !amount) return res.send("Invalid request");

  exec("date", (err, stdout) => {   // Vulnerable: OS command injection possible
    res.send(`Transaction successful at: ${stdout} <a href='/frontend/dashboard.html'>Back</a>`);
  });
});

// Change Password (POST CSRF vulnerability)
app.post("/changepassword", requireLogin, (req, res) => {
  const user = req.cookies.session;
  const { newpassword } = req.body;
  const q = `UPDATE users SET password='${newpassword}' WHERE username='${user}'`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.send("Password changed! <a href='/frontend/dashboard.html'>Back</a>");
  });
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/frontend/login.html");
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
