-- GTPlanner Sample Data for Development
-- This file creates sample data for testing and development purposes

-- Insert sample users (all passwords are: pass1234)
INSERT INTO users (email, password_hash, name, role, is_active) VALUES
('admin@example.com', '$2b$12$8RBlLrsaVkHui8jWFpP41OFSzfskIJZNNjuD5QgVQY6yQIz7haFBC', 'System Administrator', 'ADMIN', true),
('user@example.com', '$2b$12$8RBlLrsaVkHui8jWFpP41OFSzfskIJZNNjuD5QgVQY6yQIz7haFBC', 'Regular User', 'EDITOR', true),
('viewer@example.com', '$2b$12$8RBlLrsaVkHui8jWFpP41OFSzfskIJZNNjuD5QgVQY6yQIz7haFBC', 'Viewer User', 'VIEWER', true)
ON CONFLICT (email) DO NOTHING;

-- Create temporary function to generate sample data
CREATE OR REPLACE FUNCTION generate_sample_data() RETURNS void AS $$
DECLARE
    var_admin_id VARCHAR(36);
    var_user_id VARCHAR(36);
    var_viewer_id VARCHAR(36);
    var_workspace1_id VARCHAR(36);
    var_workspace2_id VARCHAR(36);
BEGIN
    -- Get user IDs
    SELECT id INTO var_admin_id FROM users WHERE email = 'admin@example.com';
    SELECT id INTO var_user_id FROM users WHERE email = 'user@example.com';
    SELECT id INTO var_viewer_id FROM users WHERE email = 'viewer@example.com';

    -- Insert sample workspaces
    INSERT INTO workspaces (name, description, owner_id) VALUES
    ('Development Team', 'Main development workspace', var_admin_id),
    ('Product Planning', 'Product requirements and planning workspace', var_user_id)
    ON CONFLICT DO NOTHING;

    -- Get workspace IDs
    SELECT id INTO var_workspace1_id FROM workspaces WHERE name = 'Development Team';
    SELECT id INTO var_workspace2_id FROM workspaces WHERE name = 'Product Planning';

    -- Insert workspace members
    INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
    (var_workspace1_id, var_admin_id, 'ADMIN'),
    (var_workspace1_id, var_user_id, 'ADMIN'),
    (var_workspace1_id, var_viewer_id, 'VIEWER'),
    (var_workspace2_id, var_user_id, 'ADMIN'),
    (var_workspace2_id, var_admin_id, 'ADMIN')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Insert sample PRDs
    INSERT INTO prds (workspace_id, title, content, status, created_by) VALUES
    (var_workspace1_id, 'User Authentication System',
    '{"overview": "Design and implement a secure authentication system", "features": ["Login", "Registration", "Password Reset", "Two-Factor Authentication"], "technical_requirements": {"security": ["JWT tokens", "Password hashing", "Session management"], "scalability": ["Load balancing", "Caching strategy"]}, "timeline": "8 weeks", "priority": "high"}', 'ACTIVE', var_admin_id),

    (var_workspace1_id, 'Database Architecture',
    '{"overview": "Create a robust and scalable database architecture", "features": ["Data modeling", "Indexing strategy", "Backup and recovery"], "technical_requirements": {"performance": ["Query optimization", "Connection pooling"], "reliability": ["High availability", "Disaster recovery"]}, "timeline": "6 weeks", "priority": "medium"}', 'DRAFT', var_user_id),

    (var_workspace2_id, 'Mobile App Requirements',
    '{"overview": "Define requirements for cross-platform mobile application", "features": ["iOS support", "Android support", "Offline mode", "Push notifications"], "technical_requirements": {"framework": "React Native or Flutter", "backend_integration": "REST API", "authentication": "OAuth 2.0"}, "timeline": "12 weeks", "priority": "high"}', 'ACTIVE', var_user_id)
    ON CONFLICT DO NOTHING;

    -- Insert sample PRD versions
    INSERT INTO prd_versions (prd_id, version, content, change_description, created_by)
    SELECT
        prd.id,
        '1.0',
        prd.content,
        'Initial version',
        prd.created_by
    FROM prds prd
    WHERE NOT EXISTS (
        SELECT 1 FROM prd_versions pv
        WHERE pv.prd_id = prd.id AND pv.version = '1.0'
    );

    -- Insert sample activity logs
    INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES
    (var_admin_id, 'create_workspace', 'workspace', CAST(var_workspace1_id AS VARCHAR), '{"workspace_name": "Development Team"}'),
    (var_user_id, 'create_workspace', 'workspace', CAST(var_workspace2_id AS VARCHAR), '{"workspace_name": "Product Planning"}'),
    (var_admin_id, 'create_prd', 'prd', (SELECT CAST(id AS VARCHAR) FROM prds WHERE title = 'User Authentication System' LIMIT 1), '{"prd_title": "User Authentication System"}'),
    (var_user_id, 'update_prd', 'prd', (SELECT CAST(id AS VARCHAR) FROM prds WHERE title = 'Database Architecture' LIMIT 1), '{"prd_title": "Database Architecture", "changes": "Added performance requirements"}')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_sample_data();

-- Clean up the function
DROP FUNCTION generate_sample_data();