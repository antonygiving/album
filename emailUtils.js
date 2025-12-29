const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateOrderConfirmationEmail = (order) => {
  const templatePath = path.join(__dirname, 'email-templates', 'order-confirmation.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  template = template.replace(/\{\{orderId\}\}/g, order._id);
  template = template.replace(/\{\{customerName\}\}/g, order.customer?.name || 'N/A');
  template = template.replace(/\{\{customerEmail\}\}/g, order.customer?.email || 'N/A');
  const itemsHtml = order.items.map(item => `<li>${item.productName} - $${item.price} x ${item.quantity}</li>`).join('');
  template = template.replace(/\{\{items\}\}/g, itemsHtml);
  template = template.replace(/\{\{total\}\}/g, order.totalAmount);

  return template;
};

const sendOrderConfirmation = async (to, order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Order Confirmation - 24 Album',
    html: generateOrderConfirmationEmail(order)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendOrderConfirmation,
  generateOrderConfirmationEmail
};