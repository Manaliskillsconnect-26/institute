import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"SkillsConnect" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};

export default sendEmail;
