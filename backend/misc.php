<?php
require_once 'database.php';

$endpoint = $_GET['endpoint'] ?? 'faq';

if ($endpoint === 'faq') {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM faq WHERE actif = TRUE ORDER BY ordre ASC");
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
} elseif ($endpoint === 'contact') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $nom = sanitize($data['nom'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $sujet = sanitize($data['sujet'] ?? '');
    $message = sanitize($data['message'] ?? '');
    
    if (!$nom || !$email || !$message) errorResponse('Champs obligatoires manquants');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');
    
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO messages_contact (nom, email, sujet, message) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nom, $email, $sujet, $message]);
    
    jsonResponse(['success' => true, 'message' => 'Message envoyé avec succès. Nous vous répondrons dans les 24h.']);
} else {
    errorResponse('Endpoint inconnu', 404);
}
