/* Checklist estático JR Telecom: cache local persistente e fotos fornecidas por public/. */
'use strict';

const CONFIG = window.APP_CONFIG;
if (!CONFIG) throw new Error('config.js não foi carregado.');
const VEICULOS = CONFIG.veiculos;
const CONDUTORES = CONFIG.condutores;
const ITENS = CONFIG.itensChecklist;
const $ = id => document.getElementById(id);

let assinou = false;
let desenhando = false;
let assinaturaDemoAtiva = false;
let assinaturaFoiLimpa = false;
let ultimoDiaKm = null;
let kmEditadoPendente = false;
let timerPersistencia = null;
let bancoCachePromise = null;

function nomeExibicao(texto) {
  return texto.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()).replace(/ (Da|De|Do|Das|Dos|E) /g, s => s.toLowerCase());
}

function abrirBancoCache() {
  if (bancoCachePromise) return bancoCachePromise;
  bancoCachePromise = new Promise(resolve => {
    if (!('indexedDB' in window)) { resolve(null); return; }
    let request;
    try { request = indexedDB.open(CONFIG.cacheDatabaseName, 1); }
    catch (_) { resolve(null); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONFIG.cacheStoreName)) db.createObjectStore(CONFIG.cacheStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return bancoCachePromise;
}

function lerCacheLocal(chave) {
  try {
    const raw = localStorage.getItem(CONFIG.cachePrefix + chave);
    return raw === null ? undefined : JSON.parse(raw);
  } catch (_) { return undefined; }
}

async function lerCache(chave) {
  const db = await abrirBancoCache();
  if (db) {
    try {
      const valor = await new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.cacheStoreName, 'readonly');
        const req = tx.objectStore(CONFIG.cacheStoreName).get(chave);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (valor !== undefined) return valor;
    } catch (_) { /* Tenta a cópia de contingência no localStorage. */ }
  }
  return lerCacheLocal(chave);
}

async function gravarCache(chave, valor) {
  const db = await abrirBancoCache();
  if (db) {
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG.cacheStoreName, 'readwrite');
        tx.objectStore(CONFIG.cacheStoreName).put(valor, chave);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transação de cache cancelada.'));
      });
      return true;
    } catch (_) { /* Tenta o localStorage como contingência. */ }
  }
  try {
    localStorage.setItem(CONFIG.cachePrefix + chave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.warn('Não foi possível salvar no cache do navegador:', error);
    return false;
  }
}

function valorOuPadrao(cache, campo, padrao) {
  const valor = cache && Object.prototype.hasOwnProperty.call(cache, campo) ? cache[campo] : undefined;
  return valor === undefined || valor === null ? padrao : valor;
}

function preencherSelects(valores) {
  $('veiculo').innerHTML = '<option value="">Selecione...</option>' + VEICULOS.map(v => `<option value="${v.codigo}">${v.codigo} - ${v.modelo} (${v.placa})</option>`).join('');
  $('condutor').innerHTML = '<option value="">Selecione seu nome...</option>' + CONDUTORES.map(c => `<option value="${c}">${nomeExibicao(c)}</option>`).join('');
  $('veiculo').value = String(valores.veiculo ?? '');
  if (!$('veiculo').value) $('veiculo').value = String(CONFIG.defaults.veiculo);
  $('condutor').value = String(valores.condutor ?? '');
  if (!$('condutor').value) $('condutor').value = String(CONFIG.defaults.condutor);
}

function valorMarcado(name) {
  const input = document.querySelector(`input[name="${name}"]:checked`);
  return input ? input.value : '';
}

function montarChecklist(statuses) {
  $('itens').innerHTML = ITENS.map((item, i) => {
    const raw = Array.isArray(statuses) && statuses[i] !== undefined && statuses[i] !== null ? statuses[i] : CONFIG.defaults.itens[i];
    const status = raw === 'NC' ? 'NC' : 'C';
    return `
      <div class="linha">
        <span class="texto-item">${i + 1}. ${item}</span>
        <div class="seg" role="group" aria-label="${item}">
          <label><input type="radio" name="it${i}" value="C" ${status === 'C' ? 'checked' : ''}><span class="ok">Conforme (C)</span></label>
          <label><input type="radio" name="it${i}" value="NC" ${status === 'NC' ? 'checked' : ''}><span class="no">Não conforme (NC)</span></label>
        </div>
      </div>`;
  }).join('');
}

