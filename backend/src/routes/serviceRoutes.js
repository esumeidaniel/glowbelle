import express from 'express';
import { createService, deleteService, getService, listServices, updateService } from '../controllers/serviceController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(listServices)
  .post(protect, authorize('admin'), createService);

router.route('/:id')
  .get(getService)
  .patch(protect, authorize('admin'), updateService)
  .delete(protect, authorize('admin'), deleteService);

export default router;
