-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: urbanvogue
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carrito`
--

DROP TABLE IF EXISTS `carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito`
--

LOCK TABLES `carrito` WRITE;
/*!40000 ALTER TABLE `carrito` DISABLE KEYS */;
INSERT INTO `carrito` VALUES (1,1,'2025-10-21 16:29:36'),(2,2,'2025-10-21 16:29:36'),(4,5,'2025-11-23 18:06:32'),(5,7,'2025-11-25 20:51:32'),(6,8,'2025-11-26 19:54:23'),(7,6,'2025-12-01 17:43:10');
/*!40000 ALTER TABLE `carrito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carrito_items`
--

DROP TABLE IF EXISTS `carrito_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_carrito` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `talla` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_carrito` (`id_carrito`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `carrito_items_ibfk_1` FOREIGN KEY (`id_carrito`) REFERENCES `carrito` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carrito_items_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_items`
--

LOCK TABLES `carrito_items` WRITE;
/*!40000 ALTER TABLE `carrito_items` DISABLE KEYS */;
INSERT INTO `carrito_items` VALUES (2,2,2,1,NULL),(21,1,2,1,NULL),(70,7,5,1,'M');
/*!40000 ALTER TABLE `carrito_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Camisetas','Camisetas'),(2,'Pantalones','Pantalones'),(4,'Accesorios','Accesorios'),(13,'Sudaderas','Sudaderas');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_pedido`
--

DROP TABLE IF EXISTS `detalle_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `talla` varchar(10) DEFAULT NULL,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pedido`
--

LOCK TABLES `detalle_pedido` WRITE;
/*!40000 ALTER TABLE `detalle_pedido` DISABLE KEYS */;
INSERT INTO `detalle_pedido` VALUES (1,1,1,2,NULL,15.99),(2,2,2,1,NULL,29.99),(3,3,1,1,NULL,15.99),(4,5,3,1,'M',19.99),(5,5,11,1,'M',100.00),(6,6,3,1,'M',19.99),(7,7,11,1,'M',100.00),(8,8,3,1,'M',19.99),(9,8,11,1,'M',100.00),(10,9,13,1,'M',1.00),(11,10,4,1,'M',19.00),(12,11,5,1,'M',1.00),(13,12,1,1,'M',15.99),(14,13,3,1,'M',19.99),(15,14,3,7,'M',19.99),(16,15,10,1,'M',29.99),(17,15,1,1,'M',15.99),(18,16,2,2,'M',29.99),(19,17,4,1,'M',19.00),(20,18,11,1,'M',100.00),(21,19,5,1,'M',1.00),(22,20,11,1,'M',100.00),(23,20,10,1,'M',29.99),(24,20,13,1,'M',1.00),(25,21,10,2,'M',29.99),(26,21,2,2,'M',29.99),(27,21,13,2,'M',1.00),(28,21,3,2,'M',19.99),(29,21,4,2,'M',19.00),(30,22,2,1,'M',29.99),(31,23,4,1,'M',19.00);
/*!40000 ALTER TABLE `detalle_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_suscriptores`
--

DROP TABLE IF EXISTS `newsletter_suscriptores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_suscriptores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `fecha_suscripcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_suscriptores`
--

LOCK TABLES `newsletter_suscriptores` WRITE;
/*!40000 ALTER TABLE `newsletter_suscriptores` DISABLE KEYS */;
INSERT INTO `newsletter_suscriptores` VALUES (1,'tgonati327@g.educaand.es','2025-11-28 19:02:16'),(2,'tomasgnzlztnz@gmail.com','2025-11-28 19:08:53'),(3,'eduardocorreaaranda10@gmail.com','2025-12-01 17:42:42'),(4,'diegohgonzalez081@gmail.com','2025-12-03 20:26:24');
/*!40000 ALTER TABLE `newsletter_suscriptores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,1,57.48,'pendiente','2025-10-21 16:29:36'),(2,2,29.99,'pendiente','2025-10-21 16:29:36'),(3,1,15.99,'pendiente','2025-11-20 20:06:28'),(4,8,119.99,'pendiente','2025-11-26 19:55:39'),(5,8,119.99,'pendiente','2025-11-26 20:00:57'),(6,8,19.99,'pendiente','2025-11-26 21:07:24'),(7,8,100.00,'pendiente','2025-11-26 21:08:22'),(8,8,119.99,'pendiente','2025-11-26 21:29:54'),(9,8,1.00,'pendiente','2025-11-27 18:22:38'),(10,8,19.00,'pendiente','2025-11-27 18:24:09'),(11,8,1.00,'pendiente','2025-11-27 18:27:40'),(12,8,15.99,'pendiente','2025-11-27 18:29:14'),(13,8,19.99,'pendiente','2025-11-27 21:05:46'),(14,8,139.93,'pendiente','2025-11-27 21:08:50'),(15,5,45.98,'pendiente','2025-11-27 21:29:17'),(16,5,59.98,'pendiente','2025-11-27 21:32:19'),(17,8,19.00,'pendiente','2025-11-27 21:34:30'),(18,8,100.00,'pendiente','2025-11-27 21:35:47'),(19,5,1.00,'pendiente','2025-11-27 21:37:13'),(20,5,130.99,'pendiente','2025-11-27 21:38:38'),(21,5,199.94,'pendiente','2025-12-05 15:59:00'),(22,5,29.99,'pendiente','2025-12-05 16:06:21'),(23,5,19.00,'pendiente','2025-12-05 16:21:58');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `talla` varchar(10) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `id_categoria` int DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Camiseta Hombre','Camiseta básica de algodón',15.99,10,'M','Negro','/img/clothes/TH-shirt.jpg',1,'2025-02-01 09:00:00'),(2,'Pantalón Mujer','Pantalón vaquero ajustado',29.99,40,'S','Azul','/img/clothes/TH-shirt.jpg',2,'2025-11-20 22:10:48'),(3,'Camiseta UrbanVogue Premium','Camiseta de algodón orgánico',19.99,50,NULL,NULL,'/img/clothes/TH-shirt.jpg',1,'2025-11-20 22:10:48'),(4,'Anillo Hombre','Anillo color plata',19.00,10,'S','plata','/img/clothes/TH-shirt.jpg',4,'2025-11-20 22:10:48'),(5,'Camiseta TH','Camiseta Team Heretics WC',1.00,15,'M','Blanco','/img/clothes/TH-shirt.jpg',1,'2025-11-06 22:13:29'),(10,'Sudadera Mundial TH','Sudadera Mundial TH Negra',29.99,100,'M','Negro','/img/clothes/TH-shirt.jpg',13,'2025-11-23 19:44:27'),(11,'Sudadera Masters Madrid TH','Sudadera Masters Madrid TH NEgra',100.00,21,'L','Azul','/img/clothes/TH-shirt.jpg',13,'2025-11-23 19:45:22'),(13,'Camiseta Basica','Camiseta Básica blanca',1.00,20,'XL','Blanco','/img/clothes/TH-shirt.jpg',1,'2025-11-23 21:36:23');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `rol` enum('cliente','admin') DEFAULT 'cliente',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Tomas Gonzalez Atienza','tomasgonzalez@mail.com','\'$2b$10$rGvP4GuRtVsALxWWzyyMVOT47.fFlTMiHWNaE.uqzrH/HSWxze796\'','Estepona','686640937',NULL,'cliente','2025-10-21 16:29:36'),(2,'Ariel Atienza','arielatienza@mail.com','\'$2b$10$rGvP4GuRtVsALxWWzyyMVOT47.fFlTMiHWNaE.uqzrH/HSWxze796\'',NULL,NULL,NULL,'cliente','2025-10-21 16:29:36'),(5,'Tomas','tomasgnzlztnz@gmail.com','$2b$10$rGvP4GuRtVsALxWWzyyMVOT47.fFlTMiHWNaE.uqzrH/HSWxze796','C/ El Cid Bloque Nº 5 Piso 3-B','686640937',NULL,'cliente','2025-11-23 17:51:42'),(6,'admin2','admin2@MAIL.COM','$2b$10$hrGbSIjqEtfJFEmrMxvC8uUzR4OXvny0N9kjatMrkok/Ao9vbnwf2','admin','admin',NULL,'admin','2025-11-23 17:52:53'),(7,'Antonio','antonio@gmail.com','$2b$10$3QV4JtSKG8V8.FNdQNFf0eIQWthp54mZWEfQ1on1epLgiBa1cjMv.',NULL,NULL,NULL,'cliente','2025-11-23 18:09:26'),(8,'tgonati327','tgonati327@g.educaand.es','$2b$10$oXUxkJNx3vN/G2zoMA2lQeOhDvGsGxWV/ktf/IRoG5.uPlhp31wdK','Estepona','686640937',NULL,'cliente','2025-11-26 19:53:12'),(9,'Urbanvogue1','urbanvogue1@gmail.com','$2b$10$vtHXZ6r9Vz46VVbi9r4OPegmu7mmQBJnK5yBI4TIdn0.GbcgEEwIe',NULL,NULL,NULL,'cliente','2025-12-02 18:16:16');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-05 19:30:39