function obterItensMarcados() {
  return ITENS.map((_, i) => valorMarcado('it' + i));
}

function dataLocalHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diferencaDias(dataAnterior, dataAtual) {
  const a = /^\d{4}-\d{2}-\d{2}$/.test(dataAnterior || '') ? dataAnterior.split('-').map(Number) : null;
  const b = /^\d{4}-\d{2}-\d{2}$/.test(dataAtual || '') ? dataAtual.split('-').map(Number) : null;
  if (!a || !b) return 0;
  return Math.floor((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

function atualizarViradaDoDia() {
  const hoje = dataLocalHoje();
  if (!ultimoDiaKm) { ultimoDiaKm = hoje; return false; }
  const dias = diferencaDias(ultimoDiaKm, hoje);
  if (dias === 0) return false;
  if (dias > 0 && !kmEditadoPendente) {
    const valor = $('km').value;
    if (valor !== '' && Number.isFinite(Number(valor)) && Number(valor) >= 0) {
      $('km').value = String(Number(valor) + dias * Number(CONFIG.kmIncrementoDiario || 30));
    }
  }
  // Em caso de ajuste do relógio para trás, apenas reinicia a data-base; nunca reduz a KM.
  ultimoDiaKm = hoje;
  return true;
}

function lerFormularioCache() {
  return {
    veiculo: $('veiculo').value,
    condutor: $('condutor').value,
    pin: $('pin').value,
    tipo: valorMarcado('tipo'),
    km: $('km').value,
    observacao: $('obs').value,
    itens: obterItensMarcados(),
    kmData: ultimoDiaKm || dataLocalHoje()
  };
}

async function persistirFormulario() {
  if (timerPersistencia) { clearTimeout(timerPersistencia); timerPersistencia = null; }
  atualizarViradaDoDia();
  if (kmEditadoPendente) {
    ultimoDiaKm = dataLocalHoje();
    kmEditadoPendente = false;
  }
  await gravarCache('formulario', lerFormularioCache());
}

function agendarPersistenciaFormulario() {
  if (timerPersistencia) clearTimeout(timerPersistencia);
  timerPersistencia = setTimeout(() => { void persistirFormulario(); }, 220);
}

function arquivosDoInput(input) {
  return Array.from(input.files || []);
}

function anexarArquivos(input, files) {
  if (typeof DataTransfer === 'undefined') throw new Error('Este navegador não permite anexar automaticamente as fotos de exemplo. Use um navegador atualizado.');
  const transfer = new DataTransfer();
  files.slice(0, 6).forEach(file => transfer.items.add(file));
  input.files = transfer.files;
}

function carregarArquivoPublico(nome) {
  const base = new URL(CONFIG.publicFolder || './public/', document.baseURI);
  const url = new URL(encodeURIComponent(nome), base);
  return fetch(url.href, { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error(`Não foi possível carregar public/${nome} (HTTP ${response.status}).`);
    return response.blob();
  }).then(blob => new File([blob], nome, { type: blob.type || 'image/jpeg', lastModified: Date.now() }));
}

function arquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível guardar a foto ' + file.name + ' no cache.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function serializarArquivos(files) {
  return Promise.all(files.map(async file => ({
    name: file.name,
    type: file.type || 'image/jpeg',
    lastModified: file.lastModified || Date.now(),
    dataUrl: await arquivoParaDataUrl(file)
  })));
}

function dataUrlParaArquivo(registro) {
  if (!registro || typeof registro.dataUrl !== 'string' || !registro.dataUrl.startsWith('data:')) return null;
  try {
    const [meta, conteudo] = registro.dataUrl.split(',', 2);
    if (!conteudo) return null;
    const mime = ((meta.match(/^data:([^;]+)/) || [])[1]) || registro.type || 'image/jpeg';
    const binario = atob(conteudo);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return new File([bytes], registro.name || 'foto-cache.jpeg', { type: mime, lastModified: registro.lastModified || Date.now() });
  } catch (_) {
    // Um registro de cache danificado deve provocar o fallback para public/.
    return null;
  }
}

function previa(input, targetId, limit) {
  const target = $(targetId);
  target.querySelectorAll('img[data-object-url]').forEach(img => URL.revokeObjectURL(img.dataset.objectUrl));
  target.innerHTML = '';
  const files = arquivosDoInput(input).slice(0, limit);
  files.forEach(file => {
    const card = document.createElement('div');
    card.className = 'foto-item';
    const img = document.createElement('img');
    img.alt = 'Pré-visualização de ' + file.name;
    img.src = URL.createObjectURL(file);
    img.dataset.objectUrl = img.src;
    const name = document.createElement('small');
    name.textContent = file.name + ' · ' + (file.size / 1024).toFixed(0) + ' KB';
    card.append(img, name);
    target.appendChild(card);
  });
  if ((input.files || []).length > limit) {
    const note = document.createElement('small');
    note.textContent = `Somente as ${limit} primeiras fotos serão enviadas.`;
    target.appendChild(note);
  }
}

function prefixoDoTipo(tipo) { return tipo === 'Saída' ? 's-' : 'e-'; }

function fotosConfiguradas(tipo) {
  const prefixo = prefixoDoTipo(tipo);
  const lista = CONFIG.fotosPorTipo && CONFIG.fotosPorTipo[tipo];
  return (Array.isArray(lista) ? lista : []).filter(nome => typeof nome === 'string' && nome.startsWith(prefixo)).slice(0, 6);
}

async function restaurarFotos(tipo, permitirCache = true) {
  let arquivos = null;
  let origem = 'public';

  if (permitirCache) {
    const cache = await lerCache('fotos');
    if (cache && cache.tipo === tipo && Array.isArray(cache.files) && cache.files.length > 0) {
      // O cache só é válido quando contém os dados reais das imagens, não apenas nomes.
      // Isso também migra automaticamente os registros antigos para o formato completo.
      const convertidos = cache.files.map(dataUrlParaArquivo);
      if (convertidos.length && convertidos.every(Boolean)) {
        arquivos = convertidos.slice(0, 6);
        origem = cache.origem === 'public' ? 'public' : 'manual';
      }
    }
  }

  // Sem imagens válidas no cache (ou ao trocar o tipo), carrega os padrões de ./public.
  if (!arquivos) {
    const nomes = fotosConfiguradas(tipo);
    arquivos = await Promise.all(nomes.map(carregarArquivoPublico));
    origem = 'public';
  }

  anexarArquivos($('fotos'), arquivos);
  previa($('fotos'), 'prevFotos', 6);

  // Guarda os bytes/base64 também para as fotos de ./public, permitindo cache-first real.
  const registros = await serializarArquivos(arquivos);
  await gravarCache('fotos', { tipo, origem, files: registros });
}

async function restaurarSelfie() {
  const cache = await lerCache('selfie');
  let arquivos = null;
  let origem = 'public';

  if (cache && Array.isArray(cache.files) && cache.files.length > 0) {
    const convertidos = cache.files.map(dataUrlParaArquivo);
    if (convertidos.length && convertidos.every(Boolean)) {
      arquivos = convertidos.slice(0, 1);
      origem = cache.origem === 'public' ? 'public' : 'manual';
    }
  }

  if (!arquivos) arquivos = [await carregarArquivoPublico(CONFIG.defaults.selfieFoto)];
  anexarArquivos($('selfie'), arquivos);
  previa($('selfie'), 'prevSelfie', 1);

  // A selfie padrão também passa a ser restaurada do cache nas próximas aberturas.
  await gravarCache('selfie', { origem, files: await serializarArquivos(arquivos) });
}

async function persistirSelfie() {
  const files = arquivosDoInput($('selfie')).slice(0, 1);
  const records = await serializarArquivos(files);
  await gravarCache('selfie', { origem: 'manual', files: records });
}

function mostrarMensagem(text, tipo = 'err') {
  const box = $('out');
  box.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'st ' + tipo;
  note.textContent = text;
  box.appendChild(note);
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function prepararCanvas() {
  const canvas = $('assin');
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.strokeStyle = '#0b1e8a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
}

function desenharAssinaturaDemonstrativa() {
  const ctx = prepararCanvas();
  ctx.font = 'italic 24px cursive';
  ctx.fillStyle = '#0b1e8a';
  ctx.fillText(CONFIG.defaults.assinaturaDemoTexto || 'Assinatura de teste', 20, 62);
  ctx.beginPath();
  ctx.moveTo(20, 80);
  ctx.bezierCurveTo(80, 116, 145, 50, 210, 91);
  ctx.bezierCurveTo(245, 112, 270, 71, 315, 89);
  ctx.stroke();
  assinou = true;
  assinaturaDemoAtiva = true;
  assinaturaFoiLimpa = false;
}

function desenharDataUrlAssinatura(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = $('assin').getContext('2d');
      ctx.drawImage(img, 0, 0, $('assin').clientWidth, $('assin').clientHeight);
      assinou = true;
      assinaturaDemoAtiva = false;
      assinaturaFoiLimpa = false;
      resolve();
    };
    img.onerror = () => reject(new Error('Não foi possível restaurar a última assinatura salva.'));
    img.src = dataUrl;
  });
}

async function restaurarAssinatura(valorCache) {
  prepararCanvas();
  const valor = valorCache === undefined || valorCache === null ? CONFIG.defaults.assinaturaDataUrl : valorCache;
  if (valor === '') {
    $('assin').getContext('2d').clearRect(0, 0, $('assin').clientWidth, $('assin').clientHeight);
    assinou = false;
    assinaturaFoiLimpa = true;
    assinaturaDemoAtiva = false;
    return;
  }
  if (typeof valor === 'string' && valor.startsWith('data:image/')) {
    try { await desenharDataUrlAssinatura(valor); return; }
    catch (_) { /* Usa a assinatura configurada como alternativa se o cache estiver danificado. */ }
  }
  if (CONFIG.defaults.assinaturaDemonstrativa) desenharAssinaturaDemonstrativa();
  else {
    $('assin').getContext('2d').clearRect(0, 0, $('assin').clientWidth, $('assin').clientHeight);
    assinou = false;
    assinaturaDemoAtiva = false;
  }
}

function limparAssinatura() {
  const canvas = $('assin');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  assinou = false;
  assinaturaDemoAtiva = false;
  assinaturaFoiLimpa = true;
  void gravarCache('assinatura', '');
}

function finalizarDesenhoAssinatura() {
  if (!desenhando) return;
  desenhando = false;
  if (assinou) void gravarCache('assinatura', $('assin').toDataURL('image/png'));
}

function validarFormulario() {
  const faltas = [];
  if (!$('veiculo').value) faltas.push('veículo');
  if (!$('condutor').value) faltas.push('condutor');
  if (!/^\d{4}$/.test($('pin').value)) faltas.push('PIN de 4 dígitos');
  if (!document.querySelector('input[name="tipo"]:checked')) faltas.push('tipo de vistoria');
  if (!$('km').value || Number($('km').value) < 0) faltas.push('quilometragem');
  const semMarca = ITENS.map((_, i) => valorMarcado('it' + i) ? null : i + 1).filter(Boolean);
  if (semMarca.length) faltas.push('itens do checklist ' + semMarca.join(', '));
  if (!$('selfie').files.length) faltas.push('selfie');
  if (!$('fotos').files.length) faltas.push('ao menos uma foto do veículo');
  if (!assinou) faltas.push('assinatura');
  return faltas;
}

function reduzirArquivo(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem ' + file.name + '.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida: ' + file.name));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function dadosDoFormulario(imagens) {
  return {
    veiculo: $('veiculo').value,
    condutor: $('condutor').value,
    pin: $('pin').value,
    km: $('km').value,
    observacao: $('obs').value.trim(),
    tipo: valorMarcado('tipo'),
    itens: obterItensMarcados(),
    selfie: imagens[0],
    fotos: imagens.slice(1),
    assinatura: $('assin').toDataURL('image/png'),
    gps: { erro: 'modo de teste estático — localização real não coletada' },
    dispositivo: navigator.userAgent,
    modoTeste: true
  };
}

function enviarPeloServidorExistente(dados, button) {
  const runner = window.google && window.google.script && window.google.script.run;
  if (!runner) {
    mostrarMensagem('Os dados e as fotos foram preparados no navegador, mas NÃO foram enviados. Esta página do GitHub Pages não possui a ponte google.script.run. O ZIP não contém uma API HTTP pública comprovada; para enviar de verdade, o servidor precisa expor um endpoint compatível ou a página precisa rodar no Google Apps Script. Servidor configurado: ' + CONFIG.serverUrl, 'err');
    button.disabled = false;
    button.textContent = 'Enviar checklist';
    return;
  }
  runner.withSuccessHandler(result => {
    mostrarMensagem('Checklist enviado pelo servidor. Protocolo: ' + (result && result.id ? result.id : 'retorno sem protocolo') + '. Confirme o registro no sistema antes de encerrar o teste.', 'ok');
    button.disabled = false;
    button.textContent = 'Enviar checklist';
  }).withFailureHandler(error => {
    mostrarMensagem('O servidor recusou o envio: ' + (error && error.message ? error.message : 'falha não detalhada') + '. Confira o PIN e os logs do Apps Script.', 'err');
    button.disabled = false;
    button.textContent = 'Enviar checklist';
  }).enviarChecklist(dados);
}

async function enviar() {
  await persistirFormulario();
  const faltas = validarFormulario();
  if (faltas.length) { mostrarMensagem('Falta preencher: ' + faltas.join(', ') + '.', 'err'); return; }
  const button = $('enviar');
  button.disabled = true;
  button.textContent = 'Preparando fotos...';
  $('out').innerHTML = '';
  try {
    const arquivos = arquivosDoInput($('fotos')).slice(0, 6);
    const imagens = await Promise.all([reduzirArquivo($('selfie').files[0], 1280, 0.8)].concat(arquivos.map(file => reduzirArquivo(file, 1920, 0.82))));
    const dados = dadosDoFormulario(imagens);
    button.textContent = 'Enviando...';
    enviarPeloServidorExistente(dados, button);
  } catch (error) {
    mostrarMensagem(error && error.message ? error.message : 'Não foi possível preparar as imagens.', 'err');
    button.disabled = false;
    button.textContent = 'Enviar checklist';
  }
}

function conectarEventos() {
  ['veiculo', 'condutor', 'pin', 'obs'].forEach(id => {
    $(id).addEventListener('input', agendarPersistenciaFormulario);
    $(id).addEventListener('change', agendarPersistenciaFormulario);
  });
  document.querySelectorAll('input[name="tipo"]').forEach(radio => radio.addEventListener('change', async () => {
    agendarPersistenciaFormulario();
    try { await restaurarFotos(valorMarcado('tipo'), false); }
    catch (error) { mostrarMensagem(error.message, 'err'); }
  }));
  $('km').addEventListener('focus', () => { if (atualizarViradaDoDia()) void persistirFormulario(); });
  $('km').addEventListener('input', () => { kmEditadoPendente = true; agendarPersistenciaFormulario(); });
  $('km').addEventListener('change', () => { kmEditadoPendente = true; agendarPersistenciaFormulario(); });
  $('itens').addEventListener('change', event => {
    if (event.target && event.target.matches('input[type="radio"]')) agendarPersistenciaFormulario();
  });
  $('tudoC').addEventListener('click', () => {
    ITENS.forEach((_, i) => { const c = document.querySelector(`input[name="it${i}"][value="C"]`); if (c) c.checked = true; });
    agendarPersistenciaFormulario();
  });
  $('selfie').addEventListener('change', async () => {
    previa($('selfie'), 'prevSelfie', 1);
    try { await persistirSelfie(); }
    catch (error) { mostrarMensagem(error.message, 'err'); }
  });
  $('fotos').addEventListener('change', async () => {
    const files = arquivosDoInput($('fotos')).slice(0, 6);
    if (!files.length) {
      try { await restaurarFotos(valorMarcado('tipo'), false); }
      catch (error) { mostrarMensagem(error.message, 'err'); }
      return;
    }
    previa($('fotos'), 'prevFotos', 6);
    try {
      const tipo = valorMarcado('tipo');
      const records = await serializarArquivos(files);
      await gravarCache('fotos', { tipo, origem: 'manual', files: records });
    } catch (error) { mostrarMensagem(error.message, 'err'); }
  });
  $('limpar').addEventListener('click', limparAssinatura);
  $('enviar').addEventListener('click', enviar);
  const canvas = $('assin');
  function point(event) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
  canvas.addEventListener('pointerdown', event => {
    desenhando = true;
    assinaturaDemoAtiva = false;
    assinaturaFoiLimpa = false;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener('pointermove', event => {
    if (!desenhando) return;
    const p = point(event);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    assinou = true;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => canvas.addEventListener(name, finalizarDesenhoAssinatura));
  window.addEventListener('resize', async () => {
    const saved = assinou ? canvas.toDataURL('image/png') : null;
    prepararCanvas();
    if (saved && !assinaturaFoiLimpa) {
      try { await desenharDataUrlAssinatura(saved); } catch (_) {}
    } else if (assinaturaDemoAtiva && CONFIG.defaults.assinaturaDemonstrativa) {
      desenharAssinaturaDemonstrativa();
    }
  });
  window.addEventListener('pagehide', () => { void persistirFormulario(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void persistirFormulario(); });
}

async function iniciar() {
  try {
    const [formCache, assinaturaCache] = await Promise.all([
      lerCache('formulario'), lerCache('assinatura')
    ]);
    const defaults = CONFIG.defaults;
    const valores = {
      veiculo: valorOuPadrao(formCache, 'veiculo', defaults.veiculo),
      condutor: valorOuPadrao(formCache, 'condutor', defaults.condutor),
      pin: valorOuPadrao(formCache, 'pin', defaults.pin),
      tipo: valorOuPadrao(formCache, 'tipo', defaults.tipo),
      km: valorOuPadrao(formCache, 'km', defaults.km),
      observacao: valorOuPadrao(formCache, 'observacao', defaults.observacao)
    };
    if (!['Entrada', 'Saída'].includes(valores.tipo)) valores.tipo = defaults.tipo;
    preencherSelects(valores);
    $('pin').value = String(valores.pin);
    $('km').value = String(valores.km);
    $('obs').value = String(valores.observacao);
    document.querySelectorAll('input[name="tipo"]').forEach(radio => { radio.checked = radio.value === valores.tipo; });
    const cachedItems = valorOuPadrao(formCache, 'itens', defaults.itens);
    montarChecklist(cachedItems);

    ultimoDiaKm = formCache && formCache.kmData ? formCache.kmData : dataLocalHoje();
    atualizarViradaDoDia();
    await restaurarAssinatura(assinaturaCache);
    await restaurarSelfie();
    // Usa os anexos em cache apenas quando pertencem ao tipo atualmente selecionado.
    await restaurarFotos(valorMarcado('tipo'), true);
    conectarEventos();
    await persistirFormulario();
    window.setInterval(() => { if (atualizarViradaDoDia()) void persistirFormulario(); }, 30000);
  } catch (error) {
    mostrarMensagem(error && error.message ? error.message : 'Não foi possível iniciar o checklist.', 'err');
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
