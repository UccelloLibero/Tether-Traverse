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

const server = app.listen(PORT, () => {
  console.log(`Tether Traverse listening on port ${PORT}`);
});

// As a container's main process, Node ignores SIGTERM unless handled. Busy connections get 5
// seconds to finish.
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
