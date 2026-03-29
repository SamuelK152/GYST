import 'dotenv/config';

import app from './app.js';
import { connectDb } from './config/db.js';

async function start() {
  const port = Number(process.env.PORT || 4000);

  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start API', error);
    process.exit(1);
  }
}

start();
