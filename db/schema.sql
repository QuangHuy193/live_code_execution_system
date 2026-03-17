CREATE TABLE code_sessions (
    id UUID PRIMARY KEY,
    language VARCHAR(50),
    source_code TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE executions (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES code_sessions(id),
    status VARCHAR(20),
    stdout TEXT,
    stderr TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);