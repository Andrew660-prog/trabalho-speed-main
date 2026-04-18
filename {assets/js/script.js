$(document).ready(function() {
    
    // --- 1. BANCO DE DADOS SIMULADO ---
    let manifestacoesDB = [
        { protocolo: "2026001", data: "15/03/2026", tipo: "Elogio", assunto: "Refeitório", status: "Concluído" },
        { protocolo: "2026002", data: "20/03/2026", tipo: "Reclamação", assunto: "Wi-fi", status: "Em análise" }
    ];
    
    // Função auxiliar para mostrar/esconder o loader global
    function toggleLoader(show) {
        if (show) {
            $('#loader-overlay').removeClass('d-none').hide().fadeIn(200);
        } else {
            $('#loader-overlay').fadeOut(200, function() { $(this).addClass('d-none'); });
        }
    }
    
    // Funções da Página de Apresentação
    window.irParaLogin = function() {
        $('#tela-apresentacao').addClass('d-none');
        $('#tela-login').removeClass('d-none').addClass('animate__animated animate__fadeIn');
    };
    
    window.irParaManifestacaoAnonima = function() {
        // Esconde a apresentação e o login
        $('#tela-apresentacao, #tela-login').addClass('d-none');
        
        // Mostra a área restrita, mas foca direto no formulário
        $('#area-restrita').removeClass('d-none');
        
        // Simula o clique no botão de "Nova Manifestação" 
        // e já marca o checkbox de anônimo
        showFormManifestacao();
        $('#checkAnonimo').prop('checked', true).trigger('change');
        
        // Esconde a sidebar e o botão de sair se for anônimo (opcional, para privacidade)
        // $('.sidebar, .navbar .btn-light').addClass('d-none'); 
    };
    
    window.voltarParaApresentacao = function() {
        toggleLoader(true);
    
        setTimeout(() => {
            // Esconde o login e mostra a apresentação
            $('#tela-login').addClass('d-none');
            $('#tela-apresentacao').removeClass('d-none').addClass('animate__animated animate__fadeIn');
            
            // Limpa possíveis erros de login ao voltar
            $('#loginError').addClass('d-none');
            $('#formLogin')[0].reset();
            
            toggleLoader(false);
        }, 600);
    };
    
    // --- 2. LÓGICA DE LOGIN ---
    $('#formLogin').on('submit', function(e) {
        e.preventDefault();
        $('#loginError').addClass('d-none');
        toggleLoader(true);

        const user = $('#loginUser').val();
        const pass = $('#loginPass').val();

        // Simulação de delay de rede (1.5 segundos)
        setTimeout(() => {
            $.ajax({
                url: 'https://jsonplaceholder.typicode.com/posts', 
                method: 'POST',
                data: { username: user, password: pass },
                success: function() {
                    if(user && pass) {
                        $('#tela-login').addClass('animate__fadeOutLeft');
                        setTimeout(() => {
                            $('#tela-login').addClass('d-none');
                            $('#area-restrita').removeClass('d-none').addClass('animate__animated animate__fadeIn');
                            renderizarDashboard();
                            toggleLoader(false);
                        }, 500);
                    } else {
                        toggleLoader(false);
                        $('#loginError').removeClass('d-none');
                    }
                },
                error: function() {
                    toggleLoader(false);
                    alert("Erro ao conectar com o servidor.");
                }
            });
        }, 1200);
    });

    // --- 3. LÓGICA DE ANONIMATO ---
    $('#checkAnonimo').on('change', function() {
        const isChecked = $(this).is(':checked');
        if (isChecked) {
            $('#secaoIdentificacao').slideUp(300);
            $('#nomeUsuario, #cpfUsuario').removeAttr('required').val('');
        } else {
            $('#secaoIdentificacao').slideDown(300);
            $('#nomeUsuario, #cpfUsuario').attr('required', true);
        }
    });

    // --- 4. ENVIO DE MANIFESTAÇÃO ---
    $('#formManifestacao').on('submit', function(e) {
        e.preventDefault();
        toggleLoader(true);

        const novoProtocolo = Math.floor(Math.random() * 900000) + 100000;
        const dados = {
            protocolo: novoProtocolo.toString(),
            data: new Date().toLocaleDateString('pt-BR'),
            tipo: $('#tipo').val(),
            assunto: $('#assunto').val(),
            descricao: $('#descricao').val(),
            status: "Recebido",
            anonimo: $('#checkAnonimo').is(':checked')
        };

        setTimeout(() => {
            $.ajax({
                url: 'https://jsonplaceholder.typicode.com/posts',
                method: 'POST',
                data: dados,
                success: function() {
                    manifestacoesDB.unshift(dados);
                    toggleLoader(false);
                    
                    alert("Manifestação enviada com sucesso!\nProtocolo: " + novoProtocolo);
                    
                    $('#formManifestacao')[0].reset();
                    if ($('#checkAnonimo').is(':checked')) {
                        $('#checkAnonimo').prop('checked', false).trigger('change');
                    }
                    showDashboard();
                }
            });
        }, 1000);
    });

    // --- 5. FUNÇÕES DE RENDERIZAÇÃO ---

    window.renderizarDashboard = function() {
        let html = "";
        manifestacoesDB.slice(0, 3).forEach(m => {
            let badgeClasse = m.tipo === "Reclamação" ? "bg-danger" : (m.tipo === "Elogio" ? "bg-success" : "bg-info");
            html += `
                <tr class="animate__animated animate__fadeIn">
                    <td><b>#${m.protocolo}</b></td>
                    <td><span class="badge ${badgeClasse}">${m.tipo}</span></td>
                    <td><i class="fas fa-clock me-1 text-warning"></i>${m.status}</td>
                </tr>
            `;
        });
        $('#listaManifestacoes').html(html || '<tr><td colspan="3" class="text-center">Nenhuma manifestação.</td></tr>');
    }

    window.renderizarTabelaCompleta = function() {
        let html = "";
        manifestacoesDB.forEach(m => {
            let corStatus = m.status === "Concluído" ? "success" : "warning";
            html += `
                <tr class="animate__animated animate__fadeIn">
                    <td><b>#${m.protocolo}</b></td>
                    <td>${m.data}</td>
                    <td><span class="badge bg-light text-dark border">${m.tipo}</span></td>
                    <td>${m.assunto}</td>
                    <td><span class="badge bg-${corStatus}">${m.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('Detalhes do protocolo ${m.protocolo}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        $('#tabelaCompletaManifestacoes').html(html || '<tr><td colspan="6" class="text-center">Vazio.</td></tr>');
    }

    // --- 6. BUSCA DE PROTOCOLO ---
    window.buscarProtocolo = function() {
        const p = $('#inputBuscaProtocolo').val().trim();
        if(!p) return;

        toggleLoader(true);
        setTimeout(() => {
            toggleLoader(false);
            const resultado = manifestacoesDB.find(m => m.protocolo === p);
            const divResultado = $('#resultadoBusca');
            
            divResultado.hide().removeClass('d-none').fadeIn();
            
            if(resultado) {
                divResultado.html(`
                    <div class="card border-success shadow-sm animate__animated animate__pulse">
                        <div class="card-body">
                            <h5 class="card-title text-success"><i class="fas fa-check-circle me-2"></i>Protocolo Encontrado</h5>
                            <hr>
                            <p class="mb-1"><strong>Status:</strong> <span class="badge bg-warning">${resultado.status}</span></p>
                            <p class="mb-1"><strong>Tipo:</strong> ${resultado.tipo}</p>
                            <p class="mb-0"><strong>Assunto:</strong> ${resultado.assunto}</p>
                        </div>
                    </div>
                `);
            } else {
                divResultado.html(`
                    <div class="alert alert-danger animate__animated animate__shakeX">
                        <i class="fas fa-times-circle me-2"></i>Protocolo não encontrado.
                    </div>
                `);
            }
        }, 600);
    }

    // --- 7. NAVEGAÇÃO ENTRE TELAS ---
    window.trocarTela = function(idTela, idLink) {
        // Efeito de fade out no conteúdo atual
        $('#content-area').removeClass('animate__fadeInUp').addClass('animate__fadeOutDown');
        
        setTimeout(() => {
            $('main > div > div').addClass('d-none'); // Esconde sub-telas
            $(`#${idTela}`).removeClass('d-none');
            
            $('#content-area').removeClass('animate__fadeOutDown').addClass('animate__fadeInUp');

            $('.sidebar .nav-link').removeClass('active');
            $(`#${idLink}`).addClass('active');

            if(idTela === 'tela-minhas-manifestacoes') renderizarTabelaCompleta();
            if(idTela === 'tela-dashboard') renderizarDashboard();
            
            // Limpa busca de protocolo se sair da tela de busca
            if(idTela !== 'tela-acompanhar') {
                $('#resultadoBusca').addClass('d-none');
                $('#inputBuscaProtocolo').val('');
            }
        }, 300);
    }

    // Funções de Navegação
    window.showDashboard = () => trocarTela('tela-dashboard', 'link-dash');
    window.showFormManifestacao = () => trocarTela('tela-manifestacao', 'link-nova');
    window.showMinhasManifestacoes = () => trocarTela('tela-minhas-manifestacoes', 'link-minhas');
    window.showAcompanhar = () => trocarTela('tela-acompanhar', 'link-busca');
    window.showPerfil = () => trocarTela('tela-perfil', 'link-perfil');

    // Logout
    window.logout = () => {
        if(confirm("Deseja realmente encerrar a sessão?")) {
            toggleLoader(true);
            setTimeout(() => {
                location.reload();
            }, 800);
        }
    };
});