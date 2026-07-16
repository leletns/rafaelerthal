'use client';

import { useState } from 'react';
import type { Patient, AmigoAttendanceItem } from '@/lib/data-model';
import { formatCurrency } from '@/lib/dashboard-calculations';
import WhatsAppButton from './WhatsAppButton';

interface PatientProfileModalProps {
  patient: Patient | null;
  onClose: () => void;
  amigoAttendances?: AmigoAttendanceItem[];
}

const MILESTONE_MONTHS = [
  { months: 3,  label: '3 meses',  color: '#007AFF', bg: '#E5F1FF' },
  { months: 6,  label: '6 meses',  color: '#5856D6', bg: '#EEECFF' },
  { months: 12, label: '1 ano',    color: '#28A745', bg: '#E6F7EC' },
];

function parseSurgeryDate(d: string, year: number): Date | null {
  const parts = d.split('/');
  if (parts.length !== 2) return null;
  return new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PatientProfileModal({ patient, onClose, amigoAttendances = [] }: PatientProfileModalProps) {
  const [tab, setTab] = useState<'resumo'|'cirurgias'|'consultas'|'calendario'>('resumo');

  if (!patient) return null;

  const totalRevenue = patient.surgeries.reduce((acc, s) => acc + s.v, 0);
  const today = new Date();

  // Compute anniversaries for all surgeries
  type AnnivRow = { surgery: typeof patient.surgeries[0]; year: number; months: number; label: string; color: string; bg: string; due: Date; days: number };
  const anniversaries: AnnivRow[] = [];
  for (const s of patient.surgeries) {
    const yr = (s.ano) ? s.ano : (s.d.includes('2026') ? 2026 : (s.d.includes('2025') ? 2025 : new Date().getFullYear()));
    const surgDate = parseSurgeryDate(s.d.split('/').slice(0,2).join('/'), yr);
    if (!surgDate) continue;
    for (const ms of MILESTONE_MONTHS) {
      const due = addMonths(surgDate, ms.months);
      const days = daysBetween(today, due);
      anniversaries.push({ surgery: s, year: yr, months: ms.months, label: ms.label, color: ms.color, bg: ms.bg, due, days });
    }
  }
  anniversaries.sort((a, b) => Math.abs(a.days) - Math.abs(b.days));

  // Filter AmigoClinic attendances matching this patient (by name)
  const patientSlug = patient.name.toLowerCase().split(' ').slice(0,2).join(' ');
  const myAttendances = amigoAttendances.filter(a =>
    a.patientName && a.patientName.toLowerCase().includes(patientSlug.split(' ')[0])
  ).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 10);

  function tabBtn(id: typeof tab, label: string) {
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          padding: '6px 14px', border: 'none', cursor: 'pointer', borderRadius: '8px',
          fontFamily: 'inherit', fontSize: '12px', fontWeight: tab === id ? 700 : 500,
          background: tab === id ? '#007AFF' : 'transparent',
          color: tab === id ? '#fff' : '#86868B',
          transition: 'all .15s',
        }}
      >{label}</button>
    );
  }

  return (
    <>
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,backdropFilter:'blur(4px)' }} onClick={onClose} />
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        background:'#fff',borderRadius:'20px',width:'90%',maxWidth:'600px',maxHeight:'88vh',
        overflow:'hidden',zIndex:110,boxShadow:'0 16px 64px rgba(0,0,0,0.25)',
        display:'flex',flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 24px',background:'linear-gradient(135deg,#007AFF15,#5856D615)',borderBottom:'1px solid #E5E5EA' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'14px' }}>
              <div style={{
                width:'52px',height:'52px',borderRadius:'50%',
                background:'linear-gradient(135deg,#007AFF,#5856D6)',
                display:'flex',alignItems:'center',justifyContent:'center',
                color:'#fff',fontWeight:800,fontSize:'1.2rem',flexShrink:0,
              }}>
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin:0,fontSize:'1.05rem',fontWeight:800,color:'#1D1D1F' }}>{patient.name}</h2>
                <div style={{ display:'flex',gap:'8px',marginTop:'4px',flexWrap:'wrap' }}>
                  {patient.age && <span style={{ fontSize:'0.75rem',color:'#86868B' }}>{patient.age} anos</span>}
                  {patient.city && <span style={{ fontSize:'0.75rem',color:'#86868B' }}>· {patient.city}</span>}
                  {patient.canal && (
                    <span style={{ fontSize:'0.72rem',background:'#E5F1FF',color:'#007AFF',padding:'1px 8px',borderRadius:'6px',fontWeight:600 }}>
                      {patient.canal}
                    </span>
                  )}
                </div>
                {patient.phone && (
                  <div style={{ display:'flex',alignItems:'center',gap:'6px',marginTop:'4px' }}>
                    <span style={{ fontSize:'0.75rem',color:'#86868B' }}>{patient.phone}</span>
                    <WhatsAppButton phone={patient.phone} size="sm" variant="icon" />
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#86868B',padding:'4px',borderRadius:'6px',display:'flex',alignItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginTop:'16px' }}>
            {[
              { label:'Cirurgias',    value:String(patient.surgeries.length),                        color:'#007AFF' },
              { label:'Consultas',    value:String(patient.consultations.length),                    color:'#5856D6' },
              { label:'Receita total',value:totalRevenue > 0 ? formatCurrency(totalRevenue) : '—',  color:'#28A745' },
            ].map(({ label,value,color }) => (
              <div key={label} style={{ background:`${color}10`,borderRadius:'10px',padding:'10px',textAlign:'center',borderTop:`2px solid ${color}` }}>
                <div style={{ fontSize:'1rem',fontWeight:800,color,marginBottom:'2px' }}>{value}</div>
                <div style={{ fontSize:'0.68rem',color:'#86868B',fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:'4px',padding:'10px 16px',borderBottom:'1px solid #E5E5EA',background:'#F9F9FB' }}>
          {tabBtn('resumo','Resumo')}
          {tabBtn('cirurgias','Cirurgias')}
          {tabBtn('consultas','Consultas')}
          {tabBtn('calendario','Calendário')}
        </div>

        {/* Body */}
        <div style={{ padding:'16px 20px',overflowY:'auto',flex:1 }}>

          {/* ── RESUMO ── */}
          {tab === 'resumo' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
              {/* Mesversários */}
              {anniversaries.length > 0 && (
                <div>
                  <h4 style={{ fontSize:'0.72rem',fontWeight:700,color:'#86868B',textTransform:'uppercase',letterSpacing:'0.05em',margin:'0 0 8px' }}>
                    Mesversários pós-cirurgia
                  </h4>
                  <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
                    {anniversaries.slice(0,6).map((a,i) => (
                      <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:a.bg,borderRadius:'10px',border:`1px solid ${a.color}30` }}>
                        <div>
                          <span style={{ fontWeight:700,fontSize:'0.82rem',color:a.color }}>
                            {a.label} · {fmtDate(a.due)}
                          </span>
                          <div style={{ fontSize:'0.72rem',color:'#86868B',marginTop:'1px' }}>{a.surgery.c}</div>
                        </div>
                        <span style={{ fontSize:'0.78rem',fontWeight:700,color:a.days === 0 ? '#FF3B30' : a.days > 0 && a.days <= 7 ? '#FF9500' : a.color }}>
                          {a.days === 0 ? 'Hoje' : a.days > 0 ? `em ${a.days}d` : `há ${Math.abs(a.days)}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Últimas consultas */}
              {patient.consultations.length > 0 && (
                <div>
                  <h4 style={{ fontSize:'0.72rem',fontWeight:700,color:'#86868B',textTransform:'uppercase',letterSpacing:'0.05em',margin:'0 0 8px' }}>
                    Últimas consultas
                  </h4>
                  {patient.consultations.slice(0,3).map((c,i) => (
                    <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#F9F9FB',borderRadius:'8px',marginBottom:'4px' }}>
                      <span style={{ fontSize:'0.82rem',color:'#1D1D1F',fontWeight:600 }}>{c.d}</span>
                      <span style={{ fontSize:'0.78rem',color:'#86868B' }}>{c.canal || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CIRURGIAS ── */}
          {tab === 'cirurgias' && (
            <div>
              {patient.surgeries.length === 0 ? (
                <p style={{ textAlign:'center',color:'#86868B',padding:'32px 0' }}>Nenhuma cirurgia</p>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                  {patient.surgeries.map((s,i) => {
                    const yr = (s.ano) ? s.ano : 2025;
                    const surgDate = parseSurgeryDate(s.d.split('/').slice(0,2).join('/'), yr);
                    return (
                      <div key={i} style={{ padding:'12px 14px',background:'#F9F9FB',borderRadius:'10px',borderLeft:'3px solid #007AFF' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
                          <span style={{ fontWeight:700,fontSize:'0.875rem',color:'#1D1D1F' }}>{s.c}</span>
                          <span style={{ fontWeight:800,color:'#28A745',fontSize:'0.875rem' }}>{s.v > 0 ? formatCurrency(s.v) : '—'}</span>
                        </div>
                        <div style={{ fontSize:'0.75rem',color:'#86868B' }}>{s.d} · {s.mes} · {s.cl}</div>
                        {surgDate && (
                          <div style={{ display:'flex',gap:'8px',marginTop:'8px',flexWrap:'wrap' }}>
                            {MILESTONE_MONTHS.map(ms => {
                              const due = addMonths(surgDate, ms.months);
                              const days = daysBetween(today, due);
                              return (
                                <span key={ms.months} style={{ fontSize:'0.68rem',padding:'2px 8px',borderRadius:'6px',background:ms.bg,color:ms.color,fontWeight:600 }}>
                                  {ms.label}: {fmtDate(due)}{days >= 0 && days <= 30 ? ` (em ${days}d)` : days < 0 && days >= -30 ? ` (há ${Math.abs(days)}d)` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CONSULTAS ── */}
          {tab === 'consultas' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
              {patient.consultations.length === 0 ? (
                <p style={{ textAlign:'center',color:'#86868B',padding:'32px 0' }}>Nenhuma consulta</p>
              ) : (
                patient.consultations.map((c,i) => (
                  <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#F9F9FB',borderRadius:'8px' }}>
                    <div>
                      <span style={{ fontWeight:600,fontSize:'0.82rem',color:'#1D1D1F' }}>{c.d}</span>
                      <span style={{ color:'#86868B',marginLeft:'8px',fontSize:'0.78rem' }}>{c.canal || '—'}</span>
                    </div>
                    <span style={{ color:'#5856D6',fontWeight:600,fontSize:'0.75rem' }}>{c.idade > 0 ? `${c.idade}a` : '—'}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CALENDÁRIO ── */}
          {tab === 'calendario' && (
            <div>
              <h4 style={{ fontSize:'0.72rem',fontWeight:700,color:'#86868B',textTransform:'uppercase',letterSpacing:'0.05em',margin:'0 0 12px' }}>
                Atendimentos (AmigoClinic)
              </h4>
              {myAttendances.length === 0 ? (
                <div style={{ textAlign:'center',padding:'32px 0',color:'#86868B',fontSize:'0.85rem' }}>
                                    Nenhum atendimento encontrado no AmigoClinic
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                  {myAttendances.map((a,i) => (
                    <div key={i} style={{ padding:'10px 12px',background:'#F9F9FB',borderRadius:'10px',borderLeft:'3px solid #FF9500' }}>
                      <div style={{ display:'flex',justifyContent:'space-between' }}>
                        <span style={{ fontWeight:700,fontSize:'0.82rem',color:'#1D1D1F' }}>
                          {a.date} {a.time && `· ${a.time}`}
                        </span>
                        {a.status && (
                          <span style={{ fontSize:'0.68rem',padding:'2px 8px',borderRadius:'6px',background:'#FFF3E0',color:'#FF9500',fontWeight:600 }}>
                            {a.status}
                          </span>
                        )}
                      </div>
                      {a.procedure && <div style={{ fontSize:'0.75rem',color:'#86868B',marginTop:'2px' }}>{a.procedure}</div>}
                      {a.doctorName && <div style={{ fontSize:'0.72rem',color:'#86868B' }}>Dr(a). {a.doctorName}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming anniversaries */}
              {anniversaries.filter(a => a.days >= 0 && a.days <= 60).length > 0 && (
                <div style={{ marginTop:'16px' }}>
                  <h4 style={{ fontSize:'0.72rem',fontWeight:700,color:'#86868B',textTransform:'uppercase',letterSpacing:'0.05em',margin:'0 0 8px' }}>
                    Próximos mesversários
                  </h4>
                  {anniversaries.filter(a => a.days >= 0 && a.days <= 60).map((a,i) => (
                    <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:a.bg,borderRadius:'8px',marginBottom:'4px',border:`1px solid ${a.color}25` }}>
                      <span style={{ fontSize:'0.82rem',fontWeight:600,color:a.color }}>{a.label} — {fmtDate(a.due)}</span>
                      <span style={{ fontSize:'0.78rem',color:a.color,fontWeight:700 }}>em {a.days}d</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px',borderTop:'1px solid #E5E5EA',background:'#F9F9FB' }}>
          <button onClick={onClose} style={{ width:'100%',padding:'10px',borderRadius:'10px',border:'none',background:'#007AFF',color:'#fff',fontWeight:700,fontSize:'0.875rem',cursor:'pointer',fontFamily:'inherit' }}>
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
