<?php
// =============================================
// auth.php — Login / Logout / Sessão
// =============================================
require_once 'conexao.php';
session_start();

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// -------- LOGIN --------
if ($action === 'login') {
    $identificador = trim($_POST['identificador'] ?? '');
    $senha          = $_POST['senha'] ?? '';

    if (!$identificador || !$senha) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Preencha todos os campos.']);
        exit;
    }

    $pdo  = conectar();
    $stmt = $pdo->prepare(
        "SELECT id, nome, email, cpf, senha, tipo
         FROM usuarios
         WHERE email = :id OR cpf = :id
         LIMIT 1"
    );
    $stmt->execute([':id' => $identificador]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        $_SESSION['usuario_id']   = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_tipo'] = $usuario['tipo'];

        unset($usuario['senha']);   // não retornar hash
        echo json_encode(['status' => 'ok', 'usuario' => $usuario]);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário ou senha inválidos.']);
    }
    exit;
}

// -------- LOGOUT --------
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'ok']);
    exit;
}

// -------- VERIFICAR SESSÃO --------
if ($action === 'verificar') {
    if (!empty($_SESSION['usuario_id'])) {
        echo json_encode([
            'status'      => 'ok',
            'logado'      => true,
            'nome'        => $_SESSION['usuario_nome'],
            'tipo'        => $_SESSION['usuario_tipo'],
            'usuario_id'  => $_SESSION['usuario_id'],
        ]);
    } else {
        echo json_encode(['status' => 'ok', 'logado' => false]);
    }
    exit;
}

echo json_encode(['status' => 'erro', 'mensagem' => 'Ação desconhecida.']);
