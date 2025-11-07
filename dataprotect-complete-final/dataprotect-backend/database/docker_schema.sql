-- Add Docker configuration table for challenges
CREATE TABLE IF NOT EXISTS challenge_docker_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    docker_image TEXT NOT NULL,
    exposed_ports TEXT DEFAULT '[]', -- JSON array of ports
    environment_vars TEXT DEFAULT '{}', -- JSON object of env vars
    memory_limit INTEGER DEFAULT 512, -- MB
    cpu_limit INTEGER DEFAULT 512, -- CPU shares
    timeout_duration INTEGER DEFAULT 3600, -- seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Add container_id and instance_id to machines table
ALTER TABLE machines ADD COLUMN container_id TEXT;
ALTER TABLE machines ADD COLUMN instance_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_docker_config_challenge ON challenge_docker_config(challenge_id);
CREATE INDEX IF NOT EXISTS idx_machines_container ON machines(container_id);
CREATE INDEX IF NOT EXISTS idx_machines_instance ON machines(instance_id);

-- Insert example Docker configurations
INSERT INTO challenge_docker_config (challenge_id, docker_image, exposed_ports, environment_vars, timeout_duration) VALUES
(1, 'vulnerables/web-dvwa:latest', '[80, 3306]', '{"MYSQL_ROOT_PASSWORD":"password"}', 3600),
(2, 'webgoat/webgoat:latest', '[8080]', '{}', 3600),
(3, 'bkimminich/juice-shop:latest', '[3000]', '{}', 3600);
