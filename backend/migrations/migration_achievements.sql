-- Create student_achievements table
CREATE TABLE IF NOT EXISTS student_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    type ENUM('certification', 'hackathon', 'workshop') NOT NULL,
    title VARCHAR(255) NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    file_path VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(255),
    rejection_reason TEXT,
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add achievement counters to student_performance if they don't exist
-- We use a stored procedure to check for column existence to make it idempotent
DROP PROCEDURE IF EXISTS upgrade_student_performance;
DELIMITER //
CREATE PROCEDURE upgrade_student_performance()
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'certification_count') THEN
        ALTER TABLE student_performance ADD COLUMN certification_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'hackathon_count') THEN
        ALTER TABLE student_performance ADD COLUMN hackathon_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'student_performance' AND COLUMN_NAME = 'workshop_count') THEN
        ALTER TABLE student_performance ADD COLUMN workshop_count INT DEFAULT 0;
    END IF;
END//
DELIMITER ;
CALL upgrade_student_performance();
DROP PROCEDURE upgrade_student_performance;

-- Insert default grading metrics if they don't exist
INSERT IGNORE INTO grading_system (metric, points) VALUES 
('certification_count', 5),
('hackathon_count', 10),
('workshop_count', 5);
