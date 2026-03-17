const express = require("express");
const router = express.Router();

const {
  createSession,
  updateCode,
  runCode
} = require("../controllers/sessionController");

router.post("/", createSession);

router.patch("/:id", updateCode);

router.post("/:id/run", runCode);

module.exports = router;