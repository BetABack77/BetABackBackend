import nodemailer from "nodemailer";

// Define the type for the return value of the function
export const sendMail = async (
  email,
  title,
  body= "hello brothers"
) => {
  try {
    // Create transporter object using nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = body; // Type is inferred as string

    // Sending mail using the transporter
    const info = await transporter.sendMail({
      from: `"BetaBack" <${process.env.EMAIL_USER}>`, // Sender address updated to Instagram
      to: email, // List of receivers
      subject: title, // Subject line
      html: htmlContent, // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
