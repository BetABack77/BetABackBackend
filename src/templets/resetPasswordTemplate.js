export const resetPasswordTemplate = (userName) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Reset Your Password - Betaback</title>
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
          .footer {
            font-size: 14px;
            color: #888888;
            text-align: center;
            margin-top: 30px;
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
            We received a request to reset your password. A team member will assist you shortly or you may receive another email with further instructions. If you didn’t request this, you can safely ignore this message.
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Betaback. All rights reserved. <br/>
            Need help? <a href="mailto:support@betaback.com">Contact Support</a>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  