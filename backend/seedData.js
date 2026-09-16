const bcrypt = require('bcryptjs');

const seedUsers = [
  {
    name: 'Compassion Administrator',
    email: 'admin@compassion.local',
    password: 'CompassionAdmin2026!',
    role: 'admin',
  },
];

async function seedUsersIfMissing(User) {
  for (const seedUser of seedUsers) {
    const exists = await User.exists({ email: seedUser.email });
    if (exists) continue;

    await User.create({
      name: seedUser.name,
      email: seedUser.email,
      role: seedUser.role,
      password: await bcrypt.hash(seedUser.password, 12),
    });

    console.log(`Seeded ${seedUser.role} account: ${seedUser.email}`);
  }
}

module.exports = { seedUsersIfMissing };
