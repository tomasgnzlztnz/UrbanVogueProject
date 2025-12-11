# UrbanVogue

UrbanVogue es una tienda online desarrollada como proyecto (TFG). Incluye catálogo, carrito, proceso de compra (simulado), panel de administración, newsletter y formulario de contacto con envío de emails usando **Resend**.

---

## Funcionalidades

- Registro / login y sesión con cookies
- Catálogo de productos por categorías
- Carrito 
- Checkout (simulación de pago) + confirmación por email
- Panel Admin:
  - CRUD de categorías
  - CRUD de productos
  - Gestión de stock
  - Gestión de usuarios 
  - Listado y borrado de suscriptores newsletter
  - Selector de imágenes desde carpeta `/img`
- Newsletter+ envío email con Resend
- Formulario de contacto + envío email con Resend
- Banner de cookies 

---

## Tecnologías utilizadas

- **Node.js + Express**
- **MySQL**
- **Bootstrap 5**
- **Boxicons**
- **Resend** 
- **express-session** 
- **cors**
- **dotenv**

---

## Requisitos

- **Node.js** (recomendado 18+)
- **npm**
- **MySQL Server**
- (Opcional) **MySQL Workbench** para gestionar la base de datos
- Archivo ./env, como por ejemplo:

# Puerto
PORT=3000

# Base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD
DB_NAME=urbanvogue
DB_PORT=3306

# Sesión
SESSION_SECRET=pon_aqui_una_clave_larga_y_segura

# Resend (emails)
RESEND_API_KEY=TU_API_KEY_DE_RESEND
RESEND_FROM=UrbanVogue <tucorreo@tu-dominio.com>
RESEND_TO=tucorreo@tu-dominio.com

# Entorno (opcional)
NODE_ENV=development


En Linux (Ubuntu/Debian), por ejemplo:


```bash
sudo apt update
sudo apt install nodejs npm
npm run dev 

