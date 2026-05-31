-- ============================================
-- Migration 001 — Ajout messagerie chat
-- VitaCare — Projet Web Dynamique 2026
-- ============================================

USE vitacare;

-- Table de messagerie patient <-> praticien
CREATE TABLE IF NOT EXISTS messages_chat (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    expediteur_id    INT NOT NULL,
    destinataire_id  INT NOT NULL,
    message          TEXT NOT NULL,
    lu               BOOLEAN DEFAULT FALSE,
    date_envoi       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Index pour accélérer la récupération des conversations
    INDEX idx_conversation (expediteur_id, destinataire_id),
    INDEX idx_destinataire (destinataire_id),
    INDEX idx_date (date_envoi)
);

-- Données de démo : quelques messages
-- Récupère les IDs: 1=admin, 2=marie(patient), 3=lucas(patient)
-- On a besoin d'un praticien ; ajouter un praticien de démo
INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone) VALUES
('Martin', 'Sarah', 'sarah.martin@vitacare.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'praticien', '0612345678');
-- ID praticien = 4

-- Messages de démo
INSERT INTO messages_chat (expediteur_id, destinataire_id, message, lu, date_envoi) VALUES
(2, 4, 'Bonjour Dr Martin, j''ai une question concernant ma prochaine séance de kinésithérapie.', TRUE,  DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 2, 'Bonjour Marie ! Bien sûr, n''hésitez pas à me poser votre question.', TRUE,  DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 4, 'Est-ce que je dois apporter des chaussures de sport spéciales pour la séance ?', TRUE,  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 2, 'Des chaussures de sport classiques feront très bien l''affaire. Prévoyez aussi une tenue confortable.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 4, 'Bonjour, je voulais savoir si vous aviez des créneaux disponibles en fin de semaine prochaine ?', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR));
