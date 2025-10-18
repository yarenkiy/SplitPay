const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not your regular password)
      }
    });
  }

  async sendVerificationCode(email, verificationCode, userName = 'User') {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'LetSPLIT - Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366F1; font-size: 28px; margin: 0;">LetSPLIT</h1>
            <p style="color: #6B7280; margin: 5px 0;">Split expenses with friends</p>
          </div>
          
          <div style="background-color: #F8FAFC; padding: 30px; border-radius: 12px; text-align: center;">
            <h2 style="color: #1F2937; margin-bottom: 20px;">Password Reset Verification</h2>
            <p style="color: #6B7280; font-size: 16px; margin-bottom: 30px;">
              Hi ${userName},<br><br>
              You requested a password reset for your LetSPLIT account. Please use the verification code below to reset your password:
            </p>
            
            <div style="background-color: #6366F1; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
              ${verificationCode}
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes.<br>
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2024 LetSPLIT. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetSuccess(email, userName = 'User') {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'LetSPLIT - Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366F1; font-size: 28px; margin: 0;">LetSPLIT</h1>
            <p style="color: #6B7280; margin: 5px 0;">Split expenses with friends</p>
          </div>
          
          <div style="background-color: #F0FDF4; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #BBF7D0;">
            <h2 style="color: #15803D; margin-bottom: 20px;">✅ Password Reset Successful</h2>
            <p style="color: #166534; font-size: 16px; margin-bottom: 20px;">
              Hi ${userName},<br><br>
              Your password has been successfully reset. You can now log in to your LetSPLIT account with your new password.
            </p>
            
            <div style="background-color: #15803D; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 20px;">
              <strong>Your account is secure</strong>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
              If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2024 LetSPLIT. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset success email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send success email:', error);
      throw new Error('Failed to send success email');
    }
  }
}

module.exports = new EmailService();
