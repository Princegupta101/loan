import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Loan, ILoan, LoanStatus } from '../models/Loan';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { uploadSalarySlip } from '../utils/cloudinary';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface BREResult {
  eligible: boolean;
  reason?: string;
}

const runBRE = (personalDetails: {
  age: number;
  monthlySalary: number;
  panNumber: string;
  employmentStatus: string;
}): BREResult => {
  const { age, monthlySalary, panNumber, employmentStatus } = personalDetails;

  if (age < 23 || age > 50) {
    return { eligible: false, reason: `Age must be between 23 and 50. Provided: ${age}` };
  }

  if (monthlySalary < 25000) {
    return { eligible: false, reason: `Monthly salary must be at least 25,000. Provided: ${monthlySalary}` };
  }

  if (!PAN_REGEX.test(panNumber.toUpperCase())) {
    return { eligible: false, reason: `Invalid PAN format. Provided: ${panNumber}` };
  }

  if (employmentStatus !== 'Salaried') {
    return { eligible: false, reason: `Employment status must be Salaried. Provided: ${employmentStatus}` };
  }

  return { eligible: true };
};

const calculateLoanMath = (amount: number, tenureDays: number) => {
  const interestRate = 12;
  const interestAmount = Number((amount * (interestRate / 100) * (tenureDays / 365)).toFixed(2));
  const totalRepayment = Number((amount + interestAmount).toFixed(2));

  return {
    amount,
    tenureDays,
    interestRate,
    interestAmount,
    totalRepayment
  };
};

