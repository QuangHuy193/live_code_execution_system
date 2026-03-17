# Architecture Overview

The system follows an Asynchronous Worker Pattern using a Producer-Consumer model to decouple high-latency code execution from the API response cycle

## End-to-End Request Flow

1. Code Session Creation: The user starts a task. The API initializes a record in PostgreSQL with the selected language and a default template, returning a session_id.

2. Autosave Behavior: As the user types, the Frontend sends periodic PATCH updates. The Backend saves the source_code directly to the database to prevent data loss.

3. Execution Request: Upon clicking "Run," the API Producer pushes a Job (containing the latest code) into the Redis Queue (BullMQ). 

4. It immediately returns an execution_id with a QUEUED status.Background Execution: A Worker pulls the Job from the Queue, initializes a Docker Sandbox (using lightweight Alpine images), executes the code, and captures stdout, stderr, and execution time.

5. Result Polling: The Frontend polls the GET /executions/{id} endpoint to check the status until it reaches a terminal state.

## Queue-based Execution Design

Using Redis as a Message Broker with BullMQ ensures:

1. Non-blocking APIs: The main server remains responsive even under heavy execution load

2. Controlled Concurrency: We can limit the number of simultaneous containers running to prevent CPU exhaustion

## Execution Lifecycle & State Management

The system strictly manages transitions through the following states:

1. QUEUED: Job is in Redis waiting for an available Worker.

2. RUNNING: Worker has picked up the Job and is starting the Sandbox.

3. COMPLETED: Code executed successfully and returned output.

4. FAILED: Syntax errors, runtime crashes, or unsupported language.

5. TIMEOUT: Execution exceeded the 5-second safety limit (e.g., infinite loops).

# Reliability & Data Model

## Data Integrity

1. PostgreSQL: Used for persistent storage of code_sessions (long-term code storage) and executions (historical logs and results).

2. Redis: Stores transient job metadata and the actual message queue for high-speed access.

## Idempotency & Failure Handling

1. Idempotency: Each "Run" event generates a unique execution_id. This prevents duplicate processing and ensures users get the correct result for each specific submission.

2. Retries: BullMQ is configured to retry transient system failures (e.g., Docker daemon hiccups) up to 3 times.

3. Error States: Detailed error messages are captured in stderr to provide actionable feedback to the learner

# Scalability Considerations

1. Horizontal Scaling: Workers are stateless. We can deploy multiple Worker instances across different nodes to handle thousands of concurrent sessions.

2. Queue Backlog Management: By monitoring the queue depth, we can implement auto-scaling to spin up more Workers when the backlog grows.

3. Queue Backlog Mitigation: To handle job spikes, the system can implement a priority queue (giving priority to interactive sessions) and use horizontal pod autoscaling for workers based on the number of pending jobs in Redis.

4. Resource Throttling: Each container is strictly limited (--cpus=0.5, --memory=128m) to ensure a single malicious script cannot crash the host.

# Trade-offs

## Node.js + BullMQ

### Pros

Rapid development and excellent asynchronous I/O handling.

### Cons

Not ideal for CPU-bound tasks within the main thread (mitigated by using Workers).

## Docker Sandboxing

### Pros

High security and absolute resource isolation.

### Cons

Higher overhead and "cold start" latency compared to direct execution.

## Polling

### Pros

Simpler to implement and easier to debug than WebSockets.

### Cons

Slightly higher network overhead due to repeated requests.

## Production Readiness Gaps

1. Security Layer: For a production environment, adding gVisor or Firecracker would provide stronger kernel-level isolation.

2. Container Pooling: Implementing a "Warm Pool" of pre-started containers would reduce the 1-2 second Docker startup lag to milliseconds.


3. Rate Limiting: Implementing per-user rate limits to prevent "Repeated Execution Abuse"
