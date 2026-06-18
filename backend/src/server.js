import 'dotenv/config';
import fs from 'fs';
import app from './app.js';
import { connectDB } from './config/db.js';
import { validateProductionEnv, verifyProductionServices } from './config/validateEnv.js';

validateProductionEnv();

const port = process.env.PORT || 5000;
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

verifyProductionServices()
  .then(connectDB)
  .then(() => {
    app.listen(port, () => console.log(`GlowBelle API listening on port ${port}`));
  })
  .catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
