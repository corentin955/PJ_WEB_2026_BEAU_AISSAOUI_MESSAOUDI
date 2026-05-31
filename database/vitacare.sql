-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : dim. 31 mai 2026 à 17:35
-- Version du serveur : 5.7.24
-- Version de PHP : 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `vitacare`
--

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

CREATE TABLE `avis` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `note` tinyint(4) NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `avis`
--

INSERT INTO `avis` (`id`, `utilisateur_id`, `service_id`, `reservation_id`, `note`, `commentaire`, `date_creation`) VALUES
(1, 2, 1, NULL, 5, 'Excellente prise en charge ! Dr. Martin est très professionnelle et à l écoute. Ma blessure au genou a guéri beaucoup plus vite que prévu.', '2026-05-26 13:34:40'),
(2, 3, 1, NULL, 4, 'Très bon suivi, je recommande vivement pour la rééducation sportive.', '2026-05-26 13:34:40'),
(3, 2, 4, NULL, 5, 'Incroyable ! La cryothérapie après mon marathon m a permis de récupérer en un temps record. Je reviendrai !', '2026-05-26 13:34:40'),
(4, 3, 9, NULL, 5, 'Sophie est une excellente masseuse. Le massage pré-compétition m a parfaitement préparé pour ma course.', '2026-05-26 13:34:40');

-- --------------------------------------------------------

--
-- Structure de la table `categories_services`
--

