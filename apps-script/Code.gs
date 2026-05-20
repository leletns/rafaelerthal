/**
 * ============================================================
 *  DASHBOARD DR. RAFAEL ERTHAL · API GOOGLE SHEETS v2
 * ============================================================
 *  Versão com AUTO-DETECÇÃO de novas abas.
 *
 *  Reconhece automaticamente qualquer aba cujo nome comece com:
 *    • CIRURGIAS YYYY        (ex: CIRURGIAS 2027)
 *    • CONSULTAS YYYY        (ex: CONSULTAS 2027)
 *    • RESUMO YYYY           (ex: RESUMO 2027)
 *    • ORÇAMENTOS E REALIZADOS YYYY    (formato anual)
 *    • ORÇAMENTOS [MES] YYYY            (formato mensal)
 *    • ORÇAMENTOS [MES]                 (mensal sem ano = ano atual)
 *
 *  Outras abas (FORNECEDORES, PROCEDIMENTOS, etc.) são lidas como
 *  raw data e disponibilizadas em `outras_abas` (para uso futuro).
 *
 *  COMO USAR:
 *  1. Cole este código em script.google.com (Extensões → Apps Script)
 *  2. Troque a linha TOKEN_SECRETO abaixo
 *  3. Salve · Implantar → Nova implantação → App da Web
 *     • Executar como: Eu
 *     • Quem tem acesso: Qualquer pessoa
 *  4. Copie a URL gerada e cole no dashboard
 * ============================================================
 */

// ⚠️ TROQUE ESTE TOKEN POR UM TEXTO ÚNICO E SECRETO
const TOKEN_SECRETO = 'May@Blue2026';

