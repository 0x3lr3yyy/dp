const fs = require('fs');
const path = require('path');
const database = require('../config/database');
const bcrypt = require('bcrypt');

async function initDatabase() {
    try {
        console.log('Initializing database...');

        // Connect to database
        await database.connect();

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await database.run(statement);
            }
        }
        
        console.log('✓ Database schema created');

        // Insert seed data
        console.log('Inserting seed data...');

        // Insert categories
        const categories = [
            { slug: 'web', name: 'Web Exploitation', description: 'Find vulnerabilities in web applications and exploit them to gain access.', icon: 'fa-globe' },
            { slug: 'crypto', name: 'Cryptography', description: 'Decode encrypted messages and break cryptographic implementations.', icon: 'fa-lock' },
            { slug: 'reverse', name: 'Reverse Engineering', description: 'Analyze binary files and understand their functionality.', icon: 'fa-microchip' },
            { slug: 'network', name: 'Network Security', description: 'Analyze network traffic and identify security vulnerabilities.', icon: 'fa-network-wired' },
            { slug: 'forensics', name: 'Forensics', description: 'Investigate digital evidence and recover hidden information.', icon: 'fa-database' },
            { slug: 'osint', name: 'OSINT', description: 'Gather intelligence from open sources and public information.', icon: 'fa-terminal' }
        ];

        for (const cat of categories) {
            await database.run(
                'INSERT INTO categories (slug, name, description, icon) VALUES (?, ?, ?, ?)',
                [cat.slug, cat.name, cat.description, cat.icon]
            );
        }

        console.log('✓ Categories inserted');

        // Insert challenges
        const challenges = [
            { challenge_id: 'w1', category_id: 1, title: 'Login Bypass', description: 'Exploit a vulnerable login page to retrieve the hidden flag. Look for SQLi-like vectors or logic bypasses.', difficulty: 'Easy', points: 100, flag: 'FLAG{sql_1nj3ct10n_1s_d4ng3r0us}' },
            { challenge_id: 'w2', category_id: 1, title: 'SSRF Playground', description: 'Trigger server-side requests and pivot to internal services to extract sensitive info.', difficulty: 'Medium', points: 200, flag: 'FLAG{ssrf_t0_1nt3rn4l_s3rv1c3s}' },
            { challenge_id: 'w3', category_id: 1, title: 'Template Injection', description: 'Remote code execution via server-side template injection.', difficulty: 'Hard', points: 300, flag: 'FLAG{t3mpl4t3_1nj3ct10n_rce}' },
            { challenge_id: 'c1', category_id: 2, title: 'Broken OTP', description: 'Recover the OTP seed given several outputs.', difficulty: 'Easy', points: 100, flag: 'FLAG{0tp_s33d_r3c0v3r3d}' },
            { challenge_id: 'c2', category_id: 2, title: 'RSA Factoring', description: 'Factor a weak RSA modulus to get the private key.', difficulty: 'Hard', points: 300, flag: 'FLAG{rs4_f4ct0r1ng_succ3ss}' },
            { challenge_id: 'r1', category_id: 3, title: 'Crackme 1', description: 'Analyze the provided binary and derive the secret string used to unlock the flag.', difficulty: 'Medium', points: 200, flag: 'FLAG{r3v3rs3_3ng1n33r1ng_m4st3r}' },
            { challenge_id: 'n1', category_id: 4, title: 'Pcap Forensics', description: 'Inspect the PCAP for leaked credentials and reconstruct the flag.', difficulty: 'Medium', points: 200, flag: 'FLAG{pc4p_4n4lys1s_c0mpl3t3}' },
            { challenge_id: 'f1', category_id: 5, title: 'Disk Recovery', description: 'Recover deleted files and find the hidden flag artifacts.', difficulty: 'Easy', points: 100, flag: 'FLAG{d1sk_r3c0v3ry_succ3ss}' },
            { challenge_id: 'o1', category_id: 6, title: 'Find the Admin', description: 'Use public information to locate the admin contact and reveal the codeword.', difficulty: 'Easy', points: 100, flag: 'FLAG{0s1nt_1nv3st1g4t10n_d0n3}' }
        ];

        for (const ch of challenges) {
            await database.run(
                'INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [ch.challenge_id, ch.category_id, ch.title, ch.description, ch.difficulty, ch.points, ch.flag]
            );
        }

        console.log('✓ Challenges inserted');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await database.run(
            'INSERT INTO users (username, email, password_hash, team_name, role, total_score) VALUES (?, ?, ?, ?, ?, ?)',
            ['admin', 'admin@dataprotect.local', adminPassword, 'Admin Team', 'admin', 0]
        );

        console.log('✓ Admin user created (username: admin, password: admin123)');

        // Create demo users
        const demoUsers = [
            { username: 'CyberElite', email: 'cyberelite@example.com', team_name: 'CyberElite', score: 2450 },
            { username: 'HackTheMatrix', email: 'hackthematrix@example.com', team_name: 'HackTheMatrix', score: 2320 },
            { username: 'BinaryStorm', email: 'binarystorm@example.com', team_name: 'BinaryStorm', score: 2180 },
            { username: 'CodeBreakers', email: 'codebreakers@example.com', team_name: 'CodeBreakers', score: 2050 },
            { username: 'ZeroDay', email: 'zeroday@example.com', team_name: 'ZeroDay', score: 1920 }
        ];

        const demoPassword = await bcrypt.hash('password123', 10);
        for (const user of demoUsers) {
            await database.run(
                'INSERT INTO users (username, email, password_hash, team_name, role, total_score) VALUES (?, ?, ?, ?, ?, ?)',
                [user.username, user.email, demoPassword, user.team_name, 'user', user.score]
            );
        }

        console.log('✓ Demo users created (password: password123)');

        console.log('\n✅ Database initialized successfully!');
        console.log('\nDefault credentials:');
        console.log('  Admin: username=admin, password=admin123');
        console.log('  Demo users: password=password123');

        await database.close();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
