/* Aprenda SQL: acessibilidade (botão do olho), configurações do site (botão da engrenagem)
   e animações/efeitos de mouse. Um único arquivo, usado por todas as páginas.
   As escolhas ficam salvas no navegador. */

/* ========================================================================
   PARTE 1: Acessibilidade e configurações (código original)
   ======================================================================== */
(function () {
    'use strict';
    const CHAVE = 'aprenda-sql-prefs';
    const PADRAO = { contraste: false, escala: 0, espaco: false, fonte: false, links: false, semAnim: false, tema: 'auto', cor: '#0e7490', icones: true };
    const ESCALAS = [1, 1.15, 1.3, 1.5];
    const CORES = [['Turquesa', '#0e7490'], ['Azul', '#2563eb'], ['Verde', '#0a7d3b'], ['Laranja', '#c2410c']];
    const raiz = document.documentElement;
    const escuroSO = window.matchMedia('(prefers-color-scheme: dark)');
    let p = Object.assign({}, PADRAO);
    try { Object.assign(p, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch (e) { }

    const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { } };

    function el(tag, attrs, ...filhos) {
        const e = document.createElement(tag);
        for (const k in (attrs || {})) { k === 'texto' ? (e.textContent = attrs[k]) : e.setAttribute(k, attrs[k]); }
        e.append(...filhos);
        return e;
    }

    function aplicar() {
        raiz.classList.toggle('a11y-contraste', p.contraste);
        raiz.classList.toggle('a11y-espaco', p.espaco);
        raiz.classList.toggle('a11y-fonte', p.fonte);
        raiz.classList.toggle('a11y-links', p.links);
        raiz.classList.toggle('a11y-sem-anim', p.semAnim);
        raiz.classList.toggle('sem-icones', !p.icones);
        document.body.style.zoom = ESCALAS[p.escala];
        raiz.dataset.tema = p.tema === 'auto' ? (escuroSO.matches ? 'escuro' : 'claro') : p.tema;
        raiz.style.setProperty('--azul', p.cor);
        sincronizar();
    }

    function sincronizar() {
        document.querySelectorAll('.painel [data-chave]').forEach(i => { i.checked = !!p[i.dataset.chave]; });
        document.querySelectorAll('.painel [data-tema]').forEach(i => { i.checked = p.tema === i.dataset.tema; });
        document.querySelectorAll('.painel [data-cor]').forEach(b => b.setAttribute('aria-pressed', String(p.cor === b.dataset.cor)));
        document.querySelectorAll('.escala-valor').forEach(s => { s.textContent = Math.round(ESCALAS[p.escala] * 100) + '%'; });
    }

    function opcao(rotulo, chave) {
        const i = el('input', { type: 'checkbox', 'data-chave': chave });
        i.addEventListener('change', () => { p[chave] = i.checked; salvar(); aplicar(); });
        return el('label', { class: 'opcao' }, i, rotulo);
    }

    function botao(texto, aoClicar, rotulo) {
        const b = el('button', { type: 'button', texto: texto });
        if (rotulo) b.setAttribute('aria-label', rotulo);
        b.addEventListener('click', aoClicar);
        return b;
    }

    // Leitura em voz alta
    const temVoz = 'speechSynthesis' in window;
    function pararLeitura() { if (temVoz) speechSynthesis.cancel(); }
    function lerPagina() {
        if (!temVoz) return;
        pararLeitura();
        const texto = (document.getElementById('conteudo') || document.body).innerText;
        texto.split(/(?<=[.!?])\s+/).filter(Boolean).forEach(t => {
            const u = new SpeechSynthesisUtterance(t);
            u.lang = 'pt-BR';
            speechSynthesis.speak(u);
        });
    }
    window.addEventListener('pagehide', pararLeitura);

    // Painéis
    const abertos = [];
    function criarPainel(id, titulo, btn, conteudo) {
        if (!btn) return;
        const painel = el('aside', { id: id, class: 'painel', role: 'dialog', 'aria-label': titulo, hidden: '' });
        const fechar = botao('Fechar', () => esconder(item, true));
        painel.append(el('h2', { texto: titulo }), ...conteudo, fechar);
        document.body.append(painel);
        btn.setAttribute('aria-controls', id);
        btn.setAttribute('aria-expanded', 'false');
        const item = { painel, btn };
        abertos.push(item);
        btn.addEventListener('click', () => {
            if (!painel.hidden) { esconder(item, true); return; }
            abertos.forEach(o => esconder(o, false));
            painel.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            painel.querySelector('input, button').focus();
        });
    }
    function esconder(item, devolverFoco) {
        item.painel.hidden = true;
        item.btn.setAttribute('aria-expanded', 'false');
        if (devolverFoco) item.btn.focus();
    }
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const aberto = abertos.find(o => !o.painel.hidden);
        if (aberto) esconder(aberto, true);
    });

    function construir() {
        // Botão do olho: suporte a pessoas com deficiência
        const escala = el('span', { class: 'escala-valor', 'aria-live': 'polite' });
        const tamanho = el('div', { class: 'linha-botoes' },
            el('span', { texto: 'Tamanho do texto' }),
            botao('A-', () => { p.escala = Math.max(0, p.escala - 1); salvar(); aplicar(); }, 'Diminuir texto'),
            escala,
            botao('A+', () => { p.escala = Math.min(ESCALAS.length - 1, p.escala + 1); salvar(); aplicar(); }, 'Aumentar texto'));
        const voz = temVoz ? el('div', { class: 'linha-botoes' }, el('span', { texto: 'Leitura em voz alta' }), botao('Ler página', lerPagina), botao('Parar', pararLeitura)) : '';
        const restaurarA11y = botao('Restaurar acessibilidade', () => {
            ['contraste', 'escala', 'espaco', 'fonte', 'links', 'semAnim'].forEach(k => { p[k] = PADRAO[k]; });
            pararLeitura(); salvar(); aplicar();
        });
        criarPainel('painel-acessibilidade', 'Acessibilidade', document.getElementById('btn-acessibilidade'), [
            opcao('Alto contraste', 'contraste'), tamanho,
            opcao('Mais espaço entre linhas e letras', 'espaco'),
            opcao('Fonte mais legível', 'fonte'),
            opcao('Destacar links', 'links'),
            opcao('Reduzir animações', 'semAnim'),
            voz, restaurarA11y
        ].filter(Boolean));

        // Botão da engrenagem: configurações do site
        const temas = el('fieldset', { class: 'grupo' }, el('legend', { texto: 'Tema' }));
        [['auto', 'Automático (igual ao seu aparelho)'], ['claro', 'Claro'], ['escuro', 'Escuro']].forEach(([valor, nome]) => {
            const r = el('input', { type: 'radio', name: 'tema', 'data-tema': valor });
            r.addEventListener('change', () => { p.tema = valor; salvar(); aplicar(); });
            temas.append(el('label', { class: 'opcao' }, r, nome));
        });
        const cores = el('div', { class: 'cores' });
        CORES.forEach(([nome, hex]) => {
            const b = el('button', { type: 'button', 'data-cor': hex, 'aria-label': 'Cor ' + nome, title: nome, style: 'background:' + hex });
            b.addEventListener('click', () => { p.cor = hex; salvar(); aplicar(); });
            cores.append(b);
        });
        const restaurarSite = botao('Restaurar configurações', () => {
            ['tema', 'cor', 'icones'].forEach(k => { p[k] = PADRAO[k]; });
            salvar(); aplicar();
        });
        const iconesOpcao = opcao('Mostrar ícones no menu', 'icones');
        criarPainel('painel-config', 'Configurações do site', document.getElementById('btn-config'), [
            temas, el('div', { class: 'grupo' }, el('p', { texto: 'Cor de destaque' }), cores), iconesOpcao, restaurarSite
        ]);
    }

    escuroSO.addEventListener('change', () => { if (p.tema === 'auto') aplicar(); });
    construir();
    aplicar();
})();


