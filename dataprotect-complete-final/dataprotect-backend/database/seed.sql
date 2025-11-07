-- Seed Data for DATAPROTECT CTF Platform

-- Insert Categories
INSERT INTO categories (slug, name, description, icon) VALUES
('web', 'Web Exploitation', 'Find vulnerabilities in web applications and exploit them to gain access.', 'fa-globe'),
('crypto', 'Cryptography', 'Decode encrypted messages and break cryptographic implementations.', 'fa-lock'),
('reverse', 'Reverse Engineering', 'Analyze binary files and understand their functionality.', 'fa-microchip'),
('network', 'Network Security', 'Analyze network traffic and identify security vulnerabilities.', 'fa-network-wired'),
('forensics', 'Forensics', 'Investigate digital evidence and recover hidden information.', 'fa-database'),
('osint', 'OSINT', 'Gather intelligence from open sources and public information.', 'fa-terminal');

-- Insert Challenges for Web Exploitation
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('w1', 1, 'Login Bypass', 'Exploit a vulnerable login page to retrieve the hidden flag. Look for SQLi-like vectors or logic bypasses.', 'Easy', 100, 'FLAG{sql_1nj3ct10n_1s_d4ng3r0us}'),
('w2', 1, 'SSRF Playground', 'Trigger server-side requests and pivot to internal services to extract sensitive info.', 'Medium', 200, 'FLAG{ssrf_t0_1nt3rn4l_s3rv1c3s}'),
('w3', 1, 'Template Injection', 'Remote code execution via server-side template injection.', 'Hard', 300, 'FLAG{t3mpl4t3_1nj3ct10n_rce}');

-- Insert Challenges for Cryptography
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('c1', 2, 'Broken OTP', 'Recover the OTP seed given several outputs.', 'Easy', 100, 'FLAG{0tp_s33d_r3c0v3r3d}'),
('c2', 2, 'RSA Factoring', 'Factor a weak RSA modulus to get the private key.', 'Hard', 300, 'FLAG{rs4_f4ct0r1ng_succ3ss}');

-- Insert Challenges for Reverse Engineering
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('r1', 3, 'Crackme 1', 'Analyze the provided binary and derive the secret string used to unlock the flag.', 'Medium', 200, 'FLAG{r3v3rs3_3ng1n33r1ng_m4st3r}');

-- Insert Challenges for Network Security
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('n1', 4, 'Pcap Forensics', 'Inspect the PCAP for leaked credentials and reconstruct the flag.', 'Medium', 200, 'FLAG{pc4p_4n4lys1s_c0mpl3t3}');

-- Insert Challenges for Forensics
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('f1', 5, 'Disk Recovery', 'Recover deleted files and find the hidden flag artifacts.', 'Easy', 100, 'FLAG{d1sk_r3c0v3ry_succ3ss}');

-- Insert Challenges for OSINT
INSERT INTO challenges (challenge_id, category_id, title, description, difficulty, points, flag) VALUES
('o1', 6, 'Find the Admin', 'Use public information to locate the admin contact and reveal the codeword.', 'Easy', 100, 'FLAG{0s1nt_1nv3st1g4t10n_d0n3}');

-- Insert Demo Users (passwords are 'password123' hashed with bcrypt)
-- Note: In production, use proper bcrypt hashing
INSERT INTO users (username, email, password_hash, team_name, total_score) VALUES
('CyberElite', 'cyberelite@example.com', '$2b$10$YourHashedPasswordHere', 'CyberElite', 2450),
('HackTheMatrix', 'hackthematrix@example.com', '$2b$10$YourHashedPasswordHere', 'HackTheMatrix', 2320),
('BinaryStorm', 'binarystorm@example.com', '$2b$10$YourHashedPasswordHere', 'BinaryStorm', 2180),
('CodeBreakers', 'codebreakers@example.com', '$2b$10$YourHashedPasswordHere', 'CodeBreakers', 2050),
('ZeroDay', 'zeroday@example.com', '$2b$10$YourHashedPasswordHere', 'ZeroDay', 1920);
