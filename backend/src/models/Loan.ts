import { Schema, model, Document, Types } from 'mongoose';

export type LoanStatus = 
  | 'Draft' 
  | 'BRE_Rejected' 
  | 'Applied' 
  | 'Sanctioned' 
  | 'Rejected' 
  | 'Disbursed' 
  | 'Closed';

export interface IPaymentHistory {
  paymentDate: Date;
  amountPaid: number;
  referenceId: string;
}

export interface ITimeline {
  status: LoanStatus;
  updatedBy?: Types.ObjectId | string;
  note?: string;
  updatedAt: Date;
}

export interface ILoan extends Document {
  borrowerId: Types.ObjectId;
  personalDetails: {
    age: number;
    monthlySalary: number;
    panNumber: string;
    employmentStatus: string;
  };
  loanConfiguration: {
    amount: number;
    tenureDays: number;
    interestRate: number;
    interestAmount: number;
    totalRepayment: number;
  };
  documentUrl?: string;
  status: LoanStatus;
  rejectionReason?: string;
  repaymentProgress: {
    amountPaid: number;
    remainingAmount: number;
  };
  paymentHistory: IPaymentHistory[];
  timeline: ITimeline[];
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>({
  borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personalDetails: {
    age: { type: Number, required: true },
    monthlySalary: { type: Number, required: true },
    panNumber: { type: String, required: true },
    employmentStatus: { type: String, required: true }
  },
  loanConfiguration: {
    amount: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, default: 12 },
    interestAmount: { type: Number, required: true },
    totalRepayment: { type: Number, required: true }
  },
  documentUrl: { type: String },
  status: { 
    type: String, 
    enum: ['Draft', 'BRE_Rejected', 'Applied', 'Sanctioned', 'Rejected', 'Disbursed', 'Closed'],
    default: 'Draft' 
  },
  rejectionReason: { type: String },
  repaymentProgress: {
    amountPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true }
  },
  paymentHistory: [{
    paymentDate: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    referenceId: { type: String, required: true }
  }],
  timeline: [{
    status: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Loan = model<ILoan>('Loan', LoanSchema);
