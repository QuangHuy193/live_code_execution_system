const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const pool = require("../db/db");
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log("Worker started and waiting for jobs...");

/* ==============================
   Worker
============================== */

const worker = new Worker(
  "code-execution",
  async (job) => {
    const { sessionId, executionId } = job.data;
    console.log("JOB_RECEIVED:", executionId);

    let startTime = Date.now(); // Gán ngay từ đầu để đảm bảo tính được executionTime

    try {
      // Cập nhật trạng thái RUNNING
      await pool.query(
        `UPDATE executions SET status='RUNNING', started_at=NOW() WHERE id=$1`,
        [executionId],
      );

      const session = await pool.query(
        "SELECT language, source_code FROM code_sessions WHERE id=$1",
        [sessionId],
      );

      if (session.rows.length === 0) throw new Error("Session not found");

      const { language, source_code } = session.rows[0];

      // Chạy code
      const result = await runCode(language, source_code);
      const executionTime = Date.now() - startTime;

      // COMPLETED: Ghi kết quả thành công
      await pool.query(
        `UPDATE executions 
         SET status='COMPLETED', 
             stdout=$1, 
             stderr=$2, 
             execution_time_ms=$3, 
             finished_at=NOW() 
         WHERE id=$4`,
        [result.stdout, result.stderr, executionTime, executionId],
      );

      console.log("CODE_FINISHED:", executionId);
    } catch (error) {
      console.error("EXECUTION_FAILED:", error);

      const status =
        error.message === "Execution timeout" ? "TIMEOUT" : "FAILED";
      const executionTime = Date.now() - startTime;

      await pool.query(
        `UPDATE executions 
          SET status=$1, 
              stdout='', 
              stderr=$2, 
              execution_time_ms=$3, 
              finished_at=NOW() 
        WHERE id=$4`,
        [
          status, // $1 -> status
          error.message, // $2 -> stderr (Chuỗi "Execution timeout" sẽ vào đây)
          executionTime, // $3 -> execution_time_ms (Số ms sẽ vào đây)
          executionId, // $4 -> id
        ],
      );
    }
  },
  { connection },
);

/* ==============================
  Run Code
============================== */

async function runCode(language, code) {
  return new Promise((resolve, reject) => {
    const jobId = crypto.randomUUID();
    const containerName = `exec-${jobId}`;

    let image;
    let runCmd;

    // Dùng Alpine cho nhẹ và nhanh
    if (language === "javascript") {
      image = "node:20-alpine";
      // Lệnh node -e lấy code từ tham số hoặc dùng "-" để đọc từ stdin
      runCmd = ["node", "-"];
    } else if (language === "python") {
      image = "python:3.11-alpine";
      runCmd = ["python", "-c", code]; // Python có thể chạy trực tiếp qua flag -c
    } else {
      return reject(new Error("Unsupported language"));
    }

    const dockerArgs = [
      "run",
      "--rm",
      "-i", // Quan trọng: Cho phép nhận input từ STDIN
      `--name=${containerName}`,
      "--cpus=0.5",
      "--memory=128m",
      "--network=none",
      image,
      ...(language === "javascript" ? ["node", "-"] : ["python", "-c", code]),
    ];

    const child = spawn("docker", dockerArgs);

    // Nếu là javascript, ta ghi code vào stdin
    if (language === "javascript") {
      child.stdin.write(code);
      child.stdin.end();
    }

    let stdout = "";
    let stderr = "";
    let isFinished = false;

    const timeout = setTimeout(() => {
      if (isFinished) return;
      isFinished = true;

      // Diệt container ngay lập tức
      spawn("docker", ["rm", "-f", containerName]);
      child.kill("SIGKILL");
      reject(new Error("Execution timeout"));
    }, process.env.EXECUTION_TIMEOUT || 5000);

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("close", (exitCode) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);

      if (exitCode !== 0) {
        return reject(new Error(stderr || `Exit code ${exitCode}`));
      }
      resolve({ stdout, stderr });
    });

    child.on("error", (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);
      reject(err);
    });
  });
}
