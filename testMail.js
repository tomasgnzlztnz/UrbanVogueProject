const { sendOrderConfirmationEmail } = require("./mailer.js")

sendOrderConfirmationEmail({
  to: "tomasgnzlztnz@gmail.com",
  nombre: "Tomas",
  pedidoId: 99,
  total: 123.45,
  items: [
    { nombre:"Camiseta Urban", talla:"M", cantidad:1, precio_unitario:40 },
    { nombre:"Sudadera TH", talla:"L", cantidad:1, precio_unitario:80 }
  ]
})
.then(() => console.log("EMAIL ENVIADO ✔"))
.catch(err => console.error("ERROR ❌", err));
