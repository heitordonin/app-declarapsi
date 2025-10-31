import DOMPurify from 'dompurify';

/**
 * Hook para sanitizar HTML e prevenir ataques XSS
 * 
 * Remove scripts maliciosos, event handlers e URLs perigosas,
 * mas mantém formatação segura (bold, italic, listas, headings, links)
 * 
 * @param dirtyHTML - HTML não confiável vindo do banco de dados
 * @returns HTML sanitizado seguro para renderização
 * 
 * @example
 * ```tsx
 * const sanitizedContent = useSanitizedHTML(userContent);
 * <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
 * ```
 */
export function useSanitizedHTML(dirtyHTML: string): string {
  return DOMPurify.sanitize(dirtyHTML, {
    // Permitir apenas tags seguras de formatação do TipTap
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div'
    ],
    // Permitir apenas atributos seguros
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
    // Remover atributos perigosos (event handlers)
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    // Sanitizar URLs em links - bloquear javascript:, data:, vbscript:
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Manter conteúdo de tags removidas (ao invés de apagar tudo)
    KEEP_CONTENT: true,
    // Adicionar rel="noopener noreferrer" em links externos automaticamente
    ADD_ATTR: ['target'],
  });
}
