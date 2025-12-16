-- Add fcm_token column to users table for Firebase Cloud Messaging push notifications
-- This replaces the background notification polling system with server-initiated push notifications

ALTER TABLE users ADD COLUMN fcm_token TEXT NULL;

-- Add index for better query performance when sending notifications
CREATE INDEX idx_users_fcm_token ON users(fcm_token(255));
