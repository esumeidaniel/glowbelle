import express from 'express';
import { createOffer, dashboardStats, deleteOffer, downloadStylistDocument, listAdminOffers, listAllBookings, listCustomers, listStylistApplications, reviewStylistApplication, updateOffer } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/stats', dashboardStats);
router.get('/bookings', listAllBookings);
router.get('/customers', listCustomers);
router.route('/offers')
  .get(listAdminOffers)
  .post(createOffer);
router.route('/offers/:id')
  .patch(updateOffer)
  .delete(deleteOffer);
router.get('/stylist-applications', listStylistApplications);
router.patch('/stylist-applications/:id', reviewStylistApplication);
router.get('/stylist-applications/:id/documents/:type', downloadStylistDocument);

export default router;
