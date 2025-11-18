
CREATE DATABASE IF NOT EXISTS urbanVogue;
USE urbanVogue;

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

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

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

CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrito_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1,
    FOREIGN KEY (id_carrito) REFERENCES carrito(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','enviado','entregado','cancelado') DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

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
-- Datos iniciales
-- ==========================================

INSERT INTO categorias (nombre, descripcion) VALUES
('Camisetas', 'Ropa superior de algodón o poliéster.'),
('Sudaderas', 'Sudaderas y hoodies de la colección Urban.'),
('Pantalones', 'Jeans, joggers y pantalones de chándal.'),
('Accesorios', 'Gorras, mochilas y complementos.');

INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Tomas Gonzalez','tomasgonzalez@mail.com','12345','cliente'),
('Ariel Atienza','arielatienza@mail.com','12345','cliente'),
('Admin','admin@mail.com','admin123','admin');

INSERT INTO productos (nombre, descripcion, precio, stock, talla, color, imagen, id_categoria) VALUES
('Camiseta Urban Black', 'Camiseta negra básica con logo UrbanVogue', 19.99, 50, 'M', 'Negro', 'camiseta_black.jpg', 1),
('Sudadera Classic', 'Sudadera oversize color beige con capucha', 39.99, 30, 'L', 'Beige', 'sudadera_classic.jpg', 2),
('Jogger Street', 'Pantalón jogger gris con puños elásticos', 34.99, 25, 'M', 'Gris', 'pantalon_jogger.jpg', 3),
('Gorra Urban', 'Gorra trucker con logotipo bordado', 14.99, 40, NULL, 'Negro', 'gorra_urban.jpg', 4);
