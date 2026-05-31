<?php
require_once 'database.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'agenda':           handleAgenda();          break;
    case 'update_statut':    handleUpdateStatut();    break;
    case 'proposer_creneau': handleProposerCreneau(); break;
    case 'mes_services':     handleMesServices();     break;
    case 'profil_patient':   handleProfilPatient();   break;
    default:
        errorResponse('Action non trouvée', 404);
}

function handleAgenda() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Méthode non autorisée', 405);
    requireRole('praticien');
    $userId = $_SESSION['user_id'];

    $params = [$userId];
    $statutFilter = '';
    if (!empty($_GET['statut'])) {
        $allowed = ['en_attente', 'confirmee', 'annulee', 'terminee'];
        if (!in_array($_GET['statut'], $allowed)) errorResponse('Statut invalide');
        $statutFilter = 'AND r.statut = ?';
        $params[] = $_GET['statut'];
    }

    $db = getDB();
    $stmt = $db->prepare("
        SELECT
            r.id,
            r.utilisateur_id AS patient_id,
            r.date_reservation,
            r.heure_reservation,
            r.statut,
            r.notes_patient,
            p.prenom             AS patient_prenom,
            p.nom                AS patient_nom,
            p.email              AS patient_email,
            p.telephone          AS patient_telephone,
            p.poids              AS patient_poids,
            p.taille             AS patient_taille,
            p.historique_sportif AS patient_historique_sportif,
            s.titre              AS service_titre,
            s.id                 AS service_id,
            pc.id                AS proposition_id,
            pc.nouvelle_date,
            pc.nouvelle_heure,
            pc.message           AS proposition_message
        FROM reservations r
        JOIN services  s  ON r.service_id     = s.id
        JOIN users     p  ON r.utilisateur_id = p.id
        LEFT JOIN propositions_creneau pc ON pc.reservation_id = r.id AND pc.statut = 'en_attente'
        WHERE s.utilisateur_id = ?
        $statutFilter
        ORDER BY r.date_reservation ASC, r.heure_reservation ASC
    ");
    $stmt->execute($params);

    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function handleUpdateStatut() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    requireRole('praticien');
    $userId = $_SESSION['user_id'];

    $data          = json_decode(file_get_contents('php://input'), true);
    $reservationId = intval($data['reservation_id'] ?? 0);
    $statut        = $data['statut'] ?? '';

    if (!$reservationId) errorResponse('reservation_id requis');
    if (!in_array($statut, ['confirmee', 'annulee'])) errorResponse('Statut invalide (confirmee | annulee)');

    $db = getDB();

    $stmt = $db->prepare("
        SELECT r.id, r.utilisateur_id AS patient_id, p.prenom, p.nom, s.titre AS service_titre
        FROM reservations r
        JOIN services s ON r.service_id = s.id
        JOIN users    p ON r.utilisateur_id = p.id
        WHERE r.id = ? AND s.utilisateur_id = ?
    ");
    $stmt->execute([$reservationId, $userId]);
    $reservation = $stmt->fetch();

    if (!$reservation) errorResponse('Réservation introuvable ou accès non autorisé', 403);

    $stmt = $db->prepare("UPDATE reservations SET statut = ? WHERE id = ?");
    $stmt->execute([$statut, $reservationId]);

    // Notification patient
    if ($statut === 'confirmee') {
        $patientTitre   = 'RDV confirmé';
        $patientMessage = 'Votre rendez-vous a été confirmé.';
        $patientType    = 'reservation';
        $actionLabel    = 'confirmé';
    } else {
        $patientTitre   = 'RDV annulé';
        $patientMessage = 'Votre rendez-vous a été annulé.';
        $patientType    = 'annulation';
        $actionLabel    = 'annulé';
    }

    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, ?, ?, ?)");
    $stmt->execute([$reservation['patient_id'], $patientTitre, $patientMessage, $patientType]);

    // Notification praticien
    $praticienMessage = 'Vous avez ' . $actionLabel . ' le RDV de ' . $reservation['prenom'] . ' ' . $reservation['nom'] . '.';
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Action effectuée', ?, 'info')");
    $stmt->execute([$userId, $praticienMessage]);

    jsonResponse(['success' => true, 'message' => 'Statut mis à jour']);
}

