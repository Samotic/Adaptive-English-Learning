import { config } from './config.js';
import { connectMongo, disconnectMongo } from './db/mongo.js';
import { createApp } from './app.js';
import gamificationService from './services/gamificationService.js';
import aiService from './services/aiService.js';
import { isEmailConfigured } from './services/emailService.js';
import { isGoogleAuthConfigured } from './services/oauthService.js';
import { startRetentionJobs } from './jobs/retention.js';

async function main() {
  await connectMongo(config.mongoUri, config.mongoDbName);
  console.log(`✓ Connected to MongoDB (database "${config.mongoDbName}")`);

  await gamificationService.initializeDefaultBadges();
  const stopRetention = startRetentionJobs();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`✓ Server running on http://localhost:${config.port}`);
    console.log(`  AI features:    ${aiService.disabled ? 'fallback mode (set GEMINI_API_KEY)' : `enabled (${aiService.modelName})`}`);
    console.log(`  Email:          ${isEmailConfigured() ? 'SMTP configured' : 'disabled (set SMTP_HOST)'}`);
    console.log(`  Google sign-in: ${isGoogleAuthConfigured() ? 'enabled' : 'disabled (set GOOGLE_CLIENT_ID)'}`);
    console.log('  No content yet? Run "npm run seed" to load questions, modules and demo accounts.');
  });

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ Port ${config.port} is already in use - another copy of the server is probably running.`);
      console.error('  Stop it (Ctrl+C in its terminal) or set a different PORT in server/.env, then start again.');
    } else {
      console.error('✗ Server error:', err.message);
    }
    stopRetention();
    await disconnectMongo();
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received - shutting down`);
    stopRetention();
    server.close();
    await disconnectMongo();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('✗ Failed to start server:', err.message);
  if (/ECONNREFUSED|querySrv|Server selection timed out/i.test(err.message)) {
    console.error('  Is MongoDB running and is MONGODB_URI in server/.env correct?');
  }
  process.exit(1);
});
