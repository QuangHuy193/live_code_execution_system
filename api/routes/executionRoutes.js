const express = require("express");
const router = express.Router();

const { getExecution } = require("../controllers/executionController");

router.get("/:id", getExecution);

module.exports = router;