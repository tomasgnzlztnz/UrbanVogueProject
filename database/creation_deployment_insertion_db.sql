-- ==========================================
-- Script de creación de base de datos Tienda de Ropa
-- ==========================================

-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS tienda_ropa;
USE tienda_ropa;

-- ==========================================
-- 2. Crear tablas
-- ==========================================

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    rol ENUM('cliente','admin') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    talla VARCHAR(10),
    color VARCHAR(50),
    imagen VARCHAR(255),
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla carrito
CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla carrito_items
CREATE TABLE IF NOT EXISTS carrito_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1,
    FOREIGN KEY (id_carrito) REFERENCES carrito(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
);

-- Tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','enviado','entregado','cancelado') DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Tabla detalle_pedido
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- ==========================================
-- 3. Insertar datos de ejemplo
-- ==========================================

-- Categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Hombre', 'Ropa para hombres'),
('Mujer', 'Ropa para mujeres');

-- Usuarios
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Tomas Gonzalez','tomasgonzalez@mail.com','12345','cliente'),
('Ariel Atienza','arielatienza@mail.com','12345','cliente'),
('Admin','admin@mail.com','admin123','admin');

-- Productos
INSERT INTO productos (nombre, descripcion, precio, stock, talla, color, imagen, id_categoria) VALUES
('Camiseta Hombre', 'Camiseta básica de algodón', 15.99, 50, 'M', 'Negro', 'camiseta_hombre.jpg', 1),
('Pantalón Mujer', 'Pantalón vaquero ajustado', 29.99, 40, 'S', 'Azul', 'pantalon_mujer.jpg', 2);

-- Carrito de prueba
INSERT INTO carrito (id_usuario) VALUES (1), (2);

-- Items de carrito
INSERT INTO carrito_items (id_carrito, id_producto, cantidad) VALUES
(1,1,2),
(2,2,1);

-- Pedidos de prueba
INSERT INTO pedidos (id_usuario, total, estado) VALUES
(1, 57.48, 'pendiente'),
(2, 29.99, 'pendiente');

-- Detalle pedido
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES
(1,1,2,15.99),
(2,2,1,29.99);

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================
