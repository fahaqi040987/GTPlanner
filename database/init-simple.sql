-- Initialize GTPlanner database schema
-- This file is automatically run when the database container starts

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tech_stack JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    messages JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_document_id ON sessions(document_id);

-- Insert sample users for development
-- Password hashes generated with bcrypt
-- Roles: admin (System Administrator), user (Regular User), viewer (Viewer User)
INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', '$2b$12$OWIwPThlh184YtOPX/CNGuwGJ0qcrhmBfsiCOyp8hKLc7KDG4Rfue', 'admin'),
('user@example.com', '$2b$12$GloVP0nvnwbBOuIjqSGb1usyUtN2VtqLxDltC9c0sXccFvlCFq.4K', 'user'),
('viewer@example.com', '$2b$12$IIMqtPxRK6ijA9K2nFGCKehvwSVebWrHrb0E.fvL6VEYiDM3f.hiu', 'viewer')
ON CONFLICT (email) DO NOTHING;
