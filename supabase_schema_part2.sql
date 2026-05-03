-- ============================================================
-- NETSANET DATABASE SCHEMA — Part 2: Functions, Triggers & Sequence
-- Run this SECOND in the Supabase SQL Editor (after Part 1).
-- ============================================================

-- Create a proper sequence for case numbers (much more reliable than COUNT)
CREATE SEQUENCE IF NOT EXISTS case_number_seq START WITH 1;

-- Function: generate case number using the sequence
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $fn$
DECLARE
  seq_val INT;
BEGIN
  seq_val := nextval('case_number_seq');
  RETURN 'NS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$fn$;

-- Trigger function: auto-set case_number on insert
CREATE OR REPLACE FUNCTION set_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.case_number := generate_case_number();
  RETURN NEW;
END;
$fn$;

-- Trigger: fire before each case insert
CREATE TRIGGER trg_set_case_number
  BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION set_case_number();

-- Create the evidence-files storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', false)
ON CONFLICT (id) DO NOTHING;
