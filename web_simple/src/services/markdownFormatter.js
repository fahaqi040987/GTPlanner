/**
 * Markdown Formatter Service
 * Formats PRD data into structured markdown with YAML frontmatter
 * Optimized for AI agent consumption
 */

/**
 * Format a PRD object into structured markdown with YAML frontmatter
 * @param {Object} prd - The PRD object to format
 * @returns {string} Formatted markdown string
 */
export function formatPRDMarkdown(prd) {
  if (!prd) return '';

  // Extract tech stack arrays
  const techStack = prd.tech_stack || {};
  const frontend = techStack.frontend || [];
  const backend = techStack.backend || [];
  const database = techStack.database || [];
  const devops = techStack.devops || [];

  // Format dates
  const createdDate = prd.created_at ? new Date(prd.created_at).toISOString().split('T')[0] : '';
  const updatedDate = prd.updated_at ? new Date(prd.updated_at).toISOString().split('T')[0] : '';

  // Build YAML frontmatter
  const yamlFrontmatter = `---
title: "${sanitizeYAML(prd.title || 'Untitled Project')}
created: "${createdDate}"
updated: "${updatedDate}"
tech_stack: ${JSON.stringify([...frontend, ...backend, ...database, ...devops]).replace(/"/g, "'")}
---

`;

  // Build main content
  let markdown = yamlFrontmatter;

  // Title
  markdown += `# ${prd.title || 'Untitled Project'}\n\n`;

  // Summary
  if (prd.content) {
    markdown += `## Summary\n\n${prd.content}\n\n`;
  }

  // Technology Stack
  if (frontend.length > 0 || backend.length > 0 || database.length > 0 || devops.length > 0) {
    markdown += `## Technology Stack\n\n`;

    if (frontend.length > 0) {
      markdown += `### Frontend\n`;
      frontend.forEach(tech => {
        markdown += `- ${tech}\n`;
      });
      markdown += `\n`;
    }

    if (backend.length > 0) {
      markdown += `### Backend\n`;
      backend.forEach(tech => {
        markdown += `- ${tech}\n`;
      });
      markdown += `\n`;
    }

    if (database.length > 0) {
      markdown += `### Database\n`;
      database.forEach(tech => {
        markdown += `- ${tech}\n`;
      });
      markdown += `\n`;
    }

    if (devops.length > 0) {
      markdown += `### DevOps\n`;
      devops.forEach(tech => {
        markdown += `- ${tech}\n`;
      });
      markdown += `\n`;
    }
  }

  // Infrastructure Recommendations
  if (prd.recommendations) {
    markdown += `## Infrastructure Recommendations\n\n`;

    if (prd.recommendations.architecture) {
      markdown += `${prd.recommendations.architecture}\n\n`;
    }

    if (prd.recommendations.hardware_specs) {
      const hw = prd.recommendations.hardware_specs;
      markdown += `### Hardware Specifications\n`;
      markdown += `- CPU: ${hw.cpu_cores || 'N/A'}\n`;
      markdown += `- RAM: ${hw.ram || 'N/A'}\n`;
      markdown += `- Disk: ${hw.disk_space || 'N/A'}\n\n`;
    }

    if (prd.recommendations.cloud_providers && prd.recommendations.cloud_providers.length > 0) {
      markdown += `### Cloud Providers\n`;
      prd.recommendations.cloud_providers.forEach(provider => {
        markdown += `- **${provider.name}**: ${provider.estimated_monthly_cost || 'Cost not specified'}\n`;
      });
      markdown += `\n`;
    }

    if (prd.recommendations.data_stack) {
      markdown += `### Data Stack\n\n${prd.recommendations.data_stack}\n\n`;
    }
  }

  // Clean up excessive whitespace
  markdown = sanitizeMarkdown(markdown);

  return markdown;
}

/**
 * Sanitize YAML values to prevent injection
 * @param {string} value - The value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeYAML(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

/**
 * Sanitize markdown formatting
 * @param {string} markdown - The markdown to sanitize
 * @returns {string} Sanitized markdown
 */
function sanitizeMarkdown(markdown) {
  // Remove excessive blank lines (more than 2 consecutive)
  let sanitized = markdown.replace(/\n{3,}/g, '\n\n');

  // Ensure proper spacing around headers
  sanitized = sanitized.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

  // Clean up trailing whitespace
  sanitized = sanitized.split('\n').map(line => line.trimEnd()).join('\n');

  return sanitized;
}

/**
 * Generate a filename-safe version of the PRD title
 * @param {string} title - The PRD title
 * @param {string} id - The PRD ID
 * @returns {string} Filename-safe string
 */
export function generateFilename(title, id) {
  const sanitized = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim();

  return `${sanitized}-${id}.md`;
}