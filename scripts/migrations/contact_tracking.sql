-- Contact Tracking Migration
-- Run this in your Supabase SQL Editor

-- 1. Create contact_logs table to store all call attempts
CREATE TABLE IF NOT EXISTS contact_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('call_failed', 'no_answer', 'not_interested', 'callback', 'interested')),
    callback_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_contact_logs_person ON contact_logs(person_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_outcome ON contact_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_contact_logs_created ON contact_logs(created_at DESC);

-- 2. Add contact_status column to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS contact_status TEXT DEFAULT 'not_contacted';

-- 3. Create a view for outreach pipeline aggregation
CREATE OR REPLACE VIEW outreach_pipeline AS
SELECT 
    p.id,
    p.name,
    p.provider_name,
    p.total_properties,
    p.total_beds,
    p.contact_status,
    cl.callback_date,
    cl.notes as last_notes,
    cl.created_at as last_contact_at
FROM people p
LEFT JOIN LATERAL (
    SELECT callback_date, notes, created_at 
    FROM contact_logs 
    WHERE person_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) cl ON true
WHERE p.contact_status != 'not_contacted';

-- 4. Grant access to the anon role (Supabase public access)
GRANT SELECT, INSERT ON contact_logs TO anon;
GRANT SELECT, UPDATE ON people TO anon;
GRANT SELECT ON outreach_pipeline TO anon;

-- Enable RLS
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all contact_logs operations" ON contact_logs
    FOR ALL USING (true) WITH CHECK (true);