export const applyForLoan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'Borrower') {
      return res.status(403).json({ message: 'Only borrowers can apply for loans' });
    }

    const { age, monthlySalary, panNumber, employmentStatus, amount, tenureDays } = req.body;

    if (!age || !monthlySalary || !panNumber || !employmentStatus || !amount || !tenureDays) {
      return res.status(400).json({ message: 'All application and configuration fields are required' });
    }

    const parsedAge = parseInt(age);
    const parsedSalary = parseFloat(monthlySalary);
    const parsedAmount = parseFloat(amount);
    const parsedTenure = parseInt(tenureDays);

    let documentUrl: string | undefined = undefined;
    if (req.file) {
      documentUrl = await uploadSalarySlip(req.file.path, req.file.filename);
    }

    const existingLoan = await Loan.findOne({
      borrowerId: req.user.id,
      status: { $in: ['Applied', 'Sanctioned', 'Disbursed'] }
    });

    if (existingLoan) {
      return res.status(400).json({ message: 'You already have a pending or active loan application' });
    }

    const personalDetails = {
      age: parsedAge,
      monthlySalary: parsedSalary,
      panNumber: panNumber.toUpperCase(),
      employmentStatus
    };
    const breResult = runBRE(personalDetails);

    const loanConfig = calculateLoanMath(parsedAmount, parsedTenure);

    const initialStatus: LoanStatus = breResult.eligible ? 'Applied' : 'BRE_Rejected';
    const rejectionReason = breResult.eligible ? undefined : breResult.reason;

    const newLoan = new Loan({
      borrowerId: new mongoose.Types.ObjectId(req.user.id),
      personalDetails,
      loanConfiguration: loanConfig,
      documentUrl,
      status: initialStatus,
      rejectionReason,
      repaymentProgress: {
        amountPaid: 0,
        remainingAmount: loanConfig.totalRepayment
      },
      paymentHistory: [],
      timeline: [{
        status: initialStatus,
        updatedBy: new mongoose.Types.ObjectId(req.user.id),
        note: breResult.eligible 
          ? 'Loan application submitted successfully' 
          : `Automated BRE Rejection: ${breResult.reason}`,
        updatedAt: new Date()
      }]
    });

    await newLoan.save();

    return res.status(201).json({
      message: breResult.eligible 
        ? 'Application submitted successfully' 
        : 'Application rejected by automated eligibility engine',
      loan: newLoan
    });
  } catch (error) {
    console.error('Apply for loan error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getBorrowerLoans = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const loans = await Loan.find({ borrowerId: req.user.id }).sort({ createdAt: -1 });
    return res.json(loans);
  } catch (error) {
    console.error('Get borrower loans error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSalesLeads = async (req: AuthRequest, res: Response) => {
  try {
    const borrowers = await User.find({ role: 'Borrower' }).select('-passwordHash').sort({ createdAt: -1 });
    const leads = [];
    
    for (const borrower of borrowers) {
      const loan = await Loan.findOne({ borrowerId: borrower._id }).sort({ createdAt: -1 });
      
      if (!loan || loan.status === 'Draft' || loan.status === 'BRE_Rejected') {
        leads.push({
          borrower,
          loanStatus: loan ? loan.status : 'Never Applied',
          rejectionReason: loan?.rejectionReason,
          lastUpdated: loan ? loan.updatedAt : borrower.createdAt
        });
      }
    }

    return res.json(leads);
  } catch (error) {
    console.error('Get sales leads error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAppliedLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await Loan.find({ status: 'Applied' })
      .populate('borrowerId', 'name email')
      .sort({ createdAt: -1 });
    return res.json(loans);
  } catch (error) {
    console.error('Get applied loans error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const reviewLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const { status, note } = req.body;

    if (!status || !['Sanctioned', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid review status. Must be Sanctioned or Rejected.' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan application not found' });
    }

    if (loan.status !== 'Applied') {
      return res.status(400).json({ message: `Loan is currently in ${loan.status} status. Cannot review.` });
    }

    loan.status = status;
    if (status === 'Rejected') {
      loan.rejectionReason = note || 'Rejected by Sanction Officer';
    }

    loan.timeline.push({
      status,
      updatedBy: new mongoose.Types.ObjectId(req.user?.id),
      note: note || `Application ${status.toLowerCase()} by Sanction Officer`,
      updatedAt: new Date()
    });

    await loan.save();

    return res.json({ message: `Loan successfully ${status.toLowerCase()}`, loan });
  } catch (error) {
    console.error('Review loan error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSanctionedLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await Loan.find({ status: 'Sanctioned' })
      .populate('borrowerId', 'name email')
      .sort({ updatedAt: -1 });
    return res.json(loans);
  } catch (error) {
    console.error('Get sanctioned loans error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const disburseLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const { note } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'Sanctioned') {
      return res.status(400).json({ message: `Loan is currently in ${loan.status} status. Cannot disburse.` });
    }

    loan.status = 'Disbursed';
    loan.timeline.push({
      status: 'Disbursed',
      updatedBy: new mongoose.Types.ObjectId(req.user?.id),
      note: note || 'Funds disbursed to the borrower bank account',
      updatedAt: new Date()
    });

    await loan.save();

    return res.json({ message: 'Loan funds disbursed successfully', loan });
  } catch (error) {
    console.error('Disburse loan error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getActiveLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await Loan.find({ status: { $in: ['Disbursed', 'Closed'] } })
      .populate('borrowerId', 'name email')
      .sort({ updatedAt: -1 });
    return res.json(loans);
  } catch (error) {
    console.error('Get active loans error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const recordRepayment = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const { amountPaid, referenceId } = req.body;

    if (!amountPaid || amountPaid <= 0 || !referenceId) {
      return res.status(400).json({ message: 'Valid amount paid and reference ID are required' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'Disbursed') {
      return res.status(400).json({ message: 'Repayment can only be recorded on active (Disbursed) loans' });
    }

    const parsedPayment = parseFloat(amountPaid);

    const newAmountPaid = Number((loan.repaymentProgress.amountPaid + parsedPayment).toFixed(2));
    const targetRepayment = loan.loanConfiguration.totalRepayment;
    
    let newRemainingAmount = Number((targetRepayment - newAmountPaid).toFixed(2));
    if (newRemainingAmount < 0) {
      newRemainingAmount = 0;
    }

    loan.repaymentProgress.amountPaid = newAmountPaid;
    loan.repaymentProgress.remainingAmount = newRemainingAmount;

    loan.paymentHistory.push({
      paymentDate: new Date(),
      amountPaid: parsedPayment,
      referenceId
    });

    const isClosed = newAmountPaid >= targetRepayment;
    if (isClosed) {
      loan.status = 'Closed';
      loan.timeline.push({
        status: 'Closed',
        updatedBy: new mongoose.Types.ObjectId(req.user?.id),
        note: `Loan automatically closed. Total paid: ${newAmountPaid}. Reference: ${referenceId}`,
        updatedAt: new Date()
      });
    } else {
      loan.timeline.push({
        status: 'Disbursed',
        updatedBy: new mongoose.Types.ObjectId(req.user?.id),
        note: `Repayment of ${parsedPayment} recorded. Remaining: ${newRemainingAmount}. Reference: ${referenceId}`,
        updatedAt: new Date()
      });
    }

    await loan.save();

    return res.json({
      message: isClosed ? 'Repayment logged. Loan is now fully closed.' : 'Repayment logged successfully',
      loan
    });
  } catch (error) {
    console.error('Record repayment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalLoans = await Loan.countDocuments({});
    const activeLoans = await Loan.countDocuments({ status: 'Disbursed' });
    const pendingLoans = await Loan.countDocuments({ status: 'Applied' });
    const sanctionedLoans = await Loan.countDocuments({ status: 'Sanctioned' });
    const closedLoans = await Loan.countDocuments({ status: 'Closed' });
    const breRejectedLoans = await Loan.countDocuments({ status: 'BRE_Rejected' });

    const allLoans = await Loan.find({});
    let totalDisbursedAmount = 0;
    let totalExpectedRepayment = 0;
    let totalCollectedAmount = 0;

    allLoans.forEach(loan => {
      if (['Disbursed', 'Closed'].includes(loan.status)) {
        totalDisbursedAmount += loan.loanConfiguration.amount;
        totalExpectedRepayment += loan.loanConfiguration.totalRepayment;
        totalCollectedAmount += loan.repaymentProgress.amountPaid;
      }
    });

    const totalBorrowers = await User.countDocuments({ role: 'Borrower' });

    return res.json({
      counts: {
        totalLoans,
        activeLoans,
        pendingLoans,
        sanctionedLoans,
        closedLoans,
        breRejectedLoans,
        totalBorrowers
      },
      financials: {
        totalDisbursedAmount: Number(totalDisbursedAmount.toFixed(2)),
        totalExpectedRepayment: Number(totalExpectedRepayment.toFixed(2)),
        totalCollectedAmount: Number(totalCollectedAmount.toFixed(2)),
        outstandingAmount: Number((totalExpectedRepayment - totalCollectedAmount).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
