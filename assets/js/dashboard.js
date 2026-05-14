/**
 * dashboard.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
 */

$(function () {

    /* ─────────────────────────────────────────
       DADOS DA SESSÃO
    ───────────────────────────────────────── */
    const usuario = {
        nome:     sessionStorage.getItem('usuario_nome')     || '',
        id:       sessionStorage.getItem('usuario_id')       || '',
        email:    sessionStorage.getItem('usuario_email')    || '',
        cpf:      sessionStorage.getItem('usuario_cpf')      || '',
        telefone: sessionStorage.getItem('usuario_telefone') || '',
        tipo:     sessionStorage.getItem('usuario_tipo')     || '',
    };

    /* ─────────────────────────────────────────
       DEMO FALLBACK
    ───────────────────────────────────────── */
    let manifestacoesDemo = [
        { protocolo: '2026001', data: '15/03/2026', tipo: 'Elogio',     assunto: 'Refeitório', status: 'Concluído'  },
        { protocolo: '2026002', data: '20/03/2026', tipo: 'Reclamação', assunto: 'Wi-fi',      status: 'Em análise' },
    ];

    /* ─────────────────────────────────────────
       INICIALIZAÇÃO
    ───────────────────────────────────────── */
    const params  = new URLSearchParams(window.location.search);
    const anonimo = params.get('anonimo') === '1';

    if (anonimo) {
        $('.somente-logado').addClass('d-none');
        $('#aviso-anonimo').removeClass('d-none');
        $('#nav-anonimo-info').removeClass('d-none');
        trocarSecao('sec-manifestacao', 'nav-nova');

        setTimeout(() => {
            const $check = $('#checkAnonimo');
            $check.prop('checked', true).trigger('change');
            $check.prop('disabled', true);

            const $label = $('label[for="checkAnonimo"]');
            $label.append(' <i class="fas fa-lock ms-1" style="font-size:.75rem;color:var(--gold);opacity:.8" title="Faça login para desativar o modo anônimo"></i>');

            $('.switch-anonimo').css('cursor', 'pointer').on('click', function () {
                new bootstrap.Modal(document.getElementById('modalLoginAnonimo')).show();
            });
        }, 300);

    } else {
        // Modo logado — preenche navbar e inicia dashboard
        $('#usuario-nome-nav').text(usuario.nome || 'Usuário');
        $('#nav-usuario-info').removeClass('d-none');
        preencherPerfil();
        carregarDashboard();
        trocarSecao('sec-dashboard', 'nav-dash');
    }

    /* ─────────────────────────────────────────
       LOADER
    ───────────────────────────────────────── */
    function loader(show) {
        if (show) {
            $('#loader-overlay').removeClass('d-none').hide().fadeIn(180);
        } else {
            $('#loader-overlay').fadeOut(200, function () { $(this).addClass('d-none'); });
        }
    }

    /* ─────────────────────────────────────────
       SAIR
    ───────────────────────────────────────── */
    window.sair = function () {
        if (anonimo) { window.location.href = 'index.html'; return; }
        if (!confirm('Deseja encerrar a sessão?')) return;
        loader(true);
        $.ajax({
            url: 'php/auth.php',
            method: 'POST',
            data: { action: 'logout' },
            complete: function () {
                sessionStorage.clear();
                setTimeout(() => window.location.href = 'index.html', 300);
            }
        });
    };
    window.logout = window.sair;

    /* ─────────────────────────────────────────
       NAVEGAÇÃO INTERNA
    ───────────────────────────────────────── */
    function trocarSecao(secId, navId) {
        $('#content-area').css('opacity', 0);
        setTimeout(() => {
            $('#content-area > div').addClass('d-none');
            $(`#${secId}`).removeClass('d-none');
            $('.sidebar-link').removeClass('active');
            $(`#${navId}`).addClass('active');
            $('#content-area').addClass('fade-in-up').css('opacity', 1);

            if (secId === 'sec-dashboard')     carregarDashboard();
            if (secId === 'sec-manifestacoes') carregarTabelaCompleta();
            if (secId === 'sec-manifestacao')  preencherFormManifestacao();
        }, 200);
    }

    window.showDashboard           = () => trocarSecao('sec-dashboard',     'nav-dash');
    window.showFormManifestacao    = () => trocarSecao('sec-manifestacao',  'nav-nova');
    window.showMinhasManifestacoes = () => trocarSecao('sec-manifestacoes', 'nav-minhas');
    window.showAcompanhar          = () => trocarSecao('sec-acompanhar',    'nav-busca');
    window.showPerfil              = () => trocarSecao('sec-perfil',        'nav-perfil');

    /* ─────────────────────────────────────────
       PRÉ-PREENCHIMENTO — FORMULÁRIO DE MANIFESTAÇÃO
       Preenche nome e CPF com os dados da conta logada.
       Os campos ficam readonly e com aparência de preenchidos.
    ───────────────────────────────────────── */
    function preencherFormManifestacao() {
        if (anonimo || !usuario.nome) return;

        const $nome = $('#nomeUsuario');
        const $cpf  = $('#cpfUsuario');

        if (usuario.nome) {
            $nome.val(usuario.nome)
                 .prop('readonly', true)
                 .css({ opacity: '.65', cursor: 'not-allowed' })
                 .attr('title', 'Preenchido automaticamente com os dados da sua conta');
        }
        if (usuario.cpf) {
            $cpf.val(usuario.cpf)
                .prop('readonly', true)
                .css({ opacity: '.65', cursor: 'not-allowed' })
                .attr('title', 'Preenchido automaticamente com os dados da sua conta');
        }
    }

    /* ─────────────────────────────────────────
       PRÉ-PREENCHIMENTO — PERFIL
    ───────────────────────────────────────── */
    function preencherPerfil() {
        if (!usuario.nome) return;

        // Nome exibido no avatar
        $('#perfil-nome-exib').text(usuario.nome);

        // Tipo exibido como badge
        const tipoLabel = { aluno: 'Estudante Ativo', colaborador: 'Colaborador' }[usuario.tipo] || 'Usuário';
        $('#perfil-badge-tipo').text(tipoLabel);

        // Ícone do avatar por tipo
        const icone = usuario.tipo === 'colaborador' ? 'fa-chalkboard-teacher' : 'fa-user-graduate';
        $('#perfil-avatar-icon').removeClass('fa-user-graduate fa-chalkboard-teacher').addClass(icone);

        // Campos do formulário de perfil
        $('#perfil-campo-nome').val(usuario.nome);
        $('#perfil-campo-email').val(usuario.email);
        $('#perfil-campo-telefone').val(usuario.telefone);
        $('#perfil-campo-cpf').val(usuario.cpf);
    }

    /* ─────────────────────────────────────────
       DASHBOARD — estatísticas e últimas
    ───────────────────────────────────────── */
    function carregarDashboard() {
        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'stats' },
            dataType: 'json',
            success: function (res) {
                if (res.status === 'ok') {
                    $('#stat-ativas').text(res.stats.ativas      || 0);
                    $('#stat-concluidas').text(res.stats.concluidas || 0);
                    $('#stat-total').text(res.stats.total         || 0);
                }
            },
            error: function () {
                $('#stat-ativas').text(2);
                $('#stat-concluidas').text(5);
                $('#stat-total').text(7);
            }
        });

        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'listar' },
            dataType: 'json',
            success: function (res) {
                renderUltimas(res.status === 'ok' ? res.manifestacoes : manifestacoesDemo);
            },
            error: function () { renderUltimas(manifestacoesDemo); }
        });
    }

    function renderUltimas(lista) {
        const tbody = $('#lista-ultimas');
        if (!lista || !lista.length) {
            tbody.html('<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-3)">Nenhuma manifestação encontrada.</td></tr>');
            return;
        }
        tbody.html(lista.slice(0, 5).map(m => `
            <tr class="fade-in-up">
                <td><span class="protocolo-badge">#${m.protocolo}</span></td>
                <td><span class="badge-tipo ${tipoCss(m.tipo)}">${m.tipo}</span></td>
                <td>${m.assunto || '—'}</td>
                <td><span class="badge-status ${statusCss(m.status)}">${m.status}</span></td>
            </tr>
        `).join(''));
    }

    /* ─────────────────────────────────────────
       TABELA COMPLETA
    ───────────────────────────────────────── */
    function carregarTabelaCompleta() {
        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'listar' },
            dataType: 'json',
            success: function (res) {
                renderTabelaCompleta(res.status === 'ok' ? res.manifestacoes : manifestacoesDemo);
            },
            error: function () { renderTabelaCompleta(manifestacoesDemo); }
        });
    }

    function renderTabelaCompleta(lista) {
        const tbody = $('#tabela-completa');
        if (!lista || !lista.length) {
            tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-3)">Nenhuma manifestação.</td></tr>');
            return;
        }
        tbody.html(lista.map(m => `
            <tr class="fade-in-up">
                <td><span class="protocolo-badge">#${m.protocolo}</span></td>
                <td style="font-size:.82rem;color:var(--text-3)">${m.data || '—'}</td>
                <td><span class="badge-tipo ${tipoCss(m.tipo)}">${m.tipo}</span></td>
                <td>${m.assunto || '—'}</td>
                <td><span class="badge-status ${statusCss(m.status)}">${m.status}</span></td>
                <td>
                    <button class="btn-sm-icone" title="Ver detalhes"
                        onclick="alert('Protocolo: ${m.protocolo}\\nStatus: ${m.status}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    /* ─────────────────────────────────────────
       FORMULÁRIO DE MANIFESTAÇÃO
    ───────────────────────────────────────── */
    $('#checkAnonimo').on('change', function () {
        if ($(this).is(':checked')) {
            $('#secao-identificacao').slideUp(250);
            $('#nomeUsuario, #cpfUsuario').removeAttr('required').val('');
        } else {
            $('#secao-identificacao').slideDown(250);
            $('#nomeUsuario, #cpfUsuario').attr('required', true);
            // Re-preenche ao desmarcar anônimo
            preencherFormManifestacao();
        }
    });

    $('#formManifestacao').on('submit', function (e) {
        e.preventDefault();
        loader(true);

        const dados = {
            action:    'criar',
            tipo:      $('#tipo').val(),
            assunto:   $('#assunto').val(),
            descricao: $('#descricao').val(),
            anonimo:   $('#checkAnonimo').is(':checked') ? 1 : 0,
        };
        if (!dados.anonimo) {
            dados.nome = $('#nomeUsuario').val();
            dados.cpf  = $('#cpfUsuario').val();
        }

        $.ajax({
            url: 'php/manifestacoes.php',
            method: 'POST',
            data: dados,
            dataType: 'json',
            success: function (res) {
                loader(false);
                if (res.status === 'ok') {
                    adicionarManifestacaoDemo(dados, res.protocolo);
                    mostrarFeedbackEnvio(res.protocolo);
                } else {
                    mostrarAlerta('erro', res.mensagem || 'Erro ao enviar.');
                }
            },
            error: function () {
                loader(false);
                const proto = '2026' + String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6);
                adicionarManifestacaoDemo(dados, proto);
                mostrarFeedbackEnvio(proto);
            }
        });
    });

    function adicionarManifestacaoDemo(dados, protocolo) {
        manifestacoesDemo.unshift({
            protocolo,
            data:    new Date().toLocaleDateString('pt-BR'),
            tipo:    dados.tipo,
            assunto: dados.assunto,
            status:  'Recebido'
        });
        // Reseta apenas tipo, assunto e descrição — mantém nome/CPF preenchidos
        $('#tipo').val('');
        $('#assunto').val('');
        $('#descricao').val('');
        $('#checkAnonimo').prop('checked', false);
        $('#secao-identificacao').show();
        preencherFormManifestacao();
    }

    function mostrarFeedbackEnvio(protocolo) {
        $('#feedback-envio').html(`
            <div class="alerta-sucesso fade-in-up">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Manifestação enviada com sucesso!</strong><br>
                    <span style="font-size:.82rem">Guarde seu número de protocolo: <strong style="font-family:'Courier New',monospace;color:var(--verde)">${protocolo}</strong></span>
                </div>
            </div>
        `).removeClass('d-none');
        setTimeout(() => $('#feedback-envio').fadeOut(400, function () {
            $(this).addClass('d-none').show();
        }), 7000);
    }

    function mostrarAlerta(tipo, msg) {
        const cls = tipo === 'erro' ? 'alerta-erro' : 'alerta-sucesso';
        const ico = tipo === 'erro' ? 'exclamation-circle' : 'check-circle';
        $('#feedback-envio').html(`
            <div class="${cls} fade-in-up">
                <i class="fas fa-${ico}"></i><span>${msg}</span>
            </div>
        `).removeClass('d-none');
    }

    /* ─────────────────────────────────────────
       BUSCA DE PROTOCOLO
    ───────────────────────────────────────── */
    window.buscarProtocolo = function () {
        const proto = $('#inputProtocolo').val().trim();
        if (!proto) return;

        loader(true);
        $('#resultado-protocolo').addClass('d-none');

        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'buscar', protocolo: proto },
            dataType: 'json',
            success: function (res) {
                loader(false);
                if (res.status === 'ok') renderResultado(res.manifestacao);
                else renderNaoEncontrado();
            },
            error: function () {
                loader(false);
                const local = manifestacoesDemo.find(m => m.protocolo === proto);
                if (local) renderResultado(local);
                else renderNaoEncontrado();
            }
        });
    };

    $('#inputProtocolo').on('keypress', function (e) {
        if (e.which === 13) buscarProtocolo();
    });

    function renderResultado(m) {
        $('#resultado-protocolo').html(`
            <div class="resultado-protocolo fade-in-up">
                <div class="titulo-proto">
                    <i class="fas fa-check-circle"></i> Protocolo encontrado
                </div>
                <div class="info-row"><strong>Protocolo</strong><span class="protocolo-badge">#${m.protocolo}</span></div>
                <div class="info-row"><strong>Tipo</strong><span class="badge-tipo ${tipoCss(m.tipo)}">${m.tipo}</span></div>
                <div class="info-row"><strong>Assunto</strong><span>${m.assunto || '—'}</span></div>
                <div class="info-row"><strong>Status</strong><span class="badge-status ${statusCss(m.status)}">${m.status}</span></div>
                ${m.data ? `<div class="info-row"><strong>Data</strong><span>${m.data}</span></div>` : ''}
            </div>
        `).removeClass('d-none');
    }

    function renderNaoEncontrado() {
        $('#resultado-protocolo').html(`
            <div class="alerta-erro fade-in-up">
                <i class="fas fa-circle-xmark"></i>
                <span>Protocolo não encontrado. Verifique o número e tente novamente.</span>
            </div>
        `).removeClass('d-none');
    }

    /* ─────────────────────────────────────────
       PERFIL — salvar
    ───────────────────────────────────────── */
    $('#formPerfil').on('submit', function (e) {
        e.preventDefault();
        loader(true);

        const novoEmail    = $('#perfil-campo-email').val().trim();
        const novoTelefone = $('#perfil-campo-telefone').val().trim();

        // Atualiza sessionStorage com os novos valores
        sessionStorage.setItem('usuario_email',    novoEmail);
        sessionStorage.setItem('usuario_telefone', novoTelefone);
        usuario.email    = novoEmail;
        usuario.telefone = novoTelefone;

        setTimeout(() => {
            loader(false);
            $('#feedback-perfil').removeClass('d-none').addClass('fade-in-up');
            setTimeout(() => $('#feedback-perfil').fadeOut(400, function () {
                $(this).addClass('d-none').show();
            }), 4000);
        }, 700);
    });

    /* ─────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────── */
    function tipoCss(tipo) {
        return { 'Reclamação': 't-reclamacao', 'Sugestão': 't-sugestao', 'Denúncia': 't-denuncia', 'Elogio': 't-elogio' }[tipo] || '';
    }
    function statusCss(status) {
        return { 'Recebido': 's-recebido', 'Em análise': 's-analise', 'Em andamento': 's-andamento', 'Concluído': 's-concluido', 'Arquivado': 's-arquivado' }[status] || '';
    }

});
