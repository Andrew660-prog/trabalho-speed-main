/**
 * dashboard.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
 * Lógica do painel interno via jQuery AJAX
 */

$(function () {

    /* ================================================
       ESTADO LOCAL (fallback demo sem backend)
       ================================================ */
    let manifestacoesDemo = [
        { protocolo: '2026001', data: '15/03/2026', tipo: 'Elogio',     assunto: 'Refeitório', status: 'Concluído'  },
        { protocolo: '2026002', data: '20/03/2026', tipo: 'Reclamação', assunto: 'Wi-fi',      status: 'Em análise' },
    ];

    /* ================================================
       INICIALIZAÇÃO
       ================================================ */
    // Exibe nome do usuário vindo da sessionStorage (setado no login)
    const nomeUsuario = sessionStorage.getItem('usuario_nome') || 'Aluno(a)';
    $('#usuario-nome-nav').text(nomeUsuario);
    $('#perfil-nome-exib').text(nomeUsuario);

    // Verifica se veio da apresentação como anônimo
    const params = new URLSearchParams(window.location.search);
    if (params.get('anonimo') === '1') {
        trocarSecao('sec-manifestacao', 'nav-nova');
        setTimeout(() => $('#checkAnonimo').prop('checked', true).trigger('change'), 300);
    } else {
        carregarDashboard();
    }

    /* ================================================
       LOADER
       ================================================ */
    function loader(show) {
        if (show) {
            $('#loader-overlay').removeClass('d-none').hide().fadeIn(180);
        } else {
            $('#loader-overlay').fadeOut(200, function () { $(this).addClass('d-none'); });
        }
    }

    /* ================================================
       LOGOUT
       ================================================ */
    window.logout = function () {
        if (!confirm('Deseja encerrar a sessão?')) return;
        loader(true);
        $.ajax({
            url: 'php/auth.php',
            method: 'POST',
            data: { action: 'logout' },
            complete: function () {
                sessionStorage.removeItem('usuario_nome');
                setTimeout(() => window.location.href = 'index.html', 300);
            }
        });
    };

    /* ================================================
       NAVEGAÇÃO INTERNA (SIDEBAR)
       ================================================ */
    function trocarSecao(secId, navId) {
        $('#content-area').css('opacity', 0);
        setTimeout(() => {
            $('#content-area > div').addClass('d-none');
            $(`#${secId}`).removeClass('d-none');
            $('.sidebar .nav-link').removeClass('active');
            $(`#${navId}`).addClass('active');
            $('#content-area').addClass('fade-in-up').css('opacity', 1);

            if (secId === 'sec-dashboard')     carregarDashboard();
            if (secId === 'sec-manifestacoes') carregarTabelaCompleta();
        }, 200);
    }

    window.showDashboard           = () => trocarSecao('sec-dashboard',     'nav-dash');
    window.showFormManifestacao    = () => trocarSecao('sec-manifestacao',  'nav-nova');
    window.showMinhasManifestacoes = () => trocarSecao('sec-manifestacoes', 'nav-minhas');
    window.showAcompanhar          = () => trocarSecao('sec-acompanhar',    'nav-busca');
    window.showPerfil              = () => trocarSecao('sec-perfil',        'nav-perfil');

    /* ================================================
       DASHBOARD — estatísticas e últimas
       ================================================ */
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
            tbody.html('<tr><td colspan="4" class="text-center py-4 text-muted">Nenhuma manifestação encontrada.</td></tr>');
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

    /* ================================================
       TABELA COMPLETA
       ================================================ */
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
            tbody.html('<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma manifestação.</td></tr>');
            return;
        }
        tbody.html(lista.map(m => `
            <tr class="fade-in-up">
                <td><span class="protocolo-badge">#${m.protocolo}</span></td>
                <td class="text-muted" style="font-size:.85rem">${m.data || '—'}</td>
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

    /* ================================================
       FORMULÁRIO DE MANIFESTAÇÃO
       ================================================ */
    $('#checkAnonimo').on('change', function () {
        if ($(this).is(':checked')) {
            $('#secao-identificacao').slideUp(280);
            $('#nomeUsuario, #cpfUsuario').removeAttr('required').val('');
        } else {
            $('#secao-identificacao').slideDown(280);
            $('#nomeUsuario, #cpfUsuario').attr('required', true);
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
                // Demo offline
                const proto = '2026' + String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6);
                adicionarManifestacaoDemo(dados, proto);
                mostrarFeedbackEnvio(proto);
            }
        });
    });

    function adicionarManifestacaoDemo(dados, protocolo) {
        manifestacoesDemo.unshift({
            protocolo,
            data: new Date().toLocaleDateString('pt-BR'),
            tipo: dados.tipo,
            assunto: dados.assunto,
            status: 'Recebido'
        });
        $('#formManifestacao')[0].reset();
        $('#secao-identificacao').show();
    }

    function mostrarFeedbackEnvio(protocolo) {
        $('#feedback-envio').html(`
            <div class="alerta-sucesso fade-in-up">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Manifestação enviada com sucesso!</strong><br>
                Guarde seu protocolo: <strong>${protocolo}</strong>
            </div>
        `).removeClass('d-none');
        setTimeout(() => $('#feedback-envio').fadeOut(400, function () {
            $(this).addClass('d-none').show();
        }), 6000);
    }

    function mostrarAlerta(tipo, msg) {
        const cls = tipo === 'erro' ? 'alerta-erro' : 'alerta-sucesso';
        const ico = tipo === 'erro' ? 'exclamation-circle' : 'check-circle';
        $('#feedback-envio').html(`
            <div class="${cls} fade-in-up">
                <i class="fas fa-${ico} me-2"></i>${msg}
            </div>
        `).removeClass('d-none');
    }

    /* ================================================
       BUSCA DE PROTOCOLO
       ================================================ */
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
                    <i class="fas fa-check-circle text-success"></i> Protocolo encontrado
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
                <i class="fas fa-times-circle me-2"></i>
                Protocolo não encontrado. Verifique o número e tente novamente.
            </div>
        `).removeClass('d-none');
    }

    /* ================================================
       PERFIL
       ================================================ */
    $('#formPerfil').on('submit', function (e) {
        e.preventDefault();
        loader(true);
        setTimeout(() => {
            loader(false);
            $('#feedback-perfil').removeClass('d-none').addClass('fade-in-up');
            setTimeout(() => $('#feedback-perfil').fadeOut(400, function () {
                $(this).addClass('d-none').show();
            }), 4000);
        }, 700);
    });

    /* ================================================
       HELPERS
       ================================================ */
    function tipoCss(tipo) {
        return { 'Reclamação': 't-reclamacao', 'Sugestão': 't-sugestao', 'Denúncia': 't-denuncia', 'Elogio': 't-elogio' }[tipo] || '';
    }

    function statusCss(status) {
        return { 'Recebido': 's-recebido', 'Em análise': 's-analise', 'Em andamento': 's-andamento', 'Concluído': 's-concluido', 'Arquivado': 's-arquivado' }[status] || '';
    }

});
