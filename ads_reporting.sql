-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 11, 2025 at 08:52 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ads reporting`
--

-- --------------------------------------------------------

--
-- Table structure for table `campaign`
--

CREATE TABLE `campaign` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Persona` varchar(255) DEFAULT NULL,
  `Gender` set('Male','Female') DEFAULT NULL,
  `Age` int(10) UNSIGNED DEFAULT NULL,
  `Locations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Locations`)),
  `Creatives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Creatives`)),
  `CampaignTypeId` int(11) NOT NULL,
  `Brand` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `StartDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `persona` text DEFAULT NULL COMMENT 'Multiple selections stored as JSON array',
  `gender` text DEFAULT NULL COMMENT 'Multiple selections stored as JSON array',
  `age` int(11) DEFAULT NULL,
  `location` text DEFAULT NULL COMMENT 'Multiple selections stored as JSON array',
  `creatives` enum('video','image','carousel','collection') DEFAULT 'image',
  `is_enabled` tinyint(1) DEFAULT 1 COMMENT 'Enable/Disable toggle',
  `campaign_type_id` int(11) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaigns`
--

INSERT INTO `campaigns` (`id`, `name`, `persona`, `gender`, `age`, `location`, `creatives`, `is_enabled`, `campaign_type_id`, `brand`, `created_by`, `created_at`, `updated_at`) VALUES
(20, 'AamirS Campaign', '\"[\\\"Young Adults (18-25)\\\",\\\"Entrepreneurs\\\"]\"', '\"[\\\"male\\\",\\\"female\\\"]\"', 40, 'Abu Hail,', 'image', 1, 21, 'Nike', NULL, '2025-09-10 20:36:10', '2025-09-10 20:36:10'),
(22, 'ALTHAF', 'Mid Age , Youngester', '\"[\\\"male\\\",\\\"female\\\"]\"', 70, 'India,Pakistan', 'image', 1, 21, 'Nike', NULL, '2025-09-11 06:27:58', '2025-09-11 06:28:12');

-- --------------------------------------------------------

--
-- Table structure for table `campaign_data`
--

