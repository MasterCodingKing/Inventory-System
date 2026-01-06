const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'IT Inventory System <noreply@inventory.com>',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  borrowConfirmation: (data) => ({
    subject: 'Equipment Borrow Confirmation',
    html: `
      <h2>Equipment Borrow Confirmation</h2>
      <p>Dear ${data.borrowerName},</p>
      <p>Your equipment borrow request has been confirmed:</p>
      <ul>
        <li><strong>Equipment:</strong> ${data.equipmentName}</li>
        <li><strong>PC Name:</strong> ${data.pcName}</li>
        <li><strong>Borrow Date:</strong> ${data.borrowDate}</li>
        <li><strong>Expected Return:</strong> ${data.expectedReturnDate}</li>
      </ul>
      <p>Please ensure to return the equipment on time.</p>
      <p>Best regards,<br>IT Department</p>
    `,
    text: `Equipment Borrow Confirmation\n\nDear ${data.borrowerName},\n\nYour equipment borrow request has been confirmed.\nEquipment: ${data.equipmentName}\nPC Name: ${data.pcName}\nBorrow Date: ${data.borrowDate}\nExpected Return: ${data.expectedReturnDate}\n\nPlease ensure to return the equipment on time.\n\nBest regards,\nIT Department`
  }),

  returnReminder: (data) => ({
    subject: 'Equipment Return Reminder',
    html: `
      <h2>Equipment Return Reminder</h2>
      <p>Dear ${data.borrowerName},</p>
      <p>This is a reminder that the following equipment is due for return:</p>
      <ul>
        <li><strong>Equipment:</strong> ${data.equipmentName}</li>
        <li><strong>PC Name:</strong> ${data.pcName}</li>
        <li><strong>Due Date:</strong> ${data.expectedReturnDate}</li>
      </ul>
      <p>Please return the equipment to the IT department.</p>
      <p>Best regards,<br>IT Department</p>
    `,
    text: `Equipment Return Reminder\n\nDear ${data.borrowerName},\n\nThis is a reminder that the following equipment is due for return.\nEquipment: ${data.equipmentName}\nPC Name: ${data.pcName}\nDue Date: ${data.expectedReturnDate}\n\nPlease return the equipment to the IT department.\n\nBest regards,\nIT Department`
  }),

  returnConfirmation: (data) => ({
    subject: 'Equipment Return Confirmation',
    html: `
      <h2>Equipment Return Confirmation</h2>
      <p>Dear ${data.borrowerName},</p>
      <p>We confirm that the following equipment has been returned:</p>
      <ul>
        <li><strong>Equipment:</strong> ${data.equipmentName}</li>
        <li><strong>PC Name:</strong> ${data.pcName}</li>
        <li><strong>Return Date:</strong> ${data.returnDate}</li>
      </ul>
      <p>Thank you for returning the equipment.</p>
      <p>Best regards,<br>IT Department</p>
    `,
    text: `Equipment Return Confirmation\n\nDear ${data.borrowerName},\n\nWe confirm that the following equipment has been returned.\nEquipment: ${data.equipmentName}\nPC Name: ${data.pcName}\nReturn Date: ${data.returnDate}\n\nThank you for returning the equipment.\n\nBest regards,\nIT Department`
  })
};

module.exports = { sendEmail, emailTemplates, transporter };
