"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = void 0;
const mongoose_1 = require("mongoose");
const LoanSchema = new mongoose_1.Schema({
    borrowerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
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
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            note: { type: String },
            updatedAt: { type: Date, default: Date.now }
        }]
}, { timestamps: true });
exports.Loan = (0, mongoose_1.model)('Loan', LoanSchema);
