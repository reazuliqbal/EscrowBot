import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  OWNER_ID: '412077846626959360', // Discord user ID of owner
  STEEM_ACCOUNT: process.env.STEEM_ACCOUNT,
  ACTIVE_KEY: process.env.ACTIVE_KEY,
  BOT_TOKEN: process.env.BOT_TOKEN,
  BITLY_TOKEN: process.env.BITLY_TOKEN,
  PROJECT_ROOT: path.dirname(__dirname),
  COMMAND_PREFIX: '..',
  MIN_AMOUNT: 0.10,
  ESCROW_FEE: 0.01, // In percentage
  USER_ROLE: 'BDX User',
  HANDLER_ROLE: 'Dispute Handler',
};

export default config;
