const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const db = require("./db");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Middleware to check login
function requireLogin(req, res, next) {
  // allow register, login, and static frontend without login
  if (
    req.path === "/register" ||
    req.path === "/login" ||
    req.path.startsWith("/frontend")
  ) {
    return next();
  }

  if (!req.cookies.session) {
    return res.redirect("/frontend/login.html");
  }
  next();
}

// Apply middleware globally
app.use(requireLogin);

// Serve static frontend files
app.use("/frontend", express.static("../frontend"));

// Routes
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

// Login (still vulnerable intentionally)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const q = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.query(q, (err, results) => {
    if (err) return res.send("Error: " + err);
    if (results.length > 0) {
      res.cookie("session", username);
      res.redirect("/frontend/dashboard.html");
    } else {
      res.send("Invalid credentials! <a href='/frontend/login.html'>Back</a>");
    }
  });
});

// Add Funds
app.post("/addfunds", (req, res) => {
  const amount = parseInt(req.body.amount);
  const user = req.cookies.session;
  const q = `UPDATE users SET wallet = wallet + ${amount} WHERE username='${user}'`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.send("Funds added successfully! <a href='/frontend/dashboard.html'>Back</a>");
  });
});

// Get current wallet balance
app.get("/balance", requireLogin, (req, res) => {
  const user = req.cookies.session;
  const q = `SELECT wallet FROM users WHERE username='${user}'`;
  db.query(q, (err, results) => {
    if (err) return res.send("Error: " + err);
    if (results.length === 0) return res.send("User not found!");
    res.json({ wallet: results[0].wallet });
  });
});

// Withdraw
// Withdraw (CSRF + OS command injection)
app.get("/withdraw", (req, res) => {
  const { account, amount } = req.query;
  const user = req.cookies.session;

  if (!account || !amount) return res.send("Invalid request");

  const amt = parseInt(amount);

  // First check balance
  const checkQ = `SELECT wallet FROM users WHERE username='${user}'`;
  db.query(checkQ, (err, results) => {
    if (err) return res.send("Error: " + err);
    if (results.length === 0) return res.send("User not found!");

    const balance = results[0].wallet;
    if (balance < amt) {
      return res.send("Insufficient funds! <a href='/frontend/dashboard.html'>Back</a>");
    }

    // Deduct balance
    const updateQ = `UPDATE users SET wallet = wallet - ${amt} WHERE username='${user}'`;
    db.query(updateQ, (err) => {
      if (err) return res.send("Error: " + err);

      // Still showing the "exec" for OS command injection
      exec("date", (err, stdout) => {
        res.send(
          `Withdrew ${amt} to account ${account}. Transaction successful at: ${stdout} <a href='/frontend/dashboard.html'>Back</a>`
        );
      });
    });
  });
});


// Change Password
app.post("/changepassword", (req, res) => {
  const user = req.cookies.session;
  const { newpassword } = req.body;
  const q = `UPDATE users SET password='${newpassword}' WHERE username='${user}'`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.send("Password changed! <a href='/frontend/dashboard.html'>Back</a>");
  });
});

// Get all comments
app.get("/comments", requireLogin, (req, res) => {
  db.query("SELECT username, message FROM comments ORDER BY id DESC", (err, results) => {
    if (err) return res.send("Error: " + err);
    res.json(results);
  });
});

// Post a comment (stored XSS possible)
app.post("/comment", requireLogin, (req, res) => {
  const user = req.cookies.session;
  const { message } = req.body;
  const q = `INSERT INTO comments (username, message) VALUES ('${user}', '${message}')`;
  db.query(q, (err) => {
    if (err) return res.send("Error: " + err);
    res.redirect("/frontend/dashboard.html");
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
