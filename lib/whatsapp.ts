// ============================================================
// WHATSAPP - Phone normalization and WhatsApp link generation
// Supports international DDI detection
// ============================================================

export function normalizePhone(phone: string): string {
  // Strip leading + or 00 before digit-only stripping
  const stripped = phone.trim().replace(/^\+/, '').replace(/^00/, '');
  const digits = stripped.replace(/\D/g, '');

  if (!digits) return '';

  // Already has a non-Brazilian country code (length >= 12 and doesn't start with 55)
  // e.g. +1-555-1234567 → 15551234567 (11 digits, starts with 1)
  if (digits.length >= 12 && !digits.startsWith('55')) {
    return digits; // international, use as-is
  }

  // Already has Brazilian country code
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Brazilian mobile (11 digits: DDD + 9-digit cell) or landline (10 digits)
  if (digits.length === 11 || digits.length === 10) {
    return `55${digits}`;
  }

  // Short international number without country code — use as-is
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  const local = normalized.startsWith('55') ? normalized.slice(2) : normalized;

  if (local.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }

  if (local.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return phone;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function openWhatsApp(phone: string, message?: string): void {
  if (typeof window === 'undefined') return;
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function buildFollowUpMessage(patientName: string): string {
  const firstName = patientName.split(' ')[0];
  return `Olá ${firstName}! Tudo bem? Aqui é da equipe da Clínica Blue. Gostaríamos de saber se você tem alguma dúvida sobre o orçamento que apresentamos. Estamos à disposição para ajudá-la!`;
}

export function buildConfirmationMessage(patientName: string, date: string): string {
  const firstName = patientName.split(' ')[0];
  return `Olá ${firstName}! Lembrando sua consulta com Dr. Erthal em ${date}. Por favor confirme sua presença. Qualquer dúvida, estamos à disposição!`;
}
