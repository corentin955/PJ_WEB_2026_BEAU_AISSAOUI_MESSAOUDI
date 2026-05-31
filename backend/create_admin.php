<?php
require_once 'database.php';

$email  = 'admin@vitacare.fr';
$mdp    = 'password';
$prenom = 'Admin';
$nom    = 'VitaCare';

$db = getDB();

$exist = $db->prepare("SELECT id FROM users WHERE email = :email");
$exist->execute([':email' => $email]);

if ($exist->fetch()) {
    jsonResponse(['message' => 'Un compte admin existe déjà pour ' . $email]);
}

$hash = password_hash($mdp, PASSWORD_DEFAULT);
$stmt = $db->prepare(
    "INSERT INTO users (prenom, nom, email, mot_de_passe, role, actif)
     VALUES (:prenom, :nom, :email, :mot_de_passe, 'admin', 1)"
);
$stmt->execute([
    ':prenom'      => $prenom,
    ':nom'         => $nom,
    ':email'       => $email,
    ':mot_de_passe'=> $hash,
]);

jsonResponse(['success' => true, 'message' => 'Compte admin créé : ' . $email . ' / ' . $mdp]);
