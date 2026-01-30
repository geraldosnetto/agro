import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza HTML para prevenir XSS (Cross-Site Scripting)
 * Remove scripts, event handlers e outros elementos perigosos
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Permitir tags comuns de conteúdo
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'figure', 'figcaption',
    ],
    // Permitir atributos seguros
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height',
    ],
    // Forçar rel="noopener noreferrer" em links externos
    ADD_ATTR: ['target'],
    // Permitir apenas protocolos seguros
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitiza e limita o tamanho do texto (para previews)
 */
export function sanitizeAndTruncate(dirty: string, maxLength: number = 300): string {
  const clean = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }); // Remove todas as tags
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength).trim() + '...';
}