/* ========================================================================
   PARTE 2: Animações e efeitos de mouse
   (a abertura em si é feita em HTML + CSS; aqui ficam os efeitos do mouse)
   ======================================================================== */
(function () {
    'use strict';

    const raiz = document.documentElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
    // Lê as classes que a PARTE 1 aplica, então reage na hora quando a pessoa liga as opções
    const semAnim = () => raiz.classList.contains('a11y-sem-anim') || raiz.classList.contains('a11y-contraste');

    const ALVOS = 'a, button, summary, label, input, select, textarea';
    const IMA = '.botao-principal, .acessibilidade button, .busca button, .servico a';
    const TILT = '.servico, .comentario, .lista-aulas a';
    const CORES = ['#0008ff', '#2563eb', '#ffb800', '#ff3d81', '#00d1b2'];

    /* ---------- Faíscas no clique ---------- */
    // Elementos fixos vão no <html> (não no body), porque o body pode ter "zoom" da acessibilidade
    function explosao(x, y) {
        if (semAnim()) return;
        const n = 14;
        for (let i = 0; i < n; i++) {
            const f = document.createElement('span');
            f.className = 'faisca';
            f.style.cssText = `left:${x}px;top:${y}px;background:${CORES[i % CORES.length]}`;
            raiz.appendChild(f);
            const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
            const dist = 40 + Math.random() * 60;
            f.animate([
                { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 }
            ], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' })
                .onfinish = () => f.remove();
        }
    }

    /* ---------- Cursor personalizado ---------- */
    let anel = null;
    if (fino) {
        const ponto = document.createElement('div');
        anel = document.createElement('div');
        ponto.className = 'cursor-ponto';
        anel.className = 'cursor-anel';
        ponto.setAttribute('aria-hidden', 'true');
        anel.setAttribute('aria-hidden', 'true');
        raiz.append(ponto, anel);

        let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y;

        addEventListener('pointermove', (e) => {
            x = e.clientX; y = e.clientY;
            raiz.classList.add('cursor-ativo');
            ponto.style.transform = `translate3d(${x}px,${y}px,0)`;
        }, { passive: true });

        (function seguir() {
            ax += (x - ax) * 0.18;
            ay += (y - ay) * 0.18;
            anel.style.transform = `translate3d(${ax}px,${ay}px,0)`;
            requestAnimationFrame(seguir);
        })();

        document.addEventListener('pointerover', (e) => {
            anel.classList.toggle('sobre', !!e.target.closest(ALVOS));
        });
        raiz.addEventListener('mouseleave', () => raiz.classList.remove('cursor-ativo'));
        addEventListener('pointerup', () => anel.classList.remove('clicando'));
    }

    addEventListener('pointerdown', (e) => {
        if (anel) anel.classList.add('clicando');
        explosao(e.clientX, e.clientY);
    });

    /* ---------- Botões magnéticos + cards 3D ---------- */
    let imaAtual = null, tiltAtual = null;

    const soltaIma = (el) => { el.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; };
    const soltaTilt = (el) => { el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; };

    if (fino) {
        document.addEventListener('pointermove', (e) => {
            if (semAnim()) return;

            const ima = e.target.closest(IMA);
            if (imaAtual && imaAtual !== ima) soltaIma(imaAtual);
            if (ima) {
                const r = ima.getBoundingClientRect();
                ima.style.transition = 'transform .15s ease-out';
                ima.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
            }
            imaAtual = ima;

            const card = e.target.closest(TILT);
            if (tiltAtual && tiltAtual !== card) soltaTilt(tiltAtual);
            if (card) {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transition = 'transform .1s ease-out';
                card.style.transform = `perspective(700px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg) scale(1.03)`;
            }
            tiltAtual = card;
        }, { passive: true });

        raiz.addEventListener('mouseleave', () => {
            if (imaAtual) soltaIma(imaAtual);
            if (tiltAtual) soltaTilt(tiltAtual);
            imaAtual = tiltAtual = null;
        });
    }

    /* ---------- Banner: partículas + holofote + parallax ---------- */
    const banner = document.querySelector('.banner-logo-inicial');
    if (!banner) return;

    const titulo = banner.querySelector('h1');
    const cv = document.createElement('canvas');
    cv.className = 'banner-canvas';
    cv.setAttribute('aria-hidden', 'true');
    banner.prepend(cv);

    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const mouse = { x: -999, y: -999 };
    let w = 0, h = 0, ps = [], visivel = true;

    function medir() {
        w = banner.clientWidth;
        h = banner.clientHeight;
        cv.width = w * dpr;
        cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(70, Math.round(w / 16));
        ps = Array.from({ length: n }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            r: 1 + Math.random() * 2
        }));
    }
    medir();
    addEventListener('resize', medir);

    new IntersectionObserver(([en]) => { visivel = en.isIntersecting; }).observe(banner);

    banner.addEventListener('pointermove', (e) => {
        const r = banner.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        banner.style.setProperty('--mx', mouse.x + 'px');
        banner.style.setProperty('--my', mouse.y + 'px');
        if (titulo && !semAnim()) {
            titulo.style.transform = `translate(${(mouse.x - w / 2) * 0.03}px, ${(mouse.y - h / 2) * 0.05}px)`;
        }
    });
    banner.addEventListener('pointerleave', () => {
        mouse.x = mouse.y = -999;
        if (titulo) titulo.style.transform = '';
    });

    (function desenhar() {
        requestAnimationFrame(desenhar);
        if (!visivel || document.hidden || semAnim()) return;
        ctx.clearRect(0, 0, w, h);

        for (const p of ps) {
            const dx = mouse.x - p.x, dy = mouse.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 150) { p.x += dx * 0.015; p.y += dy * 0.015; } // mouse atrai
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,.75)';
            ctx.fill();

            if (d < 170) { // linha até o mouse
                ctx.strokeStyle = `rgba(255,184,0,${1 - d / 170})`;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
        }
        for (let i = 0; i < ps.length; i++) {
            for (let j = i + 1; j < ps.length; j++) {
                const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
                if (d < 90) {
                    ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 90) * 0.35})`;
                    ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
                }
            }
        }
    })();
})();

/* ========================================================================
   PARTE 3: Home (aparecer ao rolar, contadores e editor ao vivo)
   Cole no FINAL do site.js. Não faz nada nas páginas que não têm esses elementos.
   ======================================================================== */
(function () {
    'use strict';
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Aparecer ao rolar ---------- */
    const alvos = document.querySelectorAll('.revelar');
    if (!('IntersectionObserver' in window) || reduz) {
        alvos.forEach(e => e.classList.add('visivel'));
    } else {
        const io = new IntersectionObserver((entradas) => {
            entradas.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
            });
        }, { threshold: 0.15 });
        alvos.forEach(e => io.observe(e));
    }

    /* ---------- Contadores animados ---------- */
    document.querySelectorAll('[data-contar]').forEach(el => {
        const fim = Number(el.dataset.contar);
        const sufixo = el.dataset.sufixo || '';
        if (reduz || !('IntersectionObserver' in window)) { el.textContent = fim + sufixo; return; }

        el.textContent = '0' + sufixo;
        const obs = new IntersectionObserver(([en]) => {
            if (!en.isIntersecting) return;
            obs.disconnect();
            const ini = performance.now(), dur = 1600;
            (function passo(agora) {
                const k = Math.min((agora - ini) / dur, 1);
                const suave = 1 - Math.pow(1 - k, 3); // desacelera no final
                el.textContent = Math.round(fim * suave) + sufixo;
                if (k < 1) requestAnimationFrame(passo);
            })(ini);
        });
        obs.observe(el);
    });

    /* ---------- Editor SQL ao vivo (mini SELECT sobre a tabela alunos) ---------- */
    const codigo = document.getElementById('editor-codigo');
    const previa = document.getElementById('editor-previa');
    if (codigo && previa) {
        const inicial = codigo.value;
        const COLS = ['id', 'nome', 'cidade', 'nota'];
        const DADOS = [
            { id: 1, nome: 'Ana', cidade: 'São Paulo', nota: 9 },
            { id: 2, nome: 'Carlos', cidade: 'Recife', nota: 7 },
            { id: 3, nome: 'Marina', cidade: 'Curitiba', nota: 10 },
            { id: 4, nome: 'João', cidade: 'São Paulo', nota: 6 },
            { id: 5, nome: 'Beatriz', cidade: 'Recife', nota: 8 }
        ];
        const cond = (l, s) => {
            const t = s.trim().match(/^(\w+)\s*(>=|<=|<>|!=|=|>|<)\s*('[^']*'|-?\d+(?:\.\d+)?)$/);
            if (!t || !COLS.includes(t[1].toLowerCase())) throw new Error('condição não suportada: ' + s.trim());
            const v = t[3][0] === "'" ? t[3].slice(1, -1) : Number(t[3]);
            const a = l[t[1].toLowerCase()];
            switch (t[2]) { case '=': return a == v; case '>': return a > v; case '<': return a < v; case '>=': return a >= v; case '<=': return a <= v; default: return a != v; }
        };
        const tabela = (cols, rows) => {
            const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
            const linha = v => v.map((x, i) => String(x).padEnd(w[i])).join(' | ');
            return linha(cols) + '\n' + w.map(n => '-'.repeat(n)).join('-+-') + '\n'
                + rows.map(r => linha(cols.map(c => r[c]))).join('\n') + (rows.length ? '\n' : '')
                + '(' + rows.length + (rows.length === 1 ? ' linha)' : ' linhas)');
        };
        const simular = c => {
            try {
                const m = c.trim().replace(/;\s*$/, '').match(/^select\s+(.+?)\s+from\s+alunos(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/is);
                if (!m) return 'Comando não suportado neste simulador. Tente:\nSELECT * FROM alunos WHERE nota >= 8 ORDER BY nome;';
                const cols = m[1].trim() === '*' ? COLS : m[1].split(',').map(x => x.trim().toLowerCase());
                cols.forEach(x => { if (!COLS.includes(x)) throw new Error('coluna desconhecida: ' + x); });
                let rows = DADOS.slice();
                if (m[2]) rows = rows.filter(l => {
                    const p = m[2].split(/\s+(and|or)\s+/i);
                    let r = cond(l, p[0]);
                    for (let i = 1; i < p.length; i += 2) r = p[i].toLowerCase() === 'and' ? (r && cond(l, p[i + 1])) : (r || cond(l, p[i + 1]));
                    return r;
                });
                if (m[3]) {
                    const o = m[3].toLowerCase();
                    if (!COLS.includes(o)) throw new Error('coluna desconhecida: ' + o);
                    const d = (m[4] || '').toLowerCase() === 'desc' ? -1 : 1;
                    rows.sort((a, b) => (typeof a[o] === 'string' ? a[o].localeCompare(b[o]) : a[o] - b[o]) * d);
                }
                if (m[5]) rows = rows.slice(0, Number(m[5]));
                return tabela(cols, rows);
            } catch (e) { return 'Erro: ' + e.message; }
        };
        const atualizar = () => { previa.textContent = simular(codigo.value); };
        codigo.addEventListener('input', atualizar);
        const reset = document.getElementById('editor-reset');
        if (reset) reset.addEventListener('click', () => { codigo.value = inicial; atualizar(); });
        atualizar();
        document.querySelectorAll('[data-exemplo]').forEach(b => {
            b.addEventListener('click', () => {
                codigo.value = b.dataset.exemplo;
                atualizar();
                document.getElementById('editor').scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'center' });
                codigo.focus({ preventScroll: true });
            });
        });
    }
})();

/* ========================================================================
   PARTE 4: Camada profissional (vale para TODAS as páginas)
   Progresso de leitura, voltar ao topo, menu fixo, aparecer ao rolar,
   botão copiar nos códigos e transição suave entre páginas.
   ======================================================================== */
(function () {
    'use strict';

    const raiz = document.documentElement;
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const semAnim = () => raiz.classList.contains('a11y-sem-anim') || raiz.classList.contains('a11y-contraste');
    raiz.classList.add('js');

    /* ---------- Barra de progresso + botão de voltar ao topo ---------- */
    // Vão no <html> (não no body) por causa do zoom do botão de acessibilidade
    const barra = document.createElement('div');
    barra.className = 'progresso-leitura';
    barra.setAttribute('aria-hidden', 'true');

    const topo = document.createElement('button');
    topo.type = 'button';
    topo.className = 'topo';
    topo.setAttribute('aria-label', 'Voltar ao topo');
    topo.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
    topo.addEventListener('click', () => scrollTo({ top: 0, behavior: (reduz || semAnim()) ? 'auto' : 'smooth' }));
    raiz.append(barra, topo);

    const menu = document.querySelector('.menu-navegacao-inicio');
    let agendado = false;

    function aoRolar() {
        agendado = false;
        const max = raiz.scrollHeight - innerHeight;
        barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ')';
        topo.classList.toggle('mostra', scrollY > 500);
        if (menu) menu.classList.toggle('fixo', menu.getBoundingClientRect().top <= 0);
    }
    addEventListener('scroll', () => {
        if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); }
    }, { passive: true });
    addEventListener('resize', aoRolar);
    aoRolar();

    /* ---------- Aparecer ao rolar (todas as páginas) ---------- */
    const SECOES = '.indice, .aula, .servicos, .como-funciona, .duvidas, .canais, .novo-comentario, .lista-comentarios, .proxima, .bloco-horarios, .novo-suporte, .faq';
    const GRUPOS = '.grade-servicos, .lista-aulas, .como-funciona ol, .duvidas, #lista-faq, .grade-numeros, .trilha, .grade-tags';

    const alvos = [];
    document.querySelectorAll(SECOES).forEach(e => {
        if (e.classList.contains('revelar')) return; // a home já cuida das dela
        e.classList.add('revelar');
        alvos.push(e);
    });
    document.querySelectorAll(GRUPOS).forEach(g => {
        Array.from(g.children).forEach((c, i) => c.style.setProperty('--i', Math.min(i, 10)));
        g.classList.add('revelar-grupo');
        alvos.push(g);
    });

    if (reduz || !('IntersectionObserver' in window)) {
        alvos.forEach(e => e.classList.add('visivel'));
    } else {
        // threshold 0: seções muito altas também aparecem assim que entram na tela
        const io = new IntersectionObserver((entradas) => {
            entradas.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
            });
        }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
        alvos.forEach(e => io.observe(e));
    }

    // Depois da carga inicial, renderizações seguintes (busca) não repetem a animação
    setTimeout(() => raiz.classList.add('pronto'), 1800);

    /* ---------- Botão "Copiar" nos blocos de código ---------- */
    document.querySelectorAll('pre').forEach(pre => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'copiar';
        b.textContent = 'Copiar';
        b.setAttribute('aria-label', 'Copiar código');
        b.addEventListener('click', async () => {
            const cod = pre.querySelector('code');
            const texto = (cod || pre).innerText;
            let ok = false;
            try {
                await navigator.clipboard.writeText(texto);
                ok = true;
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = texto;
                ta.style.cssText = 'position:fixed;opacity:0';
                document.body.append(ta);
                ta.select();
                try { ok = document.execCommand('copy'); } catch (_) { }
                ta.remove();
            }
            b.textContent = ok ? 'Copiado!' : 'Não copiou';
            b.classList.toggle('ok', ok);
            setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1800);
        });
        pre.append(b);
    });

    /* ---------- Transição suave ao trocar de página ---------- */
    addEventListener('pageshow', (e) => { if (e.persisted) raiz.classList.remove('saindo'); });

    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a[href]');
        if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
        if (a.protocol !== location.protocol || a.host !== location.host || a.pathname === location.pathname) return;
        if (reduz || semAnim()) return;
        e.preventDefault();
        raiz.classList.add('saindo');
        setTimeout(() => { location.href = a.href; }, 280);
    });
})();
