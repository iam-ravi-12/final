-- Migration script for Anonymous Help Requests
-- Adds is_anonymous column to posts table

ALTER TABLE posts ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
