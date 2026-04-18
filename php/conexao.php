<?php
// =============================================
// CONEXÃO COM O BANCO DE DADOS VIA PDO
// EEEP Dom Walfrido Teixeira Vieira - Ouvidoria
// =============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'ouvidoria_eeep');
define('DB_USER', 'root');       // Altere conforme seu servidor
define('DB_PASS', '');           // Altere conforme seu servidor
define('DB_CHARSET', 'utf8mb4');

function conectar(): PDO {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão com o banco de dados.']);
        exit;
    }
}

// Headers padrão para todas as respostas JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
