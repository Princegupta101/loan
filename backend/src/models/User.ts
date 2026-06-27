import { Schema, model, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection', 'Borrower'], 
    default: 'Borrower' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', UserSchema);
