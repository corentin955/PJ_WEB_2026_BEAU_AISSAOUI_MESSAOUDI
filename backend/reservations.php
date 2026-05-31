<?php
require_once 'database.php';

$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list': handleList(); break;
    case 'create': handleCreate(); break;
    case 'annuler': handleAnnuler($id); break;
    case 'supprimer': handleSupprimer($id); break;
    case 'panier_list': handlePanierList(); break;
    case 'panier_add': handlePanierAdd(); break;
    case 'panier_remove': handlePanierRemove($id); break;
    case 'panier_valider': handlePanierValider(); break;
    case 'repondre_proposition': handleRepondreProposition(); break;
    default: errorResponse('Action non trouvée', 404);
}

function handleList() {
    $userId = requireAuth();
    $db = getDB();
    
    $sql = "SELECT r.*, s.nom_praticien, s.titre, s.lieu, s.prix as service_prix, 
                   s.duree, s.image_url, c.nom as categorie_nom, c.couleur as categorie_couleur
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            JOIN categories_services c ON s.categorie_id = c.id
            WHERE r.utilisateur_id = ?
            ORDER BY r.date_reservation DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function handleCreate() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $service_id = intval($data['service_id'] ?? 0);
    $date = sanitize($data['date_reservation'] ?? '');
    $heure = sanitize($data['heure_reservation'] ?? '');
    $notes = sanitize($data['notes_patient'] ?? '');
    
    if (!$service_id || !$date || !$heure) errorResponse('Champs obligatoires manquants');
    
    // Vérifier disponibilité
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM reservations WHERE service_id = ? AND date_reservation = ? AND heure_reservation = ? AND statut NOT IN ('annulee')");
    $stmt->execute([$service_id, $date, $heure]);
    if ($stmt->fetch()) errorResponse('Ce créneau n\'est plus disponible');
    
    // Récupérer prix
    $stmt = $db->prepare("SELECT prix FROM services WHERE id = ?");
    $stmt->execute([$service_id]);
    $service = $stmt->fetch();
    if (!$service) errorResponse('Service introuvable');
    
    $stmt = $db->prepare("INSERT INTO reservations (utilisateur_id, service_id, date_reservation, heure_reservation, notes_patient, prix_paye, statut) VALUES (?, ?, ?, ?, ?, ?, 'confirmee')");
    $stmt->execute([$userId, $service_id, $date, $heure, $notes, $service['prix']]);
    
    $reservationId = $db->lastInsertId();

    // Notification praticien propriétaire du service
    $stmt = $db->prepare("SELECT utilisateur_id, titre FROM services WHERE id = ?");
    $stmt->execute([$service_id]);
    $serviceRow = $stmt->fetch();
    if ($serviceRow && $serviceRow['utilisateur_id']) {
        $stmt = $db->prepare("SELECT prenom, nom FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $patient = $stmt->fetch();
        $praticienMessage = $patient['prenom'] . ' ' . $patient['nom'] . ' a demandé un RDV pour "' . $serviceRow['titre'] . '" le ' . $date . ' a ' . $heure;
        $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Nouveau rendez-vous', ?, 'reservation')");
        $stmt->execute([$serviceRow['utilisateur_id'], $praticienMessage]);
    }

    // Notification patient
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Réservation confirmée', ?, 'reservation')");
    $stmt->execute([$userId, "Votre réservation du $date à $heure est confirmée."]);
    
    jsonResponse(['success' => true, 'id' => $reservationId, 'message' => 'Réservation confirmée'], 201);
}

function handleAnnuler($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    if (!$id) errorResponse('ID requis');
    
    $db = getDB();
    $stmt = $db->prepare("UPDATE reservations SET statut = 'annulee' WHERE id = ? AND utilisateur_id = ? AND statut NOT IN ('annulee', 'terminee')");
    $stmt->execute([$id, $userId]);
    
    if ($stmt->rowCount() === 0) errorResponse('Réservation introuvable ou déjà annulée');
    
    // Notification
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Réservation annulée', 'Votre réservation a été annulée.', 'annulation')");
    $stmt->execute([$userId]);
    
    jsonResponse(['success' => true, 'message' => 'Réservation annulée']);
}

function handleSupprimer($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    if (!$id) errorResponse('ID requis');
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM reservations WHERE id = ? AND utilisateur_id = ? AND statut = 'annulee'");
    $stmt->execute([$id, $userId]);
    if ($stmt->rowCount() === 0) errorResponse('Réservation introuvable ou non supprimable', 403);
    jsonResponse(['success' => true]);
}

function handlePanierList() {
    $userId = requireAuth();
    $db = getDB();
    $sql = "SELECT p.*, s.nom_praticien, s.titre, s.prix, s.duree, s.lieu, s.image_url, c.nom as categorie_nom, c.couleur as categorie_couleur
            FROM panier p
            JOIN services s ON p.service_id = s.id
            JOIN categories_services c ON s.categorie_id = c.id
            WHERE p.utilisateur_id = ?
            ORDER BY p.date_ajout DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    $total = array_sum(array_column($items, 'prix'));
    jsonResponse(['success' => true, 'data' => $items, 'total' => $total]);
}

function handlePanierAdd() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $service_id = intval($data['service_id'] ?? 0);
    $date = sanitize($data['date_souhaitee'] ?? '');
    $heure = sanitize($data['heure_souhaitee'] ?? '');
    if (!$service_id) errorResponse('Service ID requis');
    
    $db = getDB();
    // Eviter doublon
    $stmt = $db->prepare("SELECT id FROM panier WHERE utilisateur_id = ? AND service_id = ?");
    $stmt->execute([$userId, $service_id]);
    if ($stmt->fetch()) errorResponse('Service déjà dans le panier');
    
    $stmt = $db->prepare("INSERT INTO panier (utilisateur_id, service_id, date_souhaitee, heure_souhaitee) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $service_id, $date ?: null, $heure ?: null]);
    jsonResponse(['success' => true, 'message' => 'Ajouté au panier'], 201);
}

function handlePanierRemove($id) {
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    if (!$id) errorResponse('ID requis');
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM panier WHERE id = ? AND utilisateur_id = ?");
    $stmt->execute([$id, $userId]);
    jsonResponse(['success' => true, 'message' => 'Supprimé du panier']);
}

function handlePanierValider() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $db = getDB();
    
    // Récupérer le panier
    $stmt = $db->prepare("SELECT p.*, s.prix FROM panier p JOIN services s ON p.service_id = s.id WHERE p.utilisateur_id = ?");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    
    if (empty($items)) errorResponse('Panier vide');
    
    $reservations = [];
    foreach ($items as $item) {
        $date = $item['date_souhaitee'] ?? date('Y-m-d', strtotime('+1 week'));
        $heure = $item['heure_souhaitee'] ?? '10:00:00';
        
        $stmtInsert = $db->prepare("INSERT INTO reservations (utilisateur_id, service_id, date_reservation, heure_reservation, prix_paye, statut) VALUES (?, ?, ?, ?, ?, 'confirmee')");
        $stmtInsert->execute([$userId, $item['service_id'], $date, $heure, $item['prix']]);
        $reservations[] = $db->lastInsertId();
    }
    
    // Vider le panier
    $stmt = $db->prepare("DELETE FROM panier WHERE utilisateur_id = ?");
    $stmt->execute([$userId]);
    
    // Notification
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Paiement validé', ?, 'reservation')");
    $stmt->execute([$userId, count($items) . " réservation(s) confirmée(s) avec succès."]);
    
    jsonResponse(['success' => true, 'reservations' => $reservations, 'message' => 'Réservations confirmées']);
}

