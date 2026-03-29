import dotenv from 'dotenv';
import app from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Life OS API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API', error);
    process.exit(1);
  }
}

start();
