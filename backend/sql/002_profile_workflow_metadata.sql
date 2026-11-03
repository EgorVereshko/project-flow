ALTER TABLE board_columns
    ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (workflow_status IN ('todo', 'in_progress', 'done'));

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id
    ON tasks(created_by_id);
