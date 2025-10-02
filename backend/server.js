const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const db = require("./db");
const http = require("http"); // for proxying image

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
      const user = results[0]; // contains username, password, wallet, userType

      // Set cookies
      res.cookie("session", username);           // existing cookie
      res.cookie("usertype", user.userType);     // new cookie for userType

      // Redirect to dashboard
      res.redirect("/frontend/dashboard.html");
    } else {
      res.send("Invalid credentials! <a href='/frontend/login.html'>Back</a>");
    }
  });
});

// Route: proxy user image
app.get("/userImage", (req, res) => {
  const userType = req.cookies.usertype || "normal";

  const options = {
    hostname: "localhost",
    port: 4000,
    path: `/getImage?userType=${userType}`,
    method: "GET"
  };

  const proxy = http.request(options, (serverRes) => {
    res.writeHead(serverRes.statusCode, serverRes.headers);
    serverRes.pipe(res); // stream image back to client
  });

  proxy.on("error", (err) => {
    console.error("Error fetching from game server:", err);
    res.status(500).send("Error loading image");
  });

  proxy.end();
});



// Load image in dashboard
/* takes cookies as input, queries the gameserver for image*/


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
// Post a comment (SECURE from SQL Injection)
app.post("/comment", requireLogin, (req, res) => {
  const user = req.cookies.session;
  const { message } = req.body;

  // Use '?' as placeholders for user-supplied data
  const q = 'INSERT INTO comments (username, message) VALUES (?, ?)';

  // Pass the variables in an array. The database driver handles sanitization.
  db.query(q, [user, message], (err) => {
    if (err) {
      console.error(err); // Log the actual error for debugging
      return res.status(500).send("Error posting comment.");
    }
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
// 'bee' OR '/1'='1'
