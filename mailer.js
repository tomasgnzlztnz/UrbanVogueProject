const nodemailer = require("nodemailer");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); 
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendOrderConfirmationEmail({ to, nombre, pedidoId, total, items }) {
  const htmlItems = items.map(i => `
    <tr>
      <td style="padding:8px 0;">${i.nombre} ${i.talla ? `(Talla ${i.talla})` : ""}</td>
      <td style="padding:8px 0; text-align:center;">x${i.cantidad}</td>
      <td style="padding:8px 0; text-align:right;">${Number(i.precio).toFixed(2)}€</td>
    </tr>
  `).join("");

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"UrbanVogue" <${process.env.MAIL_USER}>`,
    to,
    subject: `Gracias por tu compra — Pedido Nº ${pedidoId}`,
    html: `
      <div style="font-family:'Arial',sans-serif;padding:20px;color:#222;">
        
        <h2 style="letter-spacing:.5px;">¡Gracias por tu compra, ${nombre}!</h2>
        <p style="font-size:15px;">
          Hemos recibido tu pedido correctamente y ya está en proceso.  
          A continuación puedes ver el resumen de tu compra:
        </p>

        <table style="width:100%;margin-top:20px;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #ccc;">
            <th style="text-align:left;padding-bottom:6px;">Producto</th>
            <th style="text-align:center;padding-bottom:6px;">Cant.</th>
            <th style="text-align:right;padding-bottom:6px;">Precio</th>
          </tr>
          ${htmlItems}
        </table>

        <p style="margin-top:20px;font-size:16px;">
          <strong>Total pagado: ${Number(total).toFixed(2)} €</strong>
        </p>

        <p style="margin-top:20px;">
          Te enviaremos otro correo en cuanto el pedido salga hacia tu dirección
        </p>

        <p style="margin-top:40px;font-size:13px;color:#555;">
          — Gracias por confiar en <strong>UrbanVogue</strong>  
        </p>
      </div>
    `
  });
}


async function sendNewsletterWelcomeEmail(toEmail) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"UrbanVogue" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Bienvenido a UrbanVogue — Te mantendremos al día",
    html: `
      <div style="font-family:'Arial',sans-serif;padding:20px;color:#222;">
        
        <h2 style="letter-spacing:1px;">¡Te has unido a UrbanVogue!</h2>

        <p style="font-size:15px;">
          A partir de ahora serás el primero en enterarte de:
        </p>

        <ul style="font-size:15px;line-height:1.6;">
          <li>Descuentos exclusivos para miembros</li>
          <li>Nuevos drops y lanzamientos limitados</li>
          <li>Re-stock de prendas populares</li>
          <li>Eventos y colaboraciones especiales</li>
        </ul>

        <p style="font-size:15px;margin-top:20px;">
          Bienvenido a nuestra comunidad.  
          Nos encanta tenerte con nosotros
        </p>

        <p style="margin-top:35px;font-size:13px;color:#666;">
          Si en algún momento deseas dejar de recibir correos,
          simplemente responde indicando <strong>BAJA</strong>.
        </p>

        <p style="margin-top:10px;font-size:14px;">
          — El equipo de <strong>UrbanVogue</strong>
        </p>
      </div>
    `
  });
}


module.exports = {
  transporter,
  sendNewsletterWelcomeEmail,
  sendOrderConfirmationEmail
};
