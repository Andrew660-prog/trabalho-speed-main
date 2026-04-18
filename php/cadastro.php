<?php
// =============================================
// cadastro.php — Registro de novo usuário
// =============================================
ob_start();
session_start();
require_once 'conexao.php';

function responderCadastro(array $dados): void {
    ob_end_clean();
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_POST['action'] ?? '') !== 'cadastrar') {
    responderCadastro(['status' => 'erro', 'mensagem' => 'Requisição inválida.']);
}

// --- Coleta e sanitiza os dados ---
$nome     = trim($_POST['nome']     ?? '');
$cpf      = preg_replace('/\D/', '', $_POST['cpf'] ?? '');  // apenas dígitos
$email    = trim($_POST['email']    ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$senha    = $_POST['senha']          ?? '';
$tipo     = $_POST['tipo']           ?? 'aluno';

// --- Validações ---
if (!$nome || !$cpf || !$email || !$senha) {
    responderCadastro(['status' => 'erro', 'mensagem' => 'Preencha todos os campos obrigatórios.']);
}
if (strlen($cpf) !== 11 || !preg_match('/^\d{11}$/', $cpf)) {
    responderCadastro(['status' => 'erro', 'mensagem' => 'CPF inválido.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderCadastro(['status' => 'erro', 'mensagem' => 'E-mail inválido.']);
}
if (strlen($senha) < 8) {
    responderCadastro(['status' => 'erro', 'mensagem' => 'A senha deve ter pelo menos 8 caracteres.']);
}
if (!in_array($tipo, ['aluno', 'colaborador'])) {
    $tipo = 'aluno';
}

// CORREÇÃO: Formata CPF DEPOIS das validações, para salvar consistentemente
// no mesmo formato que o auth.php espera ao fazer login por CPF.
$cpf_fmt = substr($cpf,0,3).'.'.substr($cpf,3,3).'.'.substr($cpf,6,3).'-'.substr($cpf,9,2);

$pdo = conectar();

// Verifica duplicidade usando o CPF formatado (igual ao que será salvo)
$check = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email OR cpf = :cpf LIMIT 1");
$check->execute([':email' => $email, ':cpf' => $cpf_fmt]);
if ($check->fetch()) {
    responderCadastro(['status' => 'erro', 'mensagem' => 'E-mail ou CPF já cadastrado.']);
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

responderCadastro([
    'status'   => 'ok',
    'mensagem' => 'Conta criada com sucesso!',
]);
