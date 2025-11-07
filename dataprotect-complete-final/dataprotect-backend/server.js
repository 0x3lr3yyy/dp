const app = require('./src/app');
const database = require('./src/config/database');
const Machine = require('./src/models/Machine');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to database and start server
async function startServer() {
    try {
        // Connect to database
        await database.connect();
        console.log('✓ Database connected');

        // Start server
        app.listen(PORT, () => {
            console.log(`\n🚀 DATAPROTECT API Server running on port ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Health check: http://localhost:${PORT}/health`);
            console.log(`   API Base URL: http://localhost:${PORT}/api`);
            console.log('\n📚 Available endpoints:');
            console.log('   POST   /api/auth/register');
            console.log('   POST   /api/auth/login');
            console.log('   GET    /api/auth/profile');
            console.log('   GET    /api/categories');
            console.log('   GET    /api/challenges');
            console.log('   GET    /api/leaderboard');
            console.log('   POST   /api/machines/start/:challengeId');
            console.log('   POST   /api/submissions/submit');
            console.log('   GET    /api/admin/dashboard');
            console.log('\n');
        });

        // Cleanup expired machines every 5 minutes
        setInterval(async () => {
            try {
                await Machine.expireOldMachines();
            } catch (error) {
                console.error('Error expiring machines:', error);
            }
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\nShutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\nShutting down gracefully...');
    await database.close();
    process.exit(0);
});

// Start the server
startServer();
