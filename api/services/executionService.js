const queue = require("../../queue/queue");
const crypto = require("crypto");
const pool = require("../../db/db");

exports.enqueueExecution = async (sessionId) => {
  const executionId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO executions (id, session_id, status)
     VALUES ($1,$2,'QUEUED')`,
    [executionId, sessionId],
  );

  await queue.add("code-execution", {
    executionId,
    sessionId,
  });

  return executionId;
};

exports.getExecutionById = async (id) => {
  const result = await pool.query(
    `SELECT id, session_id, status, stdout, stderr,
    execution_time_ms, created_at, started_at, finished_at FROM executions WHERE id=$1`,
    [id],
  );

  return result.rows[0] || null;
};
