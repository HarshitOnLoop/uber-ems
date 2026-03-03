require("dotenv").config();
const path = require('path');
const app = require("./api");

const PORT = process.env.PORT || 5001;

// Static files middleware
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Catch-all route to serve frontend
app.get("*", (req, res) =>
