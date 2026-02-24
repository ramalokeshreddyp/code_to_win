-- Migration: Verification System
-- Run once on the DB before deploying the feature/verify-profiles branch.

-- Add verification token column (safe to re-run)
ALTER TABLE student_coding_profiles
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(20) DEFAULT NULL AFTER student_id;