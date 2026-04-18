<?php
// =============================================
// setup_teste.php
// Cria usuários de teste com hash bcrypt válido
// ACESSE UMA VEZ pelo navegador após importar banco.sql
// APAGUE este arquivo do servidor após usar!
// =============================================
require_once 'conexao.php';

// Proteção mínima: só roda em localhost ou com chave
$permitido = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1']);
$chave_ok  = ($_GET['chave'] ?? '') === 'eeep2026setup';

if (!$permitido && !$chave_ok) {
    http_response_code(403);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Acesso negado. Passe ?chave=eeep2026setup na URL.']);
    exit;
}

$pdo = conectar();

$usuarios = [
    [
        'nome'  => 'Aluno Teste',
        'cpf'   => '000.000.000-00',
        'email' => 'aluno@escola.ce.gov.br',
        'senha' => 'teste123',
        'tipo'  => 'aluno',
    ],
    [
        'nome'  => 'Admin Escola',
        'cpf'   => '111.111.111-11',
        'email' => 'admin@escola.ce.gov.br',
        'senha' => 'teste123',
        'tipo'  => 'admin',
    ],
];

$criados = [];
$erros   = [];

$stmt = $pdo->prepare(
    "INSERT IGNORE INTO usuarios (nome, cpf, email, senha, tipo)
     VALUES (:nome, :cpf, :email, :senha, :tipo)"
);

foreach ($usuarios as $u) {
    try {
        $hash = password_hash($u['senha'], PASSWORD_BCRYPT);
        $stmt->execute([
            ':nome'  => $u['nome'],
            ':cpf'   => $u['cpf'],
            ':email' => $u['email'],
            ':senha' => $hash,
            ':tipo'  => $u['tipo'],
        ]);
        $criados[] = "{$u['nome']} ({$u['email']}) — senha: {$u['senha']}";
    } catch (PDOException $e) {
        $erros[] = "Erro ao criar {$u['email']}: " . $e->getMessage();
    }
}

echo json_encode([
    'status'  => 'ok',
    'criados' => $criados,
    'erros'   => $erros,
    'aviso'   => 'APAGUE este arquivo (setup_teste.php) do servidor agora!',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
