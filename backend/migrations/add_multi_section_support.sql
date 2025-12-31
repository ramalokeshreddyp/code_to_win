-- Migration: Support multiple section assignments per faculty
-- Date: 2025-12-31
-- Description: Change faculty_section_assignment table to allow multiple year-section combinations per faculty

USE code_to_win;

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS faculty_section_assignment_backup AS 
SELECT * FROM faculty_section_assignment;

-- Step 2: Drop the foreign key constraint
ALTER TABLE faculty_section_assignment 
DROP FOREIGN KEY faculty_section_assignment_ibfk_1;

-- Step 3: Drop existing primary key constraint
ALTER TABLE faculty_section_assignment DROP PRIMARY KEY;

-- Step 4: Add composite primary key (faculty_id, year, section)
ALTER TABLE faculty_section_assignment 
ADD PRIMARY KEY (faculty_id, year, section);

-- Step 5: Add index for better query performance
CREATE INDEX idx_faculty_assignments ON faculty_section_assignment(faculty_id);

-- Step 6: Recreate the foreign key constraint
ALTER TABLE faculty_section_assignment
ADD CONSTRAINT faculty_section_assignment_ibfk_1 
FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(faculty_id);

-- Verification query
SELECT 'Migration completed successfully. Composite primary key added.' AS status;
SELECT COUNT(*) as total_assignments FROM faculty_section_assignment;
