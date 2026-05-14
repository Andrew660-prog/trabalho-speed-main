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
            data: { action: 'login', identificador: user, senha: pass },
            success: function (raw) {
                loader(false);

                let res;
                try {
                    res = (typeof raw === 'object') ? raw : JSON.parse(raw);
                } catch (err) {
                    console.error('Resposta inválida do servidor:', raw);
                    mostrarErro('Resposta inesperada do servidor. Veja o console (F12).');
                    return;
                }

                if (res.status === 'ok') {
                    // Salva todos os dados do usuário no sessionStorage
                    sessionStorage.setItem('usuario_nome',     res.usuario.nome      || '');
                    sessionStorage.setItem('usuario_id',       res.usuario.id        || '');
                    sessionStorage.setItem('usuario_email',    res.usuario.email     || '');
                    sessionStorage.setItem('usuario_cpf',      res.usuario.cpf       || '');
                    sessionStorage.setItem('usuario_telefone', res.usuario.telefone  || '');
                    sessionStorage.setItem('usuario_tipo',     res.usuario.tipo      || '');
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
