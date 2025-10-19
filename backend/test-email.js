// Test email functionality
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  try {
    console.log('🧪 Testing email service...');
    
    const result = await emailService.sendVerificationCode(
      'test@example.com', // Your test email
      '123456',
      'Test User'
    );
    
    console.log('✅ Email test successful:', result);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n📝 Setup instructions:');
    console.log('1. Enable 2-Step Verification in your Google Account');
    console.log('2. Generate an App Password for Mail');
    console.log('3. Update .env file with:');
    console.log('   EMAIL_USER=your_gmail@gmail.com');
    console.log('   EMAIL_APP_PASSWORD=your_16_digit_app_password');
  }
}

testEmail();

