import express from 'express';
import { container } from '../../../../core/di/container.js';
import { detectConnectionQuality } from '../../../middleware/connectionQuality.js';

const router = express.Router();

// Note: wiring of productController in container will be done later
let productController;
try {
  productController = container.resolve('productController');
} catch (_) {
  productController = null;
}

router.get('/', detectConnectionQuality, async (req, res, next) => {
  if (!productController) return res.status(501).json({ success: false, message: 'Not implemented' });
  return productController.getProducts(req, res, next);
});

export default router;