function handleProposerCreneau() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    requireRole('praticien');
    $userId = $_SESSION['user_id'];

    $data          = json_decode(file_get_contents('php://input'), true);
    $reservationId = intval($data['reservation_id'] ?? 0);
    $nouvelleDate  = $data['nouvelle_date']  ?? '';
    $nouvelleHeure = $data['nouvelle_heure'] ?? '';
    $message       = $data['message'] ?? '';

    if (!$reservationId || !$nouvelleDate || !$nouvelleHeure) errorResponse('reservation_id, nouvelle_date et nouvelle_heure sont requis');

    $db = getDB();

    $stmt = $db->prepare("
        SELECT r.id, r.utilisateur_id AS patient_id
        FROM reservations r
        JOIN services s ON r.service_id = s.id
        WHERE r.id = ? AND s.utilisateur_id = ?
    ");
    $stmt->execute([$reservationId, $userId]);
    $reservation = $stmt->fetch();

    if (!$reservation) errorResponse('Réservation introuvable ou accès non autorisé', 403);

    $stmt = $db->prepare("
        INSERT INTO propositions_creneau (reservation_id, praticien_id, nouvelle_date, nouvelle_heure, message)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$reservationId, $userId, $nouvelleDate, $nouvelleHeure, $message]);

    $notifMessage = 'Le praticien vous propose le ' . $nouvelleDate . ' a ' . $nouvelleHeure . '.' . ($message ? ' ' . $message : '');
    $stmt = $db->prepare("INSERT INTO notifications (utilisateur_id, titre, message, type) VALUES (?, 'Nouveau creneau propose', ?, 'decalage')");
    $stmt->execute([$reservation['patient_id'], $notifMessage]);

    jsonResponse(['success' => true, 'message' => 'Proposition envoyée'], 201);
}

function handleMesServices() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Méthode non autorisée', 405);
    requireRole('praticien');
    $userId = $_SESSION['user_id'];

    $db = getDB();
    $stmt = $db->prepare("
        SELECT s.*, c.nom AS categorie_nom, c.icone, c.couleur
        FROM services s
        JOIN categories_services c ON s.categorie_id = c.id
        WHERE s.utilisateur_id = ? AND s.actif = TRUE
        ORDER BY s.date_creation DESC
    ");
    $stmt->execute([$userId]);

    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function handleProfilPatient() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Méthode non autorisée', 405);
    requireRole('praticien');
    $userId    = $_SESSION['user_id'];
    $patientId = intval($_GET['patient_id'] ?? 0);

    if (!$patientId) errorResponse('patient_id requis');

    $db = getDB();

    // Vérifie qu'une relation praticien-patient existe
    $stmt = $db->prepare("
        SELECT COUNT(*) FROM reservations r
        JOIN services s ON r.service_id = s.id
        WHERE r.utilisateur_id = ? AND s.utilisateur_id = ?
    ");
    $stmt->execute([$patientId, $userId]);
    if ($stmt->fetchColumn() == 0) errorResponse('Accès non autorisé', 403);

    $stmt = $db->prepare("
        SELECT prenom, nom, email, telephone, poids, taille, historique_sportif
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch();

    if (!$patient) errorResponse('Patient introuvable', 404);

    $stmt = $db->prepare("
        SELECT r.date_reservation, r.heure_reservation, r.statut, s.titre AS service_titre
        FROM reservations r
        JOIN services s ON r.service_id = s.id
        WHERE r.utilisateur_id = ? AND s.utilisateur_id = ?
        ORDER BY r.date_reservation DESC, r.heure_reservation DESC
    ");
    $stmt->execute([$patientId, $userId]);
    $patient['historique'] = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $patient]);
}
