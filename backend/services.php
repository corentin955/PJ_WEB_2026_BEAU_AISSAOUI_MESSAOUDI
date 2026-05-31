<?php
require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list':
        handleList();
        break;
    case 'get':
        handleGet($id);
        break;
    case 'create':
        handleCreate();
        break;
    case 'categories':
        handleCategories();
        break;
    case 'disponibilites':
        handleDisponibilites($id);
        break;
    case 'delete':
        handleDelete($id);
        break;
    default:
        errorResponse('Action non trouvée', 404);
}

function handleList() {
    $db = getDB();
    
    $where = ['s.actif = TRUE'];
    $params = [];
    
    if (!empty($_GET['categorie_id'])) {
        $where[] = 's.categorie_id = ?';
        $params[] = intval($_GET['categorie_id']);
    }
    if (!empty($_GET['prix_min'])) {
        $where[] = 's.prix >= ?';
        $params[] = floatval($_GET['prix_min']);
    }
    if (!empty($_GET['prix_max'])) {
        $where[] = 's.prix <= ?';
        $params[] = floatval($_GET['prix_max']);
    }
    if (!empty($_GET['search'])) {
        $where[] = '(s.nom_praticien LIKE ? OR s.description LIKE ? OR s.lieu LIKE ?)';
        $searchTerm = '%' . $_GET['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $orderBy = 'ORDER BY s.note_moyenne DESC';
    if (!empty($_GET['sort'])) {
        switch ($_GET['sort']) {
            case 'prix_asc': $orderBy = 'ORDER BY s.prix ASC'; break;
            case 'prix_desc': $orderBy = 'ORDER BY s.prix DESC'; break;
            case 'duree': $orderBy = 'ORDER BY s.duree ASC'; break;
            case 'note': $orderBy = 'ORDER BY s.note_moyenne DESC'; break;
        }
    }
    
    $whereClause = implode(' AND ', $where);
    $sql = "SELECT s.*, c.nom as categorie_nom, c.icone as categorie_icone, c.couleur as categorie_couleur
            FROM services s
            JOIN categories_services c ON s.categorie_id = c.id
            WHERE $whereClause
            $orderBy";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $services = $stmt->fetchAll();
    
    jsonResponse(['success' => true, 'data' => $services]);
}

function handleGet($id) {
    if (!$id) errorResponse('ID requis');
    $db = getDB();
    
    $stmt = $db->prepare("SELECT s.*, c.nom as categorie_nom, c.icone as categorie_icone, c.couleur as categorie_couleur
        FROM services s
        JOIN categories_services c ON s.categorie_id = c.id
        WHERE s.id = ? AND s.actif = TRUE");
    $stmt->execute([$id]);
    $service = $stmt->fetch();
    
    if (!$service) errorResponse('Service non trouvé', 404);
    
    // Avis
    $stmt = $db->prepare("SELECT a.*, u.prenom, u.nom FROM avis a JOIN users u ON a.utilisateur_id = u.id WHERE a.service_id = ? ORDER BY a.date_creation DESC LIMIT 5");
    $stmt->execute([$id]);
    $service['avis'] = $stmt->fetchAll();
    
    jsonResponse(['success' => true, 'data' => $service]);
}

function handleCreate() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $categorie_id = intval($data['categorie_id'] ?? 0);
    $nom_praticien = sanitize($data['nom_praticien'] ?? '');
    $titre = sanitize($data['titre'] ?? '');
    $description = sanitize($data['description'] ?? '');
    $prix = floatval($data['prix'] ?? 0);
    $duree = intval($data['duree'] ?? 0);
    $lieu = sanitize($data['lieu'] ?? '');
    $adresse = sanitize($data['adresse'] ?? '');
    $image_url = sanitize($data['image_url'] ?? '');
    
    if (!$categorie_id || !$nom_praticien || !$prix || !$duree || !$lieu) {
        errorResponse('Champs obligatoires manquants');
    }
    
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO services (utilisateur_id, categorie_id, nom_praticien, titre, description, prix, duree, lieu, adresse, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $categorie_id, $nom_praticien, $titre, $description, $prix, $duree, $lieu, $adresse, $image_url]);
    
    $serviceId = $db->lastInsertId();
    
    // Notification admin
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (1, 'Nouveau service proposé', ?, 'nouveau_service')");
    $stmt->execute(["$nom_praticien a proposé un nouveau service : $titre"]);
    
    jsonResponse(['success' => true, 'id' => $serviceId, 'message' => 'Service créé avec succès'], 201);
}

function handleDelete($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();

    $id     = (int) $id;
    $userId = (int) $userId;

    if (!$id) errorResponse('ID requis');

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM services WHERE id = ? AND utilisateur_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) errorResponse('Service introuvable ou accès non autorisé', 403);

    error_log("[VitaCare] handleDelete: suppression service id=$id pour utilisateur_id=$userId");

    $stmt = $db->prepare('DELETE FROM services WHERE id = ? AND utilisateur_id = ?');
    $stmt->execute([$id, $userId]);

    error_log("[VitaCare] handleDelete: service id=$id supprimé (" . $stmt->rowCount() . " ligne(s) affectée(s))");

    jsonResponse(['success' => true, 'message' => 'Service supprimé']);
}

function handleCategories() {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM categories_services ORDER BY nom");
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function handleDisponibilites($id) {
    if (!$id) errorResponse('ID service requis');
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM disponibilites WHERE service_id = ?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}
