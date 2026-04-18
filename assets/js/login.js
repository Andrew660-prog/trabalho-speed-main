/**
 * login.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
 * Lógica de autenticação via jQuery AJAX
 */

$(function () {

    function loader(show) {
        if (show) {
            $('#loader-overlay').removeClass('d-none').hide().fadeIn(180);
        } else {
            $('#loader-overlay').fadeOut(200, function () { $(this).addClass('d-none'); });
        }
    }

    function mostrarErro(msg) {
        $('#loginErrorMsg').text(msg);
        $('#loginError')
            .removeClass('d-none animate__shakeX')
            .addClass('animate__shakeX');
    }

    $('#formLogin').on('submit', function (e) {
        e.preventDefault();

        const user = $('#loginUser').val().trim();
        const pass = $('#loginPass').val();

        if (!user || !pass) {
            mostrarErro('Preencha todos os campos.');
            return;
        }

        $('#loginError').addClass('d-none');
        loader(true);

        $.ajax({
            url: 'php/auth.php',
            method: 'POST',
            data: { action: 'login', identificador: user, senha: pass },
            dataType: 'json',
            success: function (res) {
                loader(false);
                if (res.status === 'ok') {
                    // Salva nome na sessionStorage para o dashboard usar
                    sessionStorage.setItem('usuario_nome', res.usuario.nome);
                    window.location.href = 'dashboard.html';
                } else {
                    mostrarErro(res.mensagem || 'Credenciais inválidas.');
                }
            },
            error: function () {
                loader(false);
                // Fallback demo (sem backend)
                if (user && pass) {
                    sessionStorage.setItem('usuario_nome', 'Aluno Demo');
                    window.location.href = 'dashboard.html';
                } else {
                    mostrarErro('Erro ao conectar. Tente novamente.');
                }
            }
        });
    });

});
