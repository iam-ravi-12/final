-- Report Feature Migration
-- Adds support for reporting community posts and admin resolution notes

-- Add reported_community_post_id column
ALTER TABLE reports ADD COLUMN reported_community_post_id BIGINT;

-- Add admin_notes column for resolution notes
ALTER TABLE reports ADD COLUMN admin_notes TEXT;

-- Add foreign key constraint for community post
ALTER TABLE reports ADD CONSTRAINT fk_reports_community_post
    FOREIGN KEY (reported_community_post_id) REFERENCES community_posts(id)
    ON DELETE SET NULL;
