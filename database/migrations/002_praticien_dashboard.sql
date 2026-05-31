-- ============================================
-- Migration 002 — Dashboard praticien
-- VitaCare — Projet Web Dynamique 2026
-- ============================================
-- Pré-requis : migration 001_add_chat.sql appliquée
-- email_praticien N'est PAS ajouté à services : users.email
-- est accessible via JOIN sur services.utilisateur_id.
-- ============================================

USE vitacare;

-- 1. Index sur services.utilisateur_id (idempotent via DROP/ADD ou IF NOT EXISTS indisponible en MySQL 5)
-- On utilise une procédure pour ne créer l'index que s'il est absent.
DROP PROCEDURE IF EXISTS vitacare_add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE vitacare_add_index_if_missing()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE table_schema = 'vitacare'
          AND table_name   = 'services'
          AND index_name   = 'idx_services_utilisateur_id'
    ) THEN
        ALTER TABLE services
            ADD INDEX idx_services_utilisateur_id (utilisateur_id);
    END IF;
END$$
DELIMITER ;
CALL vitacare_add_index_if_missing();
DROP PROCEDURE IF EXISTS vitacare_add_index_if_missing;

-- 2. Insertion du praticien démo Dr. Sarah Martin (dr.sarah@vitacare.fr)
--    Hash bcrypt de 'password' — même valeur que les autres comptes démo.
--    ON DUPLICATE KEY UPDATE garantit l'idempotence de la migration.
INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
VALUES ('Martin', 'Sarah', 'dr.sarah@vitacare.fr',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'praticien', '0612345678')
ON DUPLICATE KEY UPDATE
    nom      = VALUES(nom),
    prenom   = VALUES(prenom),
    role     = VALUES(role);

-- 3. Associe le service id=1 (Dr. Sarah Martin — Kinésithérapeute du sport)
--    à l'utilisateur praticien qui vient d'être créé/retrouvé.
UPDATE services
SET utilisateur_id = (
    SELECT id FROM users WHERE email = 'dr.sarah@vitacare.fr' LIMIT 1
)
WHERE id = 1;
