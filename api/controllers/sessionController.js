const sessionService = require("../services/sessionService")
const executionService = require("../services/executionService")

/**
 * Tạo một code session mới
 * API: POST /api/code-sessions
 */
exports.createSession = async (req, res) => {
  try {

    const result = await sessionService.createSession()

    res.json(result)

  } catch (error) {

    console.error("Create session error:", error)

    res.status(500).json({
      error: "Failed to create session"
    })

  }
}

/**
 * Cập nhật code của session
 * API: PATCH /api/code-sessions/:id
 */
exports.updateCode = async (req, res) => {
  try {

    const { id } = req.params
    const { language, source_code } = req.body

    const result = await sessionService.updateCode(id, language, source_code)

    res.json(result)

  } catch (error) {

    console.error("Update code error:", error)

    res.status(500).json({
      error: "Failed to update code"
    })

  }
}

/**
 * Chạy code của một session.
 * API: POST /api/code-sessions/:id/run
 */
exports.runCode = async (req, res) => {
  try {

    const { id } = req.params

    const executionId = await executionService.enqueueExecution(id)

    res.json({
      execution_id: executionId,
      status: "QUEUED"
    })

  } catch (error) {

    console.error("Run code error:", error)

    res.status(500).json({
      error: "Failed to run code"
    })

  }
}