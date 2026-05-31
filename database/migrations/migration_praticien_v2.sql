-- Migration praticien v2 — VitaCare (compatible MySQL 5.7)
-- Exécuter : mysql -u root -proot vitacare < database/migrations/migration_praticien_v2.sql

USE vitacare;

-- ── 1. Colonnes profil sportif sur users (ajout conditionnel via INFORMATION_SCHEMA) ──

SET @db = DATABASE();

-- poids
SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'poids'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE users ADD COLUMN poids DECIMAL(5,2) NULL',
    'SELECT ''poids already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- taille
SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'taille'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE users ADD COLUMN taille INT NULL',
    'SELECT ''taille already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- historique_sportif
SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'historique_sportif'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE users ADD COLUMN historique_sportif TEXT NULL',
    'SELECT ''historique_sportif already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Ajout du type 'decalage' dans notifications ────────────────────────────
-- MODIFY redéfinit l'ENUM entier — idempotent si relancé

ALTER TABLE notifications
    MODIFY COLUMN type ENUM(
        'reservation',
        'annulation',
        'rappel',
        'info',
        'nouveau_service',
        'decalage'
    ) DEFAULT 'info';

-- ── 3. Table propositions_creneau ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS propositions_creneau (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    praticien_id   INT NOT NULL,
    nouvelle_date  DATE NOT NULL,
    nouvelle_heure TIME NOT NULL,
    message        TEXT,
    statut         ENUM('en_attente','acceptee','refusee') DEFAULT 'en_attente',
    date_creation  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (praticien_id)   REFERENCES users(id)        ON DELETE CASCADE
);

-- ── 4. Données profil sportif des patients démo ───────────────────────────────

UPDATE users
SET poids              = 65.0,
    taille             = 168,
    historique_sportif = 'Course à pied 3x/semaine, ancienne entorse cheville droite'
WHERE id = 2;

UPDATE users
SET poids              = 80.5,
    taille             = 182,
    historique_sportif = 'Cyclisme compétition, hernie discale L4-L5'
WHERE id = 3;

-- ── 5. Réservations démo en statut en_attente ─────────────────────────────────

INSERT INTO reservations (utilisateur_id, service_id, date_reservation, heure_reservation, statut, prix_paye) VALUES
(2, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', 'en_attente', 65.00),
(3, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 'en_attente', 65.00),
(2, 9, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:00:00', 'en_attente', 75.00);
