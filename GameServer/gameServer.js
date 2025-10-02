// server4000.js
const express = require("express");
const path = require("path");

const app = express();

// Example images (put these in a folder named "images" next to this file)
const proImage = path.join(__dirname, "images", "pro.png");
const normalImage = path.join(__dirname, "images", "normal.png");

app.get("/getImage", (req, res) => {
  const userType = req.query.userType; // e.g. /getImage?userType=pro

  if (userType === "pro") {
    res.sendFile(proImage);
  } else {
    res.sendFile(normalImage);
  }
});

app.listen(4000, () => {
  console.log("Image server running on http://localhost:4000");
});
