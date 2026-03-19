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

  await queue.add(
    "code-execution",
    {
      executionId,
      sessionId,
    },
    {
      attempts: 3, // [Retry] Thử lại tối đa 3 lần nếu Worker bị sập hoặc lỗi logic
      backoff: {
        type: "exponential", // Thử lại theo lũy thừa (1s, 2s, 4s...)
        delay: 2000, // Thời gian chờ cơ bản là 2s
      },
      removeOnComplete: true, // Dọn dẹp job sau khi xong để nhẹ Redis
      removeOnFail: false,
    },
  );

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
