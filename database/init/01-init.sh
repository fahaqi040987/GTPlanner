#!/bin/bash
# GTPlanner Database Initialization Script
# This script initializes the PostgreSQL database with required schemas and extensions

set -e

echo "Initializing GTPlanner database..."

# Create extensions if they don't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- For text search
    CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- For improved indexing
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

    -- Create schemas if they don't exist
    CREATE SCHEMA IF NOT EXISTS gtplanner;
    CREATE SCHEMA IF NOT EXISTS gtplanner_auth;
    CREATE SCHEMA IF NOT EXISTS gtplanner_audit;

    -- Set search path for future operations
    SET search_path TO public, gtplanner, gtplanner_auth, gtplanner_audit;

    -- Create custom types if needed
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
            CREATE TYPE workspace_role AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prd_status') THEN
            CREATE TYPE prd_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
        END IF;
    END
    \$\$;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON SCHEMA gtplanner TO "$POSTGRES_USER";
    GRANT ALL PRIVILEGES ON SCHEMA gtplanner_auth TO "$POSTGRES_USER";
    GRANT ALL PRIVILEGES ON SCHEMA gtplanner_audit TO "$POSTGRES_USER";

    -- Set default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA gtplanner GRANT ALL ON TABLES TO "$POSTGRES_USER";
    ALTER DEFAULT PRIVILEGES IN SCHEMA gtplanner GRANT ALL ON SEQUENCES TO "$POSTGRES_USER";

EOSQL

echo "Database initialization completed successfully!"