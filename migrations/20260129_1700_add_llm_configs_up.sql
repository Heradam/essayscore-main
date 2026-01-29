CREATE TABLE llm_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(64) NOT NULL,
  provider VARCHAR(64),
  api_key VARCHAR(255) NOT NULL,
  base_url VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);
