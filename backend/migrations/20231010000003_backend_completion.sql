ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE financial_paths
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

ALTER TABLE levels
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) DEFAULT 'Sprout';

CREATE INDEX IF NOT EXISTS idx_financial_paths_user_id ON financial_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_levels_path_id ON levels(path_id);
CREATE INDEX IF NOT EXISTS idx_tasks_level_id ON tasks(level_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
