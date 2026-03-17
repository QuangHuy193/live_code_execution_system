const { Queue } = require("bullmq")
const IORedis = require("ioredis")

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

const codeQueue = new Queue("code-execution", {
  connection
})

module.exports = codeQueue