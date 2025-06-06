const User = require('../models/user.model');
const notifications = require('./notifications');

/**
 * Checks for expired pro subscriptions and downgrades users to free tier
 * @returns {Promise<{modifiedCount: number, expiredUsers: Array}>} Results of downgrade operation
 */
exports.downgradeExpiredSubscriptions = async () => {
  try {
    const currentDate = new Date();
    
    // Find users with expired subscriptions
    const expiredSubscriptions = await User.find({
      role: 'pro',
      subscriptionExpires: { $lt: currentDate }
    });
    
    // Log detailed information about expiring subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`Found ${expiredSubscriptions.length} expired pro subscriptions to downgrade:`);
      expiredSubscriptions.forEach(user => {
        console.log(`- User: ${user.username} (${user.email}), Expired: ${user.subscriptionExpires.toISOString()}`);
      });
      
      // Send notification about expired subscriptions to admin
      await notifications.subscriptions.notifyDowngraded(expiredSubscriptions);
      
      // Send individual email notifications to each user
      for (const user of expiredSubscriptions) {
        try {
          const emailResult = await notifications.subscriptions.notifyUserSubscriptionExpired(user);
          console.log(`Email notification sent to ${user.email}: ${emailResult.success ? 'Success' : 'Failed'}`);
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } else {
      console.log('No expired pro subscriptions found');
    }
    
    // Downgrade users to free tier
    const result = await User.updateMany(
      { 
        role: 'pro', 
        subscriptionExpires: { $lt: currentDate }
      },
      { 
        $set: { 
          role: 'free',
          subscriptionExpires: null
        } 
      }
    );
    
    // Log results
    if (result.modifiedCount > 0) {
      console.log(`Successfully downgraded ${result.modifiedCount} users from pro to free tier`);
    }
    
    return {
      ...result,
      expiredUsers: expiredSubscriptions
    };
  } catch (error) {
    console.error('Error while downgrading expired subscriptions:', error);
    throw error;
  }
};

/**
 * Check and notify about subscriptions that will expire soon
 * @param {number} daysThreshold - Number of days considered as "soon" (default: 3)
 * @returns {Promise<Array>} - Array of users with soon-to-expire subscriptions
 */
exports.checkSoonToExpireSubscriptions = async (daysThreshold = 3) => {
  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + daysThreshold);
    
    // Find users whose subscriptions will expire within the threshold
    const soonToExpire = await User.find({
      role: 'pro',
      subscriptionExpires: { 
        $gte: currentDate,
        $lte: futureDate
      }
    }).select('username email subscriptionExpires');
    
    // Log information about soon-to-expire subscriptions
    if (soonToExpire.length > 0) {
      console.log(`Found ${soonToExpire.length} pro subscriptions expiring in the next ${daysThreshold} days:`);
      soonToExpire.forEach(user => {
        const daysLeft = Math.ceil((user.subscriptionExpires - currentDate) / (1000 * 60 * 60 * 24));
        console.log(`- User: ${user.username} (${user.email}), Expires: ${user.subscriptionExpires.toISOString()} (${daysLeft} days left)`);
      });
      
      // Send notification about subscriptions that will expire soon to admin
      await notifications.subscriptions.notifyExpiringSoon(soonToExpire, daysThreshold);
      
      // Send individual email notifications to each user
      for (const user of soonToExpire) {
        try {
          const daysLeft = Math.ceil((user.subscriptionExpires - currentDate) / (1000 * 60 * 60 * 24));
          const emailResult = await notifications.subscriptions.notifyUserSubscriptionExpiring(user, daysLeft);
          console.log(`Email notification sent to ${user.email}: ${emailResult.success ? 'Success' : 'Failed'}`);
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } else {
      console.log(`No pro subscriptions expiring in the next ${daysThreshold} days`);
    }
    
    return soonToExpire;
  } catch (error) {
    console.error('Error checking soon-to-expire subscriptions:', error);
    throw error;
  }
};
