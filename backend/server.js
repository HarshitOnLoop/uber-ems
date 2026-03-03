require("dotenv").config();
const path = require('path');
// when running locally we start the same express app
const app = require("./api");

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
app.get("*", (req, res) => {
  
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
