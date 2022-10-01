// Add Express
const express = require("express");
var cors = require('cors')

// Initialize Express
const app = express();
app.use(cors());

// Create GET request
app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.get("/user", (req, res) => {
  res.json({name: 'philena'}).end()
});

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});

// Export the Express API
module.exports = app;