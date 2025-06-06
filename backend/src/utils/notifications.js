/**
 * Notification utility for sending alerts about subscription status and other events
 */
const axios = require('axios');
const nodemailer = require('nodemailer');

// Default notification settings - will be updated from environment variables
let config = {
  enabled: false,
  telegramEnabled: false,
  telegramToken: null,
  telegramChatId: null,
  emailEnabled: false,
  emailHost: null,
  emailPort: null,
  emailUser: null,
  emailPass: null,
  emailFrom: null,
  environment: process.env.NODE_ENV
};

/**
 * Initialize the notification services with settings from environment variables
 */
const initialize = () => {
  config.enabled = process.env.NOTIFICATIONS_ENABLED === 'true';
  config.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true';
  config.telegramToken = process.env.TELEGRAM_TOKEN;
  config.telegramChatId = process.env.TELEGRAM_CHAT_ID;
  
  // Allow explicit setting of email environment through ENV_TYPE for more control
  const envType = process.env.ENV_TYPE ? process.env.ENV_TYPE.trim().toLowerCase() : '';
  const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV.trim().toLowerCase() : '';
  
  // If any environment variable contains 'prod', set to production
  if (envType === 'production' || nodeEnv === 'production' || 
      envType.includes('prod') || nodeEnv.includes('prod')) {
    config.environment = 'production';
  } else {
    config.environment = envType || nodeEnv || 'development';
  }
  
  // Log the environment setting for debugging
  console.log(`Notification environment set to: "${config.environment}"`);
  
  if (config.telegramEnabled && (!config.telegramToken || !config.telegramChatId)) {
    console.warn('Telegram notifications are enabled, but token or chat ID is missing');
    config.telegramEnabled = false;
  }
  
  // Email notification settings
  config.emailEnabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
  config.emailHost = process.env.EMAIL_HOST;
  config.emailPort = process.env.EMAIL_PORT;
  config.emailUser = process.env.EMAIL_USER;
  config.emailPass = process.env.EMAIL_PASS;
  config.emailFrom = process.env.EMAIL_FROM;
  
  if (config.emailEnabled && (!config.emailHost || !config.emailUser || !config.emailPass)) {
    console.warn('Email notifications are enabled, but some configuration is missing');
    config.emailEnabled = false;
  }
  
  // Log settings on startup
  console.log(`Notification service initialized. Environment: ${config.environment}, Enabled: ${config.enabled}, Telegram: ${config.telegramEnabled}, Email: ${config.emailEnabled}`);
};

// Create email transporter
let emailTransporter = null;

const createEmailTransporter = () => {
  if (!config.emailEnabled) return null;
  
  try {
    return nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort || 587,
      secure: config.emailPort === 465, // true for 465, false for other ports
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

/**
 * Send an email notification to a specific user
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<Object>} - Result of sending email
 */
const sendEmail = async (to, subject, text, html = null) => {
  if (!config.emailEnabled) {
    return { success: false, reason: 'Email notifications disabled' };
  }
  
  if (!emailTransporter) {
    emailTransporter = createEmailTransporter();
  }
  
  if (!emailTransporter) {
    return { success: false, reason: 'Email transporter not configured' };
  }
  
  try {
    // DIRECT FIX: Simply use the subject as is without any modifications
    // This ensures NO PREFIX is ever added to any email subject
    let emailSubject = subject;
    
    // Skip all environment checking and logic - just use the subject exactly as provided
    // No more [development] or [undefined] prefixes in any emails
    
    // Log for debugging
    console.log(`Sending email with subject: "${emailSubject}" (no prefix added)`);
    
    const mailOptions = {
      from: config.emailFrom || `"Notification System" <${config.emailUser}>`,
      to,
      subject: emailSubject,
      text
    };
    
    if (html) {
      mailOptions.html = html;
    }
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send a notification through configured channels
 * @param {string} message - The message to send
 * @param {string} level - The importance level ('info', 'warning', 'error')
 * @param {Object} [data] - Additional data to include
 * @returns {Promise<Object>} - Result of sending notifications
 */
const sendNotification = async (message, level = 'info', data = {}) => {
  if (!config.enabled) {
    return { success: false, reason: 'Notifications disabled' };
  }
  
  const results = {};
  // Remove environment prefix from admin notifications too
  // Only include the level in the prefix for consistency with email subjects
  const safeLevel = level ? level.toString() : 'info';
  const prefix = `${safeLevel.toUpperCase()}: `;
  const fullMessage = prefix + (message || 'No message provided');
  
  // Add data details if provided
  let detailedMessage = fullMessage;
  if (Object.keys(data).length > 0) {
    try {
      const formattedData = JSON.stringify(data, null, 2);
      detailedMessage += `\n\nDetails:\n${formattedData}`;
    } catch (error) {
      console.error('Error formatting notification data:', error);
    }
  }
  
  // Always log to console
  console.log(`NOTIFICATION: ${detailedMessage}`);
  
  // Send to Telegram if enabled
  if (config.telegramEnabled) {
    try {
      // Use plain text format to avoid parsing issues
      const response = await axios.post(
        `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
        {
          chat_id: config.telegramChatId,
          text: detailedMessage,
          parse_mode: '' // Empty string for plain text (no parsing)
        }
      );
      
      console.log('Telegram notification sent successfully');
      results.telegram = {
        success: true,
        messageId: response.data?.result?.message_id
      };
    } catch (error) {
      console.error('Error sending Telegram notification:', error.message);
      
      if (error.response) {
        // The request was made and the server responded with an error
        console.error(`Telegram API error - Status: ${error.response.status}, Data:`, error.response.data);
      }
      
      results.telegram = {
        success: false,
        error: error.message
      };
    }
  }
  
  // Send email if enabled
  if (config.emailEnabled) {
    try {
      // Create a transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailPort === 465, // true for 465, false for other ports
        auth: {
          user: config.emailUser,
          pass: config.emailPass
        }
      });
      
      // Send mail with defined transport object
      let info = await transporter.sendMail({
        from: config.emailFrom, // sender address
        to: config.emailUser, // list of receivers (send to the same user for testing)
        subject: `Notification - ${level.toUpperCase()}`, // No environment prefix for consistency
        text: detailedMessage, // plain text body
        html: `<pre>${detailedMessage}</pre>` // html body
      });
      
      results.email = {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email notification:', error.message);
      results.email = {
        success: false,
        error: error.message
      };
    }
  }
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    level,
    channels: results
  };
};

/**
 * Send subscription-specific notifications
 */
const subscriptions = {
  /**
   * Notify about expired subscriptions that were downgraded
   * @param {Array} users - List of downgraded users
   * @returns {Promise<Object>} - Notification result
   */
  notifyDowngraded: async (users) => {
    if (!users || users.length === 0) return { success: false, reason: 'No users to report' };
    
    const count = users.length;
    const message = `${count} user subscription${count !== 1 ? 's' : ''} expired and ${count !== 1 ? 'were' : 'was'} downgraded from Pro to Free`;
    
    // Format user data for the notification
    const userDetails = users.map(user => ({
      username: user.username,
      email: user.email,
      expiredAt: user.subscriptionExpires
    }));
    
    return sendNotification(message, 'warning', { users: userDetails });
  },
  
  /**
   * Notify about subscriptions that will expire soon
   * @param {Array} users - List of users with soon-to-expire subscriptions
   * @param {number} daysThreshold - Number of days threshold used for checking
   * @returns {Promise<Object>} - Notification result
   */
  notifyExpiringSoon: async (users, daysThreshold = 3) => {
    if (!users || users.length === 0) return { success: false, reason: 'No users to report' };
    
    const count = users.length;
    const message = `${count} user subscription${count !== 1 ? 's' : ''} will expire within ${daysThreshold} days`;
    
    // Format user data for the notification
    const userDetails = users.map(user => {
      const daysLeft = Math.ceil((new Date(user.subscriptionExpires) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        username: user.username,
        email: user.email,
        expiresAt: user.subscriptionExpires,
        daysLeft
      };
    });
    
    return sendNotification(message, 'info', { users: userDetails });
  },
  
  /**
   * Notify a user via email about their subscription expiring soon
   * @param {Object} user - User object with email and subscription details
   * @param {number} daysLeft - Number of days until subscription expires
   * @returns {Promise<Object>} - Email notification result
   */
  notifyUserSubscriptionExpiring: async (user, daysLeft) => {
    // Ensure notifications are initialized with latest environment variables
    initialize();
    
    if (!config.emailEnabled || !user.email) {
      return { success: false, reason: 'Email notifications disabled or no email provided' };
    }
    
    const subject = 'Langganan Pro Anda akan segera berakhir';
    
    const text = `Halo ${user.username || 'Pelanggan'},
    
Langganan Pro Anda di Mbotix Prompt Generate  akan berakhir dalam ${daysLeft} hari.

Detail langganan:
- Username: ${user.username}
- Tanggal berakhir: ${new Date(user.subscriptionExpires).toLocaleDateString('id-ID')}

Untuk memperbarui langganan Anda, silakan hubungi admin atau kunjungi situs kami.

Terima kasih,
Tim Mbotix Prompt Generate `;
    
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #d32f2f;">Langganan Pro Anda akan segera berakhir</h2>
      <p>Halo <strong>${user.username || 'Pelanggan'}</strong>,</p>
      <p>Langganan Pro Anda di Mbotix Prompt Generate  akan berakhir dalam <strong>${daysLeft} hari</strong>.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Detail langganan:</h3>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Tanggal berakhir:</strong> ${new Date(user.subscriptionExpires).toLocaleDateString('id-ID')}</p>
      </div>
      
      <p>Untuk memperbarui langganan Anda, silakan hubungi admin atau kunjungi situs kami.</p>
      
      <p>Terima kasih,<br>Tim Mbotix Prompt Generate </p>
    </div>`;
    
    return sendEmail(user.email, subject, text, html);
  },
  
  /**
   * Notify a user via email about their subscription expiring
   * @param {Object} user - User object with email and subscription details
   * @returns {Promise<Object>} - Email notification result
   */
  notifyUserSubscriptionExpired: async (user) => {
    // Ensure notifications are initialized with latest environment variables
    initialize();
    
    if (!config.emailEnabled || !user.email) {
      return { success: false, reason: 'Email notifications disabled or no email provided' };
    }
    
    const subject = 'Langganan Pro Anda telah berakhir';
    
    const text = `Halo ${user.username || 'Pelanggan'},
    
Langganan Pro Anda di Mbotix Prompt Generate  telah berakhir. Akun Anda sekarang telah dikembalikan ke status Gratis.

Untuk memperbarui langganan Anda, silakan hubungi admin atau kunjungi situs kami.

Terima kasih,
Tim Mbotix Prompt Generate `;
    
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #d32f2f;">Langganan Pro Anda telah berakhir</h2>
      <p>Halo <strong>${user.username || 'Pelanggan'}</strong>,</p>
      <p>Langganan Pro Anda di Mbotix Prompt Generate  telah berakhir. Akun Anda sekarang telah dikembalikan ke status Gratis.</p>
      
      <p>Untuk memperbarui langganan Anda, silakan hubungi admin atau kunjungi situs kami.</p>
      
      <p>Terima kasih,<br>Tim Mbotix Prompt Generate </p>
    </div>`;
    
    return sendEmail(user.email, subject, text, html);
  },
  
  /**
   * Notify a user via email about their role being upgraded to Pro
   * @param {Object} user - User object with email and username details
   * @returns {Promise<Object>} - Email notification result
   */
  notifyUserUpgradedToPro: async (user) => {
    // Ensure notifications are initialized with latest environment variables
    initialize();
    
    if (!config.emailEnabled || !user.email) {
      return { success: false, reason: 'Email notifications disabled or no email provided' };
    }
    
    const subject = 'Selamat! Akun Anda Telah Diupgrade ke Pro';
    
    const text = `Halo ${user.username || 'Pelanggan'},
    
Selamat! Akun Anda di Mbotix Prompt Generate  telah diupgrade ke status Pro.

Detail akun:
- Username: ${user.username}
- Status: Pro

Semua fitur Pro sekarang tersedia untuk Anda gunakan. Terima kasih telah menggunakan layanan kami.

Salam,
Tim Mbotix Prompt Generate `;
    
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2e7d32;">Selamat! Akun Anda Telah Diupgrade ke Pro</h2>
      <p>Halo <strong>${user.username || 'Pelanggan'}</strong>,</p>
      <p>Selamat! Akun Anda di Mbotix Prompt Generate  telah diupgrade ke status Pro.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2e7d32;">Detail akun:</h3>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Status:</strong> <span style="color: #2e7d32; font-weight: bold;">Pro</span></p>
      </div>
      
      <p>Semua fitur Pro sekarang tersedia untuk Anda gunakan. Terima kasih telah menggunakan layanan kami.</p>
      
      <p>Salam,<br>Tim Mbotix Prompt Generate </p>
    </div>`;
    
    return sendEmail(user.email, subject, text, html);
  },
  
  /**
   * Notify a user via email about their Pro subscription being extended
   * @param {Object} user - User object with email and subscription details
   * @param {number} addedDays - Number of days added to the subscription
   * @param {Date} newExpirationDate - New expiration date for the subscription
   * @returns {Promise<Object>} - Email notification result
   */
  notifyUserSubscriptionExtended: async (user, addedDays, newExpirationDate) => {
    // Ensure notifications are initialized with latest environment variables
    initialize();
    
    if (!config.emailEnabled || !user.email) {
      return { success: false, reason: 'Email notifications disabled or no email provided' };
    }
    
    const isUnlimited = addedDays === "unlimited";
    const subject = isUnlimited 
      ? 'Langganan Pro Anda Sekarang Tidak Terbatas!' 
      : 'Langganan Pro Anda Telah Diperpanjang';
    
    const formattedDate = isUnlimited 
      ? 'Tidak terbatas' 
      : new Date(newExpirationDate).toLocaleDateString('id-ID');
    
    const durationText = isUnlimited 
      ? 'Tidak terbatas (permanen)' 
      : `${addedDays} hari`;
    
    const text = `Halo ${user.username || 'Pelanggan'},
    
${isUnlimited 
  ? 'Selamat! Langganan Pro Anda di Mbotix Prompt Generate  sekarang tidak terbatas!' 
  : 'Langganan Pro Anda di Mbotix Prompt Generate  telah diperpanjang.'
}

Detail langganan:
- Username: ${user.username}
- Durasi ${isUnlimited ? '' : 'ditambahkan'}: ${durationText}
- Tanggal berakhir baru: ${formattedDate}

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Mbotix Prompt Generate `;
    
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #1976d2;">${isUnlimited 
        ? 'Langganan Pro Anda Sekarang Tidak Terbatas!' 
        : 'Langganan Pro Anda Telah Diperpanjang'}</h2>
      <p>Halo <strong>${user.username || 'Pelanggan'}</strong>,</p>
      <p>${isUnlimited 
        ? 'Selamat! Langganan Pro Anda di Mbotix Prompt Generate  sekarang tidak terbatas!' 
        : 'Langganan Pro Anda di Mbotix Prompt Generate  telah diperpanjang.'}</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1976d2;">Detail langganan:</h3>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Durasi ${isUnlimited ? '' : 'ditambahkan'}:</strong> ${durationText}</p>
        <p><strong>Tanggal berakhir:</strong> ${formattedDate}</p>
      </div>
      
      <p>Terima kasih telah menggunakan layanan kami.</p>
      
      <p>Salam,<br>Tim Mbotix Prompt Generate </p>
    </div>`;
    
    return sendEmail(user.email, subject, text, html);
  }
};

module.exports = {
  initialize,
  sendNotification,
  sendEmail,
  subscriptions,
  // Export the config object for debugging and testing
  get config() {
    return config;
  }
};