CREATE TABLE `categories_services` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `couleur` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories_services`
--

INSERT INTO `categories_services` (`id`, `nom`, `icone`, `couleur`, `description`) VALUES
(1, 'Kinésithérapie', 'activity', '#3B82F6', 'Rééducation et traitement des troubles musculo-squelettiques'),
(2, 'Ostéopathie', 'zap', '#8B5CF6', 'Traitement ostéopathique global du corps'),
(3, 'IRM / Imagerie', 'eye', '#EC4899', 'Imagerie médicale par résonance magnétique'),
(4, 'Cryothérapie', 'thermometer', '#06B6D4', 'Thérapie par le froid pour récupération sportive'),
(5, 'Nutrition sportive', 'leaf', '#10B981', 'Conseils nutritionnels adaptés aux sportifs'),
(6, 'Médecine du sport', 'heart', '#EF4444', 'Suivi médical spécialisé pour sportifs'),
(7, 'Podologie', 'footprints', '#F59E0B', 'Soins et analyses biomécaniques du pied'),
(8, 'Psychologie du sport', 'brain', '#6366F1', 'Accompagnement mental et performance'),
(9, 'Massage sportif', 'hand', '#14B8A6', 'Massages de préparation et récupération'),
(10, 'Électrostimulation', 'cpu', '#F97316', 'Rééducation et renforcement par électrostimulation');

-- --------------------------------------------------------

--
-- Structure de la table `disponibilites`
--

CREATE TABLE `disponibilites` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `jour_semaine` tinyint(4) DEFAULT NULL COMMENT '0=Lundi, 6=Dimanche',
  `date_specifique` date DEFAULT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `places_disponibles` int(11) DEFAULT '1',
  `recurrent` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `disponibilites`
--

INSERT INTO `disponibilites` (`id`, `service_id`, `jour_semaine`, `date_specifique`, `heure_debut`, `heure_fin`, `places_disponibles`, `recurrent`) VALUES
(1, 1, 0, NULL, '09:00:00', '12:00:00', 1, 1),
(2, 1, 0, NULL, '14:00:00', '18:00:00', 1, 1),
(3, 1, 2, NULL, '09:00:00', '12:00:00', 1, 1),
(4, 1, 2, NULL, '14:00:00', '18:00:00', 1, 1),
(5, 1, 4, NULL, '09:00:00', '12:00:00', 1, 1),
(6, 2, 1, NULL, '10:00:00', '13:00:00', 1, 1),
(7, 2, 1, NULL, '15:00:00', '19:00:00', 1, 1),
(8, 2, 3, NULL, '10:00:00', '13:00:00', 1, 1),
(9, 2, 3, NULL, '15:00:00', '19:00:00', 1, 1),
(10, 3, 0, NULL, '08:00:00', '17:00:00', 3, 1),
(11, 3, 2, NULL, '08:00:00', '17:00:00', 3, 1),
(12, 3, 4, NULL, '08:00:00', '17:00:00', 3, 1),
(13, 4, 1, NULL, '08:00:00', '20:00:00', 4, 1),
(14, 4, 3, NULL, '08:00:00', '20:00:00', 4, 1),
(15, 4, 5, NULL, '09:00:00', '16:00:00', 4, 1),
(16, 5, 0, NULL, '09:00:00', '18:00:00', 1, 1),
(17, 5, 2, NULL, '09:00:00', '18:00:00', 1, 1),
(18, 5, 4, NULL, '09:00:00', '18:00:00', 1, 1),
(19, 6, 0, NULL, '08:00:00', '12:00:00', 2, 1),
(20, 6, 1, NULL, '14:00:00', '18:00:00', 2, 1),
(21, 6, 3, NULL, '08:00:00', '12:00:00', 2, 1),
(22, 7, 1, NULL, '09:00:00', '12:00:00', 1, 1),
(23, 7, 4, NULL, '09:00:00', '12:00:00', 1, 1),
(24, 7, 4, NULL, '14:00:00', '17:00:00', 1, 1),
(25, 8, 2, NULL, '10:00:00', '19:00:00', 1, 1),
(26, 8, 3, NULL, '10:00:00', '19:00:00', 1, 1),
(27, 9, 0, NULL, '09:00:00', '19:00:00', 2, 1),
(28, 9, 2, NULL, '09:00:00', '19:00:00', 2, 1),
(29, 9, 5, NULL, '10:00:00', '16:00:00', 2, 1),
(30, 10, 1, NULL, '08:00:00', '12:00:00', 3, 1),
(31, 10, 3, NULL, '08:00:00', '12:00:00', 3, 1),
(32, 10, 5, NULL, '09:00:00', '13:00:00', 3, 1);

-- --------------------------------------------------------

--
-- Structure de la table `faq`
--

CREATE TABLE `faq` (
  `id` int(11) NOT NULL,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reponse` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordre` int(11) DEFAULT '0',
  `actif` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `faq`
--

INSERT INTO `faq` (`id`, `question`, `reponse`, `categorie`, `ordre`, `actif`) VALUES
(1, 'Comment prendre rendez-vous sur VitaCare ?', 'Pour prendre rendez-vous, connectez-vous à votre espace personnel, naviguez vers la section \"Services\", choisissez un praticien et sélectionnez un créneau disponible. Vous pouvez également utiliser notre panier pour réserver plusieurs services en une seule fois.', 'Réservations', 1, 1),
(2, 'Puis-je annuler un rendez-vous ?', 'Oui, vous pouvez annuler un rendez-vous jusqu à 24h avant la séance depuis votre espace \"Mes réservations\". Au-delà de ce délai, des frais d annulation peuvent s appliquer selon les conditions du praticien.', 'Réservations', 2, 1),
(3, 'Comment proposer mes services sur la plateforme ?', 'Pour proposer vos services, créez un compte praticien depuis la page d inscription, puis utilisez la section \"Proposer un service\" dans le menu. Remplissez le formulaire avec vos informations, tarifs et disponibilités. Votre service sera visible après validation.', 'Praticiens', 3, 1),
(4, 'Les paiements sont-ils sécurisés ?', 'Le processus de paiement sur VitaCare est simulé dans le cadre de cette version de démonstration. Dans la version production, les paiements seraient sécurisés via des protocoles SSL/TLS et des partenaires de paiement certifiés.', 'Paiements', 4, 1),
(5, 'Comment fonctionne la cryothérapie ?', 'La cryothérapie corps entier consiste en une exposition brève (2-3 minutes) à des températures très basses (-110°C à -140°C). Elle favorise la récupération musculaire, réduit l inflammation et stimule la production d endorphines. Une consultation préalable est recommandée.', 'Services', 5, 1),
(6, 'Quels sportifs peuvent bénéficier des services VitaCare ?', 'VitaCare s adresse à tous les sportifs, qu ils soient amateurs ou professionnels, pratiquant tous types de sports. Nos praticiens sont formés pour adapter leur prise en charge à votre niveau et vos objectifs.', 'Général', 6, 1),
(7, 'Comment voir mon historique de réservations ?', 'Votre historique complet de réservations est disponible dans votre espace \"Mes réservations\". Vous pouvez filtrer par date, statut ou type de service, et consulter le détail de chaque consultation.', 'Général', 7, 1),
(8, 'Comment contacter un praticien directement ?', 'Après confirmation de votre rendez-vous, vous pouvez envoyer un message au praticien via la messagerie intégrée à VitaCare. Vous retrouverez cet espace dans la section \"Messages\" de votre tableau de bord.', 'Communication', 8, 1);

-- --------------------------------------------------------

--
-- Structure de la table `messages_chat`
--

CREATE TABLE `messages_chat` (
  `id` int(11) NOT NULL,
  `expediteur_id` int(11) NOT NULL,
  `destinataire_id` int(11) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `lu` tinyint(1) DEFAULT '0',
  `date_envoi` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages_chat`
