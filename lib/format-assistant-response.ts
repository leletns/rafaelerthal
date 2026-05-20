// ============================================================
// FORMAT ASSISTANT RESPONSE - Format AI responses as clean HTML
// ============================================================

export function formatAssistantResponse(text: string): string {
  // Convert markdown to simple HTML
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1 text-brand-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-brand-primary">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2 text-brand-primary">$1</h1>')

    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>')

    // Italic
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>')

    // Code inline
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 rounded px-1 font-mono text-sm">$1</code>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-3 border-gray-200" />')

    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')

    // Wrap consecutive li in ul
    .replace(/((<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>')

    // Paragraphs (lines not starting with tags)
    .replace(/^(?!<[h|u|o|l|h|c|p|d])(.+)$/gm, '<p class="mb-2">$1</p>')

    // Remove empty paragraphs
    .replace(/<p class="mb-2"><\/p>/g, '');

  return html;
}

export function extractKeyMetrics(text: string): { label: string; value: string }[] {
  const metrics: { label: string; value: string }[] = [];

  // Match patterns like "R$ X.XXX" or "XX%" or "XX cirurgias"
  const currencyPattern = /([A-Za-záéíóúãõâêôçÁÉÍÓÚÃÕÂÊÔÇ\s]+):\s*(R\$\s*[\d.,]+)/g;
  const percentPattern = /([A-Za-záéíóúãõâêôçÁÉÍÓÚÃÕÂÊÔÇ\s]+):\s*([\d.,]+%)/g;

  let match;
  while ((match = currencyPattern.exec(text)) !== null) {
    metrics.push({ label: match[1].trim(), value: match[2].trim() });
  }
  while ((match = percentPattern.exec(text)) !== null) {
    metrics.push({ label: match[1].trim(), value: match[2].trim() });
  }

  return metrics.slice(0, 4); // Max 4 highlighted metrics
}
