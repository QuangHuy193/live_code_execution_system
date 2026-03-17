const express = require("express");

const sessionRoutes = require("./routes/sessionRoutes");
const executionRoutes = require("./routes/executionRoutes");

const app = express();

app.get("/", (req, res) => {
  res.send("API running")
})

app.use(express.json());

app.use("/code-sessions", sessionRoutes);
app.use("/executions", executionRoutes);

module.exports = app;