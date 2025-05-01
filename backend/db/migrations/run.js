const { db } = require('../index');

/**
 * Run database migrations
 */
const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Run latest migrations
    await db.migrate.latest();
    
    const version = await db.migrate.currentVersion();
    console.log(`Migrations completed successfully. Current version: ${version}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
};

// Run migrations
runMigrations();