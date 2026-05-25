// ============================================================
// WHATSAPP - Phone normalization and WhatsApp link generation
// Supports international DDI detection
// ============================================================

export function normalizePhone(phone: string): string {
  const raw = phone.trim();
  // If stored with explicit + prefix → already has country code, never add 55
  const hadPlusPrefix = raw.startsWith('+');
  const stripped = raw.replace(/^\+/, '').replace(/^00/, '');
  const digits = stripped.replace(/\D/g, '');

  if (!digits) return '';

  // Explicit + prefix → country code already present, use as-is
  if (hadPlusPrefix) return digits;

  // 13+ digits and starts with 55 → Brazilian with CC already
  if (digits.startsWith('55') && digits.length >= 12) return digits;

  // 12+ digits not starting with 55 → non-Brazilian international
  if (digits.length >= 12 && !digits.startsWith('55')) return digits;

  // 11-digit numbers — distinguish Brazilian mobile from international
  // Brazilian mobiles (since 2012): DDD (2 digits) + 9 (mandatory) + 8 digits
  // So 3rd digit MUST be '9' for a valid Brazilian mobile
  // International 11-digit: e.g. US/Canada = 1 + 10-digit NANP number
  if (digits.length === 11) {
    const thirdDigit = digits[2];
    if (thirdDigit === '9') {
      return `55${digits}`; // Brazilian mobile pattern (DDD + 9XXXXXXXX)
    }
    // 3rd digit is not 9 → not a standard Brazilian mobile → treat as international
    return digits;
  }

  // 10-digit: Brazilian landline (DDD + 8 digits)
  if (digits.length === 10) {
    return `55${digits}`;
  }

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