function handleRepondreProposition() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();

    $data         = json_decode(file_get_contents('php://input'), true);
    $propositionId = intval($data['proposition_id'] ?? 0);
    $reponse       = $data['reponse'] ?? '';

    if (!$propositionId) errorResponse('proposition_id requis');
    if (!in_array($reponse, ['acceptee', 'refusee'])) errorResponse('reponse invalide (acceptee | refusee)');

    $db = getDB();

    $stmt = $db->prepare("SELECT * FROM propositions_creneau WHERE id = ?");
    $stmt->execute([$propositionId]);
    $proposition = $stmt->fetch();

    if (!$proposition) errorResponse('Proposition introuvable', 404);

    // Vérifie que la réservation appartient au patient connecté
    $stmt = $db->prepare("SELECT utilisateur_id FROM reservations WHERE id = ?");
    $stmt->execute([$proposition['reservation_id']]);
    $reservation = $stmt->fetch();

    if (!$reservation || intval($reservation['utilisateur_id']) !== $userId) errorResponse('Accès non autorisé', 403);

    $stmt = $db->prepare("UPDATE propositions_creneau SET statut = ? WHERE id = ?");
    $stmt->execute([$reponse, $propositionId]);

    if ($reponse === 'acceptee') {
        $stmt = $db->prepare("
            UPDATE reservations
            SET date_reservation  = ?,
                heure_reservation = ?,
                statut            = 'confirmee'
            WHERE id = ?
        ");
        $stmt->execute([$proposition['nouvelle_date'], $proposition['nouvelle_heure'], $proposition['reservation_id']]);

        $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Creneau accepte', 'Le patient a accepté votre proposition de créneau.', 'reservation')");
        $stmt->execute([$proposition['praticien_id']]);
    } else {
        $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Creneau refuse', 'Le patient a refusé votre proposition de créneau.', 'annulation')");
        $stmt->execute([$proposition['praticien_id']]);
    }

    // Notification patient dans les deux cas
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Reponse envoyee', 'Votre réponse a bien été transmise au praticien.', 'info')");
    $stmt->execute([$userId]);

    jsonResponse(['success' => true, 'message' => 'Réponse enregistrée']);
}
