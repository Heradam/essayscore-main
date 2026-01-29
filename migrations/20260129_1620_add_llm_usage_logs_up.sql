DROP TABLE IF EXISTS llm_usage_logs;

CREATE TABLE llm_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model VARCHAR(64) NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);
