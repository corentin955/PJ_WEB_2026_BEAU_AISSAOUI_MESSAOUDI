<?php
require_once('database.php');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':           handleLogin();          break;
    case 'register':        handleRegister();       break;
    case 'logout':          handleLogout();         break;
    case 'me':              handleMe();             break;
    case 'check_role':      handleCheckRole();      break;
    case 'update_profile':  handleUpdateProfile();  break;
    case 'change_password': handleChangePassword(); break;
    case 'delete_account':  handleDeleteAccount();  break;
    default:
        errorResponse('Action non trouvée', 404);
}

function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $email = sanitize($data['email'] ?? '');
    $password = $data['mot_de_passe'] ?? '';
    
    if (!$email || !$password) errorResponse('Email et mot de passe requis');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');
    
    $db = getDB();
    $stmt = $db->prepare('SELECT id, nom, prenom, email, mot_de_passe, role, avatar FROM users WHERE email = ? AND actif = TRUE');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['mot_de_passe'])) {
        errorResponse('Email ou mot de passe incorrect', 401);
    }
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];
    
    unset($user['mot_de_passe']);
    jsonResponse(['success' => true, 'user' => $user]);
}

function handleRegister() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $nom = sanitize($data['nom'] ?? '');
    $prenom = sanitize($data['prenom'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $password = $data['mot_de_passe'] ?? '';
    $telephone = sanitize($data['telephone'] ?? '');
    $role = in_array($data['role'] ?? '', ['patient', 'praticien']) ? $data['role'] : 'patient';
    
    if (!$nom || !$prenom || !$email || !$password) errorResponse('Tous les champs obligatoires doivent être remplis');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');
    if (strlen($password) < 6) errorResponse('Le mot de passe doit faire au moins 6 caractères');
    
    $db = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) errorResponse('Cet email est déjà utilisé');
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$nom, $prenom, $email, $hashedPassword, $role, $telephone]);
    
    $userId = $db->lastInsertId();
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_role'] = $role;
    
    jsonResponse(['success' => true, 'user' => ['id' => $userId, 'nom' => $nom, 'prenom' => $prenom, 'email' => $email, 'role' => $role]], 201);
}

function handleLogout() {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Déconnecté avec succès']);
}

function handleMe() {
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare('SELECT id, nom, prenom, email, role, telephone, avatar, date_inscription,
        specialite, annees_experience, diplome, etablissement, numero_rpps,
        tarif_moyen, langues, site_web, bio, adresse_cabinet, ville, disponibilites
        FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) errorResponse('Utilisateur introuvable', 404);
    jsonResponse(['success' => true, 'user' => $user]);
}

function handleCheckRole() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $db = getDB();
    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) errorResponse('Utilisateur introuvable', 404);
    jsonResponse(['success' => true, 'role' => $user['role']]);
}

function handleUpdateProfile() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $data   = json_decode(file_get_contents('php://input'), true);
    $nom    = sanitize($data['nom']    ?? '');
    $prenom = sanitize($data['prenom'] ?? '');
    $email  = sanitize($data['email']  ?? '');
    if (!$nom || !$prenom || !$email) errorResponse('Champs obligatoires manquants');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');
    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $stmt->execute([$email, $userId]);
    if ($stmt->fetch()) errorResponse('Cet email est déjà utilisé par un autre compte');
    $stmt = $db->prepare('UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ?');
    $stmt->execute([$nom, $prenom, $email, $userId]);

    if (($_SESSION['user_role'] ?? '') === 'praticien') {
        $specialite      = sanitize($data['specialite']      ?? '') ?: null;
        $annees_exp      = (isset($data['annees_experience']) && $data['annees_experience'] !== '') ? intval($data['annees_experience']) : null;
        $diplome         = sanitize($data['diplome']         ?? '') ?: null;
        $etablissement   = sanitize($data['etablissement']   ?? '') ?: null;
        $numero_rpps     = sanitize($data['numero_rpps']     ?? '') ?: null;
        $tarif_moyen     = (isset($data['tarif_moyen']) && $data['tarif_moyen'] !== '') ? floatval($data['tarif_moyen']) : null;
        $langues         = sanitize($data['langues']         ?? '') ?: null;
        $site_web        = sanitize($data['site_web']        ?? '') ?: null;
        $bio             = sanitize($data['bio']             ?? '') ?: null;
        $adresse_cabinet = sanitize($data['adresse_cabinet'] ?? '') ?: null;
        $ville           = sanitize($data['ville']           ?? '') ?: null;
        $dispo_raw       = $data['disponibilites'] ?? null;
        $disponibilites  = $dispo_raw !== null ? json_encode($dispo_raw) : null;

        $stmt = $db->prepare('UPDATE users SET
            specialite = ?, annees_experience = ?, diplome = ?, etablissement = ?,
            numero_rpps = ?, tarif_moyen = ?, langues = ?, site_web = ?,
            bio = ?, adresse_cabinet = ?, ville = ?, disponibilites = ?
            WHERE id = ?');
        $stmt->execute([
            $specialite, $annees_exp, $diplome, $etablissement,
            $numero_rpps, $tarif_moyen, $langues, $site_web,
            $bio, $adresse_cabinet, $ville, $disponibilites, $userId,
        ]);
    }

    jsonResponse(['success' => true, 'message' => 'Profil mis à jour']);
}

function handleChangePassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId    = requireAuth();
    $data      = json_decode(file_get_contents('php://input'), true);
    $ancien    = $data['ancien_mot_de_passe']  ?? '';
    $nouveau   = $data['nouveau_mot_de_passe'] ?? '';
    $confirm   = $data['confirmation']         ?? '';
    if (!$ancien || !$nouveau || !$confirm) errorResponse('Tous les champs sont requis');
    if ($nouveau !== $confirm) errorResponse('Les mots de passe ne correspondent pas');
    if (strlen($nouveau) < 6) errorResponse('Le mot de passe doit faire au moins 6 caractères');
    $db   = getDB();
    $stmt = $db->prepare('SELECT mot_de_passe FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($ancien, $user['mot_de_passe'])) errorResponse('Mot de passe actuel incorrect', 401);
    $stmt = $db->prepare('UPDATE users SET mot_de_passe = ? WHERE id = ?');
    $stmt->execute([password_hash($nouveau, PASSWORD_DEFAULT), $userId]);
    jsonResponse(['success' => true, 'message' => 'Mot de passe modifié avec succès']);
}

function handleDeleteAccount() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('Méthode non autorisée', 405);
    $userId = requireAuth();
    $db     = getDB();
    $stmt   = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Compte supprimé définitivement']);
}
