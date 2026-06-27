"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("./models/User");
const db_1 = require("./db");
const seedUsers = [
    { name: 'System Admin', email: 'admin@lms.com', role: 'Admin' },
    { name: 'Sales Officer', email: 'sales@lms.com', role: 'Sales' },
    { name: 'Sanction Manager', email: 'sanction@lms.com', role: 'Sanction' },
    { name: 'Disbursement Executive', email: 'disbursement@lms.com', role: 'Disbursement' },
    { name: 'Collection Executive', email: 'collection@lms.com', role: 'Collection' },
    { name: 'Test Borrower', email: 'borrower@lms.com', role: 'Borrower' },
];
const seed = async () => {
    try {
        await (0, db_1.connectDB)();
        console.log('Clearing existing users...');
        // We only clear users that have seed emails to prevent purging user-created accounts
        const seedEmails = seedUsers.map(u => u.email);
        await User_1.User.deleteMany({ email: { $in: seedEmails } });
        console.log('Seeding role accounts...');
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash('Password123', salt);
        for (const seedUser of seedUsers) {
            const newUser = new User_1.User({
                name: seedUser.name,
                email: seedUser.email,
                passwordHash,
                role: seedUser.role
            });
            await newUser.save();
            console.log(`Created user: ${seedUser.name} (${seedUser.role})`);
        }
        console.log('Database seeded successfully!');
        mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};
seed();
