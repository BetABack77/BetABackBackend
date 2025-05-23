export const changePasswordTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Password Updated - Betaback</title>
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
          We wanted to let you know that your password was successfully updated. If you made this change, you don't need to do anything else.<br/><br/>
          If you did <strong>not</strong> request this change, please contact our support team immediately to secure your account.
        </div>
        <div class="footer">
          Need help? <a href="mailto:support@betaback.com">Contact Support</a><br/><br/>
          &copy; ${new Date().getFullYear()} Betaback. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;
};
