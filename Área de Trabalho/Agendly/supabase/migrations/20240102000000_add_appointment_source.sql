-- Add appointment source enum and column
-- This allows tracking whether appointments were created internally or via public booking

-- Create enum for appointment source
CREATE TYPE appointment_source AS ENUM ('internal', 'public');

-- Add source column to appointments table
ALTER TABLE appointments 
ADD COLUMN source appointment_source DEFAULT 'internal' NOT NULL;

-- Create index for filtering by source
CREATE INDEX idx_appointments_source ON appointments(business_id, source) WHERE deleted_at IS NULL;

-- Update existing appointments to be 'internal'
UPDATE appointments SET source = 'internal' WHERE source IS NULL;
