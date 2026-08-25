/**
 * Safe Markdown Renderer
 * Converts markdown to HTML with proper sanitization
 */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Safely render markdown content to HTML
 * @param {string} markdown - The markdown content to render
 * @returns {object} Sanitized HTML object safe for React
 */
export function safeRenderMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return { __html: '' };
  }

  try {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false, // We'll use DOMPurify instead
      sanitizeFn: null
    });

    // Convert markdown to HTML
    const html = marked(markdown);

    // Sanitize HTML to prevent XSS
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'class', 'id'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });

    return { __html: sanitized };
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Return error message as safe HTML
    return { __html: '<p>Error rendering content</p>' };
  }
}

/**
 * Parse markdown content into structured sections
 * @param {string} content - The markdown content
 * @returns {array} Array of section objects
 */
export function parseMarkdownSections(content) {
  if (!content || typeof content !== 'string') {
    return [{ title: 'Content', content: '', items: [], type: 'text', safeHtml: { __html: '' } }];
  }

  try {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = {
      title: 'Overview',
      content: '',
      items: [],
      type: 'text',
      safeHtml: { __html: '' }
    };

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection.content || currentSection.items.length > 0) {
          currentSection.safeHtml = safeRenderMarkdown(currentSection.content);
          sections.push({ ...currentSection });
        }

        // Start new section
        currentSection = {
          title: line.replace('## ', ''),
          content: '',
          items: [],
          type: 'text',
          safeHtml: { __html: '' }
        };
      } else if (line.startsWith('```')) {
        currentSection.type = 'code';
        currentSection.content += line + '\n';
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        if (currentSection.type !== 'list') {
          // Save previous section if it had content
          if (currentSection.content) {
            currentSection.safeHtml = safeRenderMarkdown(currentSection.content);
            sections.push({ ...currentSection });
          }

          // Start new list section
          currentSection = {
            title: currentSection.title,
            content: '',
            items: [],
            type: 'list',
            safeHtml: { __html: '' }
          };
        }
        currentSection.items.push(line.trim().replace(/^[-*] /, ''));
      } else if (line.trim()) {
        if (currentSection.type === 'list' && currentSection.items.length > 0) {
          // Append to last list item
          currentSection.items[currentSection.items.length - 1] += ' ' + line.trim();
        } else {
          currentSection.content += line + '\n';
        }
      }
    });

    // Don't forget the last section
    if (currentSection.content || currentSection.items.length > 0) {
      currentSection.safeHtml = safeRenderMarkdown(currentSection.content);
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{
      title: 'Content',
      content,
      items: [],
      type: 'text',
      safeHtml: safeRenderMarkdown(content)
    }];
  } catch (error) {
    console.error('Error parsing markdown sections:', error);
    return [{
      title: 'Content',
      content: 'Error parsing content',
      items: [],
      type: 'text',
      safeHtml: { __html: '<p>Error parsing content</p>' }
    }];
  }
}

/**
 * Truncate markdown content to a specified length
 * @param {string} content - The markdown content
 * @param {number} maxLength - Maximum length in characters
 * @returns {string} Truncated content
 */
export function truncateMarkdown(content, maxLength = 200) {
  if (!content) return '';

  // Remove markdown syntax for length calculation
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove emphasis
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .trim();

  if (plainText.length <= maxLength) {
    return content;
  }

  return plainText.substring(0, maxLength) + '...';
}

export default { safeRenderMarkdown, parseMarkdownSections, truncateMarkdown };