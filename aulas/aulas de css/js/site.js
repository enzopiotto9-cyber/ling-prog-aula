/* Aprenda C++: acessibilidade (botão do olho), configurações do site (botão da engrenagem)
   e animações/efeitos de mouse. Um único arquivo, usado por todas as páginas.
   As escolhas ficam salvas no navegador. */

/* ========================================================================
   PARTE 1: Acessibilidade e configurações (código original)
   ======================================================================== */
(function () {
    'use strict';
    const CHAVE = 'aprenda-cpp-prefs';
    const PADRAO = { contraste: false, escala: 0, espaco: false, fonte: false, links: false, semAnim: false, tema: 'auto', cor: '#00599c', icones: true };
    const ESCALAS = [1, 1.15, 1.3, 1.5];
    const CORES = [['Azul', '#00599c'], ['Roxo', '#6d28d9'], ['Verde', '#0a7d3b'], ['Laranja', '#c2410c']];
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

    /* ---------- Editor C++ ao vivo (simula std::cout) ---------- */
    const codigo = document.getElementById('editor-codigo');
    const previa = document.getElementById('editor-previa');
    if (codigo && previa) {
        const inicial = codigo.value;
        let saida = null;
        const simular = c => {
            const cmds = [...c.matchAll(/(?:std::)?cout\s*((?:<<\s*(?:"(?:[^"\\]|\\.)*"|(?:std::)?endl|'\\n'|[\w.]+)\s*)+);/g)];
            if (!cmds.length) return '(sem saída: use std::cout << "texto";)';
            return cmds.map(m => [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"|(endl|'\\n')/g)]
                .map(t => t[2] ? '\n' : t[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')).join('')).join('');
        };
        const atualizar = () => { previa.textContent = saida !== null ? saida : simular(codigo.value); };
        codigo.addEventListener('input', () => { saida = null; atualizar(); });
        const reset = document.getElementById('editor-reset');
        if (reset) reset.addEventListener('click', () => { codigo.value = inicial; saida = null; atualizar(); });
        atualizar();
        document.querySelectorAll('[data-exemplo]').forEach(b => {
            b.addEventListener('click', () => {
                codigo.value = b.dataset.exemplo;
                saida = b.dataset.saida !== undefined ? b.dataset.saida : null;
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


/* ========================================================================
   PARTE 5: ESPECIAL C++
   Realce de sintaxe, chuva de símbolos, log da abertura, terminal que
   compila, pipeline do g++, simulador de memória (pilha/heap) e
   progresso das aulas. Cole no FINAL do site.js.
   ======================================================================== */
(function () {
    'use strict';
    const raiz = document.documentElement;
    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const semAnim = () => reduz || raiz.classList.contains('a11y-sem-anim') || raiz.classList.contains('a11y-contraste');
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const dorme = ms => new Promise(r => setTimeout(r, ms));

    /* ---------- 1. Realce de sintaxe C++ ---------- */
    const KW = 'if|else|for|while|do|switch|case|default|break|continue|return|class|struct|public|private|protected|virtual|override|final|const|constexpr|static|new|delete|try|catch|throw|template|typename|namespace|using|enum|operator|this|true|false|nullptr|explicit|friend|inline|noexcept|sizeof|auto|mutable';
    const TP = 'int|double|float|char|bool|void|long|short|unsigned|signed|size_t|string|vector|map|set|array|unique_ptr|shared_ptr|ifstream|ofstream|exception|ostream|cout|cin|endl|cerr';
    const RE = new RegExp(String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#\s*\w+(?:\s*(?:<[^>\n]+>|"[^"\n]+"))?)|\b(0x[0-9a-fA-F]+|\d+\.?\d*[fFuUlL]*)\b|\b(` + KW + String.raw`)\b|\b(` + TP + String.raw`)\b|\b([A-Za-z_]\w*)(?=\s*\()|(::|->)`, 'g');
    const CLS = [null, 'c', 's', 'p', 'n', 'k', 't', 'f', 'o'];
    function colorirCpp(t) {
        let out = '', i = 0, m;
        RE.lastIndex = 0;
        while ((m = RE.exec(t))) {
            let g = 1; while (!m[g]) g++;
            out += esc(t.slice(i, m.index)) + '<span class="tk-' + CLS[g] + '">' + esc(m[0]) + '</span>';
            i = RE.lastIndex;
            if (m[0] === '') RE.lastIndex++;
        }
        return out + esc(t.slice(i));
    }
    window.colorirCpp = colorirCpp;
    $$('pre code.lang-cpp').forEach(c => { c.innerHTML = colorirCpp(c.textContent); });

    /* ---------- 2. Chuva de símbolos do C++ no fundo ---------- */
    const cv = document.createElement('canvas');
    cv.id = 'cpp-fx'; cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const x = cv.getContext('2d');
    const GL = ['::', '->', '<<', '>>', '&&', '*p', '&x', 'new', 'int', '{}', '0x7f', 'std', '++', '#', 'nullptr', 'void', ';', '&', '*'];
    const mouse = { x: -999, y: -999 };
    let W = 0, H = 0, P = [];
    function medir() {
        W = cv.width = innerWidth; H = cv.height = innerHeight;
        P = Array.from({ length: Math.min(55, Math.round(W / 24)) }, () => ({
            x: Math.random() * W, y: Math.random() * H, v: .12 + Math.random() * .35,
            g: GL[Math.random() * GL.length | 0], s: 12 + Math.random() * 12
        }));
    }
    medir(); addEventListener('resize', medir);
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    function desenha(anima) {
        x.clearRect(0, 0, W, H);
        const escuro = raiz.dataset.tema === 'escuro';
        x.fillStyle = escuro ? '#7cc4ff' : '#00599c';
        for (const p of P) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y, r = Math.hypot(dx, dy) || 1;
            let a = escuro ? .14 : .1;
            if (r < 160) { a += (1 - r / 160) * .55; if (anima) { p.x += dx / r * 2; p.y += dy / r * 2; } }
            if (anima) { p.y -= p.v; if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } }
            x.globalAlpha = a; x.font = p.s + 'px ui-monospace,Consolas,monospace'; x.fillText(p.g, p.x, p.y);
        }
        x.globalAlpha = 1;
    }
    (function loop() {
        requestAnimationFrame(loop);
        if (document.hidden) return;
        if (semAnim()) { if (!loop.f) { desenha(false); loop.f = 1; } return; }
        loop.f = 0; desenha(true);
    })();

    /* ---------- 3. Log de compilação na abertura ---------- */
    const log = $('#intro-log');
    if (log && raiz.classList.contains('intro-novo')) {
        [[150, '$ g++ main.cpp -o programa'], [900, 'pré-processando...'], [1300, 'compilando...'], [1650, 'ligando...'], [1950, 'pronto ✓']]
            .forEach(([t, s]) => setTimeout(() => { log.textContent = s; }, t));
    }

    /* ---------- 4. Pipeline do g++ e terminal ---------- */
    const ETAPAS = [
        ['main.cpp', 'Seu código-fonte', 'fa-file-code'],
        ['Pré-processador', 'Resolve #include e #define', 'fa-wand-magic-sparkles'],
        ['Compilador', 'Traduz C++ para assembly', 'fa-gears'],
        ['Assembler', 'Gera o código objeto (.o)', 'fa-microchip'],
        ['Linker', 'Junta as bibliotecas', 'fa-link'],
        ['programa', 'Pronto para executar', 'fa-play']
    ];
    $$('[data-pipeline]').forEach(el => {
        el.classList.add('pipeline');
        el.innerHTML = '<ol>' + ETAPAS.map((e, k) => '<li data-e="' + k + '"><i class="fa-solid ' + e[2] + '" aria-hidden="true"></i><strong>' + e[0] + '</strong><span>' + e[1] + '</span></li>').join('') + '</ol>';
    });
    const setEtapa = n => $$('.pipeline li').forEach(li => {
        const k = +li.dataset.e;
        li.classList.toggle('feito', k < n || n > 5);
        li.classList.toggle('ativo', k === n);
    });
    const term = $('[data-terminal]');
    if (!term && $('.pipeline')) {
        let n = 0, vis = true;
        new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe($('.pipeline'));
        if (semAnim()) setEtapa(6);
        else setInterval(() => { if (vis) { setEtapa(n); n = (n + 1) % 8; } }, 1000);
    }
    if (term) {
        const corpo = $('.term-corpo', term);
        const SEQ = [
            ['c', 'g++ -std=c++20 main.cpp -o programa', 0],
            ['o', '[1/4] pré-processando   #include <iostream>', 1],
            ['o', '[2/4] compilando        main.cpp -> main.s', 2],
            ['o', '[3/4] montando          main.s -> main.o', 3],
            ['o', '[4/4] ligando           main.o + libstdc++', 4],
            ['k', '✓ build concluído, 0 erros', 5],
            ['c', './programa', 5],
            ['o', 'Olá, mundo!', 6],
            ['o', 'Eu estou aprendendo C++!', 6]
        ];
        let visivel = true, rodada = 0;
        new IntersectionObserver(es => { visivel = es[0].isIntersecting; }).observe(term);
        const linha = (tipo, txt) => {
            const d = document.createElement('div');
            d.className = 'tl tl-' + tipo;
            if (tipo === 'c') { d.innerHTML = '<span class="pr">$</span> <span class="tx"></span>'; }
            else d.textContent = txt;
            corpo.append(d);
            return d;
        };
        async function roda(meu) {
            corpo.replaceChildren(); setEtapa(0);
            for (const [t, txt, et] of SEQ) {
                if (meu !== rodada) return;
                while (!visivel && meu === rodada) await dorme(400);
                const d = linha(t, txt);
                if (t === 'c') {
                    const alvo = $('.tx', d);
                    for (const ch of txt) { alvo.textContent += ch; await dorme(semAnim() ? 0 : 38); }
                    await dorme(semAnim() ? 0 : 350);
                } else await dorme(semAnim() ? 0 : 520);
                setEtapa(et);
            }
            const cur = document.createElement('span'); cur.className = 'bloco'; corpo.lastChild.append(cur);
            await dorme(5200);
            if (meu === rodada) roda(++rodada);
        }
        roda(rodada);
    }

    /* ---------- 5. Simulador de memória (pilha e heap) ---------- */
    const STEPS = {
        ponteiro: {
            titulo: 'Ponteiros',
            code: ['int x = 10;', 'int* p = &x;', 'cout << *p;', '*p = 20;', 'cout << x;', 'p = nullptr;'],
            passos: [
                { l: -1, e: 'Clique em "Próximo" para executar o código linha por linha.', m: [], o: '' },
                { l: 0, e: 'Cria a variável x na pilha (stack), com o valor 10.', m: [{ n: 'x', t: 'int', a: '0x1000', v: '10' }], o: '' },
                { l: 1, e: 'p guarda o ENDEREÇO de x (&x), não o valor dele.', m: [{ n: 'x', t: 'int', a: '0x1000', v: '10' }, { n: 'p', t: 'int*', a: '0x1008', v: '0x1000', p: 'x' }], o: '' },
                { l: 2, e: '*p vai até o endereço guardado e lê o valor que está lá: 10.', m: [{ n: 'x', t: 'int', a: '0x1000', v: '10' }, { n: 'p', t: 'int*', a: '0x1008', v: '0x1000', p: 'x' }], o: '10' },
                { l: 3, e: '*p = 20 escreve no endereço apontado: x mudou sem ser tocado diretamente!', m: [{ n: 'x', t: 'int', a: '0x1000', v: '20' }, { n: 'p', t: 'int*', a: '0x1008', v: '0x1000', p: 'x' }], o: '10' },
                { l: 4, e: 'x agora vale 20.', m: [{ n: 'x', t: 'int', a: '0x1000', v: '20' }, { n: 'p', t: 'int*', a: '0x1008', v: '0x1000', p: 'x' }], o: '10 20' },
                { l: 5, e: 'nullptr significa "não aponta para nada". Nunca use *p com p nulo.', m: [{ n: 'x', t: 'int', a: '0x1000', v: '20' }, { n: 'p', t: 'int*', a: '0x1008', v: 'nullptr' }], o: '10 20' }
            ]
        },
        ref: {
            titulo: 'Referências',
            code: ['int a = 5;', 'int& r = a;', 'int b = a;', 'r = 9;', 'cout << a << " " << b;'],
            passos: [
                { l: -1, e: 'Clique em "Próximo" para executar o código linha por linha.', m: [], o: '' },
                { l: 0, e: 'Cria a variável a na pilha, com o valor 5.', m: [{ n: 'a', t: 'int', a: '0x1000', v: '5' }], o: '' },
                { l: 1, e: 'r NÃO é uma nova variável: é outro nome para a mesma caixa de a.', m: [{ n: 'a', t: 'int', a: '0x1000', v: '5', al: 'r' }], o: '' },
                { l: 2, e: 'b é uma CÓPIA: ganha uma caixa própria com o valor 5.', m: [{ n: 'a', t: 'int', a: '0x1000', v: '5', al: 'r' }, { n: 'b', t: 'int', a: '0x1004', v: '5' }], o: '' },
                { l: 3, e: 'r = 9 muda a caixa de a (os dois nomes enxergam o mesmo valor). b não muda.', m: [{ n: 'a', t: 'int', a: '0x1000', v: '9', al: 'r' }, { n: 'b', t: 'int', a: '0x1004', v: '5' }], o: '' },
                { l: 4, e: 'a vale 9 (alterado via r) e b continua 5.', m: [{ n: 'a', t: 'int', a: '0x1000', v: '9', al: 'r' }, { n: 'b', t: 'int', a: '0x1004', v: '5' }], o: '9 5' }
            ]
        },
        heap: {
            titulo: 'new / delete',
            heap: true,
            code: ['int* p = new int(42);', 'cout << *p;', 'delete p;', 'p = nullptr;'],
            passos: [
                { l: -1, e: 'Clique em "Próximo" para executar o código linha por linha.', m: [], o: '' },
                { l: 0, e: 'new reserva um int no HEAP (monte). p, na pilha, guarda o endereço dele.', m: [{ id: 'h1', n: '', t: 'int', a: '0x5a20', v: '42', r: 'h' }, { n: 'p', t: 'int*', a: '0x7ffc10', v: '0x5a20', p: 'h1' }], o: '' },
                { l: 1, e: 'Lê o valor 42 através do ponteiro.', m: [{ id: 'h1', n: '', t: 'int', a: '0x5a20', v: '42', r: 'h' }, { n: 'p', t: 'int*', a: '0x7ffc10', v: '0x5a20', p: 'h1' }], o: '42' },
                { l: 2, e: 'delete devolve a memória ao sistema. Mas p ainda guarda o endereço: ponteiro "pendurado"!', m: [{ id: 'h1', n: '', t: 'int', a: '0x5a20', v: '?', r: 'h', x: 1 }, { n: 'p', t: 'int*', a: '0x7ffc10', v: '0x5a20', p: 'h1', d: 1 }], o: '42' },
                { l: 3, e: 'Zerar o ponteiro evita usar por engano uma memória que já não é sua.', m: [{ id: 'h1', n: '', t: 'int', a: '0x5a20', v: '?', r: 'h', x: 1 }, { n: 'p', t: 'int*', a: '0x7ffc10', v: 'nullptr' }], o: '42' }
            ]
        }
    };
    const ident = c => c.id || c.n;
    function montaStepper(el) {
        const ids = el.dataset.stepper.split(',');
        let cur = ids[0], i = 0, timer = null;
        el.classList.add('stepper');
        el.innerHTML = (ids.length > 1 ? '<div class="st-abas" role="tablist">' + ids.map(k => '<button type="button" role="tab" data-k="' + k + '">' + STEPS[k].titulo + '</button>').join('') + '</div>' : '') +
            '<div class="st-corpo"><div class="st-cod"><pre><code></code></pre></div>' +
            '<div class="st-mem"><div class="st-reg"><h4>Pilha (stack)</h4><div class="st-stack"></div></div>' +
            '<div class="st-reg st-heapreg"><h4>Monte (heap)</h4><div class="st-heap"></div></div></div></div>' +
            '<p class="st-exp" aria-live="polite"></p>' +
            '<div class="st-saida"><span>saída:</span><code></code></div>' +
            '<div class="st-ctl"><button type="button" data-a="ini" aria-label="Reiniciar"><i class="fa-solid fa-backward-step" aria-hidden="true"></i></button>' +
            '<button type="button" data-a="ant"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i> Anterior</button>' +
            '<span class="st-n"></span>' +
            '<button type="button" data-a="prox" class="prim">Próximo <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
            '<button type="button" data-a="auto"><i class="fa-solid fa-play" aria-hidden="true"></i> Auto</button></div>';
        const codeEl = $('.st-cod code', el), stack = $('.st-stack', el), heap = $('.st-heap', el), heapReg = $('.st-heapreg', el);
        const exp = $('.st-exp', el), saida = $('.st-saida code', el), nEl = $('.st-n', el), auto = $('[data-a=auto]', el);
        function celula(c, p, ps) {
            const id = ident(c), ant = p.m.find(z => ident(z) === id);
            const apont = ps.m.filter(z => z.p === id).map(z => z.n);
            const cl = ['cel'];
            if (!ant) cl.push('novo'); else if (ant.v !== c.v) cl.push('muda');
            if (apont.length) cl.push('alvo');
            if (c.x) cl.push('livre');
            if (c.d) cl.push('pend');
            if (c.p) cl.push('ptr');
            const tags = (apont.length ? '<em class="tag">&#9664; ' + apont.join(', ') + '</em>' : '') +
                (c.al ? '<em class="tag al">também: ' + c.al + '</em>' : '') +
                (c.d ? '<em class="tag ruim">pendurado!</em>' : '') +
                (c.x ? '<em class="tag ruim">liberado</em>' : '');
            return '<div class="' + cl.join(' ') + '"><b>' + (c.n || 'sem nome') + '</b><small>' + c.t + ' &middot; ' + c.a + '</small><span class="val">' + c.v + '</span>' + tags + '</div>';
        }
        function mostra() {
            const S = STEPS[cur], p = S.passos[i], ant = S.passos[i - 1] || { m: [] };
            codeEl.innerHTML = S.code.map((ln, k) => '<span class="l' + (k === p.l ? ' on' : '') + '">' + colorirCpp(ln) + '</span>').join('');
            stack.innerHTML = p.m.filter(c => c.r !== 'h').map(c => celula(c, ant, p)).join('') || '<span class="vazia">(vazia)</span>';
            heap.innerHTML = p.m.filter(c => c.r === 'h').map(c => celula(c, ant, p)).join('') || '<span class="vazia">(vazio)</span>';
            heapReg.hidden = !S.heap;
            exp.textContent = p.e; saida.textContent = p.o || '(nada ainda)';
            nEl.textContent = i + ' / ' + (S.passos.length - 1);
            $$('.st-abas button', el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === cur)));
        }
        function para() { clearInterval(timer); timer = null; auto.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i> Auto'; }
        function passa(d) { const n = STEPS[cur].passos.length - 1; i = Math.max(0, Math.min(n, i + d)); mostra(); }
        el.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            if (b.dataset.k) { cur = b.dataset.k; i = 0; para(); mostra(); return; }
            const a = b.dataset.a;
            if (a === 'prox') { para(); passa(1); }
            else if (a === 'ant') { para(); passa(-1); }
            else if (a === 'ini') { para(); i = 0; mostra(); }
            else if (a === 'auto') {
                if (timer) { para(); return; }
                auto.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i> Pausar';
                if (i >= STEPS[cur].passos.length - 1) i = 0;
                passa(0);
                timer = setInterval(() => { if (i >= STEPS[cur].passos.length - 1) para(); else passa(1); }, 1900);
            }
        });
        mostra();
    }
    $$('[data-stepper]').forEach(montaStepper);

    /* ---------- 6. Página de aulas: progresso, filtro e mini-índice ---------- */
    const arts = $$('.aula[data-n]');
    if (arts.length) {
        const KEY = 'cpp-progresso';
        let feitas = new Set();
        try { feitas = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { }
        const total = arts.length;
        const salva = () => { try { localStorage.setItem(KEY, JSON.stringify([...feitas])); } catch (e) { } };
        function atualiza() {
            const n = feitas.size, pct = Math.round(n / total * 100);
            const anel = $('#anel'); if (anel) { anel.style.setProperty('--p', pct); $('#anel-txt').textContent = pct + '%'; }
            const t = $('#prog-txt'); if (t) t.textContent = n + ' de ' + total + ' aulas concluídas' + (n === total ? ' 🎉 Parabéns!' : '');
            const b = $('#prog-barra'); if (b) b.style.width = pct + '%';
            arts.forEach(a => {
                const id = +a.dataset.n, ok = feitas.has(id);
                const btn = $('.concluir', a); btn.classList.toggle('ok', ok); btn.setAttribute('aria-pressed', String(ok));
                $('span', btn).textContent = ok ? 'Concluída' : 'Marcar como concluída';
                $('i', btn).className = ok ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
                const lk = $('.lista-aulas a[href="#aula' + id + '"]'); if (lk) lk.classList.toggle('concluida', ok);
                const dot = $('.mini-toc a[data-n="' + id + '"]'); if (dot) dot.classList.toggle('ok', ok);
            });
            $$('.modulo').forEach(m => {
                const ls = $$('.lista-aulas a', m), f = ls.filter(a => a.classList.contains('concluida')).length;
                const c = $('.mod-cont', m); if (c) c.textContent = f + '/' + ls.length;
            });
        }
        arts.forEach(a => $('.concluir', a).addEventListener('click', () => {
            const id = +a.dataset.n;
            feitas.has(id) ? feitas.delete(id) : feitas.add(id);
            salva(); atualiza();
        }));
        const zerar = $('#prog-zerar');
        if (zerar) zerar.addEventListener('click', () => { if (feitas.size && confirm('Zerar o seu progresso?')) { feitas.clear(); salva(); atualiza(); } });
        atualiza();

        const chips = $$('.chips-mod button');
        chips.forEach(b => b.addEventListener('click', () => {
            chips.forEach(z => z.setAttribute('aria-pressed', String(z === b)));
            $$('.modulo').forEach(m => { m.dataset.fora = (b.dataset.mod !== 'todos' && m.dataset.mod !== b.dataset.mod) ? '1' : ''; });
            if (window.__aulasAtualiza) window.__aulasAtualiza();
        }));

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(es => es.forEach(e => {
                if (e.isIntersecting) $$('.mini-toc a').forEach(a => a.classList.toggle('on', a.dataset.n === e.target.dataset.n));
            }), { rootMargin: '-40% 0px -55% 0px' });
            arts.forEach(a => io.observe(a));
        }
    }
})();
