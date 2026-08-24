'use client';

import { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '@/lib/safe-storage';
import { formatAssistantResponse } from '@/lib/format-assistant-response';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AttachedFile {
  base64: string;
  mediaType: string;
  name: string;
}

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Esc fecha o assistente
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setAttachedFile({ base64, mediaType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);

    // reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !attachedFile) || loading) return;

    const displayText = text || (attachedFile ? `Arquivo: ${attachedFile.name}` : '');
    const newMessages: Message[] = [...messages, { role: 'user', content: displayText }];
    setMessages(newMessages);
    setInput('');
    const fileToSend = attachedFile;
    setAttachedFile(null);
    setLoading(true);

    try {
      const token = getAuthToken() || '';
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text || 'Analise o arquivo anexado.',
          history: messages,
          attachment: fileToSend ? { base64: fileToSend.base64, mediaType: fileToSend.mediaType, name: fileToSend.name } : undefined,
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || data.error || 'Sem resposta' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro ao conectar com o assistente.' }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestedQuestions = [
    'Como foi meu desempenho em 2025?',
    'Qual o canal de maior conversão?',
    'Compara 2025 vs 2026',
    'Qual o ticket médio atual?',
  ];

  return (
    <>
      {/* Float button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--c-blue)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-2)',
          zIndex: 30,
          color: 'var(--on-accent)',
          transition: 'transform 0.15s ease',
        }}
        aria-label="Abrir o assistente do painel"
        title="Assistente"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Assistente do painel"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: 'min(380px, calc(100vw - 32px))',
              height: 'min(520px, calc(100vh - 48px))',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-3)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                background: 'var(--c-blue)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div aria-hidden="true" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, var(--on-accent) 22%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: 'var(--on-accent)', fontWeight: 700, fontSize: '0.875rem' }}>Assistente Blue</div>
                  <div style={{ color: 'var(--on-accent)', opacity: .92, fontSize: '0.72rem' }}>Perguntas sobre os dados da clínica</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar o assistente"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-accent)', padding: '4px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && (
                <div>
                  <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.8rem', marginBottom: '16px' }}>
                    Pergunte o que quiser sobre os dados da clínica — ou anexe um arquivo.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        style={{
                          background: 'var(--fill)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.78rem',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tint-blue)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--fill)')}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--c-blue)' : 'var(--fill)',
                      color: msg.role === 'user' ? 'var(--on-accent)' : 'var(--text)',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: formatAssistantResponse(msg.content) }} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', background: 'var(--fill)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-blue)', animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
                    ))}
                    <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }`}</style>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div style={{
                padding: '6px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface-2)',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.19 5.19l-9.2 9.19a1.83 1.83 0 0 1-2.59-2.59l8.49-8.48" /></svg>
                <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '12px', padding: '2px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
                 aria-label="Remover anexo">×</button>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={sendMessage}
              style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Paperclip button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                title="Anexar arquivo"
                aria-label="Anexar arquivo à pergunta"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  background: attachedFile ? 'var(--tint-blue)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: attachedFile ? 'var(--c-blue)' : 'var(--text-2)',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tint-blue)'; e.currentTarget.style.color = 'var(--c-blue)'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = attachedFile ? 'var(--tint-blue)' : 'var(--surface-2)';
                  e.currentTarget.style.color = attachedFile ? 'var(--c-blue)' : 'var(--text-2)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Escreva sua pergunta"
                placeholder="Pergunte algo…"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border)',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: 'var(--surface-2)',
                }}
              />
              <button
                type="submit"
                aria-label="Enviar pergunta"
                disabled={loading || (!input.trim() && !attachedFile)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: 'var(--on-accent)',
                  background: (loading || (!input.trim() && !attachedFile)) ? 'color-mix(in srgb, var(--c-blue) 45%, transparent)' : 'var(--c-blue)',
                  border: 'none',
                  cursor: (loading || (!input.trim() && !attachedFile)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
