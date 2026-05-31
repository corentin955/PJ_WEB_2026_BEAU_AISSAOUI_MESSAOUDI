<?php
/**
 * VitaCare — Backend Test Suite
 * Usage : C:\MAMP\bin\php\php8.2.14\php.exe tests\run_tests.php
 */

define('BASE_URL', 'http://localhost/vitacare/backend');
define('PASS', '[OK]');
define('FAIL', '[FAIL]');

$results = ['pass' => 0, 'fail' => 0];
$cookieFile = sys_get_temp_dir() . '/vitacare_test_cookies.txt';

function request(string $url, string $method = 'GET', array $body = [], bool $useCookie = true): array {
    global $cookieFile;
    $opts = [
        'http' => [
            'method'  => $method,
            'header'  => "Content-Type: application/json\r\nCookie: " . ($useCookie ? @file_get_contents($cookieFile) : ''),
            'content' => $body ? json_encode($body) : null,
            'ignore_errors' => true,
        ]
    ];
    $context  = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    $httpCode = 0;
    foreach ($http_response_header ?? [] as $h) {
        if (preg_match('#HTTP/\d\.\d (\d+)#', $h, $m)) $httpCode = (int)$m[1];
    }
    // Sauvegarder les cookies
    foreach ($http_response_header ?? [] as $h) {
        if (stripos($h, 'Set-Cookie:') === 0) {
            $cookie = trim(substr($h, 11));
            $cookie = explode(';', $cookie)[0];
            file_put_contents($cookieFile, $cookie);
        }
    }
    return ['code' => $httpCode, 'body' => json_decode($response, true), 'raw' => $response];
}

function test(string $name, bool $condition, string $detail = ''): void {
    global $results;
    $icon = $condition ? PASS : FAIL;
    $condition ? $results['pass']++ : $results['fail']++;
    echo "$icon  $name" . ($detail ? "  =>  $detail" : '') . "\n";
}

function section(string $title): void {
    echo "\n=== $title ===\n";
}

// ─── 1. AUTH ───────────────────────────────────────────────────────────────

section('AUTH');

$r = request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'password'
]);
test('Login valide -> 200', $r['code'] === 200, 'code=' . $r['code']);
test('Login retourne user.id', isset($r['body']['user']['id']));
test('Login ne retourne pas mot_de_passe', !isset($r['body']['user']['mot_de_passe']));

$r = request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'wrongpassword'
]);
test('Login mauvais mdp -> 401', $r['code'] === 401, 'code=' . $r['code']);

$r = request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'notanemail', 'mot_de_passe' => 'password'
]);
test('Login email invalide -> 400', $r['code'] === 400, 'code=' . $r['code']);

// Re-login propre pour la suite
request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'password'
]);

$r = request(BASE_URL . '/auth.php?action=me');
test('/me authentifie -> 200', $r['code'] === 200, 'code=' . $r['code']);
test('/me retourne user.id', isset($r['body']['user']['id']));

@unlink($cookieFile);
$r = request(BASE_URL . '/auth.php?action=me', 'GET', [], false);
test('/me sans session -> 401', $r['code'] === 401, 'code=' . $r['code']);

$randomEmail = 'test_' . time() . '@test.fr';
$r = request(BASE_URL . '/auth.php?action=register', 'POST', [
    'nom' => 'Test', 'prenom' => 'User',
    'email' => $randomEmail, 'mot_de_passe' => 'password123', 'role' => 'patient'
]);
test('Register new user -> 201', $r['code'] === 201, 'code=' . $r['code']);

$r = request(BASE_URL . '/auth.php?action=register', 'POST', [
    'nom' => 'Test', 'prenom' => 'User',
    'email' => $randomEmail, 'mot_de_passe' => 'password123', 'role' => 'patient'
]);
test('Register email duplique -> 400', $r['code'] === 400, 'code=' . $r['code']);

$r = request(BASE_URL . '/auth.php?action=register', 'POST', [
    'nom' => 'A', 'prenom' => 'B', 'email' => 'x2@x.fr', 'mot_de_passe' => 'ab'
]);
test('Register mdp < 6 chars -> 400', $r['code'] === 400, 'code=' . $r['code']);

// Re-login marie pour la suite
request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'password'
]);

// ─── 2. SERVICES ──────────────────────────────────────────────────────────

section('SERVICES');

