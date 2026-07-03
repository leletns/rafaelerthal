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
          background: 'linear-gradient(135deg, #007AFF, #0051D5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,122,255,0.4)',
          zIndex: 30,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '380px',
              height: '520px',
              background: '#fff',
              borderRadius: '20px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
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
                background: 'linear-gradient(135deg, #007AFF, #0051D5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>Assistente Blue</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>Análise inteligente de dados</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && (
                <div>
                  <div style={{ textAlign: 'center', color: '#86868B', fontSize: '0.8rem', marginBottom: '16px' }}>
                    Olá! Pergunte qualquer coisa sobre seus dados clínicos, ou anexe um arquivo.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        style={{
                          background: '#F5F5F7',
                          border: '1px solid #E5E5EA',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.78rem',
                          color: '#1D1D1F',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#E5F1FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F7')}
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
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #007AFF, #0051D5)' : '#F5F5F7',
                      color: msg.role === 'user' ? '#fff' : '#1D1D1F',
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
                  <div style={{ padding: '10px 14px', background: '#F5F5F7', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#007AFF', animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
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
                borderTop: '1px solid #E5E5EA',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F9F9FB',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                <span style={{ flex: 1, fontSize: '0.75rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AEAEB2', fontSize: '12px', padding: '2px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#AEAEB2')}
                >✕</button>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={sendMessage}
              style={{ padding: '12px 16px', borderTop: '1px solid #E5E5EA', display: 'flex', gap: '8px', alignItems: 'center' }}
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
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E5EA',
                  background: attachedFile ? '#E5F1FF' : '#F9F9FB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: attachedFile ? '#007AFF' : '#86868B',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E5F1FF'; e.currentTarget.style.color = '#007AFF'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = attachedFile ? '#E5F1FF' : '#F9F9FB';
                  e.currentTarget.style.color = attachedFile ? '#007AFF' : '#86868B';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E5EA',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#F9F9FB',
                }}
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && !attachedFile)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: (loading || (!input.trim() && !attachedFile)) ? '#99C9FF' : '#007AFF',
                  border: 'none',
                  cursor: (loading || (!input.trim() && !attachedFile)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
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
