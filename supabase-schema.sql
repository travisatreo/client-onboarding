-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ProducerOS Schema v2 — Multi-Producer Support
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Clients/submissions table
CREATE TABLE IF NOT EXISTS clients (
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
  signed_at TIMESTAMPTZ,
  phone TEXT,
  birthday TEXT,
  drive_folder_url TEXT,
  producer_slug TEXT DEFAULT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_producer_slug ON clients (producer_slug);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the service role (API endpoint)
CREATE POLICY "Allow service role full access" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration: Add new columns if table already exists
-- Run this if you already have the clients table
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday TEXT;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS producer_slug TEXT DEFAULT NULL;
-- CREATE INDEX IF NOT EXISTS idx_clients_producer_slug ON clients (producer_slug);
-- CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
