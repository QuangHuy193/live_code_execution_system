const crypto = require("crypto")
const pool = require("../../db/db")

exports.createSession = async () => {

  const id = crypto.randomUUID()

  await pool.query(
    "INSERT INTO code_sessions (id) VALUES ($1)",
    [id]
  )

  return {
    session_id: id,
    status: "ACTIVE"
  }

}

exports.updateCode = async (id, language, source_code) => {

  await pool.query(
    `UPDATE code_sessions
     SET language=$1, source_code=$2, updated_at=NOW()
     WHERE id=$3`,
    [language, source_code, id]
  )

  return {
    session_id: id,
    status: "ACTIVE"
  }

}