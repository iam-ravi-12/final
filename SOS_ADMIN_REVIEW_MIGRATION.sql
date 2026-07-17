-- Migration script for SOS Admin Review & Verification
-- Adds status column to sos_responses table

ALTER TABLE sos_responses ADD COLUMN status VARCHAR(255) NOT NULL DEFAULT 'PENDING';
