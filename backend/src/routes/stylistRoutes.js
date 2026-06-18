import express from 'express';
import { configurePayout, createMyOffer, createStylist, deleteMyOffer, deletePortfolioItem, getStylist, listMyOffers, listStylists, myStylistBookings, payoutBanks, updateMyBusinessSettings, updateMyOffer, updateMyOfferings, updateStylist, uploadOfferingImage, uploadPortfolioImage, uploadProfileImage } from '../controllers/stylistController.js';
import { authorize, protect } from '../middleware/auth.js';
import { mediaUpload, upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/me/bookings', protect, authorize('stylist'), myStylistBookings);
router.get('/me/payout-banks', protect, authorize('stylist'), payoutBanks);
router.patch('/me/payout', protect, authorize('stylist'), configurePayout);
router.route('/me/offers')
  .get(protect, authorize('stylist'), listMyOffers)
  .post(protect, authorize('stylist'), createMyOffer);
router.route('/me/offers/:id')
  .patch(protect, authorize('stylist'), updateMyOffer)
  .delete(protect, authorize('stylist'), deleteMyOffer);
router.put('/me/offerings', protect, authorize('stylist'), updateMyOfferings);
router.post('/me/offerings/:serviceId/image', protect, authorize('stylist'), upload.single('image'), uploadOfferingImage);
router.post('/me/profile-image', protect, authorize('stylist'), upload.single('image'), uploadProfileImage);
router.patch('/me/settings', protect, authorize('stylist'), updateMyBusinessSettings);
router.post('/me/portfolio', protect, authorize('stylist'), mediaUpload.single('image'), uploadPortfolioImage);
router.delete('/me/portfolio/:index', protect, authorize('stylist'), deletePortfolioItem);

router.route('/')
  .get(listStylists)
  .post(protect, authorize('admin'), createStylist);

router.route('/:id')
  .get(getStylist)
  .patch(protect, authorize('admin', 'stylist'), updateStylist);

export default router;
