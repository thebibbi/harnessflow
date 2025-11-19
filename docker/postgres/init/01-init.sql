-- HarnessFlow Database Initialization
-- This script runs automatically when the database is first created

-- Create database (already created by environment variable, but kept for reference)
-- CREATE DATABASE harnessflow_dev;

-- Enable UUID extension (required by Prisma)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Apache AGE extension will be added in Phase 1 Week 3-4
-- For now, we'll use PostgreSQL's built-in capabilities
-- Future: CREATE EXTENSION IF NOT EXISTS age;

COMMENT ON DATABASE harnessflow_dev IS 'HarnessFlow - Intelligent electrical change-impact engine for automotive wiring harness design';
