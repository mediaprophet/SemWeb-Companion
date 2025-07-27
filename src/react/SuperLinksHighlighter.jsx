import React from 'react';

/**
 * SuperLinksHighlighter - Highlights terms in the page using a React effect.
 * Props:
 *   term: string - the term to highlight
 *   enabled: boolean - whether highlighting is active
 */
export default function SuperLinksHighlighter({ term, enabled }) {
  React.useEffect(() => {
    if (!enabled || !term) return;
    // Simple highlight: wrap all occurrences of term in <mark> (demo only)
    // In production, use a robust library or custom logic for safety.
    const walk = node => {
      if (node.nodeType === 3) { // Text node
        const idx = node.data.toLowerCase().indexOf(term.toLowerCase());
        if (idx >= 0) {
          const span = document.createElement('mark');
          span.textContent = node.data.substr(idx, term.length);
          const after = node.splitText(idx);
          after.data = after.data.substr(term.length);
          node.parentNode.insertBefore(span, after);
        }
      } else if (node.nodeType === 1 && node.childNodes && !['SCRIPT','STYLE','MARK'].includes(node.tagName)) {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(document.body);
    return () => {
      // Cleanup: remove all <mark> elements
      document.querySelectorAll('mark').forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent));
      });
    };
  }, [term, enabled]);
  return null;
}
