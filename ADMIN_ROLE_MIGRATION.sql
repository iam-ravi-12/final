-- Migration script for Admin role, Account status and Reports features

-- 1. Update the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at DATETIME NULL;

-- Ensure all existing users default to USER role and ACTIVE status if they were somehow null
UPDATE users SET role = 'USER' WHERE role IS NULL;
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;

-- 2. Create the reports table
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    reported_user_id BIGINT NULL,
    reported_post_id BIGINT NULL,
    reported_community_id BIGINT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users(id),
    CONSTRAINT fk_reports_reported_post FOREIGN KEY (reported_post_id) REFERENCES posts(id),
    CONSTRAINT fk_reports_reported_community FOREIGN KEY (reported_community_id) REFERENCES communities(id),
    INDEX idx_reports_status (status)
);
