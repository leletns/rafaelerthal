'use client';

import { useState, useRef } from 'react';
import { getAuthToken } from '@/lib/safe-storage';

interface TeamMember {
  key: string;
  name: string;
  role: string;
  color: string;
  emoji: string;
  bank?: string;
  agency?: string;
  account?: string;
  pix: string;
  pixType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'key';
  favored?: string;
  fixedValue?: string;
}

const TEAM: TeamMember[] = [
  {
    key: 'blue',
    name: 'Blue Clínica',
    role: 'Clínica médica e cirúrgica',
    color: '#007AFF',
    emoji: '🏥',
    bank: 'C6 Bank — 336',
    agency: '0001',
    account: '27520102-3',
    pix: '21971101000',
    pixType: 'phone',
    favored: 'Blue Clínica médica e cirúrgica',
    fixedValue: '',
  },
  {
    key: 'anest',
    name: 'Anestesista',
    role: 'EP Serviços Médicos Ltda',
    color: '#5856D6',
    emoji: '💉',
    pix: '44856036000147',
    pixType: 'cnpj',
    favored: 'EP Serviços Médicos Ltda',
    fixedValue: '',
  },
  {
    key: 'leo',
    name: 'Leonardo Valadão Pinto',
    role: 'Cirurgião Auxiliar',
    color: '#28A745',
    emoji: '👨‍⚕️',
    bank: 'Santander',
    agency: '3977',
    account: '01061191-1',
    pix: '13604862752',
    pixType: 'cpf',
    favored: 'Leonardo Valadão Pinto',
    fixedValue: '',
  },
  {
    key: 'magda',
    name: 'Magda Pires dos Santos',
    role: 'Instrumentadora 1',
    color: '#FF9500',
    emoji: '🔬',
    pix: '21995892783',
    pixType: 'phone',
    favored: 'Magda Pires dos Santos',
    fixedValue: 'R$ 700,00',
  },
  {
    key: 'adrielle',
    name: 'Adrielle Lopes Alves Gualberto',
    role: 'Instrumentadora 2',
    color: '#FF6B35',
    emoji: '🔬',
    pix: 'adriellelopesinstrumentacao@gmail.com',
    pixType: 'email',
    favored: 'Adrielle Lopes Alves Gualberto',
    fixedValue: 'R$ 450,00',
  },
  {
    key: 'fisio',
    name: 'Fisioterapia — Cintya',
    role: 'Perfeita Saúde Fisioterapia Ltda',
    color: '#00C7BE',
    emoji: '🏃‍♀️',
    pix: 'cintyafisiorj@gmail.com',
    pixType: 'email',
    favored: 'Perfeita Saúde Fisioterapia Ltda',
    fixedValue: '',
  },
];

interface Receipt {
  id: string;
  memberKey: string;
  filename: string;
  uploadedAt: string;
  valor?: string;
  data?: string;
  pagador?: string;
  raw?: string;
}

const STORAGE_KEY = 'equipe_receipts_v1';

