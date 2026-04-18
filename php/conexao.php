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
define('DB_PORT', '3306');

function conectar(): PDO {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Limpa qualquer output anterior e retorna erro JSON limpo
        if (ob_get_level()) ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status'   => 'erro',
            'mensagem' => 'Falha na conexão com o banco de dados.',
            // Descomente abaixo apenas em desenvolvimento para depurar:
            // 'detalhe' => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
// NOTA: Headers Content-Type são definidos individualmente em cada endpoint
// para evitar conflitos com ob_start/ob_end_clean.
