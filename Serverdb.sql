deployer@vultr:~/Ads-Management-Fresh$ zcat /home/deployer/ads_management_20251024_154337.sql.gz
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: ads_management
-- ------------------------------------------------------
-- Server version       8.0.43-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `ads_management`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ads_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `ads_management`;

--
-- Table structure for table `ads_managers`
--

DROP TABLE IF EXISTS `ads_managers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads_managers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bm_id` int NOT NULL,
  `ads_manager_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('enabled','disabled','suspended_temporarily') COLLATE utf8mb4_general_ci DEFAULT 'enabled',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ads_manager_per_bm` (`bm_id`,`ads_manager_name`),
  KEY `idx_ads_manager_bm_id` (`bm_id`),
  KEY `idx_ads_manager_status` (`status`),
  KEY `idx_ads_manager_created_by` (`created_by`),
  KEY `idx_ads_manager_name` (`ads_manager_name`),
  KEY `idx_ads_manager_email` (`email`),
  CONSTRAINT `ads_managers_ibfk_1` FOREIGN KEY (`bm_id`) REFERENCES `bm` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads_managers`
--

LOCK TABLES `ads_managers` WRITE;
/*!40000 ALTER TABLE `ads_managers` DISABLE KEYS */;
/*!40000 ALTER TABLE `ads_managers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bm`
--

DROP TABLE IF EXISTS `bm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bm` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bm_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('enabled','disabled','suspended_temporarily') COLLATE utf8mb4_general_ci DEFAULT 'enabled',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bm_email` (`email`),
  KEY `idx_bm_status` (`status`),
  KEY `idx_bm_created_by` (`created_by`),
  KEY `idx_bm_email` (`email`),
  KEY `idx_bm_name` (`bm_name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bm`
--

LOCK TABLES `bm` WRITE;
/*!40000 ALTER TABLE `bm` DISABLE KEYS */;
/*!40000 ALTER TABLE `bm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_updated_by` (`updated_by`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (61,'BazaarFX','',1,35,NULL,'2025-10-23 08:48:33','2025-10-23 08:48:33'),(62,'Tradekaro','',1,35,NULL,'2025-10-23 08:48:37','2025-10-23 08:48:37'),(63,'Tradebazaar','',1,35,NULL,'2025-10-23 08:48:42','2025-10-23 08:48:42');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaign`
--

DROP TABLE IF EXISTS `campaign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Persona` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gender` set('Male','Female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Age` int unsigned DEFAULT NULL,
  `Locations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `Creatives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `CampaignTypeId` int NOT NULL,
  `Brand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `StartDate` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_campaign_type` (`CampaignTypeId`),
  KEY `idx_name` (`Name`),
  CONSTRAINT `fk_campaign_type` FOREIGN KEY (`CampaignTypeId`) REFERENCES `campaign_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `campaign_chk_1` CHECK (json_valid(`Locations`)),
  CONSTRAINT `campaign_chk_2` CHECK (json_valid(`Creatives`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaign`
--

LOCK TABLES `campaign` WRITE;
/*!40000 ALTER TABLE `campaign` DISABLE KEYS */;
/*!40000 ALTER TABLE `campaign` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaign_data`
--

DROP TABLE IF EXISTS `campaign_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` int NOT NULL,
  `facebook_result` int DEFAULT '0',
  `xoho_result` int DEFAULT '0',
  `spent` decimal(15,2) DEFAULT '0.00',
  `data_date` date DEFAULT ((curdate() - interval 1 day)) COMMENT 'Default to yesterday',
  `card_id` int DEFAULT NULL,
  `card_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Denormalized for quick access',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_data_date` (`data_date`),
  KEY `idx_card_id` (`card_id`),
  CONSTRAINT `campaign_data_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `campaign_data_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_campaign_data_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaign_data`
--

LOCK TABLES `campaign_data` WRITE;
/*!40000 ALTER TABLE `campaign_data` DISABLE KEYS */;
INSERT INTO `campaign_data` VALUES (125,93,21,15,550.71,'2025-10-22',66,'Zainab4700',77,'2025-10-24 09:27:15','2025-10-24 09:27:33'),(126,93,17,11,547.84,'2025-10-23',66,'Zainab4700',77,'2025-10-24 09:31:05','2025-10-24 09:54:36'),(127,94,79,71,565.82,'2025-10-22',64,'Zainab3050',77,'2025-10-24 09:32:42','2025-10-24 09:32:42'),(128,94,71,68,574.70,'2025-10-23',64,'Zainab3050',77,'2025-10-24 09:33:29','2025-10-24 09:33:29'),(129,95,61,57,593.22,'2025-10-22',64,'Zainab3050',77,'2025-10-24 09:35:59','2025-10-24 09:36:10'),(130,95,56,57,565.06,'2025-10-23',64,'Zainab3050',77,'2025-10-24 09:37:04','2025-10-24 09:37:04'),(131,96,37,33,601.26,'2025-10-22',68,'Zainab3272',77,'2025-10-24 09:38:54','2025-10-24 09:38:54'),(132,96,23,24,575.55,'2025-10-23',68,'Zainab3272',77,'2025-10-24 09:40:00','2025-10-24 09:40:00'),(133,97,35,25,501.61,'2025-10-22',67,'Zainab0319',77,'2025-10-24 09:41:34','2025-10-24 09:41:34'),(134,97,36,26,504.20,'2025-10-23',67,'Zainab0319',77,'2025-10-24 09:42:05','2025-10-24 09:42:05'),(135,98,39,17,954.12,'2025-10-22',67,'Zainab0319',77,'2025-10-24 09:42:51','2025-10-24 09:42:51'),(136,98,69,34,973.65,'2025-10-23',67,'Zainab0319',77,'2025-10-24 09:43:11','2025-10-24 09:44:08'),(137,99,21,19,849.31,'2025-10-22',67,'Zainab0319',77,'2025-10-24 09:45:31','2025-10-24 09:45:31'),(138,100,78,75,715.97,'2025-10-22',64,'Zainab3050',77,'2025-10-24 09:46:30','2025-10-24 09:46:30'),(139,100,116,107,749.03,'2025-10-23',64,'Zainab3050',77,'2025-10-24 09:47:00','2025-10-24 09:47:00'),(140,101,64,31,641.79,'2025-10-22',67,'Zainab0319',77,'2025-10-24 09:47:47','2025-10-24 09:47:47'),(141,101,88,38,699.24,'2025-10-23',67,'Zainab0319',77,'2025-10-24 09:48:20','2025-10-24 09:48:20'),(142,102,24,24,305.91,'2025-10-23',66,'Zainab4700',77,'2025-10-24 09:52:04','2025-10-24 09:52:04'),(143,103,4,4,248.91,'2025-10-23',66,'Zainab4700',77,'2025-10-24 09:58:02','2025-10-24 09:58:02'),(144,104,57,0,966.00,'2025-10-23',72,'Abeera',78,'2025-10-24 10:45:04','2025-10-24 10:45:04'),(145,105,23,0,638.00,'2025-10-23',74,'Abeera 0418',78,'2025-10-24 10:50:29','2025-10-24 10:50:29'),(146,105,3,0,137.00,'2025-10-24',74,'Abeera 0418',78,'2025-10-24 10:51:20','2025-10-24 10:52:10'),(147,106,84,35,481.00,'2025-10-23',74,'Abeera 0418',78,'2025-10-24 10:57:52','2025-10-24 13:29:36'),(148,106,21,0,80.00,'2025-10-24',74,'Abeera 0418',78,'2025-10-24 10:58:32','2025-10-24 10:58:32'),(149,107,13,0,178.00,'2025-10-24',74,'Abeera 0418',78,'2025-10-24 11:00:03','2025-10-24 11:00:03'),(150,108,44,0,975.00,'2025-10-23',73,'Abeera 7142',78,'2025-10-24 11:02:53','2025-10-24 11:02:53'),(151,109,44,42,861.00,'2025-10-23',74,'Abeera 0418',78,'2025-10-24 11:07:33','2025-10-24 13:17:12'),(152,110,47,45,990.00,'2025-10-23',72,'Abeera',78,'2025-10-24 11:12:02','2025-10-24 13:30:33'),(153,111,33,0,962.00,'2025-10-23',75,'Abeera 9177',78,'2025-10-24 11:17:50','2025-10-24 11:17:50'),(154,113,8,0,144.00,'2025-10-23',75,'Abeera 9177',78,'2025-10-24 11:24:30','2025-10-24 11:24:30'),(155,114,29,0,684.00,'2025-10-23',78,'Asifa Ansari 4878',79,'2025-10-24 13:09:05','2025-10-24 13:09:05'),(156,115,129,0,1167.91,'2025-10-23',78,'Asifa Ansari 4878',79,'2025-10-24 13:16:37','2025-10-24 13:16:37');
/*!40000 ALTER TABLE `campaign_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaign_types`
--

DROP TABLE IF EXISTS `campaign_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL COMMENT 'User who created this record',
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`),
  KEY `idx_type_name` (`type_name`),
  KEY `fk_campaign_types_created_by` (`created_by`),
  CONSTRAINT `fk_campaign_types_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaign_types`
--

LOCK TABLES `campaign_types` WRITE;
/*!40000 ALTER TABLE `campaign_types` DISABLE KEYS */;
INSERT INTO `campaign_types` VALUES (61,'Meta Leads','',1,'2025-10-23 08:53:50','2025-10-23 08:53:50',NULL),(62,'Meta Leads Messenger','',1,'2025-10-23 08:54:07','2025-10-23 08:54:07',NULL),(63,'WhatsApp','',1,'2025-10-23 08:54:14','2025-10-23 08:54:14',NULL),(64,'Meta Landing Page','',1,'2025-10-23 08:54:23','2025-10-23 08:54:23',NULL);
/*!40000 ALTER TABLE `campaign_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `persona` text COLLATE utf8mb4_unicode_ci COMMENT 'Multiple selections stored as JSON array',
  `gender` text COLLATE utf8mb4_unicode_ci COMMENT 'Multiple selections stored as JSON array',
  `min_age` int DEFAULT NULL,
  `max_age` int DEFAULT NULL,
  `location` text COLLATE utf8mb4_unicode_ci COMMENT 'Multiple selections stored as JSON array',
  `creatives` enum('video','image','carousel','collection') COLLATE utf8mb4_unicode_ci DEFAULT 'image',
  `is_enabled` tinyint(1) DEFAULT '1' COMMENT 'Enable/Disable toggle',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `campaign_type_id` int DEFAULT NULL,
  `brand` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_campaign_name` (`name`),
  KEY `idx_brand` (`brand`),
  KEY `idx_campaign_type` (`campaign_type_id`),
  KEY `idx_enabled` (`is_enabled`),
  CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`campaign_type_id`) REFERENCES `campaign_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `campaigns_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES (93,'T K- T G | L. F | 16. 10','[\"Financial Market\",\"Mutual Fund\",\"Stock Exchange\",\"Stock Market\",\"Share\",\"National Stock Exchange of India\"]','[\"Male\"]',25,54,NULL,'image',1,'active',62,62,77,'2025-10-23 09:14:52','2025-10-23 09:17:35'),(94,'Leads | TK | TG | 29.08','[\"Financial Market\",\"Stock Market\",\"National Stock Exchange of India\"]','[\"Male\"]',25,50,'[\"Telangana\"]','image',1,'active',61,62,77,'2025-10-23 09:19:56','2025-10-23 09:19:56'),(95,'Leads | TK-AP | 29.08',NULL,'[\"Male\"]',25,50,'[\"Andhra Pradesh\"]','image',1,'active',61,62,77,'2025-10-23 09:21:35','2025-10-23 09:21:35'),(96,'T K- Tamil | Lead | 26. 09','[\"Financial Market\",\"Stock Market\",\"Share\"]','[\"Male\"]',24,51,'[\"Tamil Nadu\"]','image',1,'active',61,62,77,'2025-10-23 09:24:06','2025-10-23 09:24:06'),(97,'T K- Kannada | L. F | 16. 10','[\"Financial Market\",\"Mutual Fund\",\"Security\",\"Stock\",\"Stock Market\",\"Share\",\"National Stock Exchange of India\",\"EToro\",\"Plus500\"]','[\"Male\"]',25,51,'[\"Karnataka\"]','image',0,'active',62,62,77,'2025-10-23 09:25:30','2025-10-24 10:57:36'),(98,'T K- T G | L. F- Reel | 17. 10','[\"Stock Market Index\",\"Financial Market\",\"MarketWatch\",\"Stock Market\",\"Share\",\"Investor\",\"Investing.com\"]','[\"Male\"]',25,53,NULL,'image',0,'active',62,62,77,'2025-10-23 09:30:48','2025-10-24 10:57:21'),(99,'T K- A P | L. F- Reel | 17. 10','[\"Investopedia\",\"Mutu Fund\",\"Stock Exchange\",\"National Stock Exchange of India\",\"EToro\",\"BSE SENSEX\",\"Plus500\"]',NULL,24,54,NULL,'image',0,'active',62,62,77,'2025-10-23 09:34:07','2025-10-23 09:34:19'),(100,'Beefx-North & West | Lead | 09-10','[\"Financial Market\",\"Stock Market\",\"National Stock Exchange of India\"]','[\"Male\"]',25,55,'[\"Delhi\",\"Gujarat\",\"Haryana\"]','image',1,'active',61,61,77,'2025-10-23 09:36:10','2025-10-23 09:36:10'),(101,'Bfx- G J | Lead- Reel | 15. 10','[\"Financial Market\",\"StockBroker\",\"Meta Trader 4\",\"Stock Market\",\"Share\",\"National Stock Exchange of India\",\"EToro\",\"Plus500\"]','[\"Male\"]',25,53,'[\"Ahmedabad\",\"Rajkot\",\"Surat\",\"Vadodara Gujarat\"]','video',1,'active',62,61,77,'2025-10-23 09:36:58','2025-10-23 09:39:27'),(102,'T K- K A | L. F- Reel | 23. 10','[\"Financial Market\",\"FxPro\",\"Stock Market\",\"National Stock Exchange of India\",\"Plus500\"]','[\"Male\"]',25,53,'[\"Karnataka\"]','video',1,'active',61,62,77,'2025-10-24 09:51:24','2025-10-24 09:51:24'),(103,'TK-Kannada | L.F-Reel | 23-10','[\"Financial Market\",\"FxPro\",\"Stock Market\",\"Share\",\"National Stock Exchange of India\",\"Gold\"]','[\"Male\"]',25,55,'[\"Karnataka\"]','video',1,'active',61,62,77,'2025-10-24 09:57:29','2025-10-24 09:57:29'),(104,'bfx_city_22/9_hindi',NULL,'[\"Male\"]',25,50,NULL,'video',1,'active',64,61,78,'2025-10-24 10:02:45','2025-10-24 10:02:45'),(105,'Bazaarfx_fbphindi_23/10',NULL,'[\"Male\"]',25,55,NULL,'video',1,'active',64,61,78,'2025-10-24 10:48:49','2025-10-24 10:48:49'),(106,'Tradekaro_tamil_23/10_Message',NULL,'[\"Male\"]',25,50,NULL,'image',1,'active',62,62,78,'2025-10-24 10:56:47','2025-10-24 10:56:47'),(107,'Tradekaro_tamil_24/10_Message -',NULL,NULL,25,50,NULL,'image',1,'active',62,62,78,'2025-10-24 10:59:46','2025-10-24 10:59:46'),(108,'BFX_HINDI_17/9',NULL,NULL,25,55,NULL,'video',1,'active',64,61,78,'2025-10-24 11:01:52','2025-10-24 11:01:52'),(109,'Tradekarolearn.23/10-telgu',NULL,'[\"Male\"]',25,50,NULL,'image',1,'active',64,62,78,'2025-10-24 11:06:30','2025-10-24 11:06:30'),(110,'Tk_learn_Telgu_22/8_N',NULL,'[\"Male\"]',25,50,NULL,'image',1,'active',64,62,78,'2025-10-24 11:11:19','2025-10-24 11:11:19'),(111,'BFX_Hindi_18/10',NULL,NULL,25,50,NULL,'video',1,'active',64,61,78,'2025-10-24 11:17:13','2025-10-24 11:17:13'),(112,'Bfx_20/10_city',NULL,'[\"Male\"]',25,60,NULL,'image',1,'active',64,61,78,'2025-10-24 11:20:16','2025-10-24 11:20:16'),(113,'tradekaro-lead message_23/10',NULL,'[\"Male\"]',25,50,NULL,'image',1,'active',64,62,78,'2025-10-24 11:22:48','2025-10-24 11:23:11'),(114,'Bazaarfx_GJ | 23/09 | LPV',NULL,'[\"Male\"]',25,50,NULL,'video',1,'active',64,61,79,'2025-10-24 13:05:40','2025-10-24 13:05:40'),(115,'Lead_Beefx_MP | 18/10',NULL,'[\"Male\"]',25,50,NULL,'image',1,'active',62,61,79,'2025-10-24 13:14:30','2025-10-24 13:14:30');
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_users`
--

DROP TABLE IF EXISTS `card_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assigned_date` date DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL COMMENT 'User who created this record',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_card_user` (`card_id`,`user_id`),
  KEY `idx_card_id` (`card_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `fk_card_users_created_by` (`created_by`),
  CONSTRAINT `card_users_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_card_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_users`
--

LOCK TABLES `card_users` WRITE;
/*!40000 ALTER TABLE `card_users` DISABLE KEYS */;
INSERT INTO `card_users` VALUES (42,64,77,'2025-10-23',0,'2025-10-23 09:40:52','2025-10-23 15:24:41',NULL),(43,65,77,'2025-10-23',0,'2025-10-23 09:43:11','2025-10-23 09:43:11',NULL),(44,66,77,'2025-10-23',0,'2025-10-23 09:43:37','2025-10-23 09:43:37',NULL),(45,67,77,'2025-10-23',0,'2025-10-23 09:43:58','2025-10-23 09:43:58',NULL),(46,68,77,'2025-10-23',0,'2025-10-23 09:44:20','2025-10-23 09:44:20',NULL),(47,69,77,'2025-10-23',0,'2025-10-23 09:45:07','2025-10-23 09:45:07',NULL),(48,70,77,'2025-10-23',0,'2025-10-23 09:45:33','2025-10-23 09:45:33',NULL),(49,71,77,'2025-10-23',0,'2025-10-23 09:45:53','2025-10-23 09:45:53',NULL),(50,72,78,'2025-10-24',1,'2025-10-24 10:23:44','2025-10-24 10:23:44',NULL),(51,73,78,'2025-10-24',0,'2025-10-24 10:26:00','2025-10-24 10:26:00',NULL),(52,74,78,'2025-10-24',0,'2025-10-24 10:26:36','2025-10-24 10:26:36',NULL),(53,75,78,'2025-10-24',0,'2025-10-24 10:27:06','2025-10-24 10:27:06',NULL),(54,76,78,'2025-10-24',0,'2025-10-24 10:27:39','2025-10-24 10:27:39',NULL),(55,77,79,'2025-10-24',1,'2025-10-24 11:14:10','2025-10-24 11:14:10',NULL),(56,78,79,'2025-10-24',0,'2025-10-24 11:16:28','2025-10-24 11:16:28',NULL),(57,79,79,'2025-10-24',0,'2025-10-24 11:17:32','2025-10-24 11:17:32',NULL),(58,80,79,'2025-10-24',0,'2025-10-24 11:18:46','2025-10-24 11:18:46',NULL),(59,81,79,'2025-10-24',0,'2025-10-24 11:19:48','2025-10-24 11:19:48',NULL);
/*!40000 ALTER TABLE `card_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cards`
--

DROP TABLE IF EXISTS `cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_number_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Last 4 digits for identification',
  `card_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., Visa, MasterCard, Amex',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `credit_limit` decimal(15,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_name` (`card_name`),
  KEY `idx_card_name` (`card_name`),
  KEY `idx_active` (`is_active`),
  KEY `fk_cards_created_by` (`created_by`),
  CONSTRAINT `fk_cards_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cards`
--

LOCK TABLES `cards` WRITE;
/*!40000 ALTER TABLE `cards` DISABLE KEYS */;
INSERT INTO `cards` VALUES (64,'Zainab3050','3050','VISA',3029.20,NULL,1,77,'2025-10-23 09:40:52','2025-10-23 09:44:29'),(65,'Zainab0350','0350','VISA',3029.20,NULL,1,77,'2025-10-23 09:43:11','2025-10-23 09:43:11'),(66,'Zainab4700','4700','VISA',3029.20,NULL,1,77,'2025-10-23 09:43:37','2025-10-23 09:43:37'),(67,'Zainab0319','0319','VISA',3029.20,NULL,1,77,'2025-10-23 09:43:58','2025-10-23 09:43:58'),(68,'Zainab3272','3272','VISA',3029.20,NULL,1,77,'2025-10-23 09:44:20','2025-10-23 09:44:20'),(69,'Bhumika6464','6464','VISA',96.68,NULL,1,77,'2025-10-23 09:45:07','2025-10-23 09:45:07'),(70,'Bhumika8684','8684','VISA',96.68,NULL,1,77,'2025-10-23 09:45:33','2025-10-23 09:45:33'),(71,'Bhumika1675','1675','VISA',96.68,NULL,1,77,'2025-10-23 09:45:53','2025-10-23 09:45:53'),(72,'Abeera','9070','Reddot',0.00,NULL,1,78,'2025-10-24 10:23:44','2025-10-24 10:23:44'),(73,'Abeera 7142','7142','Reddot',0.00,NULL,1,78,'2025-10-24 10:26:00','2025-10-24 10:26:00'),(74,'Abeera 0418','0418','Reddot',0.00,NULL,1,78,'2025-10-24 10:26:36','2025-10-24 10:26:36'),(75,'Abeera 9177','9177','Reddot',0.00,NULL,1,78,'2025-10-24 10:27:06','2025-10-24 10:27:06'),(76,'Abeera 9923','9923','Reddot',0.00,NULL,1,78,'2025-10-24 10:27:39','2025-10-24 10:27:39'),(77,'Asifa Ansari 4787','4787','Redot',0.00,NULL,1,79,'2025-10-24 11:14:10','2025-10-24 11:20:22'),(78,'Asifa Ansari 4878','4878','Redot',0.00,NULL,1,79,'2025-10-24 11:16:28','2025-10-24 11:16:28'),(79,'Asifa Ansari 2703','2703','Redot',0.00,NULL,1,79,'2025-10-24 11:17:32','2025-10-24 11:17:32'),(80,'Asifa Ansari 5173','5173','Redot',0.00,NULL,1,79,'2025-10-24 11:18:46','2025-10-24 11:18:46'),(81,'Asifa Ansari 9247','9247','Redot',0.00,NULL,1,79,'2025-10-24 11:19:48','2025-10-24 11:19:48');
/*!40000 ALTER TABLE `cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facebook_accounts`
--

DROP TABLE IF EXISTS `facebook_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facebook_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `authenticator` text COLLATE utf8mb4_general_ci,
  `phone_number` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_image_path` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('enabled','disabled','suspended_temporarily') COLLATE utf8mb4_general_ci DEFAULT 'enabled',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_facebook_accounts_email` (`email`),
  KEY `idx_facebook_accounts_status` (`status`),
  KEY `idx_facebook_accounts_created_by` (`created_by`),
  CONSTRAINT `facebook_accounts_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facebook_accounts`
--

LOCK TABLES `facebook_accounts` WRITE;
/*!40000 ALTER TABLE `facebook_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `facebook_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facebook_pages`
--

DROP TABLE IF EXISTS `facebook_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facebook_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `facebook_account_id` int NOT NULL,
  `page_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `page_description` text COLLATE utf8mb4_general_ci,
  `status` enum('enabled','disabled','suspended_temporarily') COLLATE utf8mb4_general_ci DEFAULT 'enabled',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page_per_account` (`facebook_account_id`,`page_name`),
  KEY `idx_facebook_pages_account_id` (`facebook_account_id`),
  KEY `idx_facebook_pages_status` (`status`),
  KEY `idx_facebook_pages_created_by` (`created_by`),
  KEY `idx_facebook_pages_page_name` (`page_name`),
  CONSTRAINT `facebook_pages_ibfk_1` FOREIGN KEY (`facebook_account_id`) REFERENCES `facebook_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `facebook_pages_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facebook_pages`
--

LOCK TABLES `facebook_pages` WRITE;
/*!40000 ALTER TABLE `facebook_pages` DISABLE KEYS */;
/*!40000 ALTER TABLE `facebook_pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_index` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (11,'facebook_pages','Facebook Pages','Manage Facebook business pages','FileText','/facebook-pages',9,1,'2025-10-08 08:22:04','2025-10-08 10:00:01'),(12,'bm','Business Manager','Manage business managers and organizational structure','Building2','/bm',10,1,'2025-10-08 09:13:25','2025-10-08 10:00:52'),(13,'ads_managers','Ads Manager','Manage advertising managers and campaign personnel','TrendingUp','/ads-managers',11,1,'2025-10-08 09:13:25','2025-10-08 10:00:52'),(14,'facebook_accounts','Facebook Accounts','Manage Facebook advertising accounts',NULL,NULL,0,1,'2025-10-08 10:00:01','2025-10-08 10:00:01'),(15,'business_manager','Business Manager','Manage business managers and organizational structure',NULL,NULL,0,1,'2025-10-08 10:00:01','2025-10-08 10:00:01'),(16,'ads_manager','Ads Manager','Manage advertising managers and campaign personnel',NULL,NULL,0,1,'2025-10-08 10:00:52','2025-10-08 10:00:52'),(17,'Reports','Reports','Advertising campaign reports and analytics','BarChart3','/reports',0,1,'2025-10-08 19:56:12','2025-10-08 19:59:37');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Internal permission name',
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Human readable name',
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general' COMMENT 'Group permissions by category',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `module_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'users_create','Create Users','Create new user accounts','users',1,'2025-09-17 11:14:55',NULL),(2,'users_read','View Users','View user accounts and details','users',1,'2025-09-17 11:14:55',NULL),(3,'users_update','Update Users','Edit user account details','users',1,'2025-09-17 11:14:55',NULL),(4,'users_delete','Delete Users','Delete user accounts','users',1,'2025-09-17 11:14:55',NULL),(5,'users_manage_roles','Manage User Roles','Assign/remove roles from users','users',1,'2025-09-17 11:14:55',NULL),(6,'campaigns_create','Create Campaigns','Create new campaigns','campaigns',1,'2025-09-17 11:14:55',NULL),(7,'campaigns_read','View Campaigns','View campaign details','campaigns',1,'2025-09-17 11:14:55',NULL),(8,'campaigns_update','Update Campaigns','Edit campaign details','campaigns',1,'2025-09-17 11:14:55',NULL),(9,'campaigns_delete','Delete Campaigns','Delete campaigns','campaigns',1,'2025-09-17 11:14:55',NULL),(10,'campaign_data_create','Create Campaign Data','Add performance data to campaigns','campaign_data',1,'2025-09-17 11:14:55',NULL),(11,'campaign_data_read','View Campaign Data','View campaign performance data','campaign_data',1,'2025-09-17 11:14:55',NULL),(12,'campaign_data_update','Update Campaign Data','Edit campaign performance data','campaign_data',1,'2025-09-17 11:14:55',NULL),(13,'campaign_data_delete','Delete Campaign Data','Delete campaign performance data','campaign_data',1,'2025-09-17 11:14:55',NULL),(14,'reports_create','Generate Reports','Create and generate reports','reports',1,'2025-09-17 11:14:55',17),(15,'reports_read','View Reports','View existing reports','reports',1,'2025-09-17 11:14:55',17),(16,'reports_export','Export Reports','Export reports to various formats','reports',1,'2025-09-17 11:14:55',17),(17,'cards_create','Create Cards','Add new payment cards','cards',1,'2025-09-17 11:14:55',NULL),(18,'cards_read','View Cards','View payment card details','cards',1,'2025-09-17 11:14:55',NULL),(19,'cards_update','Update Cards','Edit payment card details','cards',1,'2025-09-17 11:14:55',NULL),(20,'cards_delete','Delete Cards','Delete payment cards','cards',1,'2025-09-17 11:14:55',NULL),(21,'system_settings','System Settings','Access system configuration','system',1,'2025-09-17 11:14:55',NULL),(22,'role_management','Role Management','Create and manage roles and permissions','system',1,'2025-09-17 11:14:55',NULL),(23,'campaign_types_create','Create Campaign Types','Create new campaign types','campaign_types',1,'2025-09-17 11:30:30',NULL),(24,'campaign_types_read','View Campaign Types','View campaign types','campaign_types',1,'2025-09-17 11:30:30',NULL),(25,'campaign_types_update','Update Campaign Types','Edit campaign types','campaign_types',1,'2025-09-17 11:30:30',NULL),(26,'campaign_types_delete','Delete Campaign Types','Delete campaign types','campaign_types',1,'2025-09-17 11:30:30',NULL),(27,'card_users_create','Create Card Users','Assign cards to users','card_users',1,'2025-09-17 11:30:30',NULL),(28,'card_users_read','View Card Users','View card assignments','card_users',1,'2025-09-17 11:30:30',NULL),(29,'card_users_update','Update Card Users','Edit card assignments','card_users',1,'2025-09-17 11:30:30',NULL),(30,'card_users_delete','Delete Card Users','Remove card assignments','card_users',1,'2025-09-17 11:30:30',NULL),(31,'brands_create','Create Brands','Create new brand entries','brands',1,'2025-09-17 13:05:36',NULL),(32,'brands_read','View Brands','View brand information and details','brands',1,'2025-09-17 13:05:36',NULL),(33,'brands_update','Update Brands','Edit brand information and details','brands',1,'2025-09-17 13:05:36',NULL),(34,'brands_delete','Delete Brands','Delete brand entries','brands',1,'2025-09-17 13:05:36',NULL),(35,'roles_create','Create Roles','Create new roles in the system','roles',1,'2025-09-17 13:22:42',NULL),(36,'roles_read','View Roles','View roles and their details','roles',1,'2025-09-17 13:22:42',NULL),(37,'roles_update','Update Roles','Edit existing roles','roles',1,'2025-09-17 13:22:42',NULL),(38,'roles_delete','Delete Roles','Remove roles from the system','roles',1,'2025-09-17 13:22:42',NULL),(39,'permissions_assign','Assign Permissions','Assign permissions to roles','roles',1,'2025-09-17 13:22:42',NULL),(40,'permissions_revoke','Revoke Permissions','Remove permissions from roles','roles',1,'2025-09-17 13:22:42',NULL),(41,'users_assign_roles','Assign User Roles','Assign roles to users','roles',1,'2025-09-17 13:22:42',NULL),(42,'users_revoke_roles','Revoke User Roles','Remove roles from users','roles',1,'2025-09-17 13:22:42',NULL),(43,'facebook_accounts_read','View Facebook Accounts',NULL,'Facebook Accounts',1,'2025-10-08 06:01:49',NULL),(44,'facebook_accounts_create','Create Facebook Accounts',NULL,'facebook_accounts',1,'2025-10-08 06:01:49',14),(45,'facebook_accounts_update','Update Facebook Accounts',NULL,'facebook_accounts',1,'2025-10-08 06:01:49',14),(46,'facebook_accounts_delete','Delete Facebook Accounts',NULL,'facebook_accounts',1,'2025-10-08 06:01:49',14),(51,'facebook_pages_create','Create Facebook Pages','Can create new Facebook pages','facebook_pages',1,'2025-10-08 08:11:26',11),(53,'facebook_pages_update','Update Facebook Pages','Can update Facebook page information and status','facebook_pages',1,'2025-10-08 08:11:26',11),(54,'facebook_pages_delete','Delete Facebook Pages','Can delete Facebook pages','facebook_pages',1,'2025-10-08 08:11:26',11),(55,'facebook_pages_view','View Facebook Pages','View Facebook Pages','facebook_pages',1,'2025-10-08 08:21:17',11),(65,'ads_manager_view','View Ads Managers','View Ads Managers','ads_manager',1,'2025-10-08 09:13:25',13),(66,'ads_manager_create','Create Ads Managers','Create Ads Managers','ads_manager',1,'2025-10-08 09:13:25',13),(67,'ads_manager_update','Update Ads Managers','Update Ads Managers','ads_manager',1,'2025-10-08 09:13:25',13),(68,'ads_manager_delete','Delete Ads Managers','Delete Ads Managers','ads_manager',1,'2025-10-08 09:13:25',13),(70,'facebook_accounts_view','View Facebook Accounts',NULL,'facebook_accounts',1,'2025-10-08 10:01:52',14),(72,'business_manager_view','View Business Managers',NULL,'business_manager',1,'2025-10-08 10:01:52',12),(73,'business_manager_create','Create Business Managers',NULL,'business_manager',1,'2025-10-08 10:01:52',12),(74,'business_manager_update','Update Business Managers',NULL,'business_manager',1,'2025-10-08 10:01:52',12),(75,'business_manager_delete','Delete Business Managers',NULL,'business_manager',1,'2025-10-08 10:01:52',12);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID for token identification',
  `expires_at` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_token` (`user_id`,`token_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token_id` (`token_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=832 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores refresh tokens for JWT authentication';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (4,35,'721b6392-c51c-4823-8605-ad1a4cad8401','2025-09-20 15:33:34',1,'2025-09-13 10:03:34','2025-09-13 10:03:34'),(8,35,'73eff421-cbe7-4460-977d-54457b52ca3d','2025-09-20 16:50:04',1,'2025-09-13 11:20:04','2025-09-13 11:20:04'),(11,35,'73af051c-014c-4c4a-86b4-6ec993ae3fa1','2025-09-20 16:56:42',1,'2025-09-13 11:26:42','2025-09-13 11:26:42'),(14,35,'8bd6fb3a-71e4-4b64-9e51-836b1738d3bf','2025-09-20 17:52:53',1,'2025-09-13 12:22:53','2025-09-13 12:22:53'),(15,35,'81a619d1-b009-4103-9367-a41226f6f05c','2025-09-20 17:53:09',1,'2025-09-13 12:23:09','2025-09-13 12:23:09'),(16,35,'3707f23d-5e8f-48ed-8a6c-6083fd7ef0cd','2025-09-20 17:53:32',1,'2025-09-13 12:23:32','2025-09-13 12:23:32'),(17,35,'9aa96bfc-358f-464b-98f7-0b94cc8d1021','2025-09-20 17:54:41',1,'2025-09-13 12:24:41','2025-09-13 12:24:41'),(18,35,'cb33b3e6-e0d5-423d-932f-f91d842af591','2025-09-20 17:55:04',1,'2025-09-13 12:25:04','2025-09-13 12:25:04'),(19,35,'9cbcea25-9594-4863-a328-00113c31241b','2025-09-20 17:56:31',1,'2025-09-13 12:26:31','2025-09-13 12:26:31'),(20,35,'05a987a5-113c-42b4-8473-b05adb75244b','2025-09-20 18:01:20',1,'2025-09-13 12:31:20','2025-09-13 12:31:20'),(21,35,'a5729c8b-f414-4244-9b60-7db02747dea3','2025-09-20 18:02:47',1,'2025-09-13 12:32:47','2025-09-13 12:32:47'),(22,35,'ad60bfab-5e06-4d07-bb5b-07ca8ee3b92e','2025-09-20 18:04:24',1,'2025-09-13 12:34:24','2025-09-13 12:34:24'),(23,35,'6eb6c87e-0dce-41cf-ad0c-774da7e28cbe','2025-09-20 18:07:22',1,'2025-09-13 12:37:22','2025-09-13 12:37:22'),(24,35,'ed47325d-226b-4437-ae88-8b40765b6477','2025-09-20 18:08:52',1,'2025-09-13 12:38:52','2025-09-13 12:38:52'),(27,35,'980db302-2a4a-497e-b142-4a1c114d655c','2025-09-20 18:20:14',1,'2025-09-13 12:50:14','2025-09-13 12:50:14'),(35,35,'174e3102-8ccd-4da2-8eea-5205112f8da9','2025-09-20 18:50:45',1,'2025-09-13 13:20:45','2025-09-13 13:20:45'),(37,35,'95f9fc7d-cc33-4f59-af66-3b365e3f8793','2025-09-20 18:54:49',1,'2025-09-13 13:24:49','2025-09-13 13:24:49'),(47,35,'93109ae0-b2bb-4543-8975-4c7191d53c7f','2025-09-20 19:13:44',1,'2025-09-13 13:43:44','2025-09-13 13:43:44'),(48,35,'52eaeada-5148-4df1-9391-f46f1c01c3cf','2025-09-20 19:18:38',1,'2025-09-13 13:48:38','2025-09-13 13:48:38'),(49,35,'a1c2989c-ef99-47f1-a103-a42ac4204f0d','2025-09-20 19:18:51',1,'2025-09-13 13:48:51','2025-09-13 13:48:51'),(50,35,'80cc491a-194d-4eb7-a146-2a9d55961a37','2025-09-20 19:19:03',1,'2025-09-13 13:49:03','2025-09-13 13:49:03'),(51,35,'a31b920f-f216-4cf7-86ce-402adda57569','2025-09-20 19:34:25',1,'2025-09-13 14:04:25','2025-09-13 14:04:25'),(52,35,'c55c3df2-baf4-4581-8be6-0b2bcc9c6f40','2025-09-20 22:26:26',1,'2025-09-13 16:56:26','2025-09-13 16:56:26'),(53,35,'337f8cf4-0e47-4f98-83b2-b606859bc0b7','2025-09-20 22:32:44',1,'2025-09-13 17:02:44','2025-09-13 17:02:44'),(55,35,'db9c8f13-13ed-4cda-987e-32c343305fae','2025-09-20 23:19:32',1,'2025-09-13 17:49:32','2025-09-13 17:49:32'),(61,35,'ec5e19be-195d-4797-905e-a5c888627bf5','2025-09-21 00:33:10',1,'2025-09-13 19:03:10','2025-09-13 19:03:10'),(64,35,'f5a4022b-c32d-485d-bc14-fb22b9f4b617','2025-09-21 01:21:28',1,'2025-09-13 19:51:28','2025-09-13 19:51:28'),(65,35,'6608642c-a323-4109-823d-6784a04f7501','2025-09-22 12:20:45',1,'2025-09-15 06:50:45','2025-09-15 06:50:45'),(79,35,'34230f03-6510-4fe7-8254-0fb954dca412','2025-09-22 14:38:49',1,'2025-09-15 09:08:49','2025-09-15 09:08:49'),(91,35,'78eb6063-bad3-45ac-9378-dedbba5093c8','2025-09-22 17:26:32',1,'2025-09-15 11:56:32','2025-09-15 11:56:32'),(94,35,'de668499-603a-4586-8c4b-8579bd65a9ef','2025-09-22 17:31:10',1,'2025-09-15 12:01:10','2025-09-15 12:01:10'),(96,35,'e0027c92-8613-43c5-87a9-3994b070c732','2025-09-22 18:07:52',1,'2025-09-15 12:37:52','2025-09-15 12:37:52'),(97,35,'2899afee-2a04-4a25-9f4a-e5422ed35038','2025-09-22 18:53:35',1,'2025-09-15 13:23:35','2025-09-15 13:23:35'),(99,35,'5610362f-a376-4747-a029-93eab7fa7395','2025-09-22 18:59:21',1,'2025-09-15 13:29:21','2025-09-15 13:29:21'),(101,35,'630e678a-dcc0-4205-a5fb-fc60c74c1aa4','2025-09-22 19:11:23',1,'2025-09-15 13:41:23','2025-09-15 13:41:23'),(102,35,'5165986c-02fe-4651-aad7-b9be519b2f65','2025-09-22 19:26:54',1,'2025-09-15 13:56:54','2025-09-15 13:56:54'),(103,35,'9bbfa365-5a02-4804-b317-2e4bfb1b09b2','2025-09-22 23:28:31',1,'2025-09-15 17:58:31','2025-09-15 17:58:31'),(104,35,'cc0c9fce-7f95-43d1-8f96-f97296373889','2025-09-22 23:47:24',1,'2025-09-15 18:17:24','2025-09-15 18:17:24'),(105,35,'7feec3d9-2ef8-45e9-a88d-2fedb9086b81','2025-09-22 23:51:49',1,'2025-09-15 18:21:49','2025-09-15 18:21:49'),(106,35,'241705a6-1cfa-4cc8-a554-f21041b12561','2025-09-22 23:52:58',1,'2025-09-15 18:22:58','2025-09-15 18:22:58'),(107,35,'666b7ae3-22c5-47e0-9774-bc3a4a9a397a','2025-09-22 23:55:10',1,'2025-09-15 18:25:11','2025-09-15 18:25:11'),(108,35,'97c31fd9-5e94-40af-b176-305173c492fc','2025-09-22 23:57:10',1,'2025-09-15 18:27:10','2025-09-15 18:27:10'),(110,35,'00f4455e-f357-4812-9211-0b559be8de01','2025-09-23 00:06:40',1,'2025-09-15 18:36:40','2025-09-15 18:36:40'),(112,35,'9cb2a626-3f55-42d6-aeb3-bd3fa1cfd230','2025-09-23 10:57:43',1,'2025-09-16 05:27:43','2025-09-16 05:27:43'),(113,35,'e2c5ed7f-6091-4430-a2b7-a1f0299c285c','2025-09-23 11:15:01',1,'2025-09-16 05:45:01','2025-09-16 05:45:01'),(114,35,'21d40f79-8c94-4bf1-9857-481fd1a143b8','2025-09-23 11:39:35',1,'2025-09-16 06:09:35','2025-09-16 06:09:35'),(115,35,'07e50bd7-eeb6-4fd4-9c49-bbe8a334e54d','2025-09-23 11:57:02',1,'2025-09-16 06:27:02','2025-09-16 06:27:02'),(116,35,'19ecd8f6-a4e9-468a-86d5-a77d2b3d380a','2025-09-23 12:14:43',1,'2025-09-16 06:44:43','2025-09-16 06:44:43'),(117,35,'75de031e-db6c-4d32-b0fb-db40fa8d7065','2025-09-23 13:22:31',1,'2025-09-16 07:52:31','2025-09-16 07:52:31'),(118,35,'d01e58dd-74aa-40ba-92b4-c5328720dac1','2025-09-23 13:34:39',1,'2025-09-16 08:04:39','2025-09-16 08:04:39'),(119,35,'3b5e21b7-1981-4f5a-b833-bdb50b6d3649','2025-09-23 13:36:19',1,'2025-09-16 08:06:19','2025-09-16 08:06:19'),(120,35,'7538b89a-fb10-4617-952b-0539e351389b','2025-09-23 13:36:32',1,'2025-09-16 08:06:32','2025-09-16 08:06:32'),(121,35,'28cf1bac-5af4-4ab1-b362-87e42e2d1671','2025-09-23 13:36:41',1,'2025-09-16 08:06:41','2025-09-16 08:06:41'),(122,35,'6e3febbb-ae3d-497b-8bc0-6acf4a4fb206','2025-09-23 13:38:16',1,'2025-09-16 08:08:16','2025-09-16 08:08:16'),(123,35,'5888c5fb-6a9a-4f06-a3a0-c5c9b307ba06','2025-09-23 13:42:57',1,'2025-09-16 08:12:57','2025-09-16 08:12:57'),(124,35,'ed3b1743-d36b-4724-a4e1-b007c04ad647','2025-09-23 13:45:50',1,'2025-09-16 08:15:50','2025-09-16 08:15:50'),(125,35,'8612ad3b-2ebe-48e5-a2de-e3b234bad017','2025-09-23 13:55:09',1,'2025-09-16 08:25:09','2025-09-16 08:25:09'),(126,35,'25a88395-8487-49ad-97d6-7c409de5653e','2025-09-23 14:04:37',1,'2025-09-16 08:34:37','2025-09-16 08:34:37'),(127,35,'ac455f67-f36f-4926-90c0-5a56b42a9a4c','2025-09-23 14:11:49',1,'2025-09-16 08:41:49','2025-09-16 08:41:49'),(128,35,'f30ed479-8957-4e76-955d-2bd7cb8dc164','2025-09-23 14:15:17',1,'2025-09-16 08:45:17','2025-09-16 08:45:17'),(129,35,'c3b05ce9-b56c-4f72-a0eb-53f8166d2af5','2025-09-23 14:16:20',1,'2025-09-16 08:46:20','2025-09-16 08:46:20'),(130,35,'fb1ce9e0-060d-45b9-aa94-b84f52dc4600','2025-09-23 14:21:16',1,'2025-09-16 08:51:16','2025-09-16 08:51:16'),(131,35,'99a08801-6528-43a2-80f1-692d825633f5','2025-09-23 14:23:30',1,'2025-09-16 08:53:30','2025-09-16 08:53:30'),(132,35,'40a45d65-af96-4a6a-a0b8-74c1e1525e70','2025-09-23 14:25:50',1,'2025-09-16 08:55:50','2025-09-16 08:55:50'),(133,35,'53ee92ff-b74b-4699-bc7c-693d1fd5ec62','2025-09-23 14:30:26',1,'2025-09-16 09:00:26','2025-09-16 09:00:26'),(134,35,'b9bb77a8-73ef-458a-9b4b-9e7beff24dc6','2025-09-23 14:30:45',1,'2025-09-16 09:00:45','2025-09-16 09:00:45'),(135,35,'5d69605a-d5cb-42b4-9530-21ae7f2be296','2025-09-23 14:35:32',1,'2025-09-16 09:05:32','2025-09-16 09:05:32'),(136,35,'1a80bc6d-2e78-4f34-b2a3-2f9f771eed04','2025-09-23 14:39:15',1,'2025-09-16 09:09:15','2025-09-16 09:09:15'),(137,35,'fd26e779-b31b-46d4-bc36-555cdc7b9324','2025-09-23 14:48:02',1,'2025-09-16 09:18:02','2025-09-16 09:18:02'),(138,35,'158d2bee-4863-45ce-9451-a6b4df6b3dfe','2025-09-23 15:10:31',1,'2025-09-16 09:40:31','2025-09-16 09:40:31'),(139,35,'6c337e45-2224-4d3d-9b49-55c9b94a226d','2025-09-23 15:16:11',1,'2025-09-16 09:46:11','2025-09-16 09:46:11'),(140,35,'a5a6a4a1-f3cd-463c-8426-c9e5037fa96f','2025-09-23 15:17:18',1,'2025-09-16 09:47:18','2025-09-16 09:47:18'),(141,35,'7c75dadf-6640-49a8-9ed2-c707f13d5d7d','2025-09-23 15:17:50',1,'2025-09-16 09:47:50','2025-09-16 09:47:50'),(142,35,'fb5c6293-3bee-4248-9900-7ea11caaad5e','2025-09-23 15:32:53',1,'2025-09-16 10:02:53','2025-09-16 10:02:53'),(143,35,'75d96986-5a4b-4b43-9fb0-02519643531a','2025-09-23 16:01:32',1,'2025-09-16 10:31:32','2025-09-16 10:31:32'),(144,35,'f548c4fd-c1ff-4130-8302-febc16e41453','2025-09-23 16:19:43',1,'2025-09-16 10:49:43','2025-09-16 10:49:43'),(145,35,'20ab72b9-a4f3-4835-9031-b50c8cc96c05','2025-09-23 16:37:30',1,'2025-09-16 11:07:30','2025-09-16 11:07:30'),(146,35,'28883162-c8af-43f9-bda8-1cf6d34c28e7','2025-09-23 16:55:32',1,'2025-09-16 11:25:32','2025-09-16 11:25:32'),(147,35,'f244dfc6-1642-4ad4-b632-9b99696ec634','2025-09-23 17:00:13',1,'2025-09-16 11:30:13','2025-09-16 11:30:13'),(152,35,'9f87b46f-5fac-4ba7-90b9-36577d2fcf02','2025-09-23 17:51:43',1,'2025-09-16 12:21:43','2025-09-16 12:21:43'),(154,35,'3ce6b7a8-0b34-49b4-8436-16ba60938dd4','2025-09-23 18:03:12',1,'2025-09-16 12:33:12','2025-09-16 12:33:12'),(158,35,'539bb96f-02e0-48ed-8159-09395f00a13f','2025-09-23 18:59:47',1,'2025-09-16 13:29:47','2025-09-16 13:29:47'),(162,35,'33532502-9c02-4923-a989-6473af3a3391','2025-09-23 23:15:34',1,'2025-09-16 17:45:34','2025-09-16 17:45:34'),(165,35,'9607b52a-3dca-4a63-969c-296f6e6e14ec','2025-09-23 23:32:19',1,'2025-09-16 18:02:19','2025-09-16 18:02:19'),(168,35,'d5640130-cb5f-4f8a-87f6-ddf794980f0c','2025-09-23 23:59:14',1,'2025-09-16 18:29:15','2025-09-16 18:29:15'),(171,35,'b78be2c0-cbf8-48a0-b05c-9b221c2cd0d8','2025-09-24 00:15:52',1,'2025-09-16 18:45:52','2025-09-16 18:45:52'),(172,35,'9d2b1f7e-0cd9-4f03-ba07-29f7b2d0dbe8','2025-09-24 10:57:22',1,'2025-09-17 05:27:22','2025-09-17 05:27:22'),(173,35,'d0f1ff53-742f-461c-a853-dbe8429a6ca0','2025-09-24 11:13:05',1,'2025-09-17 05:43:05','2025-09-17 05:43:05'),(176,35,'ba3a4be3-85b3-4fbf-a49c-7872daeb40fc','2025-09-24 13:08:49',1,'2025-09-17 07:38:49','2025-09-17 07:38:49'),(177,35,'38016920-1449-4289-b800-b3f5c8d98693','2025-09-24 13:08:57',1,'2025-09-17 07:38:57','2025-09-17 07:38:57'),(178,35,'267a5a8b-9593-4c36-9917-7ebbb93fcf04','2025-09-24 13:10:46',1,'2025-09-17 07:40:46','2025-09-17 07:40:46'),(179,35,'d9bef6f8-5b05-417f-9c02-239aca4e0362','2025-09-24 13:11:49',1,'2025-09-17 07:41:49','2025-09-17 07:41:49'),(180,35,'940a7993-a7b6-4dee-bb68-e741d0904546','2025-09-24 13:18:50',1,'2025-09-17 07:48:50','2025-09-17 07:48:50'),(181,35,'690b3782-39ed-45ba-a8d5-18c196ba4cb5','2025-09-24 13:19:00',1,'2025-09-17 07:49:00','2025-09-17 07:49:00'),(182,35,'204e10de-cc95-462f-823f-b3660c902f68','2025-09-24 13:21:25',1,'2025-09-17 07:51:25','2025-09-17 07:51:25'),(183,35,'9ecd2a26-8bf0-4586-a9a3-b3e86848f85c','2025-09-24 13:25:55',1,'2025-09-17 07:55:55','2025-09-17 07:55:55'),(185,35,'1a3281b0-8d84-4ef8-abe9-ab74631d1252','2025-09-24 13:31:54',1,'2025-09-17 08:01:54','2025-09-17 08:01:54'),(186,35,'22f20e9b-07ad-4127-8658-37d7dfc4d984','2025-09-24 13:32:02',1,'2025-09-17 08:02:02','2025-09-17 08:02:02'),(187,35,'3553c5ed-6e89-4492-9c79-466da2f8b94a','2025-09-24 13:32:09',1,'2025-09-17 08:02:09','2025-09-17 08:02:09'),(190,35,'5fea373c-7b53-4c18-ba72-583f2228ab54','2025-09-24 13:36:35',1,'2025-09-17 08:06:35','2025-09-17 08:06:35'),(191,35,'08b97b06-e13b-4d7a-8ecc-4ef1c15031f3','2025-09-24 13:36:43',1,'2025-09-17 08:06:43','2025-09-17 08:06:43'),(195,35,'c5ede28a-9b57-4b0c-9f3b-b09eee34f0ee','2025-09-24 13:39:12',1,'2025-09-17 08:09:12','2025-09-17 08:09:12'),(199,35,'0f0ed667-edd6-412e-8522-749f72f9b659','2025-09-24 13:40:42',1,'2025-09-17 08:10:42','2025-09-17 08:10:42'),(202,35,'78e09c9d-f47e-4358-b33d-1bf0bbede1e5','2025-09-24 14:04:48',1,'2025-09-17 08:34:48','2025-09-17 08:34:48'),(203,35,'e35d796f-1602-423f-ab99-ea085ddb6391','2025-09-24 14:20:23',1,'2025-09-17 08:50:23','2025-09-17 08:50:23'),(204,35,'79f376ed-3a63-4fd1-ad57-f5f2f1541acd','2025-09-24 14:24:11',1,'2025-09-17 08:54:11','2025-09-17 08:54:11'),(205,35,'a03ae7a7-e6b3-4aee-85c2-da80be102dcf','2025-09-24 14:43:05',1,'2025-09-17 09:13:05','2025-09-17 09:13:05'),(206,35,'e89f88e3-d755-4ecd-9060-575698c79c1d','2025-09-24 15:00:45',1,'2025-09-17 09:30:46','2025-09-17 09:30:46'),(207,35,'e23a94a8-d5fc-480c-ad91-1e0cd7c0c994','2025-09-24 15:17:50',1,'2025-09-17 09:47:50','2025-09-17 09:47:50'),(208,35,'a2e80df7-f587-4f37-ad99-8943ad21a60b','2025-09-24 15:22:24',1,'2025-09-17 09:52:24','2025-09-17 09:52:24'),(210,35,'4ed7c16d-6206-4841-aab2-e24c925828e0','2025-09-24 15:27:27',1,'2025-09-17 09:57:27','2025-09-17 09:57:27'),(211,35,'10e2ee12-de85-416f-99dd-eddca2a9ab1b','2025-09-24 15:27:59',1,'2025-09-17 09:57:59','2025-09-17 09:57:59'),(213,35,'e3f96dab-e4e4-4466-bf4f-0d106c3dd44c','2025-09-24 15:29:41',1,'2025-09-17 09:59:41','2025-09-17 09:59:41'),(215,35,'73f32f97-a995-4373-959d-7fb01d0aef1b','2025-09-24 15:35:13',1,'2025-09-17 10:05:13','2025-09-17 10:05:13'),(218,35,'3d978f1a-2331-446d-8a1e-f8c67943cbe1','2025-09-24 15:52:37',1,'2025-09-17 10:22:37','2025-09-17 10:22:37'),(219,35,'d7d9427a-4a16-41bf-b372-e6f55165ea8c','2025-09-24 16:40:00',1,'2025-09-17 11:10:00','2025-09-17 11:10:00'),(220,35,'b7a4f808-706c-4fc7-a06f-d8f71dc53918','2025-09-24 16:53:32',1,'2025-09-17 11:23:32','2025-09-17 11:23:32'),(221,35,'aefb9c25-a566-4d87-ae1a-a9664ae94ca2','2025-09-24 17:11:10',1,'2025-09-17 11:41:10','2025-09-17 11:41:10'),(222,35,'735b899f-7fe3-4452-9487-73e1ac3b0d49','2025-09-24 17:11:20',1,'2025-09-17 11:41:20','2025-09-17 11:41:20'),(223,35,'d8cca7fd-4649-455d-9b70-b60ce8049220','2025-09-24 17:12:24',1,'2025-09-17 11:42:24','2025-09-17 11:42:24'),(224,35,'bf7106f9-23e7-45e5-adb8-91a46dd5d720','2025-09-24 17:12:50',1,'2025-09-17 11:42:50','2025-09-17 11:42:50'),(225,35,'f428d114-21c7-490d-945e-1003328947c1','2025-09-24 17:16:04',1,'2025-09-17 11:46:04','2025-09-17 11:46:04'),(226,35,'16e9a1b1-5807-4745-ad52-8b4915f2497f','2025-09-24 17:23:44',1,'2025-09-17 11:53:44','2025-09-17 11:53:44'),(228,35,'5efbcd7c-6f25-40d8-ab8d-653ee2d43ae6','2025-09-24 17:27:29',1,'2025-09-17 11:57:29','2025-09-17 11:57:29'),(229,35,'d570526e-bd28-4c5b-907d-378cc2a7135e','2025-09-24 17:27:55',1,'2025-09-17 11:57:55','2025-09-17 11:57:55'),(230,35,'ec040d7f-2fcc-46ed-9108-409ef7cf3ff0','2025-09-24 17:30:39',1,'2025-09-17 12:00:39','2025-09-17 12:00:39'),(231,35,'4befcf77-d2e5-4201-b2de-1cc8467bec4c','2025-09-24 17:35:12',1,'2025-09-17 12:05:12','2025-09-17 12:05:12'),(232,35,'b959d5a6-b633-4965-abd1-ab5e9fdcc566','2025-09-24 17:37:32',1,'2025-09-17 12:07:32','2025-09-17 12:07:32'),(233,35,'94f4f0cb-3039-446c-ac54-59ef345436b5','2025-09-24 17:40:28',1,'2025-09-17 12:10:28','2025-09-17 12:10:28'),(234,35,'d53ef733-41c4-49d1-9166-49616012a957','2025-09-24 17:41:16',1,'2025-09-17 12:11:16','2025-09-17 12:11:16'),(235,35,'29c46873-3053-4114-98d9-d5868b10a5a9','2025-09-24 17:44:40',1,'2025-09-17 12:14:40','2025-09-17 12:14:40'),(236,35,'7d7471d8-cb63-4b1c-8785-5681d9fd7264','2025-09-24 17:53:12',1,'2025-09-17 12:23:12','2025-09-17 12:23:12'),(237,35,'9d54c9ef-4b97-4494-a194-627f2596f42c','2025-09-24 17:55:11',1,'2025-09-17 12:25:11','2025-09-17 12:25:11'),(238,35,'df6c2b34-0686-4014-a460-515e4927d5d5','2025-09-24 18:16:29',1,'2025-09-17 12:46:29','2025-09-17 12:46:29'),(239,35,'dd7de992-2af9-4993-88ac-117a07de14aa','2025-09-24 18:19:52',1,'2025-09-17 12:49:52','2025-09-17 12:49:52'),(240,35,'dbbfe4e5-7a49-4d46-b7f7-50a87ae715e4','2025-09-24 18:20:45',1,'2025-09-17 12:50:45','2025-09-17 12:50:45'),(241,35,'03e978b3-b4d6-49c4-9640-ae3596ff772d','2025-09-24 18:23:14',1,'2025-09-17 12:53:14','2025-09-17 12:53:14'),(242,35,'6e8c874e-7189-4e86-b7dd-c931a882449b','2025-09-24 18:29:32',1,'2025-09-17 12:59:32','2025-09-17 12:59:32'),(243,35,'79cd6479-fcd0-4bcc-b7da-ce396ab714bd','2025-09-24 18:37:28',1,'2025-09-17 13:07:28','2025-09-17 13:07:28'),(244,35,'7353194e-7586-4b62-af86-5c9cac5e56f4','2025-09-24 18:43:00',1,'2025-09-17 13:13:00','2025-09-17 13:13:00'),(245,35,'2bf0ee2f-41b2-498f-bd31-98248d1443e3','2025-09-24 19:00:37',1,'2025-09-17 13:30:37','2025-09-17 13:30:37'),(246,35,'50d504b0-8e72-41e5-b81c-5567e40a1642','2025-09-24 19:25:50',1,'2025-09-17 13:55:50','2025-09-17 13:55:50'),(247,35,'9afc7c8f-3b3b-44a2-b42d-71654fed0b5f','2025-09-24 23:41:00',1,'2025-09-17 18:11:00','2025-09-17 18:11:00'),(248,35,'f896269b-404f-4f85-96be-e84c27a4ad6f','2025-09-24 23:41:23',1,'2025-09-17 18:11:23','2025-09-17 18:11:23'),(249,35,'ce49dc8d-77d2-46ff-a255-8995447fbb08','2025-09-24 23:49:43',1,'2025-09-17 18:19:43','2025-09-17 18:19:43'),(250,35,'fca73810-61b2-4e2f-8614-1c3cd24da8d7','2025-09-25 00:07:18',1,'2025-09-17 18:37:18','2025-09-17 18:37:18'),(251,35,'b560d56a-b674-4097-9000-013207c5987f','2025-09-25 00:33:16',1,'2025-09-17 19:03:16','2025-09-17 19:03:16'),(252,35,'d28f9f71-0bda-4b94-b160-5b86ba494881','2025-09-25 00:33:44',1,'2025-09-17 19:03:44','2025-09-17 19:03:44'),(253,35,'0cd57c89-6f1c-4a0f-9bbe-e899ca521820','2025-09-25 00:38:44',1,'2025-09-17 19:08:44','2025-09-17 19:08:44'),(254,35,'e42efcb6-e2a2-43ff-b230-0c4a135078df','2025-09-25 00:41:50',1,'2025-09-17 19:11:50','2025-09-17 19:11:50'),(255,35,'93a59735-cb81-479f-ad23-bbc4f05b7c86','2025-09-25 00:42:11',1,'2025-09-17 19:12:11','2025-09-17 19:12:11'),(256,35,'4f5b589e-0212-41ad-a9af-4f7c5ea2ba57','2025-09-25 00:42:26',1,'2025-09-17 19:12:26','2025-09-17 19:12:26'),(257,35,'c7cc1ecd-0201-4edd-b792-01cbc9d2b852','2025-09-25 00:44:48',1,'2025-09-17 19:14:48','2025-09-17 19:14:48'),(258,35,'11c81bd0-463f-4722-88b2-f36188960f02','2025-09-25 00:51:44',1,'2025-09-17 19:21:44','2025-09-17 19:21:44'),(259,35,'93936544-a069-4c59-8df4-5b80b37a9d83','2025-09-25 00:54:03',1,'2025-09-17 19:24:03','2025-09-17 19:24:03'),(260,35,'049d9d84-adb6-41b5-b28f-4f3c57790bf1','2025-09-25 01:00:58',1,'2025-09-17 19:30:58','2025-09-17 19:30:58'),(261,35,'7d5edffa-8416-404a-b6e6-427ebb3ae5bf','2025-09-25 01:02:06',1,'2025-09-17 19:32:06','2025-09-17 19:32:06'),(262,35,'d645fee9-42fd-48d3-ab64-2233afee8167','2025-09-25 01:02:34',1,'2025-09-17 19:32:34','2025-09-17 19:32:34'),(263,35,'cfd8b831-6eff-4eff-b411-c4912f579f02','2025-09-25 01:16:22',1,'2025-09-17 19:46:22','2025-09-17 19:46:22'),(264,35,'36111972-66a5-4638-919b-5de96df71746','2025-09-25 01:20:09',1,'2025-09-17 19:50:09','2025-09-17 19:50:09'),(265,35,'8a1c52de-cc51-41f4-8e51-565628814e9f','2025-09-25 01:35:39',1,'2025-09-17 20:05:39','2025-09-17 20:05:39'),(266,35,'81f80419-d969-42a0-bd7e-789cb5303373','2025-09-25 10:46:01',1,'2025-09-18 05:16:01','2025-09-18 05:16:01'),(267,35,'74eb5ef9-b662-4ac2-9ff6-a0fa16d4da7e','2025-09-25 11:05:19',1,'2025-09-18 05:35:19','2025-09-18 05:35:19'),(268,35,'96d1cf33-4b6a-4677-8894-620c0153555f','2025-09-25 11:22:18',1,'2025-09-18 05:52:18','2025-09-18 05:52:18'),(269,35,'7d20c7dd-6029-4fa8-abeb-c4dbe4c0ea43','2025-09-25 11:55:00',1,'2025-09-18 06:25:00','2025-09-18 06:25:00'),(270,35,'e871e3ac-c35a-41ab-9d7b-c9ad7a266290','2025-09-25 12:05:53',1,'2025-09-18 06:35:53','2025-09-18 06:35:53'),(271,35,'dca2c6a2-0ab1-4c08-bcec-72c8f30f8802','2025-09-25 12:18:28',1,'2025-09-18 06:48:28','2025-09-18 06:48:28'),(272,35,'4b417957-13de-4f37-b218-a2c0f0405728','2025-09-25 12:18:48',1,'2025-09-18 06:48:48','2025-09-18 06:48:48'),(273,35,'ce5a1cd2-be2b-41b3-8c1a-771bdceb61bf','2025-09-25 12:19:22',1,'2025-09-18 06:49:22','2025-09-18 06:49:22'),(274,35,'47f019f8-d4b7-45b6-b26d-3021c3b027a7','2025-09-25 12:20:18',1,'2025-09-18 06:50:18','2025-09-18 06:50:18'),(275,35,'26a8a66f-b819-467a-b4ad-e1d2451f59ba','2025-09-25 12:21:42',1,'2025-09-18 06:51:42','2025-09-18 06:51:42'),(276,35,'b1814943-4961-41a4-91fc-c05a7d8412a2','2025-09-25 12:22:50',1,'2025-09-18 06:52:50','2025-09-18 06:52:50'),(277,35,'949cc9c9-6729-47ea-b6bc-764deb2a6087','2025-09-25 12:25:42',1,'2025-09-18 06:55:42','2025-09-18 06:55:42'),(278,35,'d67dd309-1492-431d-8eb5-1b9cd48e8c03','2025-09-25 12:27:49',1,'2025-09-18 06:57:49','2025-09-18 06:57:49'),(279,35,'003a69c4-c514-4a7d-952a-765f6530eac1','2025-09-25 12:30:39',1,'2025-09-18 07:00:39','2025-09-18 07:00:39'),(281,35,'02476350-9fab-40b8-ad45-83392702373c','2025-09-25 12:36:22',1,'2025-09-18 07:06:22','2025-09-18 07:06:22'),(282,35,'154e2447-775b-4936-b7f4-48ae937802c2','2025-09-25 12:41:38',1,'2025-09-18 07:11:38','2025-09-18 07:11:38'),(283,35,'d6023bea-35b0-4d28-b7a2-f8171bbec7a0','2025-09-25 12:51:39',1,'2025-09-18 07:21:39','2025-09-18 07:21:39'),(284,35,'5835a70c-31e8-4983-822f-e4ffe5d8765b','2025-09-25 13:07:51',1,'2025-09-18 07:37:51','2025-09-18 07:37:51'),(286,35,'d7484b30-f6f9-46e7-9e4e-bfb48c8f6319','2025-09-25 13:31:49',1,'2025-09-18 08:01:49','2025-09-18 08:01:49'),(288,35,'bc7b781d-75e7-4945-adf0-c0d419b2942c','2025-09-25 13:35:12',1,'2025-09-18 08:05:12','2025-09-18 08:05:12'),(289,35,'0844c3dc-00c9-4211-a6f6-b6c7c0577122','2025-09-25 13:36:02',1,'2025-09-18 08:06:02','2025-09-18 08:06:02'),(290,35,'69f80ece-9910-4ce3-8853-60c888c9eba3','2025-09-25 13:57:47',1,'2025-09-18 08:27:47','2025-09-18 08:27:47'),(291,35,'3d364835-b42d-477d-bdf4-2070806181a4','2025-09-25 14:00:16',1,'2025-09-18 08:30:16','2025-09-18 08:30:16'),(296,35,'7742eedd-b396-498f-9c45-59c9e3b9d4cf','2025-09-25 14:35:38',1,'2025-09-18 09:05:38','2025-09-18 09:05:38'),(299,35,'3d74a6ec-5e13-4247-b7ab-6d4b033416b1','2025-09-25 14:36:50',1,'2025-09-18 09:06:50','2025-09-18 09:06:50'),(302,35,'af89eb65-be14-4047-910b-259c50c48ad8','2025-09-25 14:51:50',1,'2025-09-18 09:21:50','2025-09-18 09:21:50'),(304,35,'447cf3c9-c2d0-4e43-9b68-c385f1dc67d9','2025-09-25 14:54:57',1,'2025-09-18 09:24:57','2025-09-18 09:24:57'),(307,35,'7b1e1dc7-a540-4f43-8e73-fba585c0da5b','2025-09-25 15:02:09',1,'2025-09-18 09:32:09','2025-09-18 09:32:09'),(309,35,'5959980a-2457-4f4f-bf37-2d4dfe82c3f1','2025-09-25 15:10:10',1,'2025-09-18 09:40:10','2025-09-18 09:40:10'),(311,35,'d615ad1c-bad2-477f-b72d-1ae444c12e61','2025-09-25 15:13:39',1,'2025-09-18 09:43:39','2025-09-18 09:43:39'),(313,35,'e151b64b-11ae-4925-8057-d7d5feb49774','2025-09-25 15:15:12',1,'2025-09-18 09:45:12','2025-09-18 09:45:12'),(317,35,'d9d54921-02d0-4bcf-bd47-499a88352d5a','2025-09-25 15:22:39',1,'2025-09-18 09:52:39','2025-09-18 09:52:39'),(320,35,'16c4bd3d-f0db-426d-a40b-65af8c0ec4a4','2025-09-25 15:35:16',1,'2025-09-18 10:05:16','2025-09-18 10:05:16'),(325,35,'322389c6-c97e-444c-95bf-86589a0e4728','2025-09-25 16:23:46',1,'2025-09-18 10:53:46','2025-09-18 10:53:46'),(327,35,'4a64f016-76b2-4094-8384-f5654370afcc','2025-09-25 16:27:12',1,'2025-09-18 10:57:12','2025-09-18 10:57:12'),(330,35,'689063b5-e469-4a1d-94f8-9ff47fbfdbdb','2025-09-25 16:47:15',1,'2025-09-18 11:17:15','2025-09-18 11:17:15'),(332,35,'28447c28-7c31-4305-9e49-31a0e190a06d','2025-09-25 16:55:50',1,'2025-09-18 11:25:50','2025-09-18 11:25:50'),(334,35,'0fe48e40-5fd3-4b6b-9d97-d5cd26a564b5','2025-09-25 16:57:29',1,'2025-09-18 11:27:29','2025-09-18 11:27:29'),(337,35,'f56975d4-6ea8-4209-a7f0-5d354840c2f5','2025-09-25 17:38:49',1,'2025-09-18 12:08:49','2025-09-18 12:08:49'),(341,35,'90daf790-68f5-42b8-9e9b-b29caa900c81','2025-09-25 20:21:19',1,'2025-09-18 14:51:19','2025-09-18 14:51:19'),(342,35,'a3bf0b03-0df9-4dab-9e99-d45f9c8056db','2025-09-25 23:21:54',1,'2025-09-18 17:51:54','2025-09-18 17:51:54'),(344,35,'5d4497d4-93e6-42f3-9be3-e870fbe4ecd1','2025-09-25 23:38:58',1,'2025-09-18 18:08:58','2025-09-18 18:08:58'),(345,35,'2af0fc0a-a84f-424c-8aa6-21288e86921f','2025-09-25 23:44:54',1,'2025-09-18 18:14:54','2025-09-18 18:14:54'),(346,35,'cee3c653-4c50-4353-ac12-401b4f60a4ec','2025-09-25 23:48:28',1,'2025-09-18 18:18:28','2025-09-18 18:18:28'),(348,35,'4035f54f-b858-4d93-8489-4aa8a7a4c1fa','2025-09-25 23:57:33',1,'2025-09-18 18:27:33','2025-09-18 18:27:33'),(349,35,'73325bf4-ef19-49ce-92b0-dc3131add98c','2025-09-26 00:00:56',1,'2025-09-18 18:30:56','2025-09-18 18:30:56'),(350,35,'329a3189-4767-4de6-9845-61c166622325','2025-09-26 00:01:11',1,'2025-09-18 18:31:11','2025-09-18 18:31:11'),(351,35,'ba19b443-8a5b-43c3-80bd-fe01bca717e0','2025-09-26 00:02:49',1,'2025-09-18 18:32:49','2025-09-18 18:32:49'),(352,35,'9876fa64-7edf-4960-b8c1-c391ff6a54e0','2025-09-26 00:02:56',1,'2025-09-18 18:32:56','2025-09-18 18:32:56'),(353,35,'229046ff-3828-459d-8dd7-3ab0203b7d91','2025-09-26 00:13:41',1,'2025-09-18 18:43:41','2025-09-18 18:43:41'),(354,35,'a472af16-e971-428f-9736-72175b1e3e18','2025-09-26 00:28:55',1,'2025-09-18 18:58:55','2025-09-18 18:58:55'),(355,35,'280f3de7-b8c9-4262-8448-c7b6ce1863d7','2025-09-26 00:36:34',1,'2025-09-18 19:06:34','2025-09-18 19:06:34'),(356,35,'21a95c4e-c5c1-42a8-8dfa-28d88895efb5','2025-09-26 00:43:05',1,'2025-09-18 19:13:05','2025-09-18 19:13:05'),(357,35,'d436fbdd-8bc6-439f-94a7-c671fc68235a','2025-09-26 00:47:08',1,'2025-09-18 19:17:08','2025-09-18 19:17:08'),(358,35,'f74d7dfd-61fb-4810-9fc3-975f4c1df269','2025-09-26 00:48:15',1,'2025-09-18 19:18:15','2025-09-18 19:18:15'),(362,35,'71371525-16e0-4d04-bebc-42a1b02d496d','2025-09-26 10:50:01',1,'2025-09-19 05:20:01','2025-09-19 05:20:01'),(363,35,'60aa290f-5f22-451c-be6c-0ac8465dbabd','2025-09-30 11:10:00',1,'2025-09-23 05:40:00','2025-09-23 05:40:00'),(364,35,'2acbe800-25fa-4484-9de3-bfed8f7959e1','2025-09-30 11:52:57',1,'2025-09-23 06:22:57','2025-09-23 06:22:57'),(366,35,'57793c2d-cf66-4740-ae97-bd688d430c2f','2025-09-30 12:49:57',1,'2025-09-23 07:19:57','2025-09-23 07:19:57'),(367,35,'b90941d1-cb30-4532-97b7-e8296b7ed170','2025-09-30 15:39:14',1,'2025-09-23 10:09:14','2025-09-23 10:09:14'),(368,35,'8733ffaa-9d54-4867-b239-626b7b9add6d','2025-09-30 15:39:29',0,'2025-09-23 10:09:29','2025-09-23 10:09:29'),(369,35,'ab12a49b-da21-482d-a6a7-8a592dcfd2c7','2025-09-30 15:39:29',0,'2025-09-23 10:09:29','2025-09-23 10:09:29'),(370,35,'4e40df65-29df-49ad-ac54-3ebb32571ab2','2025-09-30 15:39:29',1,'2025-09-23 10:09:29','2025-09-23 10:09:29'),(371,35,'225ce137-e773-4b41-8428-683f9f4fbfee','2025-09-30 16:34:21',0,'2025-09-23 11:04:21','2025-09-23 11:04:21'),(372,35,'97c7a822-440e-43b3-aec5-5a9080c1610c','2025-09-30 16:34:21',1,'2025-09-23 11:04:21','2025-09-23 11:04:21'),(373,35,'02a22593-6ef1-4358-bb15-78798b41d08b','2025-09-30 16:38:01',0,'2025-09-23 11:08:01','2025-09-23 11:08:01'),(374,35,'10ebf85d-9c49-481d-b5cf-d368f5d7009d','2025-09-30 16:38:01',1,'2025-09-23 11:08:01','2025-09-23 11:08:01'),(375,35,'27961e60-3632-49a4-b8fd-031a9ad86665','2025-09-30 16:44:34',1,'2025-09-23 11:14:34','2025-09-23 11:14:34'),(376,35,'ebfddcf1-bd88-4022-9877-e4ae01ff77db','2025-09-30 16:55:57',1,'2025-09-23 11:25:57','2025-09-23 11:25:57'),(377,35,'4f2ced7c-25e6-469b-8e57-278f6f02964c','2025-09-30 16:59:47',1,'2025-09-23 11:29:47','2025-09-23 11:29:47'),(378,35,'686f3083-aa57-4de9-ac7b-a308579e362f','2025-09-30 17:01:28',1,'2025-09-23 11:31:28','2025-09-23 11:31:28'),(379,35,'34ebb389-2793-409d-844e-519d478e6615','2025-09-30 17:02:09',1,'2025-09-23 11:32:09','2025-09-23 11:32:09'),(380,35,'f143e801-94f4-4708-bb5b-9e5537365a87','2025-09-30 17:02:27',1,'2025-09-23 11:32:27','2025-09-23 11:32:27'),(381,35,'3cfad0d1-2494-4127-a544-00b4a8046ee9','2025-09-30 17:02:33',1,'2025-09-23 11:32:33','2025-09-23 11:32:33'),(382,35,'b93aa043-d04a-42e6-9f5b-3c576356baa6','2025-09-30 17:03:44',1,'2025-09-23 11:33:44','2025-09-23 11:33:44'),(383,35,'a57e44c4-b261-42a0-b50f-25054c17f8c7','2025-09-30 17:39:59',1,'2025-09-23 12:09:59','2025-09-23 12:09:59'),(384,35,'6671d911-395f-44c8-8ce3-b270ddc07eb5','2025-09-30 17:40:10',1,'2025-09-23 12:10:10','2025-09-23 12:10:10'),(385,35,'8d9db5c6-f63d-41bb-8b6d-5621d21980c3','2025-09-30 17:40:20',1,'2025-09-23 12:10:20','2025-09-23 12:10:20'),(386,35,'5a8f4953-35d6-4991-bb27-a0605c43ca1b','2025-09-30 17:54:00',1,'2025-09-23 12:24:00','2025-09-23 12:24:00'),(387,35,'ccbdb14c-ddcb-425b-96dc-473e8d3b3daf','2025-09-30 17:55:24',1,'2025-09-23 12:25:24','2025-09-23 12:25:24'),(388,35,'a034462f-78d2-4b57-9ad6-51b628d9378a','2025-09-30 17:56:58',1,'2025-09-23 12:26:58','2025-09-23 12:26:58'),(389,35,'cee7c2a6-7315-4219-b9f1-2267b1bc6531','2025-09-30 18:05:02',1,'2025-09-23 12:35:02','2025-09-23 12:35:02'),(390,35,'c13b8c03-f657-4345-b17a-8fb771993e3e','2025-09-30 18:27:01',1,'2025-09-23 12:57:01','2025-09-23 12:57:01'),(391,35,'5bd33f08-18a4-4a9e-ad5e-7c4b9b1fe5c6','2025-09-30 18:27:17',1,'2025-09-23 12:57:17','2025-09-23 12:57:17'),(392,35,'40d7801c-7b55-4d86-920b-df95a3adf3ac','2025-10-01 18:09:14',1,'2025-09-24 12:39:14','2025-09-24 12:39:14'),(393,35,'98ac41d9-60fe-4e06-b75f-88bbc08ca928','2025-10-01 18:38:38',1,'2025-09-24 13:08:38','2025-09-24 13:08:38'),(394,35,'68044e9a-2dd5-4d37-84bb-a15c93b46dcb','2025-10-01 18:55:12',1,'2025-09-24 13:25:12','2025-09-24 13:25:12'),(395,35,'1dbed95b-d490-45eb-86a7-9040cf6f9663','2025-10-01 18:55:21',1,'2025-09-24 13:25:21','2025-09-24 13:25:21'),(396,35,'ea96b36b-e7dc-4a8b-9d03-96226d436a83','2025-10-01 18:55:37',1,'2025-09-24 13:25:37','2025-09-24 13:25:37'),(397,35,'937b9dcf-f058-42c7-8683-bf83882fbf01','2025-10-01 19:23:05',1,'2025-09-24 13:53:05','2025-09-24 13:53:05'),(398,35,'71bda191-bd7d-473b-9d17-f6373428e3a7','2025-10-01 19:24:32',1,'2025-09-24 13:54:32','2025-09-24 13:54:32'),(399,35,'25c1fed3-1ffa-4a67-b2f8-6a6eb2fec2c5','2025-10-01 19:31:52',1,'2025-09-24 14:01:52','2025-09-24 14:01:52'),(400,35,'1586bd23-4a51-4725-92bd-dd2df98be9e8','2025-10-01 19:32:15',1,'2025-09-24 14:02:15','2025-09-24 14:02:15'),(401,35,'2489b872-f37b-4d6f-8bcf-79538f661716','2025-10-01 19:33:06',1,'2025-09-24 14:03:06','2025-09-24 14:03:06'),(402,35,'0c8959e5-2945-4e7f-89bf-dec9ccc69785','2025-10-01 19:37:53',1,'2025-09-24 14:07:53','2025-09-24 14:07:53'),(403,35,'fff5d4af-da21-438e-92a8-1355923c3874','2025-10-02 10:28:28',0,'2025-09-25 04:58:28','2025-09-25 05:29:20'),(404,35,'8f7040b6-a6d4-4ab0-bd5b-a669accc12e0','2025-10-02 10:31:16',1,'2025-09-25 05:01:16','2025-09-25 05:01:16'),(405,35,'53219888-174c-4afd-9b81-fd0904e14856','2025-10-02 10:39:53',1,'2025-09-25 05:09:53','2025-09-25 05:09:53'),(406,35,'7badf4cb-8a93-4720-81f5-a37ef2e669ee','2025-10-02 10:40:39',1,'2025-09-25 05:10:39','2025-09-25 05:10:39'),(407,35,'49b16c43-8d8b-4bf7-8520-cda557af1652','2025-10-02 10:59:20',0,'2025-09-25 05:29:20','2025-09-25 05:29:21'),(408,35,'8f0a6c9f-ecd7-4229-89ed-1ecf16ee1017','2025-10-02 10:59:21',1,'2025-09-25 05:29:21','2025-09-25 05:29:21'),(409,35,'0266141d-987a-4d90-b67b-1583c52f2059','2025-10-02 10:59:21',1,'2025-09-25 05:29:21','2025-09-25 05:29:21'),(410,35,'5a5ae322-a226-4462-bca7-8735c255d33a','2025-10-02 10:59:21',1,'2025-09-25 05:29:21','2025-09-25 05:29:21'),(411,35,'ed3470ac-c6db-46e8-986d-fe83a3268a8f','2025-10-02 10:59:21',0,'2025-09-25 05:29:21','2025-09-25 05:45:13'),(412,35,'a4c599d3-a1ab-407d-9be4-ee860d4a1050','2025-10-02 11:10:45',1,'2025-09-25 05:40:45','2025-09-25 05:40:45'),(413,35,'4680b92a-5042-4625-94c3-b38f49b03921','2025-10-02 11:11:15',1,'2025-09-25 05:41:15','2025-09-25 05:41:15'),(414,35,'0c33dbac-74e5-41d2-80bc-bf23f5cf925d','2025-10-02 11:11:36',1,'2025-09-25 05:41:36','2025-09-25 05:41:36'),(415,35,'3b93fb59-0748-454f-a10f-98f7bc5bedc9','2025-10-02 11:13:16',1,'2025-09-25 05:43:16','2025-09-25 05:43:16'),(416,35,'abed4510-f5f8-478e-a757-51510502b325','2025-10-02 11:13:53',1,'2025-09-25 05:43:53','2025-09-25 05:43:53'),(417,35,'b252597d-769f-46ed-8e14-71aa9398ba51','2025-10-02 11:15:13',1,'2025-09-25 05:45:13','2025-09-25 05:45:13'),(418,35,'875e16c0-c8cd-46d6-bb8b-c40338e7062f','2025-10-02 11:15:13',0,'2025-09-25 05:45:13','2025-09-25 06:03:07'),(419,35,'bf5b8586-fb71-4d57-a680-1d2cfa0dd239','2025-10-02 11:33:07',1,'2025-09-25 06:03:07','2025-09-25 06:03:07'),(420,35,'00b213eb-9c62-47e9-9743-7946c17881cd','2025-10-02 11:33:07',1,'2025-09-25 06:03:07','2025-09-25 06:03:07'),(421,35,'bf10481d-df59-4239-8790-59f577528ee2','2025-10-02 11:33:07',1,'2025-09-25 06:03:07','2025-09-25 06:03:07'),(422,35,'576c7470-2383-4139-93a1-d7685957a8dd','2025-10-02 11:33:07',1,'2025-09-25 06:03:07','2025-09-25 06:03:07'),(423,35,'9f0292b4-9cdc-4959-bb76-3174d251beb2','2025-10-02 11:33:07',1,'2025-09-25 06:03:07','2025-09-25 06:03:07'),(424,35,'605c1288-de57-4560-b062-0600860c057d','2025-10-02 11:33:07',0,'2025-09-25 06:03:07','2025-09-25 06:38:11'),(425,35,'026587e1-3525-4b4b-9d25-47fea87d4eb1','2025-10-02 11:52:34',1,'2025-09-25 06:22:34','2025-09-25 06:22:34'),(426,35,'fa620ac0-6a37-4390-9b68-47c4046099ef','2025-10-02 12:08:11',0,'2025-09-25 06:38:11','2025-09-25 08:27:47'),(427,35,'b02cbf80-f65d-401a-a684-1b84e6a7eab6','2025-10-02 12:18:33',1,'2025-09-25 06:48:33','2025-09-25 06:48:33'),(428,35,'f5bb839b-56af-4d66-919a-eebd942c72b5','2025-10-02 12:18:53',1,'2025-09-25 06:48:53','2025-09-25 06:48:53'),(430,35,'be2a5697-145d-4cd2-b6f3-1b9d15481db3','2025-10-02 12:19:49',1,'2025-09-25 06:49:49','2025-09-25 06:49:49'),(432,35,'ac5b1dcb-9bed-40eb-a85d-1fd1ff502682','2025-10-02 12:25:18',1,'2025-09-25 06:55:18','2025-09-25 06:55:18'),(434,35,'a77dc249-9112-4041-a3b7-2eaf012e7915','2025-10-02 12:28:14',1,'2025-09-25 06:58:14','2025-09-25 06:58:14'),(436,35,'18603e90-5466-46fd-baa0-7f9acd2b38fd','2025-10-02 12:29:26',1,'2025-09-25 06:59:26','2025-09-25 06:59:26'),(437,35,'c9e21e12-ed2b-46b0-8c50-40d5a71840eb','2025-10-02 12:30:08',1,'2025-09-25 07:00:08','2025-09-25 07:00:08'),(438,35,'1f9e03cc-cfbf-4c29-9ad7-2bc5f9a0c6b6','2025-10-02 12:30:37',1,'2025-09-25 07:00:37','2025-09-25 07:00:37'),(439,35,'4d5a9c56-03ea-45e2-a896-ba8442536530','2025-10-02 12:33:11',1,'2025-09-25 07:03:11','2025-09-25 07:03:11'),(441,35,'b2ab19f4-324f-4858-ad12-3561e04a7ca5','2025-10-02 12:37:49',1,'2025-09-25 07:07:49','2025-09-25 07:07:49'),(443,35,'04c76318-edf1-4b09-9618-cf4f1cb4e6b0','2025-10-02 12:39:33',1,'2025-09-25 07:09:33','2025-09-25 07:09:33'),(445,35,'e695fb65-7b0f-4ec1-8465-f59d4071613c','2025-10-02 12:59:55',1,'2025-09-25 07:29:55','2025-09-25 07:29:55'),(447,35,'6e04ae09-ffb9-46c5-a675-b972475d47bb','2025-10-02 13:00:08',1,'2025-09-25 07:30:08','2025-09-25 07:30:08'),(448,35,'48355462-155c-42ec-91e8-5e4f85750578','2025-10-02 13:00:21',1,'2025-09-25 07:30:21','2025-09-25 07:30:21'),(449,35,'3c6fb278-daee-448d-b6ce-22f5484aef74','2025-10-02 13:00:30',1,'2025-09-25 07:30:30','2025-09-25 07:30:30'),(450,35,'0579f90d-3107-4ccc-a7ed-ff1fb1c315f7','2025-10-02 13:00:44',1,'2025-09-25 07:30:44','2025-09-25 07:30:44'),(453,35,'61d77a0b-353c-4f90-9354-6ad6f4578a3a','2025-10-02 13:57:47',0,'2025-09-25 08:27:47','2025-09-25 08:47:58'),(454,35,'271823ed-df6d-42c3-9d15-f9c8b1bfc212','2025-10-02 14:04:13',1,'2025-09-25 08:34:13','2025-09-25 08:34:13'),(455,35,'3edd4617-719f-412c-bd48-e5f945130380','2025-10-02 14:14:21',1,'2025-09-25 08:44:21','2025-09-25 08:44:21'),(456,35,'778b216b-be31-4f71-8d08-8b1442c92a16','2025-10-02 14:15:41',1,'2025-09-25 08:45:41','2025-09-25 08:45:41'),(457,35,'7bcbf2ca-486f-425b-b952-23af89bfae56','2025-10-02 14:17:58',0,'2025-09-25 08:47:58','2025-09-25 10:37:25'),(458,35,'93fbff5c-b257-4005-a566-ad7aac4e5ac3','2025-10-02 14:32:25',1,'2025-09-25 09:02:25','2025-09-25 09:02:25'),(459,35,'12c8e0d5-51fc-4dcb-b06e-8d69da8284ea','2025-10-02 14:32:53',1,'2025-09-25 09:02:53','2025-09-25 09:02:53'),(460,35,'bd5c61be-1f9f-43d9-8a92-22b3c2cd6acf','2025-10-02 14:33:14',1,'2025-09-25 09:03:14','2025-09-25 09:03:14'),(461,35,'f57fca29-25bd-4a60-8675-5c8eccb92462','2025-10-02 14:33:41',1,'2025-09-25 09:03:41','2025-09-25 09:03:41'),(462,35,'dad46fdf-de07-4034-85a2-f000310ffe0b','2025-10-02 14:34:00',1,'2025-09-25 09:04:00','2025-09-25 09:04:00'),(463,35,'139b95b7-de16-4539-a822-3667f2708948','2025-10-02 14:34:28',1,'2025-09-25 09:04:28','2025-09-25 09:04:28'),(464,35,'6fc32b18-55ab-4ff0-a523-b7ff4616681c','2025-10-02 14:35:00',1,'2025-09-25 09:05:00','2025-09-25 09:05:00'),(465,35,'5eccbd3c-a567-4d2a-a3a8-7c549066c6d4','2025-10-02 14:36:45',1,'2025-09-25 09:06:45','2025-09-25 09:06:45'),(466,35,'1bb4ab3e-54dc-4e1a-8c39-17edebf23a1e','2025-10-02 14:37:19',1,'2025-09-25 09:07:19','2025-09-25 09:07:19'),(467,35,'42693a3d-0c69-411e-8b0e-76f9be5f0697','2025-10-02 15:41:22',1,'2025-09-25 10:11:22','2025-09-25 10:11:22'),(468,35,'9272cf54-a16c-4f8e-8e48-86664c52cce0','2025-10-02 15:41:59',1,'2025-09-25 10:11:59','2025-09-25 10:11:59'),(469,35,'dbccbeed-4842-497d-809a-f73c81095a89','2025-10-02 16:07:25',0,'2025-09-25 10:37:25','2025-09-25 11:40:05'),(470,35,'640cb97f-c9a0-4b9b-a1a4-11a364d1a711','2025-10-02 16:07:25',1,'2025-09-25 10:37:25','2025-09-25 10:37:25'),(471,35,'adf0321a-5d30-42d2-a397-f023fc89bf30','2025-10-02 16:07:25',1,'2025-09-25 10:37:25','2025-09-25 10:37:25'),(472,35,'e9d4a95e-b66d-436a-bc36-9a1fa2a35c44','2025-10-02 16:15:18',1,'2025-09-25 10:45:18','2025-09-25 10:45:18'),(473,35,'38352c93-c9b6-4ec9-ba48-a263dd9aefe7','2025-10-02 16:16:13',1,'2025-09-25 10:46:13','2025-09-25 10:46:13'),(474,35,'0cb31c30-062c-45fc-91f3-a09fa6e1adea','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(475,35,'adcd6fd0-af37-40d6-ac9e-2256c01dec1d','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(476,35,'10cbfd5d-75eb-4bb1-80b5-25be864a717a','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(477,35,'f43bdd44-9ddf-48e2-8f85-e79d6f63d51a','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(478,35,'8febf5d7-b87d-43f7-8a1f-b98055a6caad','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(479,35,'cc1a76ad-9904-4af2-846e-0474be2cfe8d','2025-10-02 17:10:05',1,'2025-09-25 11:40:05','2025-09-25 11:40:05'),(480,35,'1d9c03cd-3a83-4a80-9ff2-c3dff3d3a748','2025-10-02 17:10:18',1,'2025-09-25 11:40:18','2025-09-25 11:40:18'),(481,35,'a41ea910-b753-47e6-a3f6-9c29beaa3c26','2025-10-02 17:27:37',0,'2025-09-25 11:57:37','2025-09-25 12:11:10'),(482,35,'7810625e-49b6-4f25-8c08-54434f27eab2','2025-10-02 17:41:10',1,'2025-09-25 12:11:10','2025-09-25 12:11:10'),(483,35,'7bcc7d29-28d4-4bce-ab02-5f0ab22ad9ee','2025-10-06 18:54:40',1,'2025-09-29 13:24:40','2025-09-29 13:24:40'),(484,35,'6f687404-1a32-4cbf-8640-09611bfd9a6f','2025-10-09 10:48:36',0,'2025-10-02 05:18:36','2025-10-02 05:33:14'),(485,35,'0a6da52e-e3b9-4842-910d-308503791439','2025-10-09 11:03:14',0,'2025-10-02 05:33:14','2025-10-02 05:52:39'),(486,35,'01abc871-463c-46a5-a7ee-e77c52742a58','2025-10-09 11:22:39',1,'2025-10-02 05:52:39','2025-10-02 05:52:39'),(487,35,'75eb2ff7-63a7-48ac-af4f-c9c261304b5b','2025-10-09 11:22:39',1,'2025-10-02 05:52:39','2025-10-02 05:52:39'),(488,35,'2f2aa023-09f5-45aa-9cb4-70a034b393b6','2025-10-09 11:22:39',1,'2025-10-02 05:52:39','2025-10-02 05:52:39'),(489,35,'556bff14-ebe2-481a-a94a-a3ba43825a65','2025-10-09 11:22:39',1,'2025-10-02 05:52:39','2025-10-02 05:52:39'),(490,35,'cbf48f4c-7c06-46b4-ba6f-7f9d96a2f8d7','2025-10-09 11:31:32',0,'2025-10-02 06:01:32','2025-10-02 06:27:52'),(491,35,'6cd83fc1-a9fd-4f28-85ad-155c56498b3a','2025-10-09 11:56:18',1,'2025-10-02 06:26:18','2025-10-02 06:26:18'),(492,35,'0ca8c99d-bbda-429f-9cc2-ff0a7bad8e04','2025-10-09 11:57:52',1,'2025-10-02 06:27:52','2025-10-02 06:27:52'),(493,35,'e4ff3052-fbfd-4218-9c84-ea7c0b8f1c95','2025-10-09 11:57:52',1,'2025-10-02 06:27:52','2025-10-02 06:27:52'),(494,35,'03302c14-7756-4474-b13a-7e72a5f00f33','2025-10-09 11:57:52',0,'2025-10-02 06:27:52','2025-10-02 06:47:01'),(495,35,'c4365018-b10f-445e-a4c8-120376bb5b32','2025-10-09 11:58:22',1,'2025-10-02 06:28:22','2025-10-02 06:28:22'),(496,35,'0a90da1f-1dd5-4eab-8d40-b635afebce78','2025-10-09 11:59:34',1,'2025-10-02 06:29:34','2025-10-02 06:29:34'),(497,35,'7267ed7b-15f1-4a1b-9f6b-7512403fe758','2025-10-09 12:00:03',1,'2025-10-02 06:30:03','2025-10-02 06:30:03'),(498,35,'70a3a055-d747-4596-9bfc-6556784d7a68','2025-10-09 12:09:12',1,'2025-10-02 06:39:12','2025-10-02 06:39:12'),(499,35,'2c9c5a35-962d-468f-9ade-2e36e6d10bba','2025-10-09 12:12:20',1,'2025-10-02 06:42:20','2025-10-02 06:42:20'),(500,35,'c3f8e4a3-cdf9-4e04-b41e-01a9a19e8b5c','2025-10-09 12:15:19',1,'2025-10-02 06:45:19','2025-10-02 06:45:19'),(501,35,'cbea2ac6-3d31-4c8f-957c-fd57ef8ef9cb','2025-10-09 12:17:01',1,'2025-10-02 06:47:03','2025-10-02 06:47:03'),(502,35,'1eb8efd6-020f-4382-a777-c7a7e6649ab7','2025-10-09 12:23:36',1,'2025-10-02 06:53:36','2025-10-02 06:53:36'),(524,35,'38135745-91ba-4df1-ad8c-af7e2f1895d8','2025-10-09 18:09:09',0,'2025-10-02 12:39:09','2025-10-02 12:54:10'),(525,35,'b2d2f086-4701-4080-bd72-ffc4bcb266b7','2025-10-09 18:24:10',0,'2025-10-02 12:54:10','2025-10-02 13:09:10'),(526,35,'08698251-17a0-4751-b3a6-33f9e1fcaefe','2025-10-09 18:24:10',1,'2025-10-02 12:54:10','2025-10-02 12:54:10'),(527,35,'d1ea2690-703c-4a97-b573-f9982584bceb','2025-10-09 18:24:10',1,'2025-10-02 12:54:10','2025-10-02 12:54:10'),(528,35,'2ed7efbd-de18-4c0b-b49f-7ccc61c582c2','2025-10-09 18:24:10',1,'2025-10-02 12:54:10','2025-10-02 12:54:10'),(529,35,'67aa63da-7fe5-4c6d-bcaa-8be767848505','2025-10-09 18:39:10',1,'2025-10-02 13:09:10','2025-10-02 13:09:10'),(530,35,'e2cab25a-62ff-4dd5-938c-94ba14ff77c0','2025-10-09 18:39:10',1,'2025-10-02 13:09:10','2025-10-02 13:09:10'),(531,35,'8b28f201-e92c-4e0d-a53b-427e26a57bbb','2025-10-09 18:39:10',0,'2025-10-02 13:09:10','2025-10-02 13:24:37'),(532,35,'30416504-3cc1-4354-ac6a-b5fac7ba0858','2025-10-09 18:39:10',1,'2025-10-02 13:09:10','2025-10-02 13:09:10'),(533,35,'b4eadf9a-68f2-4396-915e-6d2d6cf41b0d','2025-10-09 18:54:37',1,'2025-10-02 13:24:37','2025-10-02 13:24:37'),(534,35,'4f0f9a49-60f5-4288-a302-73ed42d18bf7','2025-10-09 18:54:37',0,'2025-10-02 13:24:37','2025-10-02 13:39:52'),(535,35,'fc7812e7-1e8d-4cfa-90c5-caed52515ecb','2025-10-09 18:54:37',1,'2025-10-02 13:24:37','2025-10-02 13:24:37'),(536,35,'1e843998-8b49-43f8-96e0-68c95dfdb877','2025-10-09 18:54:37',1,'2025-10-02 13:24:37','2025-10-02 13:24:37'),(537,35,'e2bf6668-3a25-41a3-b8d8-2af38a4e3869','2025-10-09 19:09:52',1,'2025-10-02 13:39:52','2025-10-02 13:39:52'),(538,35,'7345fa58-fa38-4c8c-adf4-66738c44034b','2025-10-09 19:09:52',1,'2025-10-02 13:39:52','2025-10-02 13:39:52'),(539,35,'fa8d800a-92a9-4279-9ade-3c45ed78830a','2025-10-09 19:09:52',0,'2025-10-02 13:39:52','2025-10-02 13:54:52'),(540,35,'4f8a9dac-060f-4258-b1bc-843108acc1f6','2025-10-09 19:09:52',1,'2025-10-02 13:39:52','2025-10-02 13:39:52'),(541,35,'effacd16-ecbb-433d-b179-cc210c47ff93','2025-10-09 19:24:52',1,'2025-10-02 13:54:52','2025-10-02 13:54:52'),(542,35,'c5746cdd-675f-4141-9bf3-cf4e686d66c6','2025-10-09 19:24:52',0,'2025-10-02 13:54:52','2025-10-02 15:04:55'),(543,35,'c08b43b8-0fa4-438a-b4c5-d985529daafc','2025-10-09 19:24:52',1,'2025-10-02 13:54:52','2025-10-02 13:54:52'),(544,35,'9e8efa01-6745-46e5-9a63-11ec168d24c8','2025-10-09 19:24:52',1,'2025-10-02 13:54:52','2025-10-02 13:54:52'),(545,35,'e49d8e1b-900f-42d7-9c08-3e26996b098c','2025-10-09 20:34:55',1,'2025-10-02 15:04:56','2025-10-02 15:04:56'),(546,35,'ffec4f54-6515-4e11-8a9f-613daa69cf62','2025-10-09 20:34:56',1,'2025-10-02 15:04:56','2025-10-02 15:04:56'),(547,35,'e15f5d76-0e17-4a28-a9b0-1c3e43cbab39','2025-10-09 20:34:56',1,'2025-10-02 15:04:56','2025-10-02 15:04:56'),(548,35,'59e0cf7b-2d7c-4b05-93ea-07acce7de15a','2025-10-09 20:34:55',1,'2025-10-02 15:04:56','2025-10-02 15:04:56'),(549,35,'806dd5f5-eb45-44ce-ba12-8cba82366554','2025-10-10 10:56:42',0,'2025-10-03 05:26:42','2025-10-03 07:12:04'),(550,35,'d39fc5b4-9930-4be4-8108-954523b7b1e7','2025-10-10 12:42:04',1,'2025-10-03 07:12:04','2025-10-03 07:12:04'),(551,35,'1641d021-ac67-49e0-91d5-5c6e75ce0685','2025-10-10 12:42:04',0,'2025-10-03 07:12:04','2025-10-03 07:44:28'),(552,35,'ffb26c7c-6e9b-4d22-a340-7433c8d6da8a','2025-10-10 12:42:04',1,'2025-10-03 07:12:04','2025-10-03 07:12:04'),(553,35,'cf7cf400-87c9-4f90-ba45-01d2727b4e69','2025-10-10 12:42:04',1,'2025-10-03 07:12:04','2025-10-03 07:12:04'),(554,35,'045e443c-f272-4ea4-a661-a3b2f0be5dd4','2025-10-10 12:42:04',1,'2025-10-03 07:12:04','2025-10-03 07:12:04'),(555,35,'6b284219-d5a4-4a15-8735-5c1efb3da86c','2025-10-10 13:14:28',0,'2025-10-03 07:44:28','2025-10-03 07:44:28'),(556,35,'b57876c9-c644-4af4-8ac4-a94b469d3177','2025-10-10 13:14:28',1,'2025-10-03 07:44:29','2025-10-03 07:44:29'),(557,35,'c358acd1-61dd-4032-916e-0d75643c1b0b','2025-10-10 13:14:29',1,'2025-10-03 07:44:29','2025-10-03 07:44:29'),(558,35,'c9d8a666-a301-4090-93b0-73b2dcc75c27','2025-10-10 13:44:25',0,'2025-10-03 08:14:25','2025-10-03 08:29:26'),(559,35,'aa4770df-0226-490a-8c43-eca0e6133547','2025-10-10 13:59:26',1,'2025-10-03 08:29:26','2025-10-03 08:29:26'),(560,35,'189a4985-2c65-4047-afde-3ccf3cf17123','2025-10-10 13:59:26',0,'2025-10-03 08:29:26','2025-10-03 10:34:50'),(561,35,'04170941-12cb-4688-8003-651db8a5a73a','2025-10-10 13:59:26',1,'2025-10-03 08:29:26','2025-10-03 08:29:26'),(562,35,'a8ae15a8-79f2-4f6d-a39b-eb42109d4069','2025-10-10 13:59:26',1,'2025-10-03 08:29:26','2025-10-03 08:29:26'),(563,35,'fbb0a166-0fc8-4b33-9182-50b36b7350db','2025-10-10 16:04:50',1,'2025-10-03 10:34:50','2025-10-03 10:34:50'),(564,35,'0a703e3b-e4fd-4648-96e4-e229f1e23485','2025-10-10 16:04:50',1,'2025-10-03 10:34:50','2025-10-03 10:34:50'),(565,35,'27b07f2a-9123-41a6-b97d-248e646fe054','2025-10-10 16:04:50',1,'2025-10-03 10:34:50','2025-10-03 10:34:50'),(566,35,'cf8ef4b5-1ca6-458b-bcce-bd31c576d111','2025-10-10 16:04:50',1,'2025-10-03 10:34:50','2025-10-03 10:34:50'),(567,35,'346b6558-afcd-4cec-9d69-6cf6f04b3873','2025-10-10 16:43:52',1,'2025-10-03 11:13:52','2025-10-03 11:13:52'),(568,35,'57904c1f-32b7-4a55-a4dd-409200587519','2025-10-10 17:20:59',0,'2025-10-03 11:50:59','2025-10-07 10:44:07'),(569,35,'74dd6ddc-df52-472f-b42a-146dd1d43e66','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(570,35,'eaba5956-d53f-4002-be45-3088cbc14f98','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(571,35,'0abc8bcc-abbc-4a62-8f2a-8e96c473cfb8','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(572,35,'73fcedcd-dfc8-4c4e-aa70-a8a7299e701d','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(573,35,'19e08638-4aee-4913-8e6c-e4d6a26dbbe1','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(574,35,'b472290d-a2a0-4539-99ba-5d878ca61da9','2025-10-14 16:14:07',1,'2025-10-07 10:44:07','2025-10-07 10:44:07'),(575,35,'15acf6cc-7285-4190-b640-2432cc18151d','2025-10-14 16:14:15',0,'2025-10-07 10:44:15','2025-10-07 11:05:34'),(576,35,'c4379c02-dbcb-4708-a635-600b1628f279','2025-10-14 16:35:34',1,'2025-10-07 11:05:34','2025-10-07 11:05:34'),(577,35,'ccd9007d-3ae5-46b4-b120-523d511ba087','2025-10-14 16:53:08',1,'2025-10-07 11:23:08','2025-10-07 11:23:08'),(578,35,'7baffe6a-b3f9-4a31-bef6-e118c3d52393','2025-10-14 16:58:44',1,'2025-10-07 11:28:44','2025-10-07 11:28:44'),(579,35,'dcbb5f33-8112-46f4-b331-214e34486d61','2025-10-14 16:59:47',1,'2025-10-07 11:29:47','2025-10-07 11:29:47'),(580,35,'9b350110-ed47-49af-a369-42e7035a6b66','2025-10-14 17:17:20',1,'2025-10-07 11:47:20','2025-10-07 11:47:20'),(581,35,'45639b12-e283-4539-b683-2ece7ac2c6a1','2025-10-14 17:17:54',1,'2025-10-07 11:47:54','2025-10-07 11:47:54'),(582,35,'a3010ead-45f4-44e8-8503-857fe6089e0d','2025-10-14 17:20:55',1,'2025-10-07 11:50:55','2025-10-07 11:50:55'),(593,35,'f1fd370e-0e5b-4704-ae26-e161cfd41c90','2025-10-15 10:46:38',0,'2025-10-08 05:16:38','2025-10-08 05:31:39'),(594,35,'b975fa6b-2c04-4d2b-a661-e550c0d3ccc1','2025-10-15 10:48:38',1,'2025-10-08 05:18:38','2025-10-08 05:18:38'),(595,35,'321d7f3b-3e22-4323-91b0-c54cf00df47c','2025-10-15 10:52:28',0,'2025-10-08 05:22:28','2025-10-08 05:29:16'),(596,35,'0d50508f-bca3-444a-8d42-52c6aa1d6262','2025-10-15 10:59:16',1,'2025-10-08 05:29:16','2025-10-08 05:29:16'),(597,35,'b530e83a-1ec9-4d8e-af64-219b87250464','2025-10-15 10:59:16',0,'2025-10-08 05:29:16','2025-10-08 05:44:41'),(598,35,'99396a27-99fa-4f09-a970-4368d57416ce','2025-10-15 11:01:39',1,'2025-10-08 05:31:39','2025-10-08 05:31:39'),(599,35,'fb2cd3a8-1bf1-4fb0-ad07-4b08cbdce7b8','2025-10-15 11:01:39',1,'2025-10-08 05:31:39','2025-10-08 05:31:39'),(600,35,'1c0c6149-ba40-4a64-a7d0-05fa0423390d','2025-10-15 11:01:39',1,'2025-10-08 05:31:39','2025-10-08 05:31:39'),(601,35,'3e0afef4-d65f-4974-99af-43f9f38288ae','2025-10-15 11:08:15',0,'2025-10-08 05:38:15','2025-10-08 05:53:23'),(602,35,'ce9b25eb-316c-4b29-b2f7-ff53a8053c73','2025-10-15 11:14:41',0,'2025-10-08 05:44:41','2025-10-08 05:59:41'),(603,35,'1e7bb740-af56-4ffd-b7e2-84bb4cba9ee6','2025-10-15 11:14:41',1,'2025-10-08 05:44:41','2025-10-08 05:44:41'),(604,35,'96ce8a9e-7b4b-4118-8a01-a970b6f95771','2025-10-15 11:14:41',1,'2025-10-08 05:44:41','2025-10-08 05:44:41'),(605,35,'f6e2e33a-fe06-45b0-8fdf-03b645fd4a84','2025-10-15 11:14:41',1,'2025-10-08 05:44:41','2025-10-08 05:44:41'),(606,35,'1c482c1d-b014-4f7a-a0e5-5bbb0a3f2969','2025-10-15 11:23:23',1,'2025-10-08 05:53:23','2025-10-08 05:53:23'),(607,35,'30505073-423d-4ee4-886f-115558d14e41','2025-10-15 11:23:23',0,'2025-10-08 05:53:23','2025-10-08 06:11:22'),(608,35,'d0193186-dfba-4a8e-8f0a-2a278a06adb5','2025-10-15 11:23:23',1,'2025-10-08 05:53:23','2025-10-08 05:53:23'),(609,35,'22c88235-2885-4135-acfa-be47754bf409','2025-10-15 11:23:23',1,'2025-10-08 05:53:23','2025-10-08 05:53:23'),(610,35,'2d528dd4-0f97-4e64-8280-5072c6335533','2025-10-15 11:29:41',1,'2025-10-08 05:59:41','2025-10-08 05:59:41'),(611,35,'64dc541b-5af3-493c-bd59-61d289c6632e','2025-10-15 11:29:41',0,'2025-10-08 05:59:41','2025-10-08 06:14:41'),(612,35,'e0313fcf-8e05-4b2a-81ad-7d569bdef8e9','2025-10-15 11:29:41',1,'2025-10-08 05:59:41','2025-10-08 05:59:41'),(613,35,'e23d4afc-e803-4da7-bff3-2ba3b8e16874','2025-10-15 11:29:41',1,'2025-10-08 05:59:41','2025-10-08 05:59:41'),(614,35,'b9035fef-2a79-4365-9c16-6914c128afb5','2025-10-15 11:41:22',0,'2025-10-08 06:11:22','2025-10-08 06:11:22'),(615,35,'9aeb91f1-ff92-4e60-bad9-1c04b290fd4d','2025-10-15 11:41:22',1,'2025-10-08 06:11:22','2025-10-08 06:11:22'),(616,35,'124b3f86-774a-4410-9c56-68a3e6735043','2025-10-15 11:44:41',1,'2025-10-08 06:14:41','2025-10-08 06:14:41'),(617,35,'da430c6f-c15a-427f-8e99-ec988fcab966','2025-10-15 11:44:41',1,'2025-10-08 06:14:41','2025-10-08 06:14:41'),(618,35,'f6d8ab41-4653-4788-b357-fc59554eec0b','2025-10-15 11:44:41',1,'2025-10-08 06:14:41','2025-10-08 06:14:41'),(619,35,'2a0e7ad7-537b-4aaf-bc02-edaf3538511c','2025-10-15 11:44:41',0,'2025-10-08 06:14:41','2025-10-08 06:29:41'),(620,35,'029e6fe0-ae2e-4e68-85b6-8a7a123b69d8','2025-10-15 11:44:53',1,'2025-10-08 06:14:53','2025-10-08 06:14:53'),(621,35,'80d0dcb7-c3cf-4b8e-b217-5272f4f8e849','2025-10-15 11:48:32',0,'2025-10-08 06:18:32','2025-10-08 06:33:42'),(622,35,'8110799e-95fc-4566-8855-613a312b3d46','2025-10-15 11:59:41',0,'2025-10-08 06:29:41','2025-10-08 06:44:41'),(623,35,'785a12e3-98ef-4411-be0f-fc82d5e1a9a5','2025-10-15 11:59:41',1,'2025-10-08 06:29:41','2025-10-08 06:29:41'),(624,35,'f5ab09a5-3c16-40d6-8621-13d2bc4b4cf5','2025-10-15 11:59:41',1,'2025-10-08 06:29:41','2025-10-08 06:29:41'),(625,35,'22beff9f-3749-437b-bdd7-f59fb45dd7ba','2025-10-15 11:59:41',1,'2025-10-08 06:29:41','2025-10-08 06:29:41'),(626,35,'2ccea7a0-cb64-4a43-9246-6b223407e25d','2025-10-15 12:03:42',1,'2025-10-08 06:33:42','2025-10-08 06:33:42'),(627,35,'aa2d8497-dc50-4312-9864-1d240a4a2d16','2025-10-15 12:03:42',1,'2025-10-08 06:33:42','2025-10-08 06:33:42'),(628,35,'c263916f-325d-4356-a23d-3b196adcd174','2025-10-15 12:03:42',1,'2025-10-08 06:33:42','2025-10-08 06:33:42'),(629,35,'6976df47-50ac-45ff-9e6d-dd245fad5863','2025-10-15 12:03:42',0,'2025-10-08 06:33:42','2025-10-08 06:48:42'),(630,35,'7b343e37-a30a-407a-b379-d720f2b3e0fb','2025-10-15 12:14:41',1,'2025-10-08 06:44:41','2025-10-08 06:44:41'),(631,35,'4d4c2941-4f0e-4049-bedd-2539596695b5','2025-10-15 12:14:41',1,'2025-10-08 06:44:41','2025-10-08 06:44:41'),(632,35,'36712d23-e237-4aab-89c2-635338abeaeb','2025-10-15 12:14:41',1,'2025-10-08 06:44:41','2025-10-08 06:44:41'),(633,35,'4fb33359-198d-4a52-82e5-4edbc4a92295','2025-10-15 12:14:41',0,'2025-10-08 06:44:41','2025-10-08 07:00:14'),(634,35,'42122d9b-6093-4817-8e32-1c76e0829a0c','2025-10-15 12:18:42',1,'2025-10-08 06:48:42','2025-10-08 06:48:42'),(635,35,'a064e26c-415a-4a8d-98bb-2bbdbb0dbace','2025-10-15 12:18:42',1,'2025-10-08 06:48:42','2025-10-08 06:48:42'),(636,35,'488e5992-4415-4532-8d76-2526c2d873f1','2025-10-15 12:18:42',1,'2025-10-08 06:48:42','2025-10-08 06:48:42'),(637,35,'2186ca45-8557-4e18-adbf-6ebe496dc8fd','2025-10-15 12:18:42',0,'2025-10-08 06:48:42','2025-10-08 07:04:19'),(638,35,'95dc6af6-bb6a-4fa0-bec9-d49d733e9964','2025-10-15 12:30:14',1,'2025-10-08 07:00:14','2025-10-08 07:00:14'),(639,35,'d32aae55-03aa-41fd-ba06-9e9459f6067c','2025-10-15 12:30:14',1,'2025-10-08 07:00:14','2025-10-08 07:00:14'),(640,35,'33d5cfc2-0191-4ce5-8928-38421caf2534','2025-10-15 12:30:14',1,'2025-10-08 07:00:14','2025-10-08 07:00:14'),(641,35,'cc0a14a8-ceae-4114-8d81-dd67844f34e3','2025-10-15 12:30:14',0,'2025-10-08 07:00:14','2025-10-08 07:20:14'),(642,35,'d033d619-a5e6-4cff-9cb0-85b8bb3a1f76','2025-10-15 12:34:19',1,'2025-10-08 07:04:19','2025-10-08 07:04:19'),(643,35,'ff6befa2-4f42-4672-9705-a66e09141910','2025-10-15 12:34:19',1,'2025-10-08 07:04:19','2025-10-08 07:04:19'),(644,35,'6dfc0709-8c22-4477-98c1-6cff1d6c1c78','2025-10-15 12:34:19',1,'2025-10-08 07:04:19','2025-10-08 07:04:19'),(645,35,'2e5de615-b738-4ec1-90e7-bbea4a07a02d','2025-10-15 12:34:19',1,'2025-10-08 07:04:19','2025-10-08 07:04:19'),(646,35,'9f95783b-c3fb-45a6-ac1e-28069f8c8bed','2025-10-15 12:46:23',0,'2025-10-08 07:16:23','2025-10-08 07:37:32'),(647,35,'19263607-45e1-4196-8e6c-c4cf579e3461','2025-10-15 12:50:14',1,'2025-10-08 07:20:14','2025-10-08 07:20:14'),(648,35,'b616a1ea-f52b-400a-9e7a-815fd24b108b','2025-10-15 12:50:14',1,'2025-10-08 07:20:14','2025-10-08 07:20:14'),(649,35,'a095c8be-f082-44e8-90cc-c10a12b4e641','2025-10-15 12:50:14',1,'2025-10-08 07:20:14','2025-10-08 07:20:14'),(650,35,'ee91d63e-5e38-4447-aba5-a7b95eb2dfe4','2025-10-15 12:50:14',0,'2025-10-08 07:20:14','2025-10-08 07:40:14'),(651,35,'c50e6401-3468-4eab-ae82-4df60df1ed52','2025-10-15 13:07:32',0,'2025-10-08 07:37:32','2025-10-08 07:55:05'),(652,35,'8e7133fd-9285-41f0-83b4-68187f11b115','2025-10-15 13:10:14',1,'2025-10-08 07:40:14','2025-10-08 07:40:14'),(653,35,'283f83ad-6011-4d18-a216-a7334767019c','2025-10-15 13:10:14',1,'2025-10-08 07:40:14','2025-10-08 07:40:14'),(654,35,'5e35e9e4-13b6-4699-96d1-4f4077d4e1c0','2025-10-15 13:10:14',1,'2025-10-08 07:40:14','2025-10-08 07:40:14'),(655,35,'42b5f5aa-317a-4baf-9e06-5171438e15d7','2025-10-15 13:25:05',1,'2025-10-08 07:55:05','2025-10-08 07:55:05'),(656,35,'191ba5ad-f2e3-4444-bee2-33dfdb1a275b','2025-10-15 13:25:05',0,'2025-10-08 07:55:05','2025-10-08 08:34:17'),(657,35,'a7c2109d-35d6-4bad-a1fb-65c2a39327e9','2025-10-15 13:25:05',1,'2025-10-08 07:55:05','2025-10-08 07:55:05'),(658,35,'79453cec-3655-43b2-adb6-c27be8fb5472','2025-10-15 14:04:17',1,'2025-10-08 08:34:18','2025-10-08 08:34:18'),(659,35,'d48ec9f0-fb0d-4a8b-a3df-6775d0c633d6','2025-10-15 14:04:18',1,'2025-10-08 08:34:18','2025-10-08 08:34:18'),(660,35,'2d25212f-ad82-45a9-b0a0-ae600033901f','2025-10-15 14:04:27',0,'2025-10-08 08:34:27','2025-10-08 09:34:04'),(661,35,'e74dc422-b32c-4e19-b5cb-cd3e9e732e4a','2025-10-15 15:04:04',1,'2025-10-08 09:34:04','2025-10-08 09:34:04'),(662,35,'dff5a21e-97ad-435e-9f51-6148a9f2765d','2025-10-15 15:04:04',1,'2025-10-08 09:34:04','2025-10-08 09:34:04'),(663,35,'e382cccc-19fc-480b-bf45-6b5b776423b5','2025-10-15 15:04:04',0,'2025-10-08 09:34:04','2025-10-08 09:54:30'),(664,35,'a22002bc-b2bd-46df-9e5d-ff8f20c8f95d','2025-10-15 15:24:30',1,'2025-10-08 09:54:30','2025-10-08 09:54:30'),(665,35,'91f17c3a-bc06-420a-bd2d-dae9d42ca785','2025-10-15 15:24:39',0,'2025-10-08 09:54:39','2025-10-08 10:18:05'),(666,35,'09bbbb73-b5b2-4c8a-85c7-3f9d60096cf8','2025-10-15 15:48:05',1,'2025-10-08 10:18:05','2025-10-08 10:18:05'),(667,35,'eac82269-2531-4826-b148-031f5dddfab0','2025-10-15 15:48:10',0,'2025-10-08 10:18:10','2025-10-08 11:19:37'),(668,35,'087b2de0-9c1b-4006-8751-4edcdacc13b3','2025-10-15 16:49:37',0,'2025-10-08 11:19:37','2025-10-08 11:32:59'),(669,35,'29bc7587-04c1-4bfe-9d4f-aa1685bb3179','2025-10-15 16:49:37',1,'2025-10-08 11:19:37','2025-10-08 11:19:37'),(670,35,'d7c23d8c-a390-4362-8782-cdcf03e81fcd','2025-10-15 16:49:37',1,'2025-10-08 11:19:37','2025-10-08 11:19:37'),(671,35,'63af738b-3f7f-4274-8815-90a26d79bc1e','2025-10-15 17:02:59',0,'2025-10-08 11:33:00','2025-10-08 11:52:45'),(672,35,'ca7e5620-05de-4459-b176-66eac2e8b9c3','2025-10-15 17:22:45',1,'2025-10-08 11:52:45','2025-10-08 11:52:45'),(673,35,'a6a5b3f1-f351-4e62-8b78-9fdbacc0a142','2025-10-15 17:22:53',1,'2025-10-08 11:52:53','2025-10-08 11:52:53'),(674,35,'9317093b-b2bb-4488-bb39-c30419a6d2f8','2025-10-15 17:25:50',1,'2025-10-08 11:55:50','2025-10-08 11:55:50'),(675,35,'527e2d51-c76a-4cf4-afd1-dba464258d1a','2025-10-15 17:29:54',1,'2025-10-08 11:59:54','2025-10-08 11:59:54'),(676,35,'a894b432-7f00-4eeb-a268-c3e64a82849a','2025-10-15 17:45:10',0,'2025-10-08 12:15:10','2025-10-08 12:33:07'),(677,35,'847dc8ce-90a6-4981-acb0-b9cc25fd8325','2025-10-15 18:03:07',1,'2025-10-08 12:33:07','2025-10-08 12:33:07'),(678,35,'46c64cb0-9db0-4c71-9b9d-3f4e56cd1b91','2025-10-15 18:03:07',1,'2025-10-08 12:33:07','2025-10-08 12:33:07'),(679,35,'b06b84e8-bbf9-4be7-a687-7b9ce65bc531','2025-10-15 18:05:10',0,'2025-10-08 12:35:10','2025-10-08 12:59:00'),(680,35,'92372176-4dbd-4eed-80f5-8143c6f7bfeb','2025-10-15 18:29:00',1,'2025-10-08 12:59:00','2025-10-08 12:59:00'),(681,35,'1d36a10f-5609-401a-a40c-422f502146a0','2025-10-15 18:29:00',1,'2025-10-08 12:59:00','2025-10-08 12:59:00'),(682,35,'cbd1b385-5e14-4599-b65c-b3dbce9a8ed7','2025-10-15 18:29:00',0,'2025-10-08 12:59:00','2025-10-08 13:14:38'),(683,35,'115250eb-caf5-43db-82c1-557679b2b906','2025-10-15 18:44:38',0,'2025-10-08 13:14:38','2025-10-08 13:28:47'),(684,35,'94770d53-e9d6-4677-944e-f6d925eed11b','2025-10-15 18:44:38',1,'2025-10-08 13:14:38','2025-10-08 13:14:38'),(685,35,'67b3d933-2e74-4e7a-8abd-23a4e9e2e685','2025-10-15 18:58:47',0,'2025-10-08 13:28:47','2025-10-08 13:45:36'),(686,35,'d7882114-8710-4574-9bff-87136e2cf99e','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(687,35,'51764abc-f091-41e1-9642-ffa2e38b56b5','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(688,35,'0c8965a1-e748-4d7c-9c14-629b87b51c82','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(689,35,'018287fe-9c5e-4e79-96ad-4f6031ef3480','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(690,35,'d474fd4e-3e56-4000-93d7-4d6d2bb5ef14','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(691,35,'5bdb43db-f1d4-43fe-81c7-e04f75cc73d7','2025-10-15 19:15:36',1,'2025-10-08 13:45:36','2025-10-08 13:45:36'),(692,35,'e0c986a5-2969-434e-a49c-d45d04219a5d','2025-10-15 19:15:53',1,'2025-10-08 13:45:53','2025-10-08 13:45:53'),(693,35,'7208d1ec-e454-4fcd-887e-0c15008993e9','2025-10-15 19:26:44',0,'2025-10-08 13:56:45','2025-10-08 14:11:51'),(694,35,'4d3438ae-e2e8-45cb-b1db-a8c897256405','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(695,35,'2d19a66a-8947-4224-8246-9a6517ce4574','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(696,35,'ad1c3a88-207c-4585-b9f9-519047f4a776','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(697,35,'c37ae31d-4a4b-417e-b4d8-d409a5c433c9','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(698,35,'3a2f739e-8291-4c75-8285-1d7268afd6b1','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(699,35,'a06f225f-3011-463b-86f5-c89ab51a2231','2025-10-15 19:41:51',1,'2025-10-08 14:11:51','2025-10-08 14:11:51'),(700,35,'065ab9e5-c7bc-4cb1-af65-62a58146aa6b','2025-10-15 19:42:08',0,'2025-10-08 14:12:08','2025-10-08 19:01:02'),(701,35,'a3d00b9e-b2ff-44d7-a528-77f187583da1','2025-10-16 00:31:02',1,'2025-10-08 19:01:02','2025-10-08 19:01:02'),(702,35,'c14473e6-6a3f-4c76-b87e-103308f90eeb','2025-10-16 01:21:12',1,'2025-10-08 19:51:12','2025-10-08 19:51:12'),(703,35,'dda637c4-f141-4a2a-94de-ffa6c986caf8','2025-10-16 01:28:10',1,'2025-10-08 19:58:10','2025-10-08 19:58:10'),(704,35,'e16ee2d4-8157-406b-84c9-4139754f186d','2025-10-16 01:30:48',0,'2025-10-08 20:00:48','2025-10-08 20:14:15'),(705,35,'8777cd0c-7886-4c4a-8f3d-2ec8f2841611','2025-10-16 01:42:30',1,'2025-10-08 20:12:30','2025-10-08 20:12:30'),(706,35,'2f2b12db-8711-43ea-82fb-d3f1f72dd1e0','2025-10-16 01:43:04',1,'2025-10-08 20:13:04','2025-10-08 20:13:04'),(707,35,'531cec73-1bb5-49b5-a637-a56861c44b91','2025-10-16 01:43:22',1,'2025-10-08 20:13:22','2025-10-08 20:13:22'),(708,35,'88d122d5-3ff2-4a4f-9802-416b9b1f042d','2025-10-16 01:43:39',1,'2025-10-08 20:13:39','2025-10-08 20:13:39'),(709,35,'7d01e290-eb35-438f-8f0a-1ee1eab60f21','2025-10-16 01:44:15',0,'2025-10-08 20:14:15','2025-10-08 21:51:07'),(710,35,'88696e4f-a977-44cf-8870-8373b54b6263','2025-10-16 03:21:07',0,'2025-10-08 21:51:07','2025-10-08 21:51:07'),(711,35,'abaa2632-8786-486c-983a-0354d08a7bcf','2025-10-16 03:21:07',1,'2025-10-08 21:51:07','2025-10-08 21:51:07'),(712,35,'9492003c-8777-48b5-8759-e110b89bd03a','2025-10-16 11:00:06',0,'2025-10-09 05:30:06','2025-10-09 05:53:24'),(713,35,'15a645e3-24b0-493f-8169-a3e3bca4f550','2025-10-16 11:23:00',1,'2025-10-09 05:53:00','2025-10-09 05:53:00'),(714,35,'ad6ff7f2-b3f9-45b5-9c6a-18964f166fa2','2025-10-16 11:23:24',0,'2025-10-09 05:53:24','2025-10-09 05:53:24'),(715,35,'04201c48-28f7-4926-a01b-3f9620d59114','2025-10-16 11:23:24',1,'2025-10-09 05:53:24','2025-10-09 05:53:24'),(716,35,'51a1cc49-df79-4a33-a02c-4452455e936d','2025-10-16 11:23:32',0,'2025-10-09 05:53:32','2025-10-09 06:14:03'),(717,35,'6885c4d0-9515-4275-a96e-04389d33f62b','2025-10-16 11:31:51',1,'2025-10-09 06:01:51','2025-10-09 06:01:51'),(718,35,'23eff37b-5a30-4cd3-a9ec-943df9e925fb','2025-10-16 11:33:25',1,'2025-10-09 06:03:25','2025-10-09 06:03:25'),(719,35,'531801db-2225-48fd-b1fe-76e8427b840b','2025-10-16 11:44:03',1,'2025-10-09 06:14:03','2025-10-09 06:14:03'),(720,35,'031514da-0dcd-43d7-9ed1-2dbca78e3cff','2025-10-16 11:49:54',0,'2025-10-09 06:19:54','2025-10-09 06:33:15'),(721,35,'bc57cc67-3586-462b-bb6a-5d3d2fb0bb1b','2025-10-16 12:03:15',0,'2025-10-09 06:33:15','2025-10-09 06:46:27'),(722,35,'d51ab375-ceff-4642-81da-328b487a4142','2025-10-16 12:16:27',0,'2025-10-09 06:46:27','2025-10-09 07:11:34'),(723,35,'68d0d4bf-2011-4dc6-99af-8ea091621aed','2025-10-16 12:41:34',1,'2025-10-09 07:11:34','2025-10-09 07:11:34'),(724,35,'616f465c-f16e-4784-9f68-98ab8b99f29f','2025-10-16 12:41:34',0,'2025-10-09 07:11:34','2025-10-09 07:50:01'),(725,35,'be7a32f1-bb4d-4911-8d2a-d74c098e6e24','2025-10-16 12:41:34',1,'2025-10-09 07:11:34','2025-10-09 07:11:34'),(726,35,'78880efd-1f09-42da-b08a-d9d85367a254','2025-10-16 13:20:01',1,'2025-10-09 07:50:01','2025-10-09 07:50:01'),(727,35,'4c392a05-0a56-4a5a-acee-926b3473dd02','2025-10-16 13:22:37',1,'2025-10-09 07:52:37','2025-10-09 07:52:37'),(728,35,'4ce40cf9-c35d-4fdb-b813-fcfd6cf78bdc','2025-10-16 13:22:50',1,'2025-10-09 07:52:50','2025-10-09 07:52:50'),(729,35,'8449d4ea-2c8b-4942-9367-024c56e5e0be','2025-10-16 13:27:59',1,'2025-10-09 07:57:59','2025-10-09 07:57:59'),(730,35,'af6001e2-e54b-43d3-a8b6-8e7367eb1290','2025-10-16 13:30:17',1,'2025-10-09 08:00:17','2025-10-09 08:00:17'),(731,35,'418eda84-701d-4ee0-b89a-6e6984432dc3','2025-10-16 13:32:23',1,'2025-10-09 08:02:23','2025-10-09 08:02:23'),(732,35,'d0b0fe48-6c95-493b-b5ac-791ed0534d0a','2025-10-16 13:35:44',0,'2025-10-09 08:05:44','2025-10-09 08:18:45'),(733,35,'cc186ff0-9908-4ffd-aefa-02f1be7485fe','2025-10-16 13:48:45',1,'2025-10-09 08:18:45','2025-10-09 08:18:45'),(734,35,'385321dc-6571-4424-8aef-8708b549df3d','2025-10-16 13:54:37',1,'2025-10-09 08:24:37','2025-10-09 08:24:37'),(735,35,'d603c615-9f09-4d26-9860-57bee42956d7','2025-10-16 13:55:58',1,'2025-10-09 08:25:58','2025-10-09 08:25:58'),(736,35,'1afcfcd5-057b-426d-b5dc-8be32d33e8fa','2025-10-16 13:57:31',1,'2025-10-09 08:27:31','2025-10-09 08:27:31'),(737,35,'264cf0a4-7891-42b1-9d6d-47229ed93786','2025-10-16 14:15:24',1,'2025-10-09 08:45:24','2025-10-09 08:45:24'),(738,35,'492e1697-66c6-4d25-8f3e-1474ceb26685','2025-10-16 14:31:11',1,'2025-10-09 09:01:11','2025-10-09 09:01:11'),(739,35,'1d91b60a-f17a-4eea-bfad-0578722dd7e7','2025-10-16 14:48:00',1,'2025-10-09 09:18:00','2025-10-09 09:18:00'),(740,35,'9a836588-412f-4824-99d8-417cde1d500c','2025-10-16 15:00:43',1,'2025-10-09 09:30:43','2025-10-09 09:30:43'),(741,35,'be8ea4ea-d904-48b8-a569-4aa8f754faed','2025-10-16 15:20:46',1,'2025-10-09 09:50:46','2025-10-09 09:50:46'),(743,35,'2feef51c-7d1a-4d44-8492-aa310c6c62f6','2025-10-16 16:47:03',1,'2025-10-09 11:17:03','2025-10-09 11:17:03'),(753,35,'d602a01d-14aa-4790-8cf7-2f3c5f6a9733','2025-10-16 23:09:40',1,'2025-10-09 17:39:40','2025-10-09 17:39:40'),(761,35,'6a8a75e3-ec5a-4a95-b363-ec065ba6a1fb','2025-10-17 11:38:25',1,'2025-10-10 06:08:25','2025-10-10 06:08:25'),(765,35,'092559c1-3580-4883-b48b-b781d6388383','2025-10-17 13:16:50',1,'2025-10-10 07:46:50','2025-10-10 07:46:50'),(766,35,'839b81c7-0f01-496c-913c-d2720659c7eb','2025-10-17 13:26:29',1,'2025-10-10 07:56:29','2025-10-10 07:56:29'),(768,35,'e57809c4-1fae-48df-aea1-566f256832b4','2025-10-17 15:33:22',1,'2025-10-10 10:03:22','2025-10-10 10:03:22'),(769,35,'e94f8bd4-2d14-4e4b-aa2f-b14c33341dcb','2025-10-17 17:09:13',1,'2025-10-10 11:39:13','2025-10-10 11:39:13'),(770,35,'1c701f9f-e921-4fc6-989e-b6a3ceaa015c','2025-10-18 06:27:17',1,'2025-10-11 06:27:17','2025-10-11 06:27:17'),(771,35,'24752556-58a3-42d3-a7da-37bfde99e0c9','2025-10-18 06:27:37',1,'2025-10-11 06:27:37','2025-10-11 06:27:37'),(772,35,'a18992ec-9061-4411-8c4a-5f9278e9258b','2025-10-18 06:27:56',1,'2025-10-11 06:27:56','2025-10-11 06:27:56'),(773,35,'e965a021-365a-4fbb-b1a1-5e09413dbf95','2025-10-18 06:28:16',1,'2025-10-11 06:28:16','2025-10-11 06:28:16'),(774,35,'48243062-4c48-48f5-bfb7-dbe37c5acd66','2025-10-18 06:35:17',1,'2025-10-11 06:35:17','2025-10-11 06:35:17'),(776,35,'065904a1-90f0-43a4-977e-6a9ae8a9bb33','2025-10-18 09:14:48',1,'2025-10-11 09:14:47','2025-10-11 09:14:47'),(777,35,'310e2314-af9c-47fe-8228-4387043b4ae0','2025-10-18 10:17:13',1,'2025-10-11 10:17:13','2025-10-11 10:17:13'),(778,35,'20816ea2-9daa-4356-a275-c4ac85447890','2025-10-18 10:34:04',1,'2025-10-11 10:34:03','2025-10-11 10:34:03'),(779,35,'cf8435e4-458a-4526-8afc-d6be45d42ae6','2025-10-18 11:49:47',1,'2025-10-11 11:49:47','2025-10-11 11:49:47'),(780,35,'7a1675e5-23a4-4d20-b69a-004b36671637','2025-10-18 12:39:45',1,'2025-10-11 12:39:45','2025-10-11 12:39:45'),(781,35,'1ddd5dd2-dd33-4638-a79d-59905e854463','2025-10-18 12:50:51',1,'2025-10-11 12:50:50','2025-10-11 12:50:50'),(782,35,'7aaa79f5-9675-4d50-bce0-86123c3498a4','2025-10-18 13:32:20',1,'2025-10-11 13:32:19','2025-10-11 13:32:19'),(783,35,'50d181ab-9aeb-4273-b7bd-7bcde55c3bff','2025-10-18 13:50:34',1,'2025-10-11 13:50:33','2025-10-11 13:50:33'),(784,35,'3f24ad0d-f6a7-44d4-b172-4e4188a88623','2025-10-18 14:06:37',1,'2025-10-11 14:06:37','2025-10-11 14:06:37'),(785,35,'cb635af5-1e7f-4546-9420-572eebaa75ca','2025-10-18 14:07:47',1,'2025-10-11 14:07:47','2025-10-11 14:07:47'),(786,35,'95ab6c70-e36b-4aa0-a85d-85c9c934cd21','2025-10-18 19:07:50',1,'2025-10-11 19:07:49','2025-10-11 19:07:49'),(787,35,'6dcaf49c-3bc7-4333-bb2d-d22846a2b8d6','2025-10-18 19:20:26',1,'2025-10-11 19:20:25','2025-10-11 19:20:25'),(789,35,'5a3b8012-8d1e-4ab6-ad41-ab01374a2f97','2025-10-18 19:52:57',0,'2025-10-11 19:52:56','2025-10-13 05:15:01'),(790,35,'9bd6c4e0-6d0e-4fa6-8be8-e12b3acba937','2025-10-20 05:15:01',1,'2025-10-13 05:15:01','2025-10-13 05:15:01'),(791,35,'284f0685-a8db-4d20-b5f2-0d865174fbc9','2025-10-20 05:15:33',1,'2025-10-13 05:15:33','2025-10-13 05:15:33'),(792,35,'46a228b0-1726-4688-bc3c-d7fd60c032b3','2025-10-20 05:16:37',1,'2025-10-13 05:16:36','2025-10-13 05:16:36'),(793,35,'86049a22-ba3e-4594-b114-14e6bc0aab62','2025-10-20 05:16:59',1,'2025-10-13 05:16:58','2025-10-13 05:16:58'),(795,35,'23fe8aa4-caad-4daf-95f0-7c5bd43b4135','2025-10-20 05:23:39',1,'2025-10-13 05:23:39','2025-10-13 05:23:39'),(799,35,'deb325ce-5981-4555-95ee-0d4d4dc16052','2025-10-20 07:46:16',1,'2025-10-13 07:46:15','2025-10-13 07:46:15'),(800,35,'e5698ee7-630e-4c4c-a805-858cad700f1b','2025-10-21 05:31:17',1,'2025-10-14 05:31:16','2025-10-14 05:31:16'),(801,35,'fe621761-b0ea-4b0e-b8da-7de24297cee1','2025-10-21 05:31:40',1,'2025-10-14 05:31:39','2025-10-14 05:31:39'),(802,35,'01c37958-5f7b-418e-8457-aa0e8ff3166d','2025-10-26 21:00:47',1,'2025-10-19 21:00:47','2025-10-19 21:00:47'),(803,35,'9df5a4f1-135a-4a9c-876f-4545eaf089cf','2025-10-26 21:01:05',1,'2025-10-19 21:01:05','2025-10-19 21:01:05'),(804,35,'3788b10e-ad91-41dc-a257-31752bec158e','2025-10-26 21:01:17',1,'2025-10-19 21:01:16','2025-10-19 21:01:16'),(805,35,'75026811-1542-4614-91c5-adf2e724dcfb','2025-10-30 08:43:58',1,'2025-10-23 08:43:58','2025-10-23 08:43:58'),(806,35,'a832a899-41ad-41f8-b2c2-bb0628732249','2025-10-30 08:46:28',1,'2025-10-23 08:46:27','2025-10-23 08:46:27'),(807,35,'4de94dcd-d7ad-42b6-aa96-98a653211d25','2025-10-30 08:46:34',1,'2025-10-23 08:46:34','2025-10-23 08:46:34'),(808,77,'36a1f441-4183-46d0-9e57-47cba91790f9','2025-10-30 08:56:05',1,'2025-10-23 08:56:04','2025-10-23 08:56:04'),(809,78,'ea46451a-d018-4777-8280-43bbfef0e756','2025-10-30 08:56:18',1,'2025-10-23 08:56:18','2025-10-23 08:56:18'),(810,76,'299285de-4843-4c6a-b0c9-72e9a8e6a2ac','2025-10-30 08:57:20',1,'2025-10-23 08:57:20','2025-10-23 08:57:20'),(811,77,'7248d542-2ddc-492f-b163-3adf7e23e29e','2025-10-30 08:57:44',0,'2025-10-23 08:57:44','2025-10-24 09:25:40'),(812,79,'d3f07df0-59cd-46b4-9a80-57ec30126e5d','2025-10-30 08:58:36',1,'2025-10-23 08:58:35','2025-10-23 08:58:35'),(813,78,'a89150c3-fa63-4dc6-806f-c95407dbf5ff','2025-10-30 08:58:57',0,'2025-10-23 08:58:56','2025-10-24 10:00:01'),(814,35,'82d2b415-d073-4d65-865c-75ba327a2b8e','2025-10-30 15:11:32',1,'2025-10-23 15:11:32','2025-10-23 15:11:32'),(815,76,'bba86d57-afbc-49ad-8217-7821b316b148','2025-10-30 15:12:50',1,'2025-10-23 15:12:49','2025-10-23 15:12:49'),(816,80,'11bf4585-d4cb-4616-8ea9-161b008ff924','2025-10-30 15:15:54',1,'2025-10-23 15:15:54','2025-10-23 15:15:54'),(817,35,'28b4dd9b-ac37-4cd2-b130-338f8ba062ce','2025-10-30 15:18:38',1,'2025-10-23 15:18:38','2025-10-23 15:18:38'),(818,35,'d9cead3f-dcd0-49ab-a225-90af43d1d8c1','2025-10-30 15:34:59',1,'2025-10-23 15:34:58','2025-10-23 15:34:58'),(819,35,'69c956e8-ca69-4c88-9897-88f790c02192','2025-10-30 15:39:43',1,'2025-10-23 15:39:43','2025-10-23 15:39:43'),(820,35,'4334511c-9c2f-4e4b-bf1b-e79499fe2072','2025-10-30 22:16:41',1,'2025-10-23 22:16:40','2025-10-23 22:16:40'),(821,77,'0028ac8e-92e6-4c24-aa9e-bef3755a89ad','2025-10-31 09:25:40',1,'2025-10-24 09:25:40','2025-10-24 09:25:40'),(822,77,'fc817a24-7a41-45ef-86ad-498f0a06bc27','2025-10-31 09:25:40',1,'2025-10-24 09:25:40','2025-10-24 09:25:40'),(823,79,'f3de3209-10f1-4e4d-8ede-54338598fdb4','2025-10-31 09:59:52',1,'2025-10-24 09:59:52','2025-10-24 09:59:52'),(824,78,'d09e2601-7f1e-4cd9-9b5a-7ef65d46204b','2025-10-31 10:00:01',1,'2025-10-24 10:00:01','2025-10-24 10:00:01'),(825,78,'a90d3349-9bb7-41c4-8757-36bc1e722bea','2025-10-31 10:00:01',1,'2025-10-24 10:00:01','2025-10-24 10:00:01'),(826,35,'57988f96-15c6-4fce-9911-f12fbd04b668','2025-10-31 10:00:10',1,'2025-10-24 10:00:09','2025-10-24 10:00:09'),(827,79,'395d3d65-205f-4b59-a9be-351345fbcf24','2025-10-31 10:03:25',1,'2025-10-24 10:03:25','2025-10-24 10:03:25'),(828,79,'106af3ab-6999-467f-a412-9950615730c4','2025-10-31 11:37:53',1,'2025-10-24 11:37:52','2025-10-24 11:37:52'),(829,35,'f326c408-b77e-4346-8136-bec17de9be64','2025-10-31 15:26:06',1,'2025-10-24 15:26:05','2025-10-24 15:26:05'),(830,35,'8219d6d4-86ac-4d4a-9e23-250f70f7d8b5','2025-10-31 15:29:50',1,'2025-10-24 15:29:50','2025-10-24 15:29:50'),(831,35,'9e6ab48b-b2cd-4a01-8af1-6d9568e30629','2025-10-31 15:30:32',1,'2025-10-24 15:30:32','2025-10-24 15:30:32');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_date` date NOT NULL,
  `report_month` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Format: YYYY-MM',
  `campaign_id` int NOT NULL,
  `campaign_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Denormalized for performance',
  `campaign_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Denormalized for performance',
  `brand` int DEFAULT NULL COMMENT 'FK to brands table',
  `brand_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Denormalized brand name for reporting',
  `leads` int DEFAULT '0',
  `facebook_result` int DEFAULT '0',
  `zoho_result` int DEFAULT '0',
  `spent` decimal(15,2) DEFAULT '0.00',
  `facebook_cost_per_lead` decimal(10,2) GENERATED ALWAYS AS ((case when (`facebook_result` > 0) then (`spent` / `facebook_result`) else NULL end)) STORED,
  `zoho_cost_per_lead` decimal(10,2) GENERATED ALWAYS AS ((case when (`zoho_result` > 0) then (`spent` / `zoho_result`) else NULL end)) STORED,
  `cost_per_lead` decimal(10,2) GENERATED ALWAYS AS ((case when (`leads` > 0) then (`spent` / `leads`) else NULL end)) STORED,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL COMMENT 'User who created this record',
  PRIMARY KEY (`id`),
  KEY `idx_report_date` (`report_date`),
  KEY `idx_report_month` (`report_month`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_brand` (`brand`),
  KEY `idx_date_campaign` (`report_date`,`campaign_id`),
  KEY `fk_reports_created_by` (`created_by`),
  KEY `idx_reports_report_month` (`report_month`),
  KEY `idx_reports_campaign` (`campaign_id`),
  KEY `idx_reports_report_date` (`report_date`),
  KEY `idx_reports_campaign_date` (`campaign_id`,`report_date`),
  KEY `idx_reports_date` (`report_date`),
  KEY `idx_reports_brand` (`brand`),
  CONSTRAINT `fk_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1021 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (94,5,1,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(95,5,2,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(96,5,3,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(97,5,4,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(98,5,5,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(99,5,6,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(100,5,7,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(101,5,8,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(102,5,9,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(103,5,10,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(104,5,11,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(105,5,12,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(106,5,13,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(107,5,14,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(108,5,15,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(109,5,16,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(110,5,17,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(111,5,18,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(112,5,19,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(113,5,20,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(114,5,21,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(115,5,22,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(116,5,23,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(117,5,24,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(118,5,25,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(119,5,26,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(120,5,27,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(121,5,28,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(122,5,29,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(123,5,30,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(124,5,31,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(125,5,32,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(126,5,33,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(127,5,34,'2025-09-17 13:05:36','2025-09-17 13:05:36'),(254,5,35,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(255,5,36,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(256,5,37,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(257,5,38,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(258,5,39,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(259,5,40,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(260,5,41,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(261,5,42,'2025-09-17 13:22:42','2025-09-17 13:22:42'),(813,5,44,'2025-10-08 06:17:25','2025-10-08 06:17:25'),(814,5,46,'2025-10-08 06:17:25','2025-10-08 06:17:25'),(815,5,43,'2025-10-08 06:17:25','2025-10-08 06:17:25'),(816,5,45,'2025-10-08 06:17:25','2025-10-08 06:17:25'),(818,5,51,'2025-10-08 08:11:26','2025-10-08 08:11:26'),(820,5,53,'2025-10-08 08:11:26','2025-10-08 08:11:26'),(821,5,54,'2025-10-08 08:11:26','2025-10-08 08:11:26'),(827,5,55,'2025-10-08 08:22:04','2025-10-08 08:22:04'),(833,5,65,'2025-10-08 09:13:25','2025-10-08 09:13:25'),(834,5,66,'2025-10-08 09:13:25','2025-10-08 09:13:25'),(835,5,67,'2025-10-08 09:13:25','2025-10-08 09:13:25'),(836,5,68,'2025-10-08 09:13:25','2025-10-08 09:13:25'),(838,5,73,'2025-10-08 10:01:53','2025-10-08 10:01:53'),(839,5,75,'2025-10-08 10:01:53','2025-10-08 10:01:53'),(841,5,74,'2025-10-08 10:01:53','2025-10-08 10:01:53'),(842,5,72,'2025-10-08 10:01:53','2025-10-08 10:01:53'),(844,5,70,'2025-10-08 10:01:53','2025-10-08 10:01:53'),(991,26,24,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(992,26,32,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(993,26,19,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(994,26,18,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(995,26,27,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(996,26,29,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(997,26,14,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(998,26,28,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(999,26,6,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1000,26,15,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1001,26,16,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1002,26,9,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1003,26,8,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1004,26,44,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1005,26,45,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1006,26,10,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1007,26,12,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1008,26,70,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1009,26,11,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1010,26,17,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1011,26,51,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1012,26,73,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1013,26,74,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1014,26,55,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1015,26,7,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1016,26,72,'2025-10-23 08:48:22','2025-10-23 08:48:22'),(1017,26,53,'2025-10-23 08:48:23','2025-10-23 08:48:23'),(1018,26,66,'2025-10-23 08:48:23','2025-10-23 08:48:23'),(1019,26,65,'2025-10-23 08:48:23','2025-10-23 08:48:23'),(1020,26,67,'2025-10-23 08:48:23','2025-10-23 08:48:23');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `level` int DEFAULT '1' COMMENT '1=lowest, 10=highest permission level',
  `is_active` tinyint(1) DEFAULT '1',
  `is_system_role` tinyint(1) DEFAULT '0' COMMENT 'Cannot be deleted if true',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (5,'super_admin','Super Administrator','Full system access with all permissions',10,1,1,'2025-09-17 13:01:36','2025-09-17 13:01:36'),(26,'Advertiser','Advertiser','',1,1,0,'2025-10-23 08:48:22','2025-10-23 08:48:22');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Google Authenticator token/secret',
  `twofa_enabled` tinyint(1) DEFAULT '0',
  `twofa_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `twofa_verified_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_2fa_enabled` tinyint(1) DEFAULT '0',
  `two_factor_secret` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `two_factor_backup_codes` text COLLATE utf8mb4_unicode_ci,
  `role_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'user',
  `role_id` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_users_twofa_enabled` (`twofa_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts with Two-Factor Authentication support';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (35,'admin','$2b$12$elxMosCK0I8oC.EMd/me/ePryc9mozP.plBanpn7I1dY5i9HJFZPu','NAYUW2ZMG46DA6DXOEXEINJMM5ZGIWTQ',0,NULL,NULL,1,'2025-10-24 15:30:32','2025-09-13 08:20:12','2025-10-24 15:30:32',0,NULL,NULL,'super_admin',5),(76,'pablo','$2b$12$WmTM15Ui6N2LzaqqbVERZe8HKV4y350fZ5PgOdgjNyw7ZV.576xgC','OQWFU4DSF5LSIRZFEFGVG6TZENTWQU3L',0,NULL,NULL,1,'2025-10-23 15:12:49','2025-10-23 08:49:18','2025-10-23 15:13:48',1,NULL,NULL,'user',26),(77,'bhumika','$2b$12$OAjkqXBfD1h4Lrx9BMC6B.Xib6wUO0k3Bx3Shuoxy0cUJx6mUOo4K','IAYWWSC3IJOXM6DVIRTCYV2YMJJGYRJI',0,NULL,NULL,1,'2025-10-23 08:57:44','2025-10-23 08:50:20','2025-10-23 08:57:44',0,NULL,NULL,'user',26),(78,'saad','$2b$12$.wgtXyfrLb6Y6x.8cgbur.Qgo5K2WSYym41SPnI23tk1668QYDH9S','N5EESJLGF4YCGO32J5XWMRTWMI2VIOT2',0,NULL,NULL,1,'2025-10-23 08:58:56','2025-10-23 08:50:34','2025-10-23 08:58:56',0,NULL,NULL,'user',26),(79,'Imran','$2b$12$zp6B7dhk7iYZ/.Lb5/DIQu6Nd2cEBxqCWVlw9SXbR4u5CLX/d6/3O',NULL,0,NULL,NULL,1,'2025-10-24 11:37:52','2025-10-23 08:50:54','2025-10-24 11:37:52',0,NULL,NULL,'user',26),(80,'aamir','$2b$12$TQ8JJPNEhMP7GoQv7fTIguuPYZotvLVE/0O5/ceQMMF3HtypBXucO','IV5GMLZSHBRDOT3JHJVWWWZIHBIDMYJD',0,NULL,NULL,1,'2025-10-23 15:15:54','2025-10-23 15:14:51','2025-10-23 15:15:54',0,NULL,NULL,'user',26);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ads_management'
--

--
-- Dumping routines for database 'ads_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-24 15:43:50
deployer@vultr:~/Ads-Management-Fresh$