-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Clients/submissions table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  num_songs INTEGER NOT NULL,
  rate_per_song NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  final_paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'deposit_paid', 'in_production', 'delivered', 'completed', 'cancelled')),
  start_date TEXT,
  notes TEXT,
  signed BOOLEAN DEFAULT FALSE,
  invoice_number TEXT,
  signed_at TIMESTAMPTZ
);

-- Index for common queries
CREATE INDEX idx_clients_created_at ON clients (created_at DESC);
CREATE INDEX idx_clients_status ON clients (status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the service role (API endpoint)
CREATE POLICY "Allow service role full access" ON clients
  FOR ALL USING (true) WITH CHECK (true);
