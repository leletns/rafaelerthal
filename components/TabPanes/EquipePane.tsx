'use client';

import { useState, useRef } from 'react';
import { getAuthToken } from '@/lib/safe-storage';
// @ts-ignore
import * as XLSX from 'xlsx';

interface TeamMember {
  key: string;
  name: string;
  role: string;
  color: string;      // usada na tela (acompanha o tema)
  print: string;      // usada no relatório impresso (documento à parte)
  initials: string;
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
    color: 'var(--c-blue)',
    print: '#0B63CE',
    initials: 'BC',
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
    color: 'var(--c-purple)',
    print: '#4A45C4',
    initials: 'AN',
    pix: '44856036000147',
    pixType: 'cnpj',
    favored: 'EP Serviços Médicos Ltda',
    fixedValue: '',
  },
  {
    key: 'leo',
    name: 'Leonardo Valadão Pinto',
    role: 'Cirurgião Auxiliar',
    color: 'var(--c-green)',
    print: '#167A3A',
    initials: 'LV',
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
    color: 'var(--c-orange)',
    print: '#A85B00',
    initials: 'MP',
    pix: '21995892783',
    pixType: 'phone',
    favored: 'Magda Pires dos Santos',
    fixedValue: 'R$ 700,00',
  },
  {
    key: 'adrielle',
    name: 'Adrielle Lopes Alves Gualberto',
    role: 'Instrumentadora 2',
    color: 'var(--c-coral)',
    print: '#B24A1E',
    initials: 'AL',
    pix: 'adriellelopesinstrumentacao@gmail.com',
    pixType: 'email',
    favored: 'Adrielle Lopes Alves Gualberto',
    fixedValue: 'R$ 450,00',
  },
  {
    key: 'fisio',
    name: 'Fisioterapia — Cintya',
    role: 'Perfeita Saúde Fisioterapia Ltda',
    color: 'var(--c-teal)',
    print: '#0E7490',
    initials: 'CF',
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
  const [uploadMsg, setUploadMsg] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null);
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
    setUploadMsg({ tone: 'warn', text: 'Lendo o comprovante…' });

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
        setUploadMsg({ tone: 'warn', text: 'Não deu para identificar o profissional. Escolha a pasta e tente de novo.' });
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
      setUploadMsg({ tone: 'ok', text: `Comprovante salvo na pasta de ${member?.name ?? memberKey}${ext.valor ? ` · ${ext.valor}` : ''}` });
      if (!selected && memberKey) setSelected(memberKey);
    } catch (err) {
      setUploadMsg({ tone: 'error', text: 'Não foi possível ler o comprovante. Tente outro arquivo.' });
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

  function handleExportExcel(memberKey: string) {
    const member = TEAM.find(t => t.key === memberKey);
    if (!member) return;
    const mrs = receipts.filter(r => r.memberKey === memberKey);
    const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const totalValor = mrs.filter(r => r.valor).length;

    const rowsHtml = mrs.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.filename}</td>
        <td>${r.data ?? '—'}</td>
        <td style="font-weight:700;color:#28A745">${r.valor ?? '—'}</td>
        <td>${r.pagador ?? '—'}</td>
        <td>${new Date(r.uploadedAt).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório — ${member.name} — ${month}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; padding: 40px; background: #fff; }
    .header { display: flex; align-items: center; gap: 20px; padding-bottom: 24px; border-bottom: 2px solid #007AFF; margin-bottom: 28px; }
    .logo { font-size: 48px; font-weight: 200; color: #007AFF; letter-spacing: -4px; font-family: 'Montserrat', sans-serif; }
    .clinic-name { font-size: 20px; font-weight: 800; color: #1D1D1F; }
    .clinic-sub { font-size: 12px; color: #86868B; margin-top: 2px; }
    .member-box { background: ${member.print}10; border-left: 4px solid ${member.print}; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 24px; }
    .member-name { font-size: 18px; font-weight: 800; color: #1D1D1F; }
    .member-role { font-size: 12px; color: ${member.print}; font-weight: 600; margin-top: 2px; }
    .member-month { font-size: 13px; color: #86868B; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #F5F5F7; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #F2F2F7; }
    tr:last-child td { border-bottom: none; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
    .summary-card { background: #F5F5F7; border-radius: 10px; padding: 12px 18px; }
    .summary-val { font-size: 22px; font-weight: 800; color: #007AFF; }
    .summary-lbl { font-size: 11px; color: #86868B; font-weight: 600; margin-top: 2px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E5EA; font-size: 11px; color: #AEAEB2; text-align: center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">b.</div>
    <div>
      <div class="clinic-name">Blue Clínica Médica e Cirúrgica</div>
      <div class="clinic-sub">Dr. Rafael Erthal · Relatório de Recebimentos</div>
    </div>
  </div>

  <div class="member-box">
    <div class="member-name">${member.name}</div>
    <div class="member-role">${member.role}</div>
    <div class="member-month">Período: ${month}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Arquivo</th>
        <th>Data</th>
        <th>Valor</th>
        <th>Paciente</th>
        <th>Importado em</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="6" style="text-align:center;color:#86868B;padding:20px">Nenhum comprovante</td></tr>'}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-val">${mrs.length}</div>
      <div class="summary-lbl">Total de comprovantes</div>
    </div>
    <div class="summary-card">
      <div class="summary-val">${totalValor}</div>
      <div class="summary-lbl">Com valor identificado</div>
    </div>
  </div>

  <div class="footer">
    © 2026 Blue Clínica Médica e Cirúrgica · Desenvolvido por Letícia Nascimento
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Por favor, permita pop-ups para este site para ver a pré-visualização.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Importação de comprovantes */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h2 className="sec-ttl">Comprovantes da equipe</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px', maxWidth: '46ch' }}>
            Importe o comprovante e o painel identifica sozinho de quem é, guardando na pasta certa.
          </p>
        </div>
        <label className="btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Lendo…' : 'Importar comprovante'}
          <input ref={fileRef} type="file" accept="image/*,.pdf,.xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {uploadMsg && (
        <div
          role="status"
          style={{
            padding: '11px 15px', borderRadius: '10px', fontWeight: 600, fontSize: '13.5px',
            background: uploadMsg.tone === 'ok' ? 'var(--tint-green)' : uploadMsg.tone === 'warn' ? 'var(--tint-orange)' : 'var(--tint-red)',
            color: uploadMsg.tone === 'ok' ? 'var(--c-green)' : uploadMsg.tone === 'warn' ? 'var(--c-orange)' : 'var(--c-red)',
          }}
        >
          {uploadMsg.text}
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
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderTop: `3px solid ${m.color}`,
                borderRadius: '16px',
                padding: '16px',
                boxShadow: isSelected ? `0 0 0 2px ${m.color}, var(--shadow-2)` : 'var(--shadow-1)',
                cursor: 'pointer',
                transition: 'box-shadow .2s ease',
                position: 'relative',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div aria-hidden="true" style={{ width: '42px', height: '42px', borderRadius: '12px', background: `color-mix(in srgb, ${m.color} 14%, transparent)`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, letterSpacing: '.5px' }}>
                    {m.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: m.color, fontWeight: 600 }}>{m.role}</div>
                  </div>
                </div>
                {mReceipts.length > 0 && (
                  <span style={{ background: m.color, color: 'var(--on-accent)', borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                    {mReceipts.length}
                  </span>
                )}
              </div>

              {/* Bank/PIX info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {m.bank && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>
                    <span style={{ fontWeight: 600 }}>Banco:</span> {m.bank}
                    {m.agency && ` · Ag: ${m.agency}`}
                    {m.account && ` · Conta: ${m.account}`}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 600 }}>PIX:</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.pix}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(m.pix, m.key); }}
                    style={{ border: 'none', background: copied === m.key ? 'var(--tint-green)' : 'var(--fill)', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 700, color: copied === m.key ? 'var(--c-green)' : 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {copied === m.key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                {m.fixedValue && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: m.color }}>{m.fixedValue}</div>
                )}
              </div>

              {/* Actions */}
              {isSelected && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                  <label style={{ flex: 1, textAlign: 'center', background: `color-mix(in srgb, ${m.color} 8%, transparent)`, border: `1.5px solid color-mix(in srgb, ${m.color} 25%, transparent)`, borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: m.color, cursor: 'pointer' }}>
                    Adicionar comprovante
                    <input type="file" accept="image/*,.pdf,.xlsx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {mReceipts.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExportExcel(m.key); }}
                      style={{ flex: 1, background: 'var(--fill)', border: 'none', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}
                    >
                      Imprimir / PDF
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
              Pasta de {selectedMember.name}
            </div>
            {memberReceipts.length > 0 && (
              <button
                onClick={() => handleExportExcel(selected!)}
                style={{ background: selectedMember.color, color: 'var(--on-accent)', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Imprimir / PDF
              </button>
            )}
          </div>

          {memberReceipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-2)', fontSize: '13px' }}>
              Nenhum comprovante nesta pasta ainda. Use &quot;Importar comprovante&quot; acima.
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
                    <th><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {memberReceipts.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>{r.filename}</td>
                      <td style={{ fontWeight: 800, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>{r.valor ?? '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.data ?? '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{r.pagador ?? '—'}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{new Date(r.uploadedAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteReceipt(r.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-red)', fontSize: '14px', padding: '2px' }}
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
