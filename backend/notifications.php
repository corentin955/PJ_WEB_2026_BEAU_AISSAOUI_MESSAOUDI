<?php
// notifications.php
require_once 'database.php';

$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list': handleList(); break;
    case 'mark_read': handleMarkRead($id); break;
    case 'mark_all_read': handleMarkAllRead(); break;
    case 'supprimer': handleSupprimer($id); break;
    default: errorResponse('Action non trouvée', 404);
}

function handleList() {
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY date_creation DESC LIMIT 20");
    $stmt->execute([$userId]);
    $notifs = $stmt->fetchAll();
    $unread = count(array_filter($notifs, fn($n) => !$n['lu']));
    jsonResponse(['success' => true, 'data' => $notifs, 'unread' => $unread]);
}

function handleMarkRead($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    if (!$id) errorResponse('ID requis');
    $db = getDB();
    $stmt = $db->prepare("UPDATE notifications SET lu = TRUE WHERE id = ? AND utilisateur_id = ?");
    $stmt->execute([$id, $userId]);
    jsonResponse(['success' => true]);
}

function handleMarkAllRead() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare("UPDATE notifications SET lu = TRUE WHERE utilisateur_id = ?");
    $stmt->execute([$userId]);
    jsonResponse(['success' => true]);
}

function handleSupprimer($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    if (!$id) errorResponse('ID requis');
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM notifications WHERE id = ? AND utilisateur_id = ?");
    $stmt->execute([$id, $userId]);
    if ($stmt->rowCount() === 0) errorResponse('Notification introuvable', 404);
    jsonResponse(['success' => true]);
}
