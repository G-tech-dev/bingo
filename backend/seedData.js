const bcrypt = require('bcryptjs');

const adminAccount = {
  name: 'Compassion Administrator',
  email: 'admin@compassion.local',
  password: 'CompassionAdmin2026!',
  role: 'admin',
};

async function seedUsersIfMissing(User) {
  await User.updateOne(
    { email: adminAccount.email },
    {
      $set: {
        name: adminAccount.name,
        role: adminAccount.role,
        password: await bcrypt.hash(adminAccount.password, 12),
      },
    },
    { upsert: true }
  );

  console.log(`Ensured ${adminAccount.role} account: ${adminAccount.email}`);
}

module.exports = { seedUsersIfMissing };
