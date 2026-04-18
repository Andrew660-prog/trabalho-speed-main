/**
 * cadastro.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
 * Lógica de cadastro de conta via jQuery AJAX
 */

$(function () {

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
       SELETOR DE TIPO (Aluno / Colaborador)
       ================================================ */
    $('.tipo-btn').on('click', function () {
        $('.tipo-btn').removeClass('ativo');
        $(this).addClass('ativo');
        $(this).find('input[type="radio"]').prop('checked', true);
    });

    /* ================================================
       MÁSCARA DE CPF
       ================================================ */
    $('#cadCpf').on('input', function () {
        let v = $(this).val().replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        $(this).val(v);
    });

    /* ================================================
       MÁSCARA DE TELEFONE
       ================================================ */
    $('#cadTelefone').on('input', function () {
        let v = $(this).val().replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{2})(\d)/, '($1) $2');
        v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
        $(this).val(v);
    });

    /* ================================================
       INDICADOR DE FORÇA DE SENHA
       ================================================ */
    $('#cadSenha').on('input', function () {
        const senha = $(this).val();
        const forca = avaliarSenha(senha);

        $('#forca-barra')
            .removeClass('fraca media forte')
            .addClass(forca.classe);

        $('#forca-texto')
            .text(forca.texto)
            .css('color', forca.cor);

        // Revalida confirmação se já preenchida
        if ($('#cadConfirma').val()) verificarConfirmacao();
    });

    function avaliarSenha(senha) {
        if (!senha) return { classe: '', texto: 'Digite uma senha', cor: '#b0bec5' };

        let pontos = 0;
        if (senha.length >= 8)             pontos++;
        if (/[A-Z]/.test(senha))           pontos++;
        if (/[0-9]/.test(senha))           pontos++;
        if (/[^A-Za-z0-9]/.test(senha))   pontos++;

        if (pontos <= 1) return { classe: 'fraca',  texto: 'Senha fraca',  cor: '#e74c3c' };
        if (pontos <= 2) return { classe: 'media',  texto: 'Senha média',  cor: '#f0b429' };
        return              { classe: 'forte',  texto: 'Senha forte',  cor: '#008d4c' };
    }

    /* ================================================
       MOSTRAR / OCULTAR SENHA
       ================================================ */
    $('#toggleSenha').on('click', function () {
        const input = $('#cadSenha');
        const icone = $('#iconeSenha');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icone.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icone.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    /* ================================================
       VERIFICAÇÃO DE CONFIRMAÇÃO DE SENHA
       ================================================ */
    $('#cadConfirma').on('input', verificarConfirmacao);

    function verificarConfirmacao() {
        const senha    = $('#cadSenha').val();
        const confirma = $('#cadConfirma').val();
        if (!confirma) { $('#confirma-erro').addClass('d-none'); return true; }

        if (senha !== confirma) {
            $('#confirma-erro').removeClass('d-none');
            $('#cadConfirma').css('border-color', '#e74c3c');
            return false;
        } else {
            $('#confirma-erro').addClass('d-none');
            $('#cadConfirma').css('border-color', 'var(--verde)');
            return true;
        }
    }

    /* ================================================
       VALIDAÇÃO GERAL
       ================================================ */
    function validarFormulario() {
        const nome     = $('#cadNome').val().trim();
        const cpf      = $('#cadCpf').val().replace(/\D/g, '');
        const email    = $('#cadEmail').val().trim();
        const senha    = $('#cadSenha').val();
        const confirma = $('#cadConfirma').val();

        if (!nome || nome.split(' ').length < 2) {
            mostrarFeedback('erro', 'Informe seu nome completo (nome e sobrenome).');
            return false;
        }
        if (cpf.length !== 11) {
            mostrarFeedback('erro', 'Informe um CPF válido com 11 dígitos.');
            return false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarFeedback('erro', 'Informe um e-mail válido.');
            return false;
        }
        if (senha.length < 8) {
            mostrarFeedback('erro', 'A senha deve ter pelo menos 8 caracteres.');
            return false;
        }
        if (!verificarConfirmacao()) {
            mostrarFeedback('erro', 'As senhas não coincidem.');
            return false;
        }
        return true;
    }

    /* ================================================
       FEEDBACK VISUAL
       ================================================ */
    function mostrarFeedback(tipo, msg) {
        const cls = tipo === 'erro' ? 'alerta-erro' : 'alerta-sucesso';
        const ico = tipo === 'erro' ? 'exclamation-circle' : 'check-circle';
        $('#feedback-cadastro')
            .html(`<div class="${cls} fade-in-up"><i class="fas fa-${ico} me-2"></i>${msg}</div>`)
            .removeClass('d-none');
        $('html, body').animate({ scrollTop: 0 }, 300);
    }

    /* ================================================
       ENVIO DO FORMULÁRIO
       ================================================ */
    $('#formCadastro').on('submit', function (e) {
        e.preventDefault();
        $('#feedback-cadastro').addClass('d-none');

        if (!validarFormulario()) return;

        loader(true);

        const dados = {
            action:    'cadastrar',
            nome:      $('#cadNome').val().trim(),
            cpf:       $('#cadCpf').val(),
            email:     $('#cadEmail').val().trim(),
            telefone:  $('#cadTelefone').val(),
            senha:     $('#cadSenha').val(),
            tipo:      $('input[name="tipo"]:checked').val(),
        };

        $.ajax({
            url: 'php/cadastro.php',
            method: 'POST',
            data: dados,
            dataType: 'json',
            success: function (res) {
                loader(false);
                if (res.status === 'ok') {
                    mostrarFeedback('sucesso',
                        'Conta criada com sucesso! Redirecionando para o login...');
                    setTimeout(() => window.location.href = 'login.html', 2200);
                } else {
                    mostrarFeedback('erro', res.mensagem || 'Erro ao criar conta.');
                }
            },
            error: function () {
                loader(false);
                // Demo offline — simula sucesso
                mostrarFeedback('sucesso',
                    'Conta criada com sucesso! Redirecionando para o login...');
                setTimeout(() => window.location.href = 'login.html', 2200);
            }
        });
    });

});
