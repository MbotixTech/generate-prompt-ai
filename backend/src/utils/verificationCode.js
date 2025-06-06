/**
 * Email verification code management system
 * Handles generating, storing, and validating verification codes for various actions
 */

const crypto = require('crypto');
const notifications = require('./notifications');

// Store verification codes in memory with TTL
// In a production environment, this should be stored in Redis or a database
const verificationCodes = new Map();

// How long verification codes remain valid (in milliseconds)
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random verification code
 * @param {number} length - Length of code to generate
 * @returns {string} - Generated code
 */
const generateCode = (length = 6) => {
  // Generate a numeric code
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
};

/**
 * Create and send a verification code to a user's email
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} action - Type of action (e.g., 'password-reset', 'email-verify')
 * @returns {Promise<Object>} - Result of sending code
 */
const sendVerificationCode = async (userId, email, action, username = null) => {
  // Generate a random code
  const code = generateCode();
  
  // Store the code with expiry
  const expiryTime = Date.now() + CODE_EXPIRY;
  const codeData = {
    code,
    expiresAt: expiryTime,
    action,
    userId,
    email
  };
  
  // Create a unique key for this user and action
  const key = `${userId}:${action}`;
  verificationCodes.set(key, codeData);
  
  // Set a timeout to remove the code after it expires
  setTimeout(() => {
    if (verificationCodes.has(key)) {
      verificationCodes.delete(key);
      console.log(`Verification code for ${key} expired and removed`);
    }
  }, CODE_EXPIRY);
  
  // Create email content based on action
  let subject, text, html;
  
  switch (action) {
    case 'password-reset':
      subject = 'Reset Kata Sandi - Kode Verifikasi';
      text = `
Halo ${username || 'Pengguna'},

Anda telah meminta untuk mereset kata sandi akun Mbotix Prompt Generate  Anda.

Kode verifikasi Anda adalah: ${code}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset kata sandi, silakan abaikan email ini.

Terima kasih,
Tim Mbotix Prompt Generate `;
      
      html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #4a5568;">Reset Kata Sandi</h2>
  <p>Halo <strong>${username || 'Pengguna'}</strong>,</p>
  <p>Anda telah meminta untuk mereset kata sandi akun Mbotix Prompt Generate  Anda.</p>
  
  <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 25px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0;">Kode Verifikasi Anda</h3>
    <div style="font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #4a5568;">${code}</div>
    <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">Kode berlaku selama 10 menit</p>
  </div>
  
  <p>Jika Anda tidak meminta reset kata sandi, silakan abaikan email ini.</p>
  
  <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
    Terima kasih,<br>
    Tim Mbotix Prompt Generate 
  </p>
</div>`;
      break;
      
    case 'email-verify':
      subject = 'Verifikasi Email - Mbotix Prompt Generate ';
      text = `
Halo ${username || 'Pengguna'},

Terima kasih telah mendaftar di Mbotix Prompt Generate .

Kode verifikasi Anda adalah: ${code}

Kode ini berlaku selama 10 menit.

Terima kasih,
Tim Mbotix Prompt Generate `;
      
      html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #4a5568;">Verifikasi Email</h2>
  <p>Halo <strong>${username || 'Pengguna'}</strong>,</p>
  <p>Terima kasih telah mendaftar di Mbotix Prompt Generate .</p>
  
  <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 25px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0;">Kode Verifikasi Anda</h3>
    <div style="font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #4a5568;">${code}</div>
    <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">Kode berlaku selama 10 menit</p>
  </div>
  
  <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
    Terima kasih,<br>
    Tim Mbotix Prompt Generate 
  </p>
</div>`;
      break;
      
    default:
      subject = 'Kode Verifikasi - Mbotix Prompt Generate ';
      text = `
Halo ${username || 'Pengguna'},

Berikut adalah kode verifikasi Anda: ${code}

Kode ini berlaku selama 10 menit.

Terima kasih,
Tim Mbotix Prompt Generate `;
      
      html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #4a5568;">Kode Verifikasi</h2>
  <p>Halo <strong>${username || 'Pengguna'}</strong>,</p>
  
  <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 25px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0;">Kode Verifikasi Anda</h3>
    <div style="font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #4a5568;">${code}</div>
    <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">Kode berlaku selama 10 menit</p>
  </div>
  
  <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
    Terima kasih,<br>
    Tim Mbotix Prompt Generate 
  </p>
</div>`;
  }
  
  // Send the email
  try {
    // Initialize notification system to make sure environment settings are up-to-date
    notifications.initialize();
    
    const result = await notifications.sendEmail(email, subject, text, html);
    
    if (!result.success) {
      console.error(`Failed to send verification code to ${email}:`, result.reason || 'Unknown error');
      return { success: false, error: result.reason || 'Failed to send verification email' };
    }
    
    console.log(`Verification code sent to ${email} for ${action}`);
    return {
      success: true,
      expiresAt: expiryTime,
      message: `Verification code sent to ${email}`
    };
  } catch (error) {
    console.error(`Error sending verification code to ${email}:`, error);
    return { success: false, error: error.message || 'Error sending verification email' };
  }
};

/**
 * Verify a code provided by a user
 * @param {string} userId - User ID
 * @param {string} submittedCode - Code submitted by user
 * @param {string} action - Type of action
 * @returns {Object} - Result of verification
 */
const verifyCode = (userId, submittedCode, action) => {
  const key = `${userId}:${action}`;
  const codeData = verificationCodes.get(key);
  
  if (!codeData) {
    return { 
      valid: false, 
      reason: 'no_code_found',
      message: 'No verification code found or code has expired'
    };
  }
  
  if (Date.now() > codeData.expiresAt) {
    verificationCodes.delete(key);
    return { 
      valid: false, 
      reason: 'code_expired',
      message: 'Verification code has expired'
    };
  }
  
  if (codeData.code !== submittedCode) {
    return { 
      valid: false, 
      reason: 'invalid_code',
      message: 'Invalid verification code'
    };
  }
  
  // Code is valid, remove it so it can't be used again
  verificationCodes.delete(key);
  
  return { 
    valid: true, 
    userId: codeData.userId,
    email: codeData.email,
    action: codeData.action
  };
};

/**
 * Invalidate a previously issued verification code
 * @param {string} userId - User ID
 * @param {string} action - Type of action
 * @returns {boolean} - Whether a code was invalidated
 */
const invalidateCode = (userId, action) => {
  const key = `${userId}:${action}`;
  const deleted = verificationCodes.delete(key);
  
  if (deleted) {
    console.log(`Invalidated verification code for ${key}`);
  }
  
  return deleted;
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  invalidateCode
};
