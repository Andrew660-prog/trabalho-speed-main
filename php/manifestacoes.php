<?php
// =============================================
// manifestacoes.php — CRUD via PDO
// =============================================
ob_start();
session_start();
require_once 'conexao.php';
ob_clean();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// -------- CRIAR manifestação --------
if ($method === 'POST' && $action === 'criar') {
    $anonimo   = !empty($_POST['anonimo']) ? 1 : 0;
    $tipo      = trim($_POST['tipo']      ?? '');
    $assunto   = trim($_POST['assunto']   ?? '');
    $descricao = trim($_POST['descricao'] ?? '');

    // Validação básica
    $tiposValidos = ['Reclamação', 'Sugestão', 'Denúncia', 'Elogio'];
    if (!in_array($tipo, $tiposValidos) || !$assunto || !$descricao) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Dados inválidos. Preencha todos os campos.']);
        exit;
    }

    // Protocolo único: ANO + 6 dígitos aleatórios
    $protocolo = date('Y') . str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT);

    $usuario_id = (!$anonimo && !empty($_SESSION['usuario_id']))
        ? (int) $_SESSION['usuario_id']
        : null;

    $pdo  = conectar();
    $stmt = $pdo->prepare(
        "INSERT INTO manifestacoes (protocolo, usuario_id, tipo, assunto, descricao, anonimo)
         VALUES (:protocolo, :usuario_id, :tipo, :assunto, :descricao, :anonimo)"
    );
    $stmt->execute([
        ':protocolo'  => $protocolo,
        ':usuario_id' => $usuario_id,
        ':tipo'       => $tipo,
        ':assunto'    => $assunto,
        ':descricao'  => $descricao,
        ':anonimo'    => $anonimo,
    ]);

    echo json_encode([
        'status'    => 'ok',
        'protocolo' => $protocolo,
        'mensagem'  => 'Manifestação registrada com sucesso!',
    ]);
    exit;
}

// -------- LISTAR (do usuário logado) --------
if ($method === 'GET' && $action === 'listar') {
    if (empty($_SESSION['usuario_id'])) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Não autenticado.']);
        exit;
    }

    $pdo  = conectar();
    $stmt = $pdo->prepare(
        "SELECT protocolo, tipo, assunto, status,
                DATE_FORMAT(criado_em, '%d/%m/%Y') AS data
         FROM manifestacoes
         WHERE usuario_id = :uid
         ORDER BY criado_em DESC"
    );
    $stmt->execute([':uid' => $_SESSION['usuario_id']]);
    $lista = $stmt->fetchAll();

    echo json_encode(['status' => 'ok', 'manifestacoes' => $lista]);
    exit;
}

// -------- BUSCAR por protocolo (público) --------
if ($method === 'GET' && $action === 'buscar') {
    $protocolo = trim($_GET['protocolo'] ?? '');

    if (!$protocolo) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Informe o número do protocolo.']);
        exit;
    }

    $pdo  = conectar();
    $stmt = $pdo->prepare(
        "SELECT protocolo, tipo, assunto, status,
                DATE_FORMAT(criado_em, '%d/%m/%Y') AS data,
                DATE_FORMAT(atualizado_em, '%d/%m/%Y %H:%i') AS atualizado_em
         FROM manifestacoes
         WHERE protocolo = :p
         LIMIT 1"
    );
    $stmt->execute([':p' => $protocolo]);
    $m = $stmt->fetch();

    if ($m) {
        // Respostas vinculadas
        $r = $pdo->prepare(
            "SELECT autor, texto, DATE_FORMAT(criado_em,'%d/%m/%Y %H:%i') AS data
             FROM respostas WHERE manifestacao_id =
             (SELECT id FROM manifestacoes WHERE protocolo = :p)
             ORDER BY criado_em"
        );
        $r->execute([':p' => $protocolo]);
        $m['respostas'] = $r->fetchAll();

        echo json_encode(['status' => 'ok', 'manifestacao' => $m]);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Protocolo não encontrado.']);
    }
    exit;
}

// -------- ESTATÍSTICAS (dashboard) --------
if ($method === 'GET' && $action === 'stats') {
    if (empty($_SESSION['usuario_id'])) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Não autenticado.']);
        exit;
    }

    $pdo  = conectar();
    $uid  = (int) $_SESSION['usuario_id'];

    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*) AS total,
            SUM(status NOT IN ('Concluído','Arquivado')) AS ativas,
            SUM(status IN ('Concluído','Arquivado'))     AS concluidas
         FROM manifestacoes WHERE usuario_id = :uid"
    );
    $stmt->execute([':uid' => $uid]);
    $stats = $stmt->fetch();

    echo json_encode(['status' => 'ok', 'stats' => $stats]);
    exit;
}

echo json_encode(['status' => 'erro', 'mensagem' => 'Ação desconhecida.']);
