"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const db_1 = require("./db");
const auth_1 = require("./middleware/auth");
const authController_1 = require("./controllers/authController");
const loanController_1 = require("./controllers/loanController");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const uploadDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadDir));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
        }
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
app.post('/api/auth/register', authController_1.register);
app.post('/api/auth/login', authController_1.login);
app.get('/api/auth/me', auth_1.authMiddleware, authController_1.getMe);
app.post('/api/loans/apply', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Borrower']), upload.single('salarySlip'), loanController_1.applyForLoan);
app.get('/api/loans/borrower', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Borrower']), loanController_1.getBorrowerLoans);
app.get('/api/loans/sales', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Sales']), loanController_1.getSalesLeads);
app.get('/api/loans/sanction', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Sanction']), loanController_1.getAppliedLoans);
app.put('/api/loans/sanction/:loanId', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Sanction']), loanController_1.reviewLoan);
app.get('/api/loans/disbursement', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Disbursement']), loanController_1.getSanctionedLoans);
app.put('/api/loans/disbursement/:loanId', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Disbursement']), loanController_1.disburseLoan);
app.get('/api/loans/collection', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Collection']), loanController_1.getActiveLoans);
app.put('/api/loans/collection/:loanId/repay', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Collection']), loanController_1.recordRepayment);
app.get('/api/loans/admin/stats', auth_1.authMiddleware, (0, auth_1.requireRoles)(['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection']), loanController_1.getAdminStats);
app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5 MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});
const startServer = async () => {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`LMS Express Server running on port ${PORT}`);
    });
};
startServer().catch(err => {
    console.error('Server startup failed:', err);
});
