/**
 * Controller for handling contact form submissions
 */
const axios = require('axios');

/**
 * Send a contact form message via Telegram
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, username, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Nama, email, dan pesan wajib diisi' 
      });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({ 
        message: 'Pesan terlalu pendek (minimal 10 karakter)' 
      });
    }

    // Get Telegram configuration from environment variables
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Check if Telegram is configured
    if (!token || !chatId) {
      console.error('Telegram configuration missing');
      return res.status(500).json({ 
        message: 'Sistem notifikasi tidak dikonfigurasi dengan benar' 
      });
    }

    // Format message with emojis for better readability
    const telegramMessage = `📩 Pesan dari Kontak Support\n\n` +
      `👤 Nama: ${name}\n` +
      `📧 Email: ${email}\n` +
      `👤 Username: ${username || 'Tidak disertakan'}\n\n` +
      `📝 Subjek: ${subject || 'Tidak disertakan'}\n\n` +
      `💬 Pesan:\n${message}\n\n` +
      `📅 Waktu: ${new Date().toLocaleString('id-ID')}`;

    // Send message to Telegram
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'HTML'
      }
    );

    if (response.data && response.data.ok) {
      res.status(200).json({ 
        message: 'Pesan berhasil dikirim ke tim support' 
      });
    } else {
      console.error('Telegram API error:', response.data);
      res.status(500).json({ 
        message: 'Gagal mengirim pesan ke tim support' 
      });
    }
  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({ 
      message: 'Server error saat mengirim pesan', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