CREATE TABLE `campaign_data` (
  `id` int(11) NOT NULL,
  `campaign_id` int(11) NOT NULL,
  `facebook_result` int(11) DEFAULT 0,
  `xoho_result` int(11) DEFAULT 0,
  `spent` decimal(15,2) DEFAULT 0.00,
  `data_date` date DEFAULT (curdate() - interval 1 day) COMMENT 'Default to yesterday',
  `card_id` int(11) DEFAULT NULL,
  `card_name` varchar(255) DEFAULT NULL COMMENT 'Denormalized for quick access',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaign_data`
--

INSERT INTO `campaign_data` (`id`, `campaign_id`, `facebook_result`, `xoho_result`, `spent`, `data_date`, `card_id`, `card_name`, `created_by`, `created_at`, `updated_at`) VALUES
(59, 20, 400, 200, 600.00, '2025-09-10', 13, NULL, NULL, '2025-09-11 06:39:22', '2025-09-11 06:39:22');

-- --------------------------------------------------------

--
-- Table structure for table `campaign_types`
--

CREATE TABLE `campaign_types` (
  `id` int(11) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaign_types`
--

INSERT INTO `campaign_types` (`id`, `type_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(19, 'Test Campaign', 'Just testing', 1, '2025-09-10 12:50:09', '2025-09-10 12:58:57'),
(20, 'Deactivate', 'check', 1, '2025-09-10 12:58:39', '2025-09-10 12:58:39'),
(21, 'Fb', 'Facebook', 1, '2025-09-10 17:43:53', '2025-09-10 17:43:53');

-- --------------------------------------------------------

--
-- Table structure for table `cards`
--

CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `card_name` varchar(255) NOT NULL,
  `card_number_last4` varchar(4) DEFAULT NULL COMMENT 'Last 4 digits for identification',
  `card_type` varchar(50) DEFAULT NULL COMMENT 'e.g., Visa, MasterCard, Amex',
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `credit_limit` decimal(15,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cards`
--

INSERT INTO `cards` (`id`, `card_name`, `card_number_last4`, `card_type`, `current_balance`, `credit_limit`, `is_active`, `created_at`, `updated_at`) VALUES
(13, 'Aamir Card', '1234', 'Visa', 2000.00, NULL, 1, '2025-09-10 13:51:29', '2025-09-10 13:51:29'),
(14, 'New Card', '2341', 'Master', 2086.25, NULL, 1, '2025-09-10 14:00:15', '2025-09-11 06:52:17');

-- --------------------------------------------------------

--
-- Table structure for table `card_users`
--

CREATE TABLE `card_users` (
  `id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_date` date DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `card_users`
--

INSERT INTO `card_users` (`id`, `card_id`, `user_id`, `assigned_date`, `is_primary`, `created_at`, `updated_at`) VALUES
(2, 14, 14, '2025-09-10', 0, '2025-09-10 20:20:38', '2025-09-10 20:20:38');

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `module_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `can_get` tinyint(1) DEFAULT 0 COMMENT 'Read/View permission',
  `can_post` tinyint(1) DEFAULT 0 COMMENT 'Create permission',
  `can_put` tinyint(1) DEFAULT 0 COMMENT 'Update/Edit permission',
  `can_delete` tinyint(1) DEFAULT 0 COMMENT 'Delete permission',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `report_date` date NOT NULL,
  `report_month` varchar(7) DEFAULT NULL COMMENT 'Format: YYYY-MM',
  `campaign_id` int(11) NOT NULL,
  `campaign_name` varchar(255) DEFAULT NULL COMMENT 'Denormalized for performance',
  `campaign_type` varchar(100) DEFAULT NULL COMMENT 'Denormalized for performance',
  `brand` varchar(255) DEFAULT NULL COMMENT 'Denormalized for performance',
  `leads` int(11) DEFAULT 0,
  `facebook_result` int(11) DEFAULT 0,
  `zoho_result` int(11) DEFAULT 0,
  `spent` decimal(15,2) DEFAULT 0.00,
  `cost_per_lead` decimal(10,2) GENERATED ALWAYS AS (case when `leads` > 0 then `spent` / `leads` else NULL end) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'super_admin', 'Super Administrator with full system access and management capabilities', 1, '2025-09-08 08:42:00', '2025-09-08 08:42:00'),
(2, 'admin', 'Administrator with full access to manage users, ads, and reports', 1, '2025-09-08 08:42:00', '2025-09-08 08:42:00'),
(3, 'manager', 'Manager with access to view and manage ads and reports for their team', 1, '2025-09-08 08:42:00', '2025-09-08 08:42:00'),
(4, 'user', 'Regular user with access to create and manage their own ads and reports', 1, '2025-09-08 08:42:00', '2025-09-08 08:42:00'),
(5, 'viewer', 'Read-only access to view ads and reports', 1, '2025-09-08 08:42:00', '2025-09-08 08:42:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `auth_token` varchar(255) DEFAULT NULL COMMENT 'Google Authenticator token/secret',
  `twofa_enabled` tinyint(1) DEFAULT 0,
  `twofa_secret` varchar(255) DEFAULT NULL,
  `twofa_verified_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_2fa_enabled` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(32) DEFAULT NULL,
  `two_factor_backup_codes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts with Two-Factor Authentication support';

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `hashed_password`, `role_id`, `auth_token`, `twofa_enabled`, `twofa_secret`, `twofa_verified_at`, `is_active`, `last_login`, `created_at`, `updated_at`, `is_2fa_enabled`, `two_factor_secret`, `two_factor_backup_codes`) VALUES
(13, 'aamir', '$2b$12$KNf4/.iEuNGq0HY7g/asCevlZuxrnQ8I9z65Pu88ehXwHmmXHPMPq', 2, NULL, 0, NULL, NULL, 1, NULL, '2025-09-10 18:56:45', '2025-09-10 18:56:45', 0, NULL, NULL),
(14, 'ahmed', '$2b$12$f0pZSkdc7MUk7hDrPrjXJ.tOc2ldNxAfKExYBEM/oH3jyr07b6.gG', 2, NULL, 0, NULL, NULL, 1, '2025-09-11 06:50:15', '2025-09-10 19:40:49', '2025-09-11 06:50:15', 0, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `campaign`
--
ALTER TABLE `campaign`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_campaign_type` (`CampaignTypeId`),
  ADD KEY `idx_name` (`Name`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_campaign_name` (`name`),
  ADD KEY `idx_brand` (`brand`),
  ADD KEY `idx_campaign_type` (`campaign_type_id`),
  ADD KEY `idx_enabled` (`is_enabled`);

--
-- Indexes for table `campaign_data`
--
ALTER TABLE `campaign_data`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_campaign_date` (`campaign_id`,`data_date`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_data_date` (`data_date`),
  ADD KEY `idx_card_id` (`card_id`);

--
-- Indexes for table `campaign_types`
--
ALTER TABLE `campaign_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `type_name` (`type_name`),
  ADD KEY `idx_type_name` (`type_name`);

--
-- Indexes for table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `card_name` (`card_name`),
  ADD KEY `idx_card_name` (`card_name`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `card_users`
--
ALTER TABLE `card_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_card_user` (`card_id`,`user_id`),
  ADD KEY `idx_card_id` (`card_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module_name` (`module_name`),
  ADD KEY `idx_module_name` (`module_name`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_module` (`role_id`,`module_id`),
  ADD KEY `idx_role_id` (`role_id`),
  ADD KEY `idx_module_id` (`module_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_report_day_campaign` (`report_date`,`campaign_id`),
  ADD KEY `idx_report_date` (`report_date`),
  ADD KEY `idx_report_month` (`report_month`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_brand` (`brand`),
  ADD KEY `idx_date_campaign` (`report_date`,`campaign_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`name`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_role_name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_role_id` (`role_id`),
  ADD KEY `idx_users_twofa_enabled` (`twofa_enabled`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `campaign`
--
ALTER TABLE `campaign`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `campaign_data`
--
ALTER TABLE `campaign_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `campaign_types`
--
ALTER TABLE `campaign_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `card_users`
--
ALTER TABLE `card_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `campaign`
--
ALTER TABLE `campaign`
  ADD CONSTRAINT `fk_campaign_type` FOREIGN KEY (`CampaignTypeId`) REFERENCES `campaign_types` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`campaign_type_id`) REFERENCES `campaign_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `campaigns_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `campaign_data`
--
ALTER TABLE `campaign_data`
  ADD CONSTRAINT `campaign_data_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaign_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `campaign_data_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `campaign_data_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_campaign_data_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `card_users`
--
ALTER TABLE `card_users`
  ADD CONSTRAINT `card_users_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `card_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
