import express from 'express';
import { createContactMessage, listBranches, listCategories, listGallery, listOffers, listReviews, validateOffer } from '../controllers/publicController.js';

const router = express.Router();

router.get('/categories', listCategories);
router.get('/branches', listBranches);
router.get('/offers', listOffers);
router.get('/offers/:code/validate', validateOffer);
router.get('/gallery', listGallery);
router.get('/reviews', listReviews);
router.post('/contact', createContactMessage);

export default router;