function loadReceipts(): Receipt[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveReceipts(rs: Receipt[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rs)); } catch {}
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function EquipePane() {
  const [selected, setSelected] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>(loadReceipts);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [copied, setCopied] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedMember = TEAM.find(t => t.key === selected);
  const memberReceipts = receipts.filter(r => r.memberKey === selected);

  function handleCopy(text: string, label: string) {
    copyToClipboard(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('Lendo comprovante com IA…');

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const token = getAuthToken();
      const resp = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ base64, mediaType: file.type, filename: file.name }),
      });

      const json = await resp.json();
      const ext = json.extracted ?? {};

      // Determine which member folder to use
      let memberKey = selected;
      if (!memberKey && json.detectedMember) memberKey = json.detectedMember;

      if (!memberKey) {
        setUploadMsg(`⚠️ Não foi possível identificar o profissional. Selecione uma pasta primeiro.`);
        setUploading(false);
        return;
      }

      const newReceipt: Receipt = {
        id: `rec_${Date.now()}`,
        memberKey,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        valor: ext.valor,
        data: ext.data,
        pagador: ext.pagador,
        raw: ext.raw,
      };

      const updated = [newReceipt, ...receipts];
      setReceipts(updated);
      saveReceipts(updated);

      const member = TEAM.find(t => t.key === memberKey);
      setUploadMsg(`✅ Comprovante salvo na pasta de ${member?.name ?? memberKey}${ext.valor ? ` · ${ext.valor}` : ''}`);
      if (!selected && memberKey) setSelected(memberKey);
    } catch (err) {
      setUploadMsg(`❌ Erro: ${String(err)}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleDeleteReceipt(id: string) {
    const updated = receipts.filter(r => r.id !== id);
    setReceipts(updated);
    saveReceipts(updated);
  }

  function handleExport(memberKey: string) {
    const member = TEAM.find(t => t.key === memberKey);
    if (!member) return;
    const mrs = receipts.filter(r => r.memberKey === memberKey);
    const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  𝗯. Blue Clínica Médica e Cirúrgica`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Olá ${member.name},`,
      ``,
      `Esses foram seus recebimentos em ${month}:`,
      ``,
      ...mrs.map((r, i) => [
        `${i + 1}. ${r.filename}`,
        `   Data: ${r.data ?? '—'}`,
        `   Valor: ${r.valor ?? '—'}`,
        r.pagador ? `   Paciente: ${r.pagador}` : '',
        `   Enviado em: ${new Date(r.uploadedAt).toLocaleDateString('pt-BR')}`,
        '',
      ].filter(Boolean).join('\n')),
      `Total de recebimentos: ${mrs.length}`,
      ``,
      `Atenciosamente,`,
      `Equipe Blue Clínica`,
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recebimentos_${member.key}_${month.replace(' ', '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upload banner */}
      <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', borderRadius: '18px', padding: '18px 22px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>
            Clínica Blue · Gestão de Pagamentos
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>📎 Comprovantes da Equipe</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '2px' }}>
            Importe o comprovante e a IA identifica automaticamente o profissional
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {uploading ? '⏳ Lendo…' : '📎 Importar comprovante'}
            <input ref={fileRef} type="file" accept="image/*,.pdf,.xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {uploadMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: uploadMsg.startsWith('✅') ? '#E6F7EC' : uploadMsg.startsWith('⚠️') ? '#FFF3E0' : '#FFE5E3', color: uploadMsg.startsWith('✅') ? '#28A745' : uploadMsg.startsWith('⚠️') ? '#FF9500' : '#FF3B30', fontWeight: 600, fontSize: '13px' }}>
          {uploadMsg}
        </div>
      )}

      {/* Team grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {TEAM.map((m) => {
          const mReceipts = receipts.filter(r => r.memberKey === m.key);
          const isSelected = selected === m.key;
          return (
            <div
              key={m.key}
              onClick={() => setSelected(isSelected ? null : m.key)}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: isSelected ? `0 0 0 2px ${m.color}, 0 4px 24px rgba(0,0,0,0.1)` : '0 2px 12px rgba(0,0,0,0.06)',
                borderTop: `3px solid ${m.color}`,
                cursor: 'pointer',
                transition: 'all .2s',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {m.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1D1D1F' }}>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: m.color, fontWeight: 600 }}>{m.role}</div>
                  </div>
                </div>
                {mReceipts.length > 0 && (
                  <span style={{ background: m.color, color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                    {mReceipts.length}
                  </span>
                )}
              </div>

              {/* Bank/PIX info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {m.bank && (
                  <div style={{ fontSize: '0.72rem', color: '#86868B' }}>
                    <span style={{ fontWeight: 600 }}>Banco:</span> {m.bank}
                    {m.agency && ` · Ag: ${m.agency}`}
                    {m.account && ` · Conta: ${m.account}`}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#86868B', fontWeight: 600 }}>PIX:</span>
                  <span style={{ fontSize: '0.72rem', color: '#1D1D1F', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.pix}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(m.pix, m.key); }}
                    style={{ border: 'none', background: copied === m.key ? '#E6F7EC' : '#F2F2F7', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 700, color: copied === m.key ? '#28A745' : '#86868B', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {copied === m.key ? '✓' : 'Copiar'}
                  </button>
                </div>
                {m.fixedValue && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: m.color }}>{m.fixedValue}</div>
                )}
              </div>

              {/* Actions */}
              {isSelected && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                  <label style={{ flex: 1, textAlign: 'center', background: `${m.color}15`, border: `1.5px solid ${m.color}40`, borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: m.color, cursor: 'pointer' }}>
                    📎 Adicionar comprovante
                    <input type="file" accept="image/*,.pdf,.xlsx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {mReceipts.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport(m.key); }}
                      style={{ flex: 1, background: '#F2F2F7', border: 'none', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: '#1D1D1F', cursor: 'pointer' }}
                    >
                      📤 Exportar relatório
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected member receipts */}
      {selectedMember && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="card-ttl" style={{ margin: 0 }}>
              {selectedMember.emoji} Pasta de {selectedMember.name}
            </div>
            {memberReceipts.length > 0 && (
              <button
                onClick={() => handleExport(selected!)}
                style={{ background: selectedMember.color, color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                📤 Exportar relatório do mês
              </button>
            )}
          </div>

          {memberReceipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#86868B', fontSize: '13px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📂</div>
              Nenhum comprovante. Clique em &quot;Importar comprovante&quot; acima.
            </div>
          ) : (
            <div className="ts">
              <table>
                <thead>
                  <tr>
                    <th>Arquivo</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Paciente</th>
                    <th>Importado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {memberReceipts.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: '12px', color: '#1D1D1F', fontWeight: 600 }}>{r.filename}</td>
                      <td style={{ fontWeight: 800, color: '#28A745', whiteSpace: 'nowrap' }}>{r.valor ?? '—'}</td>
                      <td style={{ color: '#86868B', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.data ?? '—'}</td>
                      <td style={{ fontSize: '12px', color: '#86868B' }}>{r.pagador ?? '—'}</td>
                      <td style={{ fontSize: '11px', color: '#86868B' }}>{new Date(r.uploadedAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteReceipt(r.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: '14px', padding: '2px' }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
