require("dotenv").config();
const path = require("path");
const express = require("express");

const app = require("./api"); // your main api file

const PORT = process.env.PORT || 10000; // Render uses 10000

// Serve frontend build folder (IMPORTANT: change if folder name different)
app.use(express.static(path.join(__dirname, "public")));

// Catch-all route (ONLY for frontend routes, NOT API)
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
