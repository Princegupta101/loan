import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { connectDB } from './db';
import { authMiddleware, requireRoles } from './middleware/auth';
import { login, register, getMe } from './controllers/authController';
import {
  applyForLoan,
  getBorrowerLoans,
  getSalesLeads,
  getAppliedLoans,
  reviewLoan,
  getSanctionedLoans,
  disburseLoan,
  getActiveLoans,
  recordRepayment,
  getAdminStats
} from './controllers/loanController';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = process.env.VERCEL 
  ? '/tmp' 
  : path.join(__dirname, '../uploads');

if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!process.env.VERCEL) {
  app.use('/uploads', express.static(uploadDir));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/api/auth/me', authMiddleware, getMe);

app.post('/api/loans/apply', authMiddleware, requireRoles(['Borrower']), upload.single('salarySlip'), applyForLoan);
app.get('/api/loans/borrower', authMiddleware, requireRoles(['Borrower']), getBorrowerLoans);

app.get('/api/loans/sales', authMiddleware, requireRoles(['Sales']), getSalesLeads);

app.get('/api/loans/sanction', authMiddleware, requireRoles(['Sanction']), getAppliedLoans);
app.put('/api/loans/sanction/:loanId', authMiddleware, requireRoles(['Sanction']), reviewLoan);

app.get('/api/loans/disbursement', authMiddleware, requireRoles(['Disbursement']), getSanctionedLoans);
app.put('/api/loans/disbursement/:loanId', authMiddleware, requireRoles(['Disbursement']), disburseLoan);

app.get('/api/loans/collection', authMiddleware, requireRoles(['Collection']), getActiveLoans);
app.put('/api/loans/collection/:loanId/repay', authMiddleware, requireRoles(['Collection']), recordRepayment);

app.get('/api/loans/admin/stats', authMiddleware, requireRoles(['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection']), getAdminStats);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5 MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

const startServer = async () => {
  await connectDB();
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`LMS Express Server running on port ${PORT}`);
    });
  }
};

startServer().catch(err => {
  console.error('Server startup failed:', err);
});

export default app;
