// Alternative email service using SendGrid
// npm install @sendgrid/mail

const sgMail = require('@sendgrid/mail');

class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendVerificationCode(email, verificationCode, userName = 'User') {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // Must be verified in SendGrid
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
      await sgMail.send(msg);
      console.log('✅ SendGrid verification email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ SendGrid email failed:', error);
      throw new Error('Failed to send verification email');
    }
  }
}

module.exports = new SendGridService();

