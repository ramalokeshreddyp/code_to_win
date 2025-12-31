-- Rollback script for multi-section faculty assignment migration
-- Date: 2025-12-31
-- Use this script if you need to revert the changes

USE code_to_win;

-- Step 1: Drop the foreign key constraint
ALTER TABLE faculty_section_assignment 
DROP FOREIGN KEY faculty_section_assignment_ibfk_1;

-- Step 2: Drop the composite primary key
ALTER TABLE faculty_section_assignment DROP PRIMARY KEY;

-- Step 3: Drop the index
DROP INDEX idx_faculty_assignments ON faculty_section_assignment;

-- Step 4: Restore original data from backup
TRUNCATE TABLE faculty_section_assignment;
INSERT INTO faculty_section_assignment SELECT * FROM faculty_section_assignment_backup;

-- Step 5: Add back the original primary key
ALTER TABLE faculty_section_assignment ADD PRIMARY KEY (faculty_id);

-- Step 6: Recreate the foreign key constraint
ALTER TABLE faculty_section_assignment
ADD CONSTRAINT faculty_section_assignment_ibfk_1 
FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(faculty_id);

-- Step 7: Clean up backup table (optional)
-- DROP TABLE faculty_section_assignment_backup;

SELECT 'Rollback completed successfully. Original schema restored.' AS status;
