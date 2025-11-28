const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "tomasgnzlztnz@gmail.com",
    pass: "iqkn aeoi wwxc ikdh",
  },
});

async function sendOrderConfirmationEmail({ to, nombre, pedidoId, total, items }) {
  const htmlItems = items.map(i => `
    <li>${i.nombre} (Talla ${i.talla}) — x${i.cantidad} — ${i.precio}€</li>
  `).join("");

  await transporter.sendMail({
    from: `"Urban Vogue" <tomasgnzlztnz@gmail.com>`,
    to,
    subject: `Confirmación de pedido Nº ${pedidoId}`,
    html: `
      <h2>Gracias por tu compra, ${nombre}!</h2>
      <p>Estos son los detalles de tu pedido:</p>
      <ul>${htmlItems}</ul>
      <p><strong>Total: ${total}€</strong></p>
      <p>Tu pedido está siendo procesado y será enviado próximamente.</p>
      <br>
      <p><em>Urban Vogue</em></p>
    `
  });
}

async function sendNewsletterWelcomeEmail(toEmail) {
  const mailOptions = {
    from: '"UrbanVogue" <TU_CORREO_DE_URBANVOGUE@gmail.com>',
    to: toEmail,
    subject: "Te has suscrito a las novedades de UrbanVogue 🖤",
    html: `
      <div style="font-family: Arial, sans-serif; padding:16px;">
        <h2>¡Gracias por suscribirte a UrbanVogue!</h2>
        <p>Desde ahora recibirás noticias sobre:</p>
        <ul>
          <li>Rebajas y promociones especiales</li>
          <li>Nuevas colecciones</li>
          <li>Lanzamientos exclusivos</li>
        </ul>
        <p>Si en algún momento no quieres seguir recibiendo correos, podrás darte de baja respondiendo a este email.</p>
        <p>Un saludo,<br>El equipo de UrbanVogue</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

//module.exports = { sendOrderConfirmationEmail };
module.exports = {
  transporter,
  sendNewsletterWelcomeEmail,
};
