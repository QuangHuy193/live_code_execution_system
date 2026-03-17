# Live Code Execution System

A scalable backend system that allows users to submit and execute code securely using Docker sandboxing and asynchronous job processing.

---

# Features

- Execute code (Node.js, Python)
- Asynchronous processing (Redis + BullMQ)
- Docker sandbox for security
- Store execution results (stdout, stderr, time)
- Scalable worker system

---

# Setup Instructions (Run Locally)

## Clone project

```bash
git clone <your-repo>
cd <your-repo>
```

## docker

```bash
docker-compose up --build
```

# API Documentation

## POST /executions

### Reponses 
{
  "session_id": "423231c5-3d2b-4880-848b-e76ce9519dac",
  "status": "ACTIVE"
}

## PATCH /executions/{session_id}

### payload
{
  "language": "javascript",
  "source_code": "console.log('Hello World')"
}

### Reponses 
{
  "session_id": "48afb7f4-0f3f-45a6-bbb0-20fcec01ed2e",
  "status": "ACTIVE"
}

## POST /code-sessions/{session_id}/run

### Reponses 
{
  "execution_id": "30bd3f41-f393-4e46-b54c-a0a67083faec",
  "status": "QUEUED"
}

## GET /executions/{execution_id}

### Reponses 
{
  "id": "30bd3f41-f393-4e46-b54c-a0a67083faec",
  "session_id": "cd8696d2-ca13-4779-b0bc-744793eb636d",
  "status": "COMPLETED",
  "stdout": "Hello World\n",
  "stderr": "",
  "execution_time_ms": 430,
  "created_at": "2026-03-17T07:05:09.381Z",
  "started_at": "2026-03-17T07:05:09.431Z",
  "finished_at": "2026-03-17T07:05:10.329Z"
}

# Design Decisions & Trade-offs

## Queue-based architecture

### Pros:

Decoupled system

Scalable

Fault-tolerant

### Cons:

More complexity

Requires Redis

## Docker sandbox

### Pros:

Secure

Isolated

### Cons:

Slower startup

Requires Docker

## Polling

### Pros:

Simple

Easy to implement

### Cons:

Not realtime

More requests

# Docker Setup

Included services

API

Worker

Redis

PostgreSQL

# Test


## Syntax Error Handling
When a user submits code with syntax errors, the system correctly captures the stderr from the container, marks the status as FAILED, and provides detailed feedback.

- Scenario: Missing or misplaced identifiers in JavaScript.

- Actual Result:

{
  "status": "FAILED",
  "stdout": "",
  "stderr": "[stdin]:1\nconsole.l World')\n ... SyntaxError: Unexpected identifier'World' ...",
  "execution_time_ms": 2547
}

## Infinite Loop & Timeout Protection
The system enforces a strict 5-second time limit per execution. If the code runs longer (e.g., an infinite while loop), the worker kills the container and returns a TIMEOUT status.

- Scenario: Missing or misplaced identifiers in JavaScript.

- Actual Result:

{
  "status": "TIMEOUT",
  "stdout": "",
  "stderr": "Execution timeout",
  "execution_time_ms": 5069
}

# Future Improvements

Implement WebSockets for real-time result streaming instead of HTTP polling.

Add a Caching layer for frequently run code snippets to reduce Docker overhead.

Expand language support to include Java and Go




