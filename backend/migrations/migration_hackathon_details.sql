-- Add subtype column to student_achievements
ALTER TABLE student_achievements ADD COLUMN subtype VARCHAR(50) DEFAULT 'participation';

-- Add new counters to student_performance
ALTER TABLE student_performance ADD COLUMN hackathon_participation_count INT DEFAULT 0;
ALTER TABLE student_performance ADD COLUMN hackathon_winner_count INT DEFAULT 0;

-- Add new metrics to grading_system
INSERT INTO grading_system (metric, points) VALUES 
('hackathon_participation_count', 10),
('hackathon_winner_count', 50);

-- Migrate existing data (Optional: assuming all existing are participation for safety, or leave 0)
-- UPDATE student_performance SET hackathon_participation_count = hackathon_count;
