-- Migration : création du compte administrateur VitaCare
-- Mot de passe : password  (bcrypt, généré avec password_hash PHP)
-- À exécuter une seule fois : mysql -u root -proot vitacare < database/migration_admin.sql

INSERT IGNORE INTO users (prenom, nom, email, mot_de_passe, role, actif)
VALUES (
  'Admin',
  'VitaCare',
  'admin@vitacare.fr',
  '$2y$10$z.jT65ngL3HaAceMiM1wMeyfexo3vtCmZUsaXVEaiNx/HqwrMoXv6',
  'admin',
  1
);