$r = request(BASE_URL . '/services.php?action=list');
test('List services -> 200', $r['code'] === 200, 'code=' . $r['code']);
test('List services retourne array', is_array($r['body']['data'] ?? null));
$firstServiceId = $r['body']['data'][0]['id'] ?? 1;

$r = request(BASE_URL . '/services.php?action=list&categorie_id=1');
test('Filtre categorie_id -> 200', $r['code'] === 200);

$r = request(BASE_URL . '/services.php?action=list&search=yoga');
test('Filtre search -> 200', $r['code'] === 200);

$r = request(BASE_URL . '/services.php?action=list&prix_min=10&prix_max=200');
test('Filtre prix min/max -> 200', $r['code'] === 200);

$r = request(BASE_URL . "/services.php?action=get&id=$firstServiceId");
test('Get service existant -> 200', $r['code'] === 200, 'code=' . $r['code']);
test('Get service contient avis', isset($r['body']['data']['avis']));

$r = request(BASE_URL . '/services.php?action=get&id=99999');
test('Get service inexistant -> 404', $r['code'] === 404, 'code=' . $r['code']);

$r = request(BASE_URL . '/services.php?action=categories');
test('Categories -> 200', $r['code'] === 200);

$r = request(BASE_URL . "/services.php?action=disponibilites&id=$firstServiceId");
test('Disponibilites -> 200', $r['code'] === 200);

// ─── 3. RÉSERVATIONS ──────────────────────────────────────────────────────

section('RESERVATIONS');

$r = request(BASE_URL . '/reservations.php?action=list');
test('List reservations authentifie -> 200', $r['code'] === 200, 'code=' . $r['code']);

@unlink($cookieFile);
$r = request(BASE_URL . '/reservations.php?action=list', 'GET', [], false);
test('List reservations sans auth -> 401', $r['code'] === 401, 'code=' . $r['code']);

// Re-login
request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'password'
]);

$futureDate = date('Y-m-d', strtotime('+30 days'));
$r = request(BASE_URL . '/reservations.php?action=create', 'POST', [
    'service_id'        => $firstServiceId,
    'date_reservation'  => $futureDate,
    'heure_reservation' => '14:00:00',
    'notes_patient'     => 'Test automatique',
]);
test('Creer reservation -> 201', $r['code'] === 201, 'code=' . $r['code']);
$newResaId = $r['body']['id'] ?? null;

$r = request(BASE_URL . '/reservations.php?action=create', 'POST', [
    'service_id'        => $firstServiceId,
    'date_reservation'  => $futureDate,
    'heure_reservation' => '14:00:00',
]);
test('Doublon creneau -> 400', $r['code'] === 400, 'code=' . $r['code']);

$r = request(BASE_URL . '/reservations.php?action=create', 'POST', []);
test('Creer sans champs -> 400', $r['code'] === 400, 'code=' . $r['code']);

if ($newResaId) {
    $r = request(BASE_URL . "/reservations.php?action=annuler&id=$newResaId", 'POST');
    test('Annuler reservation -> 200', $r['code'] === 200, 'code=' . $r['code']);

    $r = request(BASE_URL . "/reservations.php?action=annuler&id=$newResaId", 'POST');
    test('Re-annuler deja annulee -> 400', $r['code'] === 400, 'code=' . $r['code']);
}

// ─── 4. PANIER ────────────────────────────────────────────────────────────

section('PANIER');

$r = request(BASE_URL . '/reservations.php?action=panier_list');
foreach ($r['body']['data'] ?? [] as $item) {
    request(BASE_URL . '/reservations.php?action=panier_remove&id=' . $item['id'], 'DELETE');
}

$r = request(BASE_URL . '/reservations.php?action=panier_add', 'POST', ['service_id' => $firstServiceId]);
test('Ajouter au panier -> 201', $r['code'] === 201, 'code=' . $r['code']);

$r = request(BASE_URL . '/reservations.php?action=panier_add', 'POST', ['service_id' => $firstServiceId]);
test('Doublon panier -> 400', $r['code'] === 400, 'code=' . $r['code']);

$r = request(BASE_URL . '/reservations.php?action=panier_list');
test('Lister panier -> 200', $r['code'] === 200);
test('Panier contient total', isset($r['body']['total']));
$panierId = $r['body']['data'][0]['id'] ?? null;

if ($panierId) {
    $r = request(BASE_URL . "/reservations.php?action=panier_remove&id=$panierId", 'DELETE');
    test('Supprimer item panier -> 200', $r['code'] === 200, 'code=' . $r['code']);
}

