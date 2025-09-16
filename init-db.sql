-- Initialize todo table for local development
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- Insert sample data
INSERT INTO todos (title, description, status) VALUES
('サンプルタスク1', 'ローカル開発用のテストデータ', 'pending'),
('サンプルタスク2', '進行中のタスク', 'in_progress'),
('サンプルタスク3', '完了済みのタスク', 'completed');