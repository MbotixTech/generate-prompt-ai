const User = require('../models/user.model');

/**
 * Reset daily prompt quota for free users
 */
exports.resetDailyQuota = async () => {
  try {
    // Reset promptsToday to 0 for all free users
    const result = await User.updateMany(
      { role: 'free' },
      { 
        $set: { 
          promptsToday: 0,
          lastQuotaReset: new Date()
        } 
      }
    );
    
    console.log(`Reset quota for ${result.modifiedCount} free users`);
    return result;
  } catch (error) {
    console.error('Error resetting daily quota:', error);
    throw error;
  }
};
