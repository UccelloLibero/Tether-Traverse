const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files from project root (index.html, assets/, css/, play/, etc.)
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for unknown routes (useful for client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Tether Traverse listening on port ${PORT}`);
});
