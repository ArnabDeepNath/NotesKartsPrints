const nodemailer = require("nodemailer");

const normalizeCredential = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const normalized = String(value)
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n]+/g, "")
    .trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
};

const createTransporter = () => {
  const host = normalizeCredential(process.env.SMTP_HOST);
  const port = Number(normalizeCredential(process.env.SMTP_PORT) || 0);
  const user = normalizeCredential(process.env.SMTP_USER);
  const pass = normalizeCredential(process.env.SMTP_PASS);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    const smtpUser = normalizeCredential(process.env.SMTP_USER);
    const smtpPass = normalizeCredential(process.env.SMTP_PASS);

    if (!smtpUser || !smtpPass) {
      console.warn("SMTP config missing, skipping email to:", to);
      return;
    }
    const transporter = createTransporter();
    await transporter.sendMail({
      from:
        normalizeCredential(process.env.SMTP_FROM) ||
        '"Basak Print" <no-reply@basak.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    if (
      error?.code === "EAUTH" ||
      /535[- ]5\.7\.8|badcredentials/i.test(error?.message || "")
    ) {
      console.error(
        "SMTP authentication failed. Confirm SMTP_USER/SMTP_PASS are the Gmail address plus a Gmail App Password, with no extra quotes or spaces.",
      );
    }
    console.error(`Error sending email to ${to}:`, error);
  }
};

const sendOrderConfirmation = async (userEmail, orderDetails, printJobs) => {
  const subject = `Order Confirmation - #${orderDetails.id}`;

  let html = `
    <h2>Thank you for your order!</h2>
    <p>Your order <strong>#${orderDetails.id}</strong> has been successfully placed.</p>
    <h3>Order Summary:</h3>
    <ul>
  `;

  if (orderDetails.items && orderDetails.items.length > 0) {
    orderDetails.items.forEach((item) => {
      html += `<li>${item.quantity}x ${item.book ? item.book.title : "Book"} - ₹${item.price}</li>`;
    });
  }

  if (printJobs && printJobs.length > 0) {
    html += `<h3>Print Jobs:</h3><ul>`;
    printJobs.forEach((job) => {
      html += `<li>Document: ${job.fileName} (${job.pages} pages, ${job.copies} copies) - ₹${job.price} <br/>
      <small>Settings: ${job.colorMode}, ${job.printType}, ${job.paperType}, Binding: ${job.binding}</small></li>`;
    });
    html += `</ul>`;
  }

  html += `</ul>
    <h3>Total: ₹${orderDetails.total}</h3>
    <p>We will notify you once your order is processed and shipped.</p>
  `;

  await sendEmail(userEmail, subject, html);
};

const sendPrintJobUpdate = async (
  userEmail,
  printJob,
  newStatus,
  trackingLink,
) => {
  const subject = `Print Job Update - ${printJob.fileName}`;

  let html = `
    <h2>Print Job Status Update</h2>
    <p>Your print job for document <strong>${printJob.fileName}</strong> is now: <strong>${newStatus}</strong>.</p>
  `;

  if (trackingLink) {
    html += `<p>You can track your shipment here: <a href="${trackingLink}">${trackingLink}</a></p>`;
  }

  html += `<p>Thank you for choosing Basak Print!</p>`;

  await sendEmail(userEmail, subject, html);
};

const sendOrderUpdate = async (userEmail, orderDetails, newStatus) => {
  const subject = `Order Status Update - #${orderDetails.id}`;

  let html = `
    <h2>Order Status Update</h2>
    <p>Your order <strong>#${orderDetails.id}</strong> is now: <strong>${newStatus}</strong>.</p>
    <p>Thank you for shopping with Basak Print!</p>
  `;

  await sendEmail(userEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPrintJobUpdate,
  sendOrderUpdate,
};