$r = request(BASE_URL . '/reservations.php?action=panier_valider', 'POST');
test('Valider panier vide -> 400', $r['code'] === 400, 'code=' . $r['code']);

request(BASE_URL . '/reservations.php?action=panier_add', 'POST', ['service_id' => $firstServiceId]);
$r = request(BASE_URL . '/reservations.php?action=panier_valider', 'POST');
test('Valider panier avec item -> 200', $r['code'] === 200, 'code=' . $r['code']);

$r = request(BASE_URL . '/reservations.php?action=panier_list');
test('Panier vide apres validation', count($r['body']['data'] ?? []) === 0);

// ─── 5. NOTIFICATIONS ─────────────────────────────────────────────────────

section('NOTIFICATIONS');

$r = request(BASE_URL . '/notifications.php');
test('List notifications -> 200', $r['code'] === 200, 'code=' . $r['code']);

@unlink($cookieFile);
$r = request(BASE_URL . '/notifications.php', 'GET', [], false);
test('Notifications sans auth -> 401', $r['code'] === 401, 'code=' . $r['code']);

request(BASE_URL . '/auth.php?action=login', 'POST', [
    'email' => 'marie.dupont@vitacare.fr', 'mot_de_passe' => 'password'
]);

// ─── 6. MISC ──────────────────────────────────────────────────────────────

section('MISC');

$r = request(BASE_URL . '/misc.php?endpoint=faq');
test('FAQ -> 200', $r['code'] === 200, 'code=' . $r['code']);

$r = request(BASE_URL . '/misc.php?endpoint=contact', 'POST', [
    'nom' => 'Test', 'email' => 'test@test.fr', 'sujet' => 'Test', 'message' => 'Test message'
]);
test('Contact -> 200', $r['code'] === 200, 'code=' . $r['code']);

$r = request(BASE_URL . '/misc.php?endpoint=contact', 'POST', ['nom' => 'Test']);
test('Contact champs manquants -> 400', $r['code'] === 400, 'code=' . $r['code']);

// ─── 7. SECURITE ──────────────────────────────────────────────────────────

section('SECURITE');

$r = request(BASE_URL . "/services.php?action=list&search=' OR 1=1 --");
test('SQL injection search -> pas de crash', $r['code'] !== 500 && $r['code'] !== 0);

// ─── 8. DATABASE DIRECTE ──────────────────────────────────────────────────

section('DATABASE DIRECTE');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=vitacare;charset=utf8mb4', 'root', 'root', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach (['users','services','reservations','notifications','panier','categories_services'] as $t) {
        test("Table '$t' existe", in_array($t, $tables));
    }

    $orphans = $pdo->query("
        SELECT COUNT(*) FROM reservations r
        LEFT JOIN users u ON r.utilisateur_id = u.id
        WHERE u.id IS NULL
    ")->fetchColumn();
    test('Pas de reservation orpheline', (int)$orphans === 0);

    $plainPwd = $pdo->query("SELECT COUNT(*) FROM users WHERE LENGTH(mot_de_passe) < 40")->fetchColumn();
    test('Mots de passe hashe (pas en clair)', (int)$plainPwd === 0);

    $badStatus = $pdo->query("
        SELECT COUNT(*) FROM reservations
        WHERE statut NOT IN ('confirmee','annulee','terminee','en_attente')
    ")->fetchColumn();
    test('Statuts reservations valides', (int)$badStatus === 0);

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE utilisateur_id = (SELECT id FROM users WHERE email = ?)");
    $stmt->execute(['marie.dupont@vitacare.fr']);
    test('Notifications creees en BDD', (int)$stmt->fetchColumn() > 0);

} catch (PDOException $e) {
    test('Connexion BDD', false, $e->getMessage());
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────

request(BASE_URL . '/auth.php?action=logout');
@unlink($cookieFile);
$r = request(BASE_URL . '/auth.php?action=me', 'GET', [], false);
test('Session detruite apres logout', $r['code'] === 401, 'code=' . $r['code']);

// ─── RESUME ───────────────────────────────────────────────────────────────

$total = $results['pass'] + $results['fail'];
echo "\n---------------------------------\n";
echo "  Resultats : {$results['pass']} / $total passes\n";
if ($results['fail'] > 0) echo "  {$results['fail']} test(s) echoue(s)\n";
else echo "  Tous les tests passent [OK]\n";
echo "---------------------------------\n\n";

@unlink($cookieFile);
