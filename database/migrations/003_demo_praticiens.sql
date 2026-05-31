-- Migration 003 : comptes praticiens de démonstration
-- Exécuter : mysql -u root -proot vitacare < database/migrations/003_demo_praticiens.sql

USE vitacare;

-- ── Insertion des comptes praticiens ────────────────────────────────────────────
-- ON DUPLICATE KEY UPDATE : corrige aussi les comptes déjà existants (mot de passe + rôle)

INSERT INTO users (nom, prenom, email, mot_de_passe, role, actif) VALUES
('Martin',    'Sarah',    'sarah.martin@vitacare.fr',    '$2y$10$JGmnMG6U7WzAo07giucTBOy99LQSprHzhYuqqZ1hZgYFzFwqFccnu', 'praticien', TRUE),
('Lefèvre',   'Thomas',   'thomas.lefevre@vitacare.fr',  '$2y$10$jusYqXDYxgDua0sz5g3Iz.N5yBp2HBK6FrTpan4KciOzIGmc9YAV.', 'praticien', TRUE),
('Garnier',   'Élise',    'elise.garnier@vitacare.fr',   '$2y$10$YhFKLt7mnkuNbzhW97QyhOafKqYFQpLjECae59lU6gK3jcmFOqaBO', 'praticien', TRUE),
('Dubois',    'Marie',    'marie.dubois@vitacare.fr',    '$2y$10$gywKsKU9fyb7rWujUIZFquzmhwLO6aTvw/3tLzjCfXgtQB1SnJm3K', 'praticien', TRUE),
('Martin',    'Julie',    'julie.martin@vitacare.fr',    '$2y$10$rfyUhlOqH2qeRg4dg912X.zylaqTMbtfvD6hM3VRjXLRNbjMYc/rm', 'praticien', TRUE),
('Rousseau',  'Antoine',  'antoine.rousseau@vitacare.fr','$2y$10$cokAB6rGO5JNZs31cm1A1Omy3tGK1kvlE9vFCpui6LtQgYjtQ1ci6', 'praticien', TRUE),
('Petit',     'Alexandre','alexandre.petit@vitacare.fr', '$2y$10$AzHR0afEYeMyCIeCwG3RhePhkUo0538Y.B.nYMKY6Ezi5vVDMjAx2', 'praticien', TRUE),
('Bernard',   'Claire',   'claire.bernard@vitacare.fr',  '$2y$10$vSFCEHurmXsjejcaW7CWbu4.AmTlr3gl8URpDj6ulCA81G2qAlTu2', 'praticien', TRUE),
('Morin',     'Sophie',   'sophie.morin@vitacare.fr',    '$2y$10$S5PgTqal6NuMiqipQJLaeeRDrlWHoSwmdW7BPbFjm4w.zgctpF5uS', 'praticien', TRUE),
('Roussel',   'Julien',   'julien.roussel@vitacare.fr',  '$2y$10$JfANzdRTrPi7WDTrmtbcn.wuABFch/6Q/Ex/7u.KefEW5yhJvTsTy', 'praticien', TRUE)
ON DUPLICATE KEY UPDATE
    mot_de_passe = VALUES(mot_de_passe),
    role         = VALUES(role),
    actif        = VALUES(actif);

-- ── Liaison services ↔ praticiens ────────────────────────────────────────────────
-- Utilise des sous-requêtes SELECT pour ne pas dépendre d'IDs hardcodés

UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'sarah.martin@vitacare.fr')     WHERE id = 1;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'thomas.lefevre@vitacare.fr')   WHERE id = 2;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'elise.garnier@vitacare.fr')    WHERE id = 3;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'marie.dubois@vitacare.fr')     WHERE id = 4;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'julie.martin@vitacare.fr')     WHERE id = 5;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'antoine.rousseau@vitacare.fr') WHERE id = 6;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'alexandre.petit@vitacare.fr')  WHERE id = 7;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'claire.bernard@vitacare.fr')   WHERE id = 8;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'sophie.morin@vitacare.fr')     WHERE id = 9;
UPDATE services SET utilisateur_id = (SELECT id FROM users WHERE email = 'julien.roussel@vitacare.fr')   WHERE id = 10;
