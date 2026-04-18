<?php
// =============================================
// cadastro.php — Registro de novo usuário
// =============================================
require_once 'conexao.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_POST['action'] ?? '') !== 'cadastrar') {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Requisição inválida.']);
    exit;
}

// --- Coleta e sanitiza os dados ---
$nome     = trim($_POST['nome']     ?? '');
$cpf      = preg_replace('/\D/', '', $_POST['cpf'] ?? '');
$email    = trim($_POST['email']    ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$senha    = $_POST['senha']          ?? '';
$tipo     = $_POST['tipo']           ?? 'aluno';

// --- Validações ---
if (!$nome || !$cpf || !$email || !$senha) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Preencha todos os campos obrigatórios.']);
    exit;
}
if (strlen($cpf) !== 11 || !preg_match('/^\d{11}$/', $cpf)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'CPF inválido.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail inválido.']);
    exit;
}
if (strlen($senha) < 8) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'A senha deve ter pelo menos 8 caracteres.']);
    exit;
}
if (!in_array($tipo, ['aluno', 'colaborador'])) {
    $tipo = 'aluno';
}

// Formata CPF para exibição: 000.000.000-00
$cpf_fmt = substr($cpf,0,3).'.'.substr($cpf,3,3).'.'.substr($cpf,6,3).'-'.substr($cpf,9,2);

$pdo = conectar();

// Verifica duplicidade de e-mail ou CPF
$check = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email OR cpf = :cpf LIMIT 1");
$check->execute([':email' => $email, ':cpf' => $cpf_fmt]);
if ($check->fetch()) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail ou CPF já cadastrado.']);
    exit;
}

// Hash seguro da senha
$hash = password_hash($senha, PASSWORD_BCRYPT);

// Insere o usuário
$stmt = $pdo->prepare(
    "INSERT INTO usuarios (nome, cpf, email, telefone, senha, tipo)
     VALUES (:nome, :cpf, :email, :telefone, :senha, :tipo)"
);
$stmt->execute([
    ':nome'     => $nome,
    ':cpf'      => $cpf_fmt,
    ':email'    => $email,
    ':telefone' => $telefone ?: null,
    ':senha'    => $hash,
    ':tipo'     => $tipo,
]);

echo json_encode([
    'status'   => 'ok',
    'mensagem' => 'Conta criada com sucesso!',
]);
