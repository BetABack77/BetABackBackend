export const generateOtpTemplate = (userName, otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Betaback OTP Verification</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f7fa;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        overflow: hidden;
        padding: 40px 30px;
        color: #333333;
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        margin-bottom: 30px;
        border-bottom: 1px solid #eeeeee;
      }
      .header img {
        height: 80px;
        border-radius: 10px;
        object-fit: contain;
      }
      .header h1 {
        font-size: 24px;
        margin-top: 10px;
        color: #4A90E2;
      }
      .message {
        font-size: 18px;
        margin-bottom: 30px;
      }
      .otp {
        font-size: 32px;
        letter-spacing: 8px;
        font-weight: bold;
        text-align: center;
        background-color: #f0f4ff;
        color: #4A90E2;
        padding: 20px;
        border-radius: 10px;
        border: 2px dashed #4A90E2;
        margin: 0 auto 30px;
        width: fit-content;
      }
      .footer {
        font-size: 14px;
        color: #888888;
        text-align: center;
        margin-top: 20px;
      }
      .footer a {
        color: #4A90E2;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://res.cloudinary.com/degag862k/image/upload/v1744893491/WhatsApp_Image_2025-04-17_at_09.07.23_19048e01_fk6hmm.jpg" alt="Betaback Logo" />
        <h1>Betaback</h1>
      </div>
      <div class="message">
        Hi <strong>${userName}</strong>,<br/><br/>
        Use the following One-Time Password (OTP) to proceed with your request. This OTP is valid for the next 10 minutes. Do not share it with anyone.
      </div>
      <div class="otp">${otp}</div>
      <div class="footer">
        If you didn’t request this, please ignore this email.<br/><br/>
        &copy; ${new Date().getFullYear()} Betaback. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
