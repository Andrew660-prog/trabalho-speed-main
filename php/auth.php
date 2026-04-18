<?php
// =============================================
// auth.php — Login / Logout / Sessão
// =============================================

// Captura QUALQUER saída antes de começar (warnings, BOM, espaços)
ob_start();
session_start();
require_once 'conexao.php';

// Função que garante resposta JSON limpa sempre
function responder(array $dados): void {
    ob_end_clean(); // descarta tudo que veio antes
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// Formata CPF para o padrão salvo no banco: 000.000.000-00
function formatarCpfParaBanco(string $valor): string {
    $cpf = preg_replace('/\D/', '', $valor);
    if (strlen($cpf) !== 11) return $valor; // não era CPF — devolve como veio (pode ser e-mail)
    return substr($cpf,0,3).'.'.substr($cpf,3,3).'.'.substr($cpf,6,3).'-'.substr($cpf,9,2);
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// -------- LOGIN --------
if ($action === 'login') {
    $identificador = trim($_POST['identificador'] ?? '');
    $senha         = $_POST['senha'] ?? '';

    if (!$identificador || !$senha) {
        responder(['status' => 'erro', 'mensagem' => 'Preencha todos os campos.']);
    }

    $pdo = conectar();

    // CORREÇÃO 1: PDO não permite reusar o mesmo parâmetro nomeado duas vezes.
    //             Usamos :email e :cpf como parâmetros distintos.
    // CORREÇÃO 2: O banco armazena o CPF FORMATADO (000.000.000-00), então
    //             formatamos o identificador antes de comparar com a coluna cpf.
    $cpfFormatado = formatarCpfParaBanco($identificador);

    $stmt = $pdo->prepare(
        "SELECT id, nome, email, cpf, senha, tipo
         FROM usuarios
         WHERE email = :email OR cpf = :cpf
         LIMIT 1"
    );
    $stmt->execute([
        ':email' => $identificador,
        ':cpf'   => $cpfFormatado,
    ]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        $_SESSION['usuario_id']   = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_tipo'] = $usuario['tipo'];
        unset($usuario['senha']);
        responder(['status' => 'ok', 'usuario' => $usuario]);
    } else {
        responder(['status' => 'erro', 'mensagem' => 'Usuário ou senha inválidos.']);
    }
}

// -------- LOGOUT --------
if ($action === 'logout') {
    session_destroy();
    responder(['status' => 'ok']);
}

// -------- VERIFICAR SESSÃO --------
if ($action === 'verificar') {
    if (!empty($_SESSION['usuario_id'])) {
        responder([
            'status'     => 'ok',
            'logado'     => true,
            'nome'       => $_SESSION['usuario_nome'],
            'tipo'       => $_SESSION['usuario_tipo'],
            'usuario_id' => $_SESSION['usuario_id'],
        ]);
    }
    responder(['status' => 'ok', 'logado' => false]);
}

responder(['status' => 'erro', 'mensagem' => 'Ação desconhecida.']);
