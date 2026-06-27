import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserRole } from './models/User';
import { connectDB } from './db';

const seedUsers = [
  { name: 'System Admin', email: 'admin@lms.com', role: 'Admin' as UserRole },
  { name: 'Sales Officer', email: 'sales@lms.com', role: 'Sales' as UserRole },
  { name: 'Sanction Manager', email: 'sanction@lms.com', role: 'Sanction' as UserRole },
  { name: 'Disbursement Executive', email: 'disbursement@lms.com', role: 'Disbursement' as UserRole },
  { name: 'Collection Executive', email: 'collection@lms.com', role: 'Collection' as UserRole },
  { name: 'Test Borrower', email: 'borrower@lms.com', role: 'Borrower' as UserRole },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Clearing existing users...');
    
    // We only clear users that have seed emails to prevent purging user-created accounts
    const seedEmails = seedUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: seedEmails } });

    console.log('Seeding role accounts...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);

    for (const seedUser of seedUsers) {
      const newUser = new User({
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role
      });
      await newUser.save();
      console.log(`Created user: ${seedUser.name} (${seedUser.role})`);
    }

    console.log('Database seeded successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
