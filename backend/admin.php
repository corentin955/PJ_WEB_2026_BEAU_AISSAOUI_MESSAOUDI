<?php
require_once 'database.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'stats':          handleStats();         break;
    case 'utilisateurs':   handleUtilisateurs();  break;
    case 'update_user':    handleUpdateUser();     break;
    case 'services':       handleServices();       break;
    case 'update_service': handleUpdateService();  break;
    default: errorResponse('Action non trouvée', 404);
}

// ── GET stats ─────────────────────────────────────────────────────────────────

function handleStats() {
    requireRole('admin');
    $db = getDB();

    $totalUtilisateurs = (int) $db
        ->query("SELECT COUNT(*) FROM users WHERE role != 'admin'")
        ->fetchColumn();

    $totalReservations = (int) $db
        ->query("SELECT COUNT(*) FROM reservations")
        ->fetchColumn();

    $totalServices = (int) $db
        ->query("SELECT COUNT(*) FROM services WHERE actif = 1")
        ->fetchColumn();

    $chiffreAffaires = (float) $db
        ->query("SELECT COALESCE(SUM(prix_paye), 0) FROM reservations WHERE statut = 'confirmee'")
        ->fetchColumn();

    jsonResponse([
        'success' => true,
        'data' => [
            'total_utilisateurs' => $totalUtilisateurs,
            'total_reservations' => $totalReservations,
            'total_services'     => $totalServices,
            'chiffre_affaires'   => $chiffreAffaires,
        ]
    ]);
}

// ── GET utilisateurs ──────────────────────────────────────────────────────────

function handleUtilisateurs() {
    requireRole('admin');
    $db = getDB();

    $sql = "SELECT id, prenom, nom, email, role, actif, date_inscription
            FROM users
            WHERE role != 'admin'";

    $params = [];
    $roleFilter = $_GET['role'] ?? '';
    if (in_array($roleFilter, ['patient', 'praticien'], true)) {
        $sql .= " AND role = :role";
        $params[':role'] = $roleFilter;
    }

    $sql .= " ORDER BY date_inscription DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $users]);
}

// ── POST update_user ──────────────────────────────────────────────────────────

function handleUpdateUser() {
    requireRole('admin');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Méthode non autorisée', 405);
    }

    $body   = json_decode(file_get_contents('php://input'), true);
    $userId = isset($body['user_id']) ? (int) $body['user_id'] : 0;
    $action = $body['action'] ?? '';

    if (!$userId || !in_array($action, ['activer', 'suspendre', 'supprimer'], true)) {
        errorResponse('Paramètres invalides');
    }

    $db = getDB();

    // Vérifier que la cible n'est pas un admin
    $stmt = $db->prepare("SELECT role FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $target = $stmt->fetch();

    if (!$target) {
        errorResponse('Utilisateur introuvable', 404);
    }
    if ($target['role'] === 'admin') {
        errorResponse('Impossible de modifier un compte administrateur', 403);
    }

    if ($action === 'supprimer') {
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id AND role != 'admin'");
        $stmt->execute([':id' => $userId]);
        if ($stmt->rowCount() === 0) {
            errorResponse('Suppression échouée : utilisateur introuvable ou protégé', 400);
        }
        jsonResponse(['success' => true, 'message' => 'Utilisateur supprimé']);
    } else {
        $actif = $action === 'activer' ? 1 : 0;
        $db->prepare("UPDATE users SET actif = :actif WHERE id = :id")
           ->execute([':actif' => $actif, ':id' => $userId]);
    }

    jsonResponse(['success' => true]);
}

// ── GET services ──────────────────────────────────────────────────────────────

function handleServices() {
    requireRole('admin');
    $db = getDB();

    $stmt = $db->query(
        "SELECT s.id, s.titre, s.prix, s.actif,
                u.prenom, u.nom,
                c.nom AS categorie
         FROM services s
         JOIN users u ON s.utilisateur_id = u.id
         JOIN categories_services c ON s.categorie_id = c.id
         ORDER BY s.id DESC"
    );

    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

// ── POST update_service ───────────────────────────────────────────────────────

function handleUpdateService() {
    requireRole('admin');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Méthode non autorisée', 405);
    }

    $body      = json_decode(file_get_contents('php://input'), true);
    $serviceId = isset($body['service_id']) ? (int) $body['service_id'] : 0;
    $action    = $body['action'] ?? '';

    if (!$serviceId || !in_array($action, ['activer', 'suspendre', 'supprimer'], true)) {
        errorResponse('Paramètres invalides');
    }

    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM services WHERE id = :id");
    $stmt->execute([':id' => $serviceId]);
    if (!$stmt->fetch()) {
        errorResponse('Service introuvable', 404);
    }

    if ($action === 'supprimer') {
        $db->prepare("DELETE FROM services WHERE id = :id")->execute([':id' => $serviceId]);
    } else {
        $actif = $action === 'activer' ? 1 : 0;
        $db->prepare("UPDATE services SET actif = :actif WHERE id = :id")
           ->execute([':actif' => $actif, ':id' => $serviceId]);
    }

    jsonResponse(['success' => true]);
}
