const User = require('../models/user.model');

/**
 * Initialize database with required data
 */
exports.initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Check if admin user exists, create if not
    await createAdminUser();
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/**
 * Create admin user if it doesn't exist
 */
async function createAdminUser() {
  try {
    // Check if admin configuration exists
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn('Admin user configuration not found in environment variables');
      return;
    }
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Create admin user
      await User.create({
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      
      console.log(`Admin user "${process.env.ADMIN_USERNAME}" created successfully`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}
