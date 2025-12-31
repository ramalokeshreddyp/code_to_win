-- Migration for GitHub Integration

-- Add GitHub ID and status to student_coding_profiles
ALTER TABLE student_coding_profiles
ADD COLUMN github_id VARCHAR(255) DEFAULT NULL AFTER hackerrank_id,
ADD COLUMN github_status ENUM('pending', 'accepted', 'rejected', 'suspended') DEFAULT 'pending' AFTER hackerrank_verified,
ADD COLUMN github_verified TINYINT(1) DEFAULT 0 AFTER github_status;

-- Add GitHub stats to student_performance
ALTER TABLE student_performance
ADD COLUMN repos_gh INT DEFAULT 0 AFTER stars_hr,
ADD COLUMN contributions_gh INT DEFAULT 0 AFTER repos_gh;

-- Add GitHub metrics to grading_system
INSERT INTO grading_system (metric, points) VALUES ('repos_gh', 5);
INSERT INTO grading_system (metric, points) VALUES ('contributions_gh', 1);
