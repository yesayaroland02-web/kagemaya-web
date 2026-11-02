"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
// Semua rute transaksi membutuhkan autentikasi
router.use(auth_middleware_1.authenticateToken);
// 1. Kalkulasi Checkout (Dry-run / Preview) - Day 10 & 11
router.post('/calculate', transaction_controller_1.calculateCheckout);
// 2. Buat Transaksi Baru (Locking kuota + simpan transaksi) - Day 10 & 11
router.post('/', transaction_controller_1.createTransaction);
// 3. Riwayat Transaksi Pengguna (Tab status filter) - Day 13
router.get('/my-transactions', transaction_controller_1.getUserTransactions);
// 4. Detail Transaksi Berdasarkan ID - Day 10 & 12
router.get('/:id', transaction_controller_1.getTransactionById);
// 5. Upload Bukti Transfer (Multer + Cloudinary) - Day 12
router.post('/:id/payment-proof', upload_middleware_1.uploadSingleImage.single('payment_proof'), transaction_controller_1.uploadPaymentProof);
// 6. Batalkan Transaksi oleh Pengguna (Rollback kuota/poin/voucher) - Day 13 & 14
router.post('/:id/cancel', transaction_controller_1.cancelTransaction);
exports.default = router;
