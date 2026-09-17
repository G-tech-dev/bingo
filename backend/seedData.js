const bcrypt = require('bcryptjs');

async function seedUsersIfMissing(User) {
  try {
    const adminEmail = 'admin@compassion.org';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      return existingAdmin;
    }

    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
    });

    return adminUser;
  } catch (error) {
    console.error('Seed admin user failed:', error.message);
    return null;
  }
}

module.exports = { seedUsersIfMissing };
