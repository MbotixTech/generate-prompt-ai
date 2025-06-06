const User = require('../models/user.model');
const Prompt = require('../models/prompt.model');

// Get current user info
exports.getMe = async (req, res) => {
  try {
    // User data is already available from auth middleware
    const { _id, username, email, role, promptsToday } = req.user;
    
    res.status(200).json({
      user: {
        id: _id,
        username,
        email,
        role,
        promptsToday,
        dailyLimit: role === 'free' ? 2 : Infinity
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengambil data pengguna.' });
  }
};

// Get user prompt history
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const userId = req.user._id;
    
    const query = { userId };
    if (type && ['veo', 'image'].includes(type)) {
      query.type = type;
    }
    
    const options = {
      sort: { createdAt: -1 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };
    
    const prompts = await Prompt.find(query, null, options);
    const total = await Prompt.countDocuments(query);
    
    res.status(200).json({
      prompts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengambil riwayat prompt.' });
  }
};
