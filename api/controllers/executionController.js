const executionService = require("../services/executionService")

/**
 * Lấy kết quả chạy code
 * API: GET /api/executions/:id
 */
exports.getExecution = async (req, res) => {

  try {

    const { id } = req.params

    const execution = await executionService.getExecutionById(id)

    if (!execution) {
      return res.status(404).json({
        error: "Execution not found"
      })
    }

    res.json(execution)

  } catch (error) {

    console.error("Get execution error:", error)

    res.status(500).json({
      error: "Failed to fetch execution"
    })

  }

}