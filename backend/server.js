require("dotenv").config();

// when running locally we start the same express app
const app = require("./api");

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
