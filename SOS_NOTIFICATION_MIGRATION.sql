-- Migration SQL for SOS Notification Feature
-- Add last_sos_check_at column to users table

-- This column tracks when a user last checked the SOS alerts page
-- Used to determine which alerts are "unread" for notification count

ALTER TABLE users 
ADD COLUMN last_sos_check_at TIMESTAMP NULL;

-- Index for better query performance
CREATE INDEX idx_users_last_sos_check_at ON users(last_sos_check_at);

-- Note: If using JPA/Hibernate with ddl-auto=update, this column will be
-- automatically created on application startup. This SQL is provided for
-- manual database migration if needed.
