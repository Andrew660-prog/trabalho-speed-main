/**
 * script.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
 * jQuery + Bootstrap 5 + AJAX (PHP/PDO backend)
 */

$(function () {

    /* ================================================
       CONFIGURAÇÃO GLOBAL DE AJAX
       ================================================ */
    $.ajaxSetup({ cache: false });

    /* Estado local (enquanto o backend não está disponível
       são usados dados simulados; em produção, remover) */
    let estado = {
        logado: false,
        usuario: null,
        manifestacoes: [
            { protocolo: '2026001', data: '15/03/2026', tipo: 'Elogio',     assunto: 'Refeitório', status: 'Concluído'  },
            { protocolo: '2026002', data: '20/03/2026', tipo: 'Reclamação', assunto: 'Wi-fi',      status: 'Em análise' },
        ]
    };

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
       TROCA DE TELAS PRINCIPAIS
       ================================================ */
    function mostrarTela(id) {
        $('#tela-apresentacao, #tela-login, #area-restrita').addClass('d-none');
        $(`#${id}`).removeClass('d-none').addClass('fade-in-up');
    }

    /* ================================================
       TELA DE APRESENTAÇÃO
       ================================================ */
    window.irParaLogin = function () {
        mostrarTela('tela-login');
        $('#loginUser').trigger('focus');
    };

    window.irParaManifestacaoAnonima = function () {
        mostrarTela('area-restrita');
        trocarSecao('sec-manifestacao', 'nav-nova');
        // Força modo anônimo
        setTimeout(() => {
            $('#checkAnonimo').prop('checked', true).trigger('change');
        }, 350);
    };

    window.voltarParaApresentacao = function () {
        loader(true);
        setTimeout(() => {
            mostrarTela('tela-apresentacao');
            $('#formLogin')[0].reset();
            $('#loginError').addClass('d-none');
            loader(false);
        }, 500);
    };

    /* ================================================
       LOGIN via AJAX
       ================================================ */
    $('#formLogin').on('submit', function (e) {
        e.preventDefault();
        const user = $('#loginUser').val().trim();
        const pass = $('#loginPass').val();
        if (!user || !pass) return;

        $('#loginError').addClass('d-none');
        loader(true);

        // Chamada real ao backend:
        $.ajax({
            url: 'php/auth.php',
            method: 'POST',
            data: { action: 'login', identificador: user, senha: pass },
            dataType: 'json',
            success: function (res) {
                loader(false);
                if (res.status === 'ok') {
                    estado.logado  = true;
                    estado.usuario = res.usuario;
                    entrarNoSistema(res.usuario.nome);
                } else {
                    mostrarLoginErro(res.mensagem || 'Credenciais inválidas.');
                }
            },
            error: function () {
                loader(false);
                // Fallback para demo (sem backend)
                if (user && pass) {
                    estado.logado  = true;
                    estado.usuario = { nome: 'Aluno Demo' };
                    entrarNoSistema('Aluno Demo');
                } else {
                    mostrarLoginErro('Preencha todos os campos.');
                }
            }
        });
    });

    function mostrarLoginErro(msg) {
        $('#loginError').text(msg).removeClass('d-none')
            .removeClass('animate__shakeX').addClass('animate__shakeX');
    }

    function entrarNoSistema(nome) {
        $('.usuario-nome-nav').text(nome);
        mostrarTela('area-restrita');
        carregarDashboard();
        trocarSecao('sec-dashboard', 'nav-dash');
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
                setTimeout(() => location.reload(), 300);
            }
        });
    };

    /* ================================================
       NAVEGAÇÃO INTERNA (SIDEBAR)
       ================================================ */
    function trocarSecao(secId, navId) {
        // Fade out
        $('#content-area').removeClass('fade-in-up').css('opacity', 0);

        setTimeout(() => {
            // Esconde tudo, mostra a seção alvo
            $('#content-area > div').addClass('d-none');
            $(`#${secId}`).removeClass('d-none');

            // Atualiza nav ativa
            $('.sidebar .nav-link').removeClass('active');
            $(`#${navId}`).addClass('active');

            // Fade in
            $('#content-area').addClass('fade-in-up').css('opacity', 1);

            // Carrega dados conforme seção
            if (secId === 'sec-dashboard')     carregarDashboard();
            if (secId === 'sec-manifestacoes') carregarTabelaCompleta();
        }, 200);
    }

    window.showDashboard      = () => trocarSecao('sec-dashboard',     'nav-dash');
    window.showFormManifestacao = () => trocarSecao('sec-manifestacao','nav-nova');
    window.showMinhasManifestacoes = () => trocarSecao('sec-manifestacoes','nav-minhas');
    window.showAcompanhar     = () => trocarSecao('sec-acompanhar',    'nav-busca');
    window.showPerfil         = () => trocarSecao('sec-perfil',        'nav-perfil');

    /* ================================================
       DASHBOARD — carrega estatísticas e últimos
       ================================================ */
    function carregarDashboard() {
        // Stats via AJAX
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
                // Demo fallback
                $('#stat-ativas').text(2);
                $('#stat-concluidas').text(5);
                $('#stat-total').text(7);
            }
        });

        // Últimas manifestações
        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'listar' },
            dataType: 'json',
            success: function (res) {
                if (res.status === 'ok') renderUltimas(res.manifestacoes);
                else renderUltimas(estado.manifestacoes);
            },
            error: function () { renderUltimas(estado.manifestacoes); }
        });
    }

    function renderUltimas(lista) {
        const tbody = $('#lista-ultimas');
        if (!lista || !lista.length) {
            tbody.html('<tr><td colspan="4" class="text-center py-4 text-muted">Nenhuma manifestação encontrada.</td></tr>');
            return;
        }
        let html = '';
        lista.slice(0, 5).forEach(m => {
            html += `<tr class="fade-in-up">
                <td><span class="protocolo-badge">#${m.protocolo}</span></td>
                <td><span class="badge-tipo ${tipoCss(m.tipo)}">${m.tipo}</span></td>
                <td>${m.assunto || '—'}</td>
                <td><span class="badge-status ${statusCss(m.status)}">${m.status}</span></td>
            </tr>`;
        });
        tbody.html(html);
    }

    /* ================================================
       TABELA COMPLETA DE MANIFESTAÇÕES
       ================================================ */
    function carregarTabelaCompleta() {
        $.ajax({
            url: 'php/manifestacoes.php',
            data: { action: 'listar' },
            dataType: 'json',
            success: function (res) {
                if (res.status === 'ok') renderTabelaCompleta(res.manifestacoes);
                else renderTabelaCompleta(estado.manifestacoes);
            },
            error: function () { renderTabelaCompleta(estado.manifestacoes); }
        });
    }

    function renderTabelaCompleta(lista) {
        const tbody = $('#tabela-completa');
        if (!lista || !lista.length) {
            tbody.html('<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma manifestação.</td></tr>');
            return;
        }
        let html = '';
        lista.forEach(m => {
            html += `<tr class="fade-in-up">
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
            </tr>`;
        });
        tbody.html(html);
    }

    /* ================================================
       FORMULÁRIO DE MANIFESTAÇÃO — envio AJAX
       ================================================ */
    // Toggle anônimo
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
                    // Adiciona ao estado local
                    estado.manifestacoes.unshift({
                        protocolo: res.protocolo,
                        data: new Date().toLocaleDateString('pt-BR'),
                        tipo: dados.tipo,
                        assunto: dados.assunto,
                        status: 'Recebido'
                    });
                    $('#formManifestacao')[0].reset();
                    $('#secao-identificacao').show();
                    mostrarFeedbackEnvio(res.protocolo);
                } else {
                    mostrarAlerta('danger', res.mensagem || 'Erro ao enviar.');
                }
            },
            error: function () {
                loader(false);
                // Demo offline
                const proto = '2026' + String(Math.floor(Math.random()*900000)+100000).slice(0,6);
                estado.manifestacoes.unshift({
                    protocolo: proto,
                    data: new Date().toLocaleDateString('pt-BR'),
                    tipo: dados.tipo,
                    assunto: dados.assunto,
                    status: 'Recebido'
                });
                $('#formManifestacao')[0].reset();
                mostrarFeedbackEnvio(proto);
            }
        });
    });

    function mostrarFeedbackEnvio(protocolo) {
        $('#feedback-envio').html(`
            <div class="alerta-sucesso fade-in-up">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Manifestação enviada com sucesso!</strong><br>
                Guarde seu número de protocolo: <strong>${protocolo}</strong>
            </div>
        `).removeClass('d-none');
        setTimeout(() => $('#feedback-envio').fadeOut(400, function () {
            $(this).addClass('d-none').show();
        }), 6000);
    }

    function mostrarAlerta(tipo, msg) {
        const cls = tipo === 'danger' ? 'alerta-erro' : 'alerta-sucesso';
        $('#feedback-envio').html(`
            <div class="${cls} fade-in-up">
                <i class="fas fa-${tipo === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2"></i>${msg}
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
                if (res.status === 'ok') {
                    renderResultadoProtocolo(res.manifestacao);
                } else {
                    renderResultadoNaoEncontrado();
                }
            },
            error: function () {
                loader(false);
                // Demo offline
                const local = estado.manifestacoes.find(m => m.protocolo === proto);
                if (local) renderResultadoProtocolo(local);
                else renderResultadoNaoEncontrado();
            }
        });
    };

    // Busca ao apertar Enter
    $('#inputProtocolo').on('keypress', function (e) {
        if (e.which === 13) buscarProtocolo();
    });

    function renderResultadoProtocolo(m) {
        $('#resultado-protocolo').html(`
            <div class="resultado-protocolo fade-in-up">
                <div class="titulo-proto">
                    <i class="fas fa-check-circle text-success"></i>
                    Protocolo encontrado
                </div>
                <div class="info-row">
                    <strong>Protocolo</strong>
                    <span class="protocolo-badge">#${m.protocolo}</span>
                </div>
                <div class="info-row">
                    <strong>Tipo</strong>
                    <span class="badge-tipo ${tipoCss(m.tipo)}">${m.tipo}</span>
                </div>
                <div class="info-row">
                    <strong>Assunto</strong>
                    <span>${m.assunto || '—'}</span>
                </div>
                <div class="info-row">
                    <strong>Status</strong>
                    <span class="badge-status ${statusCss(m.status)}">${m.status}</span>
                </div>
                ${m.data ? `<div class="info-row">
                    <strong>Data</strong><span>${m.data}</span>
                </div>` : ''}
            </div>
        `).removeClass('d-none');
    }

    function renderResultadoNaoEncontrado() {
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
       HELPERS — classes CSS por tipo/status
       ================================================ */
    function tipoCss(tipo) {
        const m = {
            'Reclamação': 't-reclamacao',
            'Sugestão':   't-sugestao',
            'Denúncia':   't-denuncia',
            'Elogio':     't-elogio',
        };
        return m[tipo] || '';
    }

    function statusCss(status) {
        const m = {
            'Recebido':     's-recebido',
            'Em análise':   's-analise',
            'Em andamento': 's-andamento',
            'Concluído':    's-concluido',
            'Arquivado':    's-arquivado',
        };
        return m[status] || '';
    }

}); // fim document.ready
