import express from 'express';
import {
  forgotPassword,
  confirmPasswordChange,
  confirmAccountDeletion,
  googleLogin,
  login,
  me,
  register,
  registerStylist,
  resendVerification,
  resetPassword,
  requestPasswordChange,
  requestAccountDeletion,
  updateProfile,
  verifyEmail,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { verificationUpload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/register-stylist', verificationUpload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'shopPhoto', maxCount: 1 },
]), registerStylist);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password/request', protect, requestPasswordChange);
router.post('/change-password/confirm', protect, confirmPasswordChange);
router.post('/google', googleLogin);
router.get('/me', protect, me);
router.patch('/me', protect, updateProfile);
router.post('/delete-account/request', protect, requestAccountDeletion);
router.post('/delete-account/confirm', protect, confirmAccountDeletion);

export default router;