--

INSERT INTO `messages_chat` (`id`, `expediteur_id`, `destinataire_id`, `message`, `lu`, `date_envoi`) VALUES
(1, 2, 4, 'Bonjour Dr Martin, j\'ai une question concernant ma prochaine séance de kinésithérapie.', 1, '2026-05-24 13:35:39'),
(2, 4, 2, 'Bonjour Marie ! Bien sûr, n\'hésitez pas à me poser votre question.', 1, '2026-05-24 13:35:39'),
(3, 2, 4, 'Est-ce que je dois apporter des chaussures de sport spéciales pour la séance ?', 1, '2026-05-25 13:35:39'),
(4, 4, 2, 'Des chaussures de sport classiques feront très bien l\'affaire. Prévoyez aussi une tenue confortable.', 0, '2026-05-25 13:35:39'),
(5, 3, 4, 'Bonjour, je voulais savoir si vous aviez des créneaux disponibles en fin de semaine prochaine ?', 0, '2026-05-26 10:35:39');

-- --------------------------------------------------------

--
-- Structure de la table `messages_contact`
--

CREATE TABLE `messages_contact` (
  `id` int(11) NOT NULL,
  `nom` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sujet` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `traite` tinyint(1) DEFAULT '0',
  `date_envoi` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages_contact`
--

INSERT INTO `messages_contact` (`id`, `nom`, `email`, `sujet`, `message`, `traite`, `date_envoi`) VALUES
(1, 'Test', 'test@test.fr', 'Test', 'Test message', 0, '2026-05-26 20:29:02'),
(2, 'Test', 'test@test.fr', 'Test', 'Test message', 0, '2026-05-26 20:31:08'),
(3, 'Test', 'test@test.fr', 'Test', 'Test message', 0, '2026-05-26 20:32:02'),
(4, 'Test', 'test@test.fr', 'Test', 'Test message', 0, '2026-05-26 20:33:04');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('reservation','annulation','rappel','info','nouveau_service','decalage') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `lu` tinyint(1) DEFAULT '0',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `utilisateur_id`, `titre`, `message`, `type`, `lu`, `date_creation`) VALUES
(18, 3, 'RDV annulé', 'Votre rendez-vous a été annulé.', 'annulation', 0, '2026-05-29 20:20:20'),
(25, 4, 'Nouveau rendez-vous', 'Marie Dupont a demandé un RDV pour \"Kinésithérapeute du sport\" le 2026-05-30 a 10:00', 'reservation', 1, '2026-05-29 23:09:07'),
(28, 2, 'Réservation annulée', 'Votre réservation a été annulée.', 'annulation', 1, '2026-05-29 23:55:09'),
(29, 20, 'Nouveau rendez-vous', 'Marie Dupont a demandé un RDV pour \"Masseur-Kinésithérapeute\" le 2026-05-30 a 17:00', 'reservation', 1, '2026-05-29 23:55:33'),
(30, 2, 'Réservation confirmée', 'Votre réservation du 2026-05-30 à 17:00 est confirmée.', 'reservation', 1, '2026-05-29 23:55:33'),
(32, 2, 'Réservation confirmée', 'Votre réservation du 2026-05-31 à 17:00 est confirmée.', 'reservation', 1, '2026-05-31 17:37:48'),
(33, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 17:41:07'),
(34, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 17:42:59'),
(35, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 18:14:38'),
(36, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 18:15:44'),
(37, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 18:24:56'),
(38, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 18:31:10'),
(39, 1, 'Nouveau service proposé', 'Marie Dubois a proposé un nouveau service : Cryo', 'nouveau_service', 1, '2026-05-31 18:34:16'),
(40, 2, 'Réservation annulée', 'Votre réservation a été annulée.', 'annulation', 0, '2026-05-31 18:37:10'),
(41, 2, 'Réservation annulée', 'Votre réservation a été annulée.', 'annulation', 0, '2026-05-31 18:37:16'),
(42, 1, 'Nouveau service proposé', 'Thomas Lefèvre a proposé un nouveau service : Elec', 'nouveau_service', 0, '2026-05-31 18:55:57');

-- --------------------------------------------------------

--
-- Structure de la table `panier`
--

CREATE TABLE `panier` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `date_souhaitee` date DEFAULT NULL,
  `heure_souhaitee` time DEFAULT NULL,
  `date_ajout` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `propositions_creneau`
--

CREATE TABLE `propositions_creneau` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `praticien_id` int(11) NOT NULL,
  `nouvelle_date` date NOT NULL,
  `nouvelle_heure` time NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `statut` enum('en_attente','acceptee','refusee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `date_reservation` date NOT NULL,
  `heure_reservation` time NOT NULL,
  `statut` enum('en_attente','confirmee','annulee','terminee') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `notes_patient` text COLLATE utf8mb4_unicode_ci,
  `prix_paye` decimal(10,2) DEFAULT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `utilisateur_id`, `service_id`, `date_reservation`, `heure_reservation`, `statut`, `notes_patient`, `prix_paye`, `date_creation`, `date_modification`) VALUES
(10, 5, 4, '2026-05-30', '12:00:00', 'confirmee', '', '45.00', '2026-05-26 22:49:24', NULL),
(12, 3, 1, '2026-06-03', '10:00:00', 'annulee', NULL, '65.00', '2026-05-29 19:55:52', '2026-05-29 20:20:20');

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `categorie_id` int(11) NOT NULL,
  `nom_praticien` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `prix` decimal(10,2) NOT NULL,
  `duree` int(11) NOT NULL COMMENT 'en minutes',
  `lieu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note_moyenne` decimal(3,2) DEFAULT '0.00',
  `nombre_avis` int(11) DEFAULT '0',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `services`
--

INSERT INTO `services` (`id`, `utilisateur_id`, `categorie_id`, `nom_praticien`, `titre`, `description`, `prix`, `duree`, `lieu`, `adresse`, `image_url`, `note_moyenne`, `nombre_avis`, `actif`, `date_creation`) VALUES
(1, 4, 1, 'Dr. Sarah Martin', 'Kinésithérapeute du sport', 'Spécialiste en rééducation sportive et prévention des blessures. Prise en charge complète des pathologies musculaires et articulaires.', '65.00', 45, 'Cabinet Sport Santé Paris 8', '12 Rue du Faubourg Saint-Honoré, 75008 Paris', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', '4.50', 2, 1, '2026-05-26 13:34:40'),
(2, 13, 2, 'Thomas Lefèvre', 'Ostéopathe D.O.', 'Ostéopathe spécialisé dans la prise en charge des sportifs de haut niveau. Traitement des douleurs chroniques et optimisation des performances.', '70.00', 60, 'Clinique du Sport Lyon', '45 Avenue Jean Jaurès, 69007 Lyon', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(3, 14, 3, 'Dr. Élise Garnier', 'Radiologue', 'IRM musculo-squelettique spécialisée pour le diagnostic des blessures sportives. Équipements de dernière génération.', '120.00', 45, 'Centre Imagerie Sport', '8 Boulevard Voltaire, 75011 Paris', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(4, 15, 4, 'Marie Dubois', 'Thérapeute cryothérapie', 'Séances de cryothérapie corps entier pour une récupération musculaire optimale. Idéal après compétition ou entraînement intense.', '45.00', 30, 'CryoSport Center', '22 Rue de la Paix, 75002 Paris', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', '5.00', 1, 1, '2026-05-26 13:34:40'),
(5, 16, 5, 'Julie Martin', 'Diététicienne du sport', 'Consultations en nutrition sportive personnalisées. Plans alimentaires adaptés à vos objectifs et à votre discipline.', '60.00', 60, 'NutriSport Bordeaux', '15 Cours de l Intendance, 33000 Bordeaux', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(6, 17, 6, 'Dr. Antoine Rousseau', 'Médecin du sport', 'Suivi médical complet pour sportifs amateurs et professionnels. Bilans de performance, certificats médicaux, gestion des blessures.', '85.00', 30, 'Cabinet Médecine du Sport Marseille', '3 Rue Paradis, 13001 Marseille', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(7, 18, 7, 'Alexandre Petit', 'Podologue du sport', 'Analyse biomécanique de la marche et de la course. Semelles orthopédiques sur mesure pour sportifs.', '55.00', 45, 'PodoSport Paris 15', '78 Rue de Vaugirard, 75015 Paris', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(8, 19, 8, 'Dr. Claire Bernard', 'Psychologue du sport', 'Accompagnement psychologique des sportifs : gestion du stress, préparation mentale, récupération après blessure.', '80.00', 50, 'Cabinet Psy Sport Nice', '10 Promenade des Anglais, 06000 Nice', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', '0.00', 0, 1, '2026-05-26 13:34:40'),
(9, 20, 9, 'Sophie Morin', 'Masseur-Kinésithérapeute', 'Massages sportifs profonds de préparation et de récupération. Techniques de drainage lymphatique et stretching global.', '75.00', 60, 'Studio Zen Sport', '5 Rue Montmartre, 75001 Paris', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', '5.00', 1, 1, '2026-05-26 13:34:40'),
(10, 21, 10, 'Julien Roussel', 'Spécialiste électrostimulation', 'Séances d électrostimulation neuromusculaire pour renforcement, rééducation et récupération. Protocoles personnalisés.', '50.00', 40, 'ElectroSport Center', '33 Avenue de la République, 75011 Paris', 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400', '0.00', 0, 1, '2026-05-26 13:34:40');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('patient','praticien','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'patient',
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `avatar` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_inscription` datetime DEFAULT CURRENT_TIMESTAMP,
  `actif` tinyint(1) DEFAULT '1',
  `poids` decimal(5,2) DEFAULT NULL,
  `taille` int(11) DEFAULT NULL,
  `historique_sportif` text COLLATE utf8mb4_unicode_ci,
  `specialite` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annees_experience` smallint(6) DEFAULT NULL,
  `diplome` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etablissement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_rpps` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tarif_moyen` decimal(7,2) DEFAULT NULL,
  `langues` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_web` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `adresse_cabinet` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disponibilites` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `role`, `telephone`, `date_naissance`, `avatar`, `date_inscription`, `actif`, `poids`, `taille`, `historique_sportif`, `specialite`, `annees_experience`, `diplome`, `etablissement`, `numero_rpps`, `tarif_moyen`, `langues`, `site_web`, `bio`, `adresse_cabinet`, `ville`, `disponibilites`) VALUES
(1, 'Admin', 'VitaCare', 'admin@vitacare.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, NULL, NULL, '2026-05-26 13:34:40', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Dupont', 'Marie', 'marie.dupont@gmail.com', '$2y$10$ol9ci6g5VlXGNZ24QWIFieOMTJJPfTxa73Q6bHbIBB672eXePBAIO', 'patient', NULL, NULL, NULL, '2026-05-26 13:34:40', 1, '68.50', 172, 'Pratique le running 3x/semaine, ancienne entorse de la cheville en 2023. Objectif : preparer un semi-marathon.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Martin', 'Lucas', 'lucas.martin@vitacare.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient', NULL, NULL, NULL, '2026-05-26 13:34:40', 1, '80.50', 182, 'Cyclisme compétition, hernie discale L4-L5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Martin', 'Sarah', 'sarah.martin@vitacare.fr', '$2y$10$JGmnMG6U7WzAo07giucTBOy99LQSprHzhYuqqZ1hZgYFzFwqFccnu', 'praticien', '0612345678', NULL, NULL, '2026-05-26 13:35:39', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'MESSAOUDI', 'Ilias', 'ilias95messa70@gmail.com', '$2y$10$1X3tTPzdurHJDvaWkt82.ub3H8.jWqqe7xvLftv4UE.Yabjk7C4EK', 'patient', '0624599362', NULL, NULL, '2026-05-26 14:55:48', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Test', 'User', 'test_1779820141@test.fr', '$2y$10$4pyLWR6A/IjDfFQpGMd/ueTclDzXNo7AU7CuCT8QTq3hdU70W726G', 'patient', '', NULL, NULL, '2026-05-26 20:29:01', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Test', 'User', 'test_1779820267@test.fr', '$2y$10$rB1toZaE/zNYHwufxupiUexV63nJoRVpLlRQinZFrkp.RVGkX6YTS', 'patient', '', NULL, NULL, '2026-05-26 20:31:07', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Test', 'User', 'test_1779820321@test.fr', '$2y$10$q4KF9kQv82xnDVbwWMuTgOaadfESuAI91Q/2SudmjKkHIUM5raoFC', 'patient', '', NULL, NULL, '2026-05-26 20:32:01', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Test', 'User', 'test_1779820383@test.fr', '$2y$10$GxsXrY8fNpvH2PxEifTwqec4tA.nvyXlyLKeBtsdmAhW43Zwvi/De', 'patient', '', NULL, NULL, '2026-05-26 20:33:03', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'Lefèvre', 'Thomas', 'thomas.lefevre@vitacare.fr', '$2y$10$jusYqXDYxgDua0sz5g3Iz.N5yBp2HBK6FrTpan4KciOzIGmc9YAV.', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'Garnier', 'Élise', 'elise.garnier@vitacare.fr', '$2y$10$YhFKLt7mnkuNbzhW97QyhOafKqYFQpLjECae59lU6gK3jcmFOqaBO', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'Dubois', 'Marie', 'marie.dubois@vitacare.fr', '$2y$10$gywKsKU9fyb7rWujUIZFquzmhwLO6aTvw/3tLzjCfXgtQB1SnJm3K', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'Martin', 'Julie', 'julie.martin@vitacare.fr', '$2y$10$rfyUhlOqH2qeRg4dg912X.zylaqTMbtfvD6hM3VRjXLRNbjMYc/rm', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'Rousseau', 'Antoine', 'antoine.rousseau@vitacare.fr', '$2y$10$cokAB6rGO5JNZs31cm1A1Omy3tGK1kvlE9vFCpui6LtQgYjtQ1ci6', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'Petit', 'Alexandre', 'alexandre.petit@vitacare.fr', '$2y$10$AzHR0afEYeMyCIeCwG3RhePhkUo0538Y.B.nYMKY6Ezi5vVDMjAx2', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'Bernard', 'Claire', 'claire.bernard@vitacare.fr', '$2y$10$vSFCEHurmXsjejcaW7CWbu4.AmTlr3gl8URpDj6ulCA81G2qAlTu2', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'Morin', 'Sophie', 'sophie.morin@vitacare.fr', '$2y$10$S5PgTqal6NuMiqipQJLaeeRDrlWHoSwmdW7BPbFjm4w.zgctpF5uS', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 'Roussel', 'Julien', 'julien.roussel@vitacare.fr', '$2y$10$JfANzdRTrPi7WDTrmtbcn.wuABFch/6Q/Ex/7u.KefEW5yhJvTsTy', 'praticien', NULL, NULL, NULL, '2026-05-29 19:38:52', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `reservation_id` (`reservation_id`);

--
-- Index pour la table `categories_services`
--
ALTER TABLE `categories_services`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `disponibilites`
--
ALTER TABLE `disponibilites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`);

--
-- Index pour la table `faq`
--
ALTER TABLE `faq`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages_chat`
--
ALTER TABLE `messages_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`expediteur_id`,`destinataire_id`),
  ADD KEY `idx_destinataire` (`destinataire_id`),
  ADD KEY `idx_date` (`date_envoi`);

--
-- Index pour la table `messages_contact`
--
ALTER TABLE `messages_contact`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`);

--
-- Index pour la table `panier`
--
ALTER TABLE `panier`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Index pour la table `propositions_creneau`
--
ALTER TABLE `propositions_creneau`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `praticien_id` (`praticien_id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Index pour la table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `categorie_id` (`categorie_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `avis`
--
ALTER TABLE `avis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `categories_services`
--
ALTER TABLE `categories_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `disponibilites`
--
ALTER TABLE `disponibilites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT pour la table `faq`
--
ALTER TABLE `faq`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `messages_chat`
--
ALTER TABLE `messages_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `messages_contact`
--
ALTER TABLE `messages_contact`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT pour la table `panier`
--
ALTER TABLE `panier`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `propositions_creneau`
--
ALTER TABLE `propositions_creneau`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `avis`
--
ALTER TABLE `avis`
  ADD CONSTRAINT `avis_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avis_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avis_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `disponibilites`
--
ALTER TABLE `disponibilites`
  ADD CONSTRAINT `disponibilites_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages_chat`
--
ALTER TABLE `messages_chat`
  ADD CONSTRAINT `messages_chat_ibfk_1` FOREIGN KEY (`expediteur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_chat_ibfk_2` FOREIGN KEY (`destinataire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `panier`
--
ALTER TABLE `panier`
  ADD CONSTRAINT `panier_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `panier_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `propositions_creneau`
--
ALTER TABLE `propositions_creneau`
  ADD CONSTRAINT `propositions_creneau_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `propositions_creneau_ibfk_2` FOREIGN KEY (`praticien_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `services_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `categories_services` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
