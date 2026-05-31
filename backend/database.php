<?php
// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_NAME', 'vitacare');
define('DB_CHARSET', 'utf8mb4');

// Configuration session
define('SESSION_NAME', 'vitacare_session');
define('SESSION_LIFETIME', 3600); // 1 heure

// Configuration application
define('APP_URL', 'http://localhost/vitacare');
define('APP_ENV', 'development');

// Headers CORS pour React frontend
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion PDO
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur de connexion à la base de données']);
            exit();
        }
    }
    return $pdo;
}

// Démarrage session
session_name(SESSION_NAME);
session_start([
    'cookie_lifetime' => SESSION_LIFETIME,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

// Helper réponse JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Helper erreur
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message, 'success' => false], $statusCode);
}

// Vérification auth
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Non authentifié', 401);
    }
    return $_SESSION['user_id'];
}

// Vérification rôle (requiert une session active)
function requireRole($role) {
    requireAuth();
    if (($_SESSION['user_role'] ?? '') !== $role) {
        errorResponse('Accès refusé', 403);
    }
}

// Sanitize input
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}