// ─── ENDPOINT PRINCIPAL ───────────────────────────────────────
function doGet(e) {
  try {
    const token = e && e.parameter ? e.parameter.token : null;
    if (!token || token !== TOKEN_SECRETO) {
      return jsonOut_({ error: 'Token inválido ou ausente' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const allNames = sheets.map(function(s) { return s.getName(); });

    // 1. Descobre todos os anos presentes
    const yearSet = {};
    allNames.forEach(function(name) {
      const m = name.match(/(?:CIRURGIAS|CONSULTAS|RESUMO|ORÇAMENTOS|ORCAMENTOS)\s.*?(\d{4})/i);
      if (m) yearSet[m[1]] = true;
    });
    const years = Object.keys(yearSet).map(Number).sort();
    const latestYear = years.length ? years[years.length - 1] : null;

    const result = {
      anos: years,
      cirurgias: {},
      consultas: {},
      orcamentos: {},
      outras_abas: {},
      syncedAt: new Date().toISOString()
    };

    // 2. Para cada ano descoberto, lê CIRURGIAS, CONSULTAS, RESUMO, ORÇAMENTOS
    years.forEach(function(yr) {
      const yrStr = String(yr);
      const cirName = 'CIRURGIAS ' + yrStr;
      const consName = 'CONSULTAS ' + yrStr;
      const resName = 'RESUMO ' + yrStr;

      if (allNames.indexOf(cirName) >= 0) {
        result.cirurgias[yrStr] = buildCirurgias_(ss, cirName, yr);
      }
      if (allNames.indexOf(consName) >= 0) {
        result.consultas[yrStr] = buildConsultas_(
          ss, consName,
          allNames.indexOf(resName) >= 0 ? resName : null
        );
      }

      // Orçamentos: tenta formato anual primeiro, depois mensal
      const orcFull = 'ORÇAMENTOS E REALIZADOS ' + yrStr;
      if (allNames.indexOf(orcFull) >= 0) {
        const sh = ss.getSheetByName(orcFull);
        result.orcamentos[yrStr] = countOrcamentos_(sh.getDataRange().getValues());
      } else {
        // Formato mensal: pega todas as abas ORÇAMENTOS [MES] desse ano
        const monthly = allNames.filter(function(name) {
          return matchesOrcamentoMonthly_(ss, name, yr, latestYear);
        });
        if (monthly.length) {
          const acc = zeroOrc_();
          acc.fontes = [];
          monthly.forEach(function(name) {
            const sh = ss.getSheetByName(name);
            const c = countOrcamentos_(sh.getDataRange().getValues());
            acc.total += c.total;
            acc.fechou += c.fechou;
            acc.nao += c.nao;
            acc.plano += c.plano;
            acc.pendente += c.pendente;
            acc.fontes.push(name);
          });
          result.orcamentos[yrStr] = acc;
        }
      }
    });

    // 3. Backward compatibility: também expõe cir25, cir26, cons25, etc.
    years.forEach(function(yr) {
      const suffix = String(yr).slice(-2);
      const yrStr = String(yr);
      if (result.cirurgias[yrStr]) result['cir' + suffix] = result.cirurgias[yrStr];
      if (result.consultas[yrStr]) result['cons' + suffix] = result.consultas[yrStr];
      if (result.orcamentos[yrStr]) result['orc' + suffix] = result.orcamentos[yrStr];
    });

    // 4. Outras abas (FORNECEDORES, PROCEDIMENTOS, etc.) — raw access
    const knownRe = /^(CIRURGIAS|CONSULTAS|RESUMO|ORÇAMENTOS|ORCAMENTOS)\s/i;
    allNames.forEach(function(name) {
      if (knownRe.test(name)) return;
      const sheet = ss.getSheetByName(name);
      const data = sheet.getDataRange().getValues();
      if (data.length === 0) return;
      // Limita a 500 linhas por aba pra evitar payload gigante
      const limited = data.slice(0, 501);
      const cleaned = limited.map(function(row) {
        return row.map(function(v) {
          if (v instanceof Date) return Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy');
          return v;
        });
      });
      result.outras_abas[name] = {
        headers: cleaned[0] || [],
        rows: cleaned.slice(1),
        total_rows: Math.max(0, data.length - 1),
        truncated: data.length > 501
      };
    });

    return jsonOut_(result);
  } catch (err) {
    return jsonOut_({ error: String(err), stack: err.stack || '' });
  }
}

// ─── ORÇAMENTOS MENSAIS: matching ────────────────────────────
function matchesOrcamentoMonthly_(ss, name, year, latestYear) {
  const upper = name.toUpperCase();
  if (upper.indexOf('ORÇAMENTOS ') !== 0 && upper.indexOf('ORCAMENTOS ') !== 0) return false;
  if (upper.indexOf('E REALIZADOS') >= 0) return false;

  const yearMatch = name.match(/(\d{4})/);
  if (yearMatch) {
    return parseInt(yearMatch[1]) === year;
  }
  // Sem ano no nome → inferir lendo a primeira data válida da aba
  const inferred = inferYearFromSheet_(ss, name);
  if (inferred !== null) return inferred === year;
  // Fallback final: assume o ano mais recente
  return year === latestYear;
}

function inferYearFromSheet_(ss, sheetName) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    const data = sheet.getDataRange().getValues();
    // Procura primeira data válida nas primeiras 15 linhas, 3 primeiras colunas
    for (var i = 1; i < Math.min(15, data.length); i++) {
      for (var j = 0; j < Math.min(3, data[i].length); j++) {
        if (data[i][j] instanceof Date) return data[i][j].getFullYear();
      }
    }
    return null;
  } catch(e) { return null; }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── CIRURGIAS ────────────────────────────────────────────────
function buildCirurgias_(ss, sheetName, year) {
  const empty = { mes: arr12_(), total: 0, fatMes: arr12_(), tipos: {}, lista: [] };
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return empty;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return empty;

  const headers = data[0].map(function(h) { return String(h).trim().toUpperCase(); });
  const idxData = findCol_(headers, ['DATA']);
  const idxPac  = findCol_(headers, ['PACIENTE']);
  const idxCir  = findCol_(headers, ['CIRURGIA']);
  const idxCl   = findCol_(headers, ['CLASSIFICAÇÃO', 'CLASSIFICACAO']);
  const idxVal  = findCol_(headers, ['NOTAS EMITIDAS', 'VALOR']);
  const idxReg  = findCol_(headers, ['REGIÃO', 'REGIAO']);

  const lista = [];
  const mes = arr12_();
  const fatMes = arr12_();
  const tipos = {};

  for (var i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[idxPac]) continue;
    let dateVal = row[idxData];
    let monthNum = 1;
    let dStr = '';
    if (dateVal instanceof Date) {
      monthNum = dateVal.getMonth() + 1;
      dStr = Utilities.formatDate(dateVal, 'America/Sao_Paulo', 'dd/MM');
    } else if (dateVal) {
      const m = String(dateVal).match(/(\d{1,2})\/(\d{1,2})/);
      if (m) { monthNum = parseInt(m[2]); dStr = pad_(m[1]) + '/' + pad_(m[2]); }
    }
    const valor = parseFloat(row[idxVal]) || null;
    const cl = String(row[idxCl] || '').trim();
    const reg = idxReg >= 0 ? String(row[idxReg] || '').trim() : '';
    lista.push({
      id: year + '_sync_' + i, d: dStr, mes: monthNum,
      p: String(row[idxPac]).trim(),
      c: String(row[idxCir] || '').trim(),
      cl: cl, v: valor, reg: reg
    });
    if (monthNum >= 1 && monthNum <= 12) {
      mes[monthNum - 1]++;
      if (valor && valor > 0) fatMes[monthNum - 1] += valor;
    }
    if (cl) tipos[cl] = (tipos[cl] || 0) + 1;
  }
  return { mes: mes, total: lista.length, fatMes: fatMes, tipos: tipos, lista: lista };
}

// ─── CONSULTAS + RESUMO ──────────────────────────────────────
function buildConsultas_(ss, consSheet, resumoSheet) {
  const result = {
    mes: arr12_(), total: 0,
    canal: {}, fx: {}, cidades: {}, intl: {},
    lista: []
  };

  // 1. RESUMO: contagem mensal autoritativa
  if (resumoSheet) {
    const resumo = ss.getSheetByName(resumoSheet);
    if (resumo) {
      const rData = resumo.getDataRange().getValues();
      const idxMap = {
        'JANEIRO':0,'FEVEREIRO':1,'MARÇO':2,'MARCO':2,'ABRIL':3,
        'MAIO':4,'JUNHO':5,'JULHO':6,'AGOSTO':7,
        'SETEMBRO':8,'OUTUBRO':9,'NOVEMBRO':10,'DEZEMBRO':11
      };
      for (var i = 0; i < rData.length; i++) {
        const firstCell = String(rData[i][0] || '').toUpperCase().trim();
        if (idxMap[firstCell] !== undefined && typeof rData[i][1] === 'number') {
          result.mes[idxMap[firstCell]] = rData[i][1];
        }
      }
      result.total = result.mes.reduce(function(a, b) { return a + b; }, 0);
    }
  }

  // 2. CONSULTAS: agrega + monta lista detalhada de pacientes
  const cons = ss.getSheetByName(consSheet);
  if (!cons) return result;

  const cData = cons.getDataRange().getValues();
  if (cData.length <= 1) return result;

  const headers = cData[0].map(function(h) { return String(h).trim().toUpperCase(); });
  const idxPac   = findCol_(headers, ['PACIENTE']);
  const idxData  = findCol_(headers, ['DATA']);
  const idxIdade = findCol_(headers, ['IDADE']);
  const idxCanal = findCol_(headers, ['COMO CONHECEU', 'CANAL']);
  const idxTel   = findCol_(headers, ['TELEFONE', 'CELULAR']);

  // Se total não veio do RESUMO, contar aqui mesmo
  let consultaCount = 0;

  for (var i = 1; i < cData.length; i++) {
    const row = cData[i];
    if (idxPac < 0 || !row[idxPac]) continue;
    consultaCount++;

    // Canal
    let canalRaw = '';
    if (idxCanal >= 0) {
      canalRaw = String(row[idxCanal] || '').trim();
      const v = canalRaw.toUpperCase();
      let key = 'Não informado';
      if (v && v !== '??' && v !== '-') {
        if (v.indexOf('INSTAGRAM') >= 0 || v.indexOf('REDES') >= 0) key = 'Instagram';
        else if (v.indexOf('INDICA') >= 0 || v.indexOf('AMIG') >= 0 || v.indexOf('PRIMA') >= 0 || v.indexOf('NORA') >= 0) key = 'Indicação';
        else if (v.indexOf('GOOGLE') >= 0 || v.indexOf('INTERNET') >= 0 || v.indexOf('PESQUI') >= 0) key = 'Google/Internet';
        else if (v.indexOf('DR') >= 0 || v.indexOf('DRA') >= 0 || v.indexOf('MÉDIC') >= 0 || v.indexOf('MEDIC') >= 0) key = 'Médicos';
        else key = 'Outros';
      }
      result.canal[key] = (result.canal[key] || 0) + 1;
    }

    // Idade
    let idadeNum = null;
    if (idxIdade >= 0 && row[idxIdade]) {
      const im = String(row[idxIdade]).match(/(\d+)/);
      if (im) {
        idadeNum = parseInt(im[1]);
        let bucket = '';
        if (idadeNum >= 17 && idadeNum < 30) bucket = '17–29';
        else if (idadeNum < 41) bucket = '30–40';
        else if (idadeNum < 51) bucket = '41–50';
        else if (idadeNum < 61) bucket = '51–60';
        else if (idadeNum >= 61) bucket = '61+';
        if (bucket) result.fx[bucket] = (result.fx[bucket] || 0) + 1;
      }
    }

    // Telefone + cidade/país
    let telStr = '';
    if (idxTel >= 0) {
      telStr = String(row[idxTel] || '').trim();
      if (telStr) {
        const loc = parseLocation_(telStr);
        if (loc.isIntl) result.intl[loc.label] = (result.intl[loc.label] || 0) + 1;
        else result.cidades[loc.label] = (result.cidades[loc.label] || 0) + 1;
      }
    }

    // Adiciona à lista detalhada de pacientes
    let dStr = '';
    if (idxData >= 0) {
      const d = row[idxData];
      if (d instanceof Date) dStr = Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy');
      else if (d) dStr = String(d);
    }
    var locPac = parseLocation_(telStr);
    result.lista.push({
      p: String(row[idxPac]).trim(),
      d: dStr,
      idade: idadeNum,
      canal: canalRaw,
      tel: telStr,
      reg: locPac.label || '',
      isIntl: locPac.isIntl || false
    });
  }

  // Se RESUMO não tinha dados, usa contagem da lista de consultas
  if (result.total === 0) result.total = consultaCount;

  return result;
}

function countOrcamentos_(data) {
  const result = zeroOrc_();
  let inPaymentSection = false;
  for (var i = 2; i < data.length; i++) {
    const row = data[i];
    const c0 = String(row[0] || '').trim().toUpperCase();
    const c1 = String(row[1] || '').trim().toUpperCase();
    if (c0.indexOf('PAGAMENTOS') >= 0 || c1.indexOf('PAGAMENTOS') >= 0) { inPaymentSection = true; continue; }
    if (inPaymentSection) continue;
    if (!row[0] || !row[1]) continue;
    if (c1 === 'PACIENTE' || c1 === 'DATA DA CONSULTA') continue;
    result.total++;
    const status = String(row[3] || '').trim().toUpperCase();
    if (!status) result.pendente++;
    else if (status === 'NÃO' || status === 'NAO') result.nao++;
    else if (status.indexOf('PLANO') >= 0) result.plano++;
    else if (row[3] instanceof Date || status.match(/^\d{4}-\d{2}-\d{2}/) || status.match(/^\d{2}\/\d{2}\/\d{4}/)) result.fechou++;
    else if (status === 'CANCELOU') { result.total--; }
    else result.pendente++;
  }
  return result;
}

// ─── HELPERS ─────────────────────────────────────────────────
function arr12_() { return [0,0,0,0,0,0,0,0,0,0,0,0]; }
function zeroOrc_() { return { total:0, fechou:0, nao:0, plano:0, pendente:0 }; }
function pad_(n) { return String(n).length === 1 ? '0' + n : String(n); }

function findCol_(headers, names) {
  for (var i = 0; i < names.length; i++) {
    const idx = headers.indexOf(names[i].toUpperCase().trim());
    if (idx >= 0) return idx;
  }
  for (var i = 0; i < headers.length; i++) {
    for (var j = 0; j < names.length; j++) {
      if (headers[i].indexOf(names[j].toUpperCase().trim()) >= 0) return i;
    }
  }
  return -1;
}

function parseLocation_(tel) {
  if (!tel) return { label: 'Rio de Janeiro — RJ', isIntl: false };
  const t = String(tel).trim();
  let m = t.match(/^\+?55\s*\(?(\d{2})\)?/);
  if (m) return { label: dddToCity_(m[1]), isIntl: false };
  m = t.match(/^\((\d{2})\)/);
  if (m) return { label: dddToCity_(m[1]), isIntl: false };
  m = t.match(/^\+(\d{1,4})/);
  if (m) {
    const code = m[1];
    if (code === '55') return { label: 'Rio de Janeiro — RJ', isIntl: false };
    for (var len = 3; len >= 1; len--) {
      const sub = code.substring(0, len);
      const country = ddiToCountry_(sub);
      if (country) return { label: country, isIntl: true };
    }
    return { label: 'Internacional', isIntl: true };
  }
  return { label: 'Rio de Janeiro — RJ', isIntl: false };
}

function dddToCity_(ddd) {
  const map = {'11':'São Paulo — SP','12':'São José dos Campos — SP','13':'Santos — SP','14':'Bauru — SP','15':'Sorocaba — SP','16':'Ribeirão Preto — SP','17':'São José do Rio Preto — SP','18':'Presidente Prudente — SP','19':'Campinas — SP','21':'Rio de Janeiro — RJ','22':'Campos — RJ','24':'Volta Redonda — RJ','27':'Vitória — ES','28':'Cachoeiro — ES','31':'Belo Horizonte — MG','32':'Juiz de Fora — MG','33':'Gov. Valadares — MG','34':'Uberlândia — MG','35':'Poços de Caldas — MG','37':'Divinópolis — MG','38':'Montes Claros — MG','41':'Curitiba — PR','42':'Ponta Grossa — PR','43':'Londrina — PR','44':'Maringá — PR','45':'Cascavel — PR','46':'Pato Branco — PR','47':'Joinville — SC','48':'Florianópolis — SC','49':'Chapecó — SC','51':'Porto Alegre — RS','53':'Pelotas — RS','54':'Caxias do Sul — RS','55':'Santa Maria — RS','61':'Brasília — DF','62':'Goiânia — GO','63':'Palmas — TO','64':'Rio Verde — GO','65':'Cuiabá — MT','67':'Campo Grande — MS','68':'Rio Branco — AC','69':'Porto Velho — RO','71':'Salvador — BA','73':'Itabuna — BA','74':'Juazeiro — BA','75':'Feira de Santana — BA','77':'V. da Conquista — BA','79':'Aracaju — SE','81':'Recife — PE','82':'Maceió — AL','83':'João Pessoa — PB','84':'Natal — RN','85':'Fortaleza — CE','86':'Teresina — PI','87':'Caruaru — PE','88':'Juazeiro do Norte — CE','91':'Belém — PA','92':'Manaus — AM','98':'São Luís — MA','99':'Imperatriz — MA'};
  return map[ddd] || 'Outras cidades';
}

function ddiToCountry_(code) {
  const map = {'1':'EUA e Canadá 🇺🇸','33':'França 🇫🇷','34':'Espanha 🇪🇸','39':'Itália 🇮🇹','41':'Suíça 🇨🇭','44':'Reino Unido 🇬🇧','49':'Alemanha 🇩🇪','51':'Peru 🇵🇪','52':'México 🇲🇽','54':'Argentina 🇦🇷','56':'Chile 🇨🇱','57':'Colômbia 🇨🇴','58':'Venezuela 🇻🇪','61':'Austrália 🇦🇺','81':'Japão 🇯🇵','351':'Portugal 🇵🇹','353':'Irlanda 🇮🇪','420':'Rep. Tcheca 🇨🇿','971':'EAU 🇦🇪','972':'Israel 🇮🇱','974':'Qatar 🇶🇦','593':'Equador 🇪🇨','503':'El Salvador 🇸🇻','598':'Uruguai 🇺🇾'};
  return map[code] || null;
}

// ════════════════════════════════════════════════════════════════════════
//  doPost — ESCRITA DO DASHBOARD → SHEETS
//  Recebe JSON do dashboard e grava na aba correta
// ════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body.token || body.token !== TOKEN_SECRETO) {
      return jsonOut_({ error: 'Token inválido' });
    }

    const ss  = SpreadsheetApp.getActiveSpreadsheet();
    const acao = body.acao; // 'nova_cirurgia' | 'nova_consulta' | 'atualizar_status'

    if (acao === 'nova_cirurgia') {
      // body: { data, paciente, cirurgia, classificacao, valor, regiao }
      const yr   = new Date(body.data).getFullYear() || new Date().getFullYear();
      const nome = 'CIRURGIAS ' + yr;
      const sh   = ss.getSheetByName(nome) || ss.insertSheet(nome);
      sh.appendRow([
        body.data, body.paciente, body.cirurgia,
        body.classificacao || '', body.valor || '', body.regiao || '',
        new Date().toISOString()
      ]);
      return jsonOut_({ ok: true, aba: nome, acao: 'nova_cirurgia' });
    }

    if (acao === 'nova_consulta') {
      // body: { data, paciente, idade, canal, telefone, email }
      const yr   = new Date(body.data).getFullYear() || new Date().getFullYear();
      const nome = 'CONSULTAS ' + yr;
      const sh   = ss.getSheetByName(nome) || ss.insertSheet(nome);
      sh.appendRow([
        body.data, body.paciente, body.idade || '',
        body.canal || '', body.telefone || '', body.email || '',
        new Date().toISOString()
      ]);
      return jsonOut_({ ok: true, aba: nome, acao: 'nova_consulta' });
    }

    if (acao === 'novo_orcamento') {
      // body: { data, paciente, cirurgia, valor, status, mes, ano }
      const yr   = body.ano || new Date().getFullYear();
      const mes  = (body.mes || '').toUpperCase();
      const nome = mes ? 'ORÇAMENTOS ' + mes + ' ' + yr : 'ORÇAMENTOS E REALIZADOS ' + yr;
      const sh   = ss.getSheetByName(nome) || ss.insertSheet(nome);
      sh.appendRow([
        body.data, body.paciente, body.cirurgia || '',
        body.status || '', body.valor || '', new Date().toISOString()
      ]);
      return jsonOut_({ ok: true, aba: nome, acao: 'novo_orcamento' });
    }

    if (acao === 'atualizar_status') {
      // Atualiza status de uma paciente numa aba PIPELINE (ou cria se não existir)
      const sh = ss.getSheetByName('PIPELINE') || ss.insertSheet('PIPELINE');
      // Verifica se paciente já existe e atualiza; se não, adiciona
      const data_ = sh.getDataRange().getValues();
      let found = false;
      for (var row2 = 1; row2 < data_.length; row2++) {
        if (String(data_[row2][0]).toLowerCase().trim() === String(body.paciente).toLowerCase().trim()) {
          sh.getRange(row2+1, 2).setValue(body.status);
          sh.getRange(row2+1, 3).setValue(new Date().toISOString());
          found = true; break;
        }
      }
      if (!found) {
        sh.appendRow([body.paciente, body.status, new Date().toISOString()]);
      }
      return jsonOut_({ ok: true, acao: 'atualizar_status', paciente: body.paciente, status: body.status });
    }

    return jsonOut_({ error: 'Ação desconhecida: ' + acao });
  } catch(err) {
    return jsonOut_({ error: String(err) });
  }
}
