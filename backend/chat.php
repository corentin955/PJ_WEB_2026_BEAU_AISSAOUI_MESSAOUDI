<?php
/**
 * VitaCare — Controller Chat
 * Messagerie patient <-> praticien
 *
 * Endpoints :
 *  GET  chat.php?action=conversations         → liste des conversations
 *  GET  chat.php?action=messages&with=:id     → messages avec un utilisateur
 *  POST chat.php?action=send                  → envoyer un message
 *  POST chat.php?action=markRead&with=:id     → marquer comme lu
 */

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$withId = isset($_GET['with']) ? intval($_GET['with']) : null;

switch ($action) {
    case 'conversations': handleConversations(); break;
    case 'messages':      handleMessages($withId); break;
    case 'send':          handleSend(); break;
    case 'markRead':      handleMarkRead($withId); break;
    default:              errorResponse('Action non trouvée', 404);
}

/**
 * Retourne la liste des conversations de l'utilisateur connecté.
 * Une conversation = le dernier message échangé avec chaque interlocuteur.
 */
function handleConversations() {
    $userId = requireAuth();
    $db = getDB();

    $stmt = $db->prepare("
        SELECT
            u.id            AS interlocuteur_id,
            u.prenom        AS interlocuteur_prenom,
            u.nom           AS interlocuteur_nom,
            u.role          AS interlocuteur_role,
            u.avatar        AS interlocuteur_avatar,
            m.message       AS dernier_message,
            m.date_envoi    AS derniere_activite,
            m.expediteur_id AS dernier_expediteur_id,
            SUM(CASE WHEN m2.lu = FALSE AND m2.destinataire_id = ? THEN 1 ELSE 0 END) AS non_lus
        FROM (
            SELECT
                CASE WHEN expediteur_id = ? THEN destinataire_id ELSE expediteur_id END AS interlocuteur,
                MAX(id) AS last_id
            FROM messages_chat
            WHERE expediteur_id = ? OR destinataire_id = ?
            GROUP BY interlocuteur
        ) AS convs
        JOIN messages_chat m  ON m.id = convs.last_id
        JOIN users u          ON u.id = convs.interlocuteur
        LEFT JOIN messages_chat m2
            ON (m2.expediteur_id = convs.interlocuteur AND m2.destinataire_id = ?)
        GROUP BY u.id, m.id
        ORDER BY m.date_envoi DESC
    ");

    $stmt->execute([$userId, $userId, $userId, $userId, $userId]);
    $conversations = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $conversations]);
}

/**
 * Retourne les messages échangés entre l'utilisateur connecté et :withId.
 */
function handleMessages($withId) {
    if (!$withId) errorResponse('Paramètre "with" requis');
    $userId = requireAuth();
    $db = getDB();

    // Vérifier que l'interlocuteur existe
    $stmt = $db->prepare("SELECT id, prenom, nom, role, avatar FROM users WHERE id = ? AND actif = TRUE");
    $stmt->execute([$withId]);
    $interlocuteur = $stmt->fetch();
    if (!$interlocuteur) errorResponse('Utilisateur introuvable', 404);

    // Récupérer les messages
    $stmt = $db->prepare("
        SELECT m.*, u.prenom AS exp_prenom, u.nom AS exp_nom
        FROM messages_chat m
        JOIN users u ON u.id = m.expediteur_id
        WHERE (m.expediteur_id = ? AND m.destinataire_id = ?)
           OR (m.expediteur_id = ? AND m.destinataire_id = ?)
        ORDER BY m.date_envoi ASC
        LIMIT 100
    ");
    $stmt->execute([$userId, $withId, $withId, $userId]);
    $messages = $stmt->fetchAll();

    jsonResponse([
        'success'       => true,
        'interlocuteur' => $interlocuteur,
        'data'          => $messages,
    ]);
}

/**
 * Envoie un message.
 * Body JSON : { destinataire_id: int, message: string }
 */
function handleSend() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();

    $data           = json_decode(file_get_contents('php://input'), true);
    $destinataireId = intval($data['destinataire_id'] ?? 0);
    $message        = trim($data['message'] ?? '');

    if (!$destinataireId)    errorResponse('Destinataire requis');
    if ($destinataireId === $userId) errorResponse('Vous ne pouvez pas vous envoyer un message');
    if (empty($message))     errorResponse('Message vide');
    if (mb_strlen($message) > 2000) errorResponse('Message trop long (max 2000 caractères)');

    $db = getDB();

    // Vérifier que le destinataire existe
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND actif = TRUE");
    $stmt->execute([$destinataireId]);
    if (!$stmt->fetch()) errorResponse('Destinataire introuvable', 404);

    // Insérer le message
    $stmt = $db->prepare("
        INSERT INTO messages_chat (expediteur_id, destinataire_id, message)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$userId, $destinataireId, $message]);
    $messageId = $db->lastInsertId();

    // Créer une notification pour le destinataire
    $stmtUser = $db->prepare("SELECT prenom, nom FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $sender = $stmtUser->fetch();

    $stmtNotif = $db->prepare("
        INSERT INTO notifications (utilisateur_id, titre, message, type)
        VALUES (?, 'Nouveau message', ?, 'info')
    ");
    $stmtNotif->execute([
        $destinataireId,
        "{$sender['prenom']} {$sender['nom']} vous a envoyé un message."
    ]);

    jsonResponse([
        'success'    => true,
        'message_id' => $messageId,
        'message'    => 'Message envoyé',
    ], 201);
}

/**
 * Marque comme lus tous les messages reçus de :withId.
 */
function handleMarkRead($withId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    if (!$withId) errorResponse('Paramètre "with" requis');
    $userId = requireAuth();
    $db = getDB();

    $stmt = $db->prepare("
        UPDATE messages_chat
        SET lu = TRUE
        WHERE expediteur_id = ? AND destinataire_id = ? AND lu = FALSE
    ");
    $stmt->execute([$withId, $userId]);

    jsonResponse(['success' => true, 'updated' => $stmt->rowCount()]);
}
