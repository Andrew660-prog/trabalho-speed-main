/**
 * login.js — Ouvidoria EEEP Dom Walfrido Teixeira Vieira
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
            // Não usamos dataType:'json' para evitar que o jQuery rejeite
            // a resposta se vier qualquer caractere extra antes do JSON
            data: { action: 'login', identificador: user, senha: pass },
            success: function (raw) {
                loader(false);

                // Parse manual — mais tolerante que dataType:'json'
                let res;
                try {
                    res = (typeof raw === 'object') ? raw : JSON.parse(raw);
                } catch (err) {
                    console.error('Resposta inválida do servidor:', raw);
                    mostrarErro('Resposta inesperada do servidor. Veja o console (F12).');
                    return;
                }

                if (res.status === 'ok') {
                    sessionStorage.setItem('usuario_nome', res.usuario.nome);
                    sessionStorage.setItem('usuario_id',   res.usuario.id);
                    window.location.href = 'dashboard.html';
                } else {
                    mostrarErro(res.mensagem || 'Credenciais inválidas.');
                }
            },
            error: function (xhr) {
                loader(false);
                console.error('Erro HTTP:', xhr.status, xhr.responseText);
                let msg = 'Erro ' + xhr.status + ' ao contatar o servidor.';
                try {
                    const r = JSON.parse(xhr.responseText);
                    if (r.mensagem) msg = r.mensagem;
                } catch (_) {
                    if (xhr.responseText) msg = xhr.responseText.substring(0, 200);
                }
                mostrarErro(msg);
            }
        });
    });

});
