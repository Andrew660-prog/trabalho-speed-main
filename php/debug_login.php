<?php
/**
 * debug_login.php — Diagnóstico completo do login
 * ACESSE: seusite.com/php/debug_login.php
 * APAGUE ESTE ARQUIVO após resolver o problema!
 */

// Mostra TODOS os erros PHP
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO DE LOGIN ===\n\n";

// 1. Versão do PHP
echo "PHP: " . PHP_VERSION . "\n";

// 2. Extensão PDO MySQL
echo "PDO MySQL: " . (extension_loaded('pdo_mysql') ? "OK" : "FALTANDO!") . "\n";

// 3. Tenta conexão com o banco
echo "\n--- CONEXÃO ---\n";
require_once 'conexao.php';
try {
    $pdo = conectar();
    echo "Conexão: OK\n";
} catch (Exception $e) {
    echo "Conexão FALHOU: " . $e->getMessage() . "\n";
    exit;
}

// 4. Verifica se a tabela existe
echo "\n--- TABELA USUARIOS ---\n";
try {
    $r = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
    $t = $r->fetch();
    echo "Registros na tabela: " . $t['total'] . "\n";
} catch (Exception $e) {
    echo "Erro na tabela: " . $e->getMessage() . "\n";
    exit;
}

// 5. Lista usuários (sem mostrar senha completa)
echo "\n--- USUÁRIOS CADASTRADOS ---\n";
$rows = $pdo->query("SELECT id, nome, email, cpf, tipo, LEFT(senha,20) as hash_inicio FROM usuarios")->fetchAll();
if (!$rows) {
    echo "Nenhum usuário encontrado! Execute o setup_teste.php ou cadastre um usuário.\n";
} else {
    foreach ($rows as $u) {
        echo "ID: {$u['id']} | {$u['nome']} | {$u['email']} | tipo: {$u['tipo']} | hash: {$u['hash_inicio']}...\n";
    }
}

// 6. Testa password_verify com o primeiro usuário
echo "\n--- TESTE DE SENHA ---\n";
if ($rows) {
    // Pega o hash completo do primeiro usuário
    $primeiro = $pdo->query("SELECT email, senha FROM usuarios LIMIT 1")->fetch();
    $senhas_teste = ['teste123', '123456', 'password', '12345678'];
    echo "Testando senhas para: {$primeiro['email']}\n";
    $achou = false;
    foreach ($senhas_teste as $s) {
        if (password_verify($s, $primeiro['senha'])) {
            echo "  SENHA CORRETA ENCONTRADA: '$s'\n";
            $achou = true;
        }
    }
    if (!$achou) {
        echo "  Nenhuma senha padrão funcionou. O hash no banco pode ser inválido.\n";
        echo "  Hash atual: " . $primeiro['senha'] . "\n";
        echo "  Comprimento do hash: " . strlen($primeiro['senha']) . " (deve ser 60)\n";
    }
}

// 7. Gera hash fresco para teste
echo "\n--- HASH GERADO AGORA ---\n";
$novo_hash = password_hash('teste123', PASSWORD_BCRYPT);
echo "Novo hash para 'teste123': $novo_hash\n";
echo "Verificação imediata: " . (password_verify('teste123', $novo_hash) ? "OK" : "FALHOU") . "\n";

// 8. Simula o fluxo exato do auth.php
echo "\n--- SIMULAÇÃO DO AUTH.PHP ---\n";
$identificador = 'aluno@escola.ce.gov.br'; // ajuste se necessário
$stmt = $pdo->prepare("SELECT id, nome, email, senha FROM usuarios WHERE email = :id OR cpf = :id LIMIT 1");
$stmt->execute([':id' => $identificador]);
$usuario = $stmt->fetch();
if (!$usuario) {
    echo "Usuário '$identificador' NÃO encontrado no banco.\n";
    echo "Tente com o e-mail ou CPF que você cadastrou.\n";
} else {
    echo "Usuário encontrado: {$usuario['nome']}\n";
    $ok = password_verify('teste123', $usuario['senha']);
    echo "password_verify('teste123', hash): " . ($ok ? "OK — LOGIN FUNCIONARIA" : "FALHOU — hash incompatível") . "\n";
}

echo "\n=== FIM DO DIAGNÓSTICO ===\n";
echo "APAGUE ESTE ARQUIVO AGORA!\n";
