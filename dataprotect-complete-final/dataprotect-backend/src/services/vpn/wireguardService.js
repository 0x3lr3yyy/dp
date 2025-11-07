const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../../config/database');

class WireguardService {
    constructor() {
        this.serverPublicKey = process.env.WG_SERVER_PUBLIC_KEY || '';
        this.serverEndpoint = process.env.WG_SERVER_ENDPOINT || 'your-server.com:51820';
        this.vpnSubnet = '10.10.0.0/16';
        this.dockerSubnet = '10.11.0.0/16';
        this.configDir = path.join(__dirname, '../../../vpn_configs');
        
        // Create config directory if it doesn't exist
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    /**
     * Generate WireGuard keypair
     */
    generateKeypair() {
        try {
            // Generate private key
            const privateKey = execSync('wg genkey', { encoding: 'utf-8' }).trim();
            
            // Generate public key from private key
            const publicKey = execSync(`echo "${privateKey}" | wg pubkey`, { encoding: 'utf-8' }).trim();
            
            return { privateKey, publicKey };
        } catch (error) {
            // Fallback for environments without wireguard-tools
            console.warn('WireGuard tools not installed, using mock keys');
            const mockPrivate = Buffer.from(Math.random().toString()).toString('base64').substring(0, 44);
            const mockPublic = Buffer.from(Math.random().toString()).toString('base64').substring(0, 44);
            return { 
                privateKey: mockPrivate + '=',
                publicKey: mockPublic + '='
            };
        }
    }

    /**
     * Allocate a unique IP address for a user
     */
    async allocateUserIP(userId) {
        return new Promise((resolve, reject) => {
            // Check if user already has a VPN config
            db.get(
                'SELECT ip_address FROM vpn_configs WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) return reject(err);
                    
                    if (row) {
                        return resolve(row.ip_address);
                    }
                    
                    // Find next available IP
                    db.get(
                        `SELECT MAX(CAST(SUBSTR(ip_address, 9) AS INTEGER)) as max_ip 
                         FROM vpn_configs`,
                        (err, result) => {
                            if (err) return reject(err);
                            
                            const nextIP = (result && result.max_ip) ? result.max_ip + 1 : 2;
                            const ipAddress = `10.10.0.${nextIP}`;
                            
                            resolve(ipAddress);
                        }
                    );
                }
            );
        });
    }

    /**
     * Generate VPN configuration for a user
     */
    async generateConfig(userId) {
        try {
            // Check if config already exists
            const existing = await this.getConfig(userId);
            if (existing) {
                return existing;
            }

            // Generate keypair
            const { privateKey, publicKey } = this.generateKeypair();
            
            // Allocate IP
            const ipAddress = await this.allocateUserIP(userId);
            
            // Save to database
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO vpn_configs (user_id, public_key, private_key, ip_address)
                     VALUES (?, ?, ?, ?)`,
                    [userId, publicKey, privateKey, ipAddress],
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });

            // Generate config file content
            const configContent = this.generateConfigFile(privateKey, ipAddress);
            
            // Save config file
            const configPath = path.join(this.configDir, `user_${userId}.conf`);
            fs.writeFileSync(configPath, configContent);

            return {
                ipAddress,
                publicKey,
                configPath,
                configContent
            };
        } catch (error) {
            console.error('Error generating VPN config:', error);
            throw error;
        }
    }

    /**
     * Generate WireGuard config file content
     */
    generateConfigFile(privateKey, ipAddress) {
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${ipAddress}/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${this.serverPublicKey}
Endpoint = ${this.serverEndpoint}
AllowedIPs = ${this.dockerSubnet}
PersistentKeepalive = 25
`;
    }

    /**
     * Get existing VPN config for a user
     */
    async getConfig(userId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM vpn_configs WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) return reject(err);
                    
                    if (!row) return resolve(null);
                    
                    const configPath = path.join(this.configDir, `user_${userId}.conf`);
                    let configContent = '';
                    
                    if (fs.existsSync(configPath)) {
                        configContent = fs.readFileSync(configPath, 'utf-8');
                    } else {
                        // Regenerate config file if missing
                        configContent = this.generateConfigFile(row.private_key, row.ip_address);
                        fs.writeFileSync(configPath, configContent);
                    }
                    
                    resolve({
                        ipAddress: row.ip_address,
                        publicKey: row.public_key,
                        configPath,
                        configContent
                    });
                }
            );
        });
    }

    /**
     * Add user to WireGuard server (requires root)
     */
    async addPeerToServer(publicKey, ipAddress) {
        try {
            execSync(`wg set wg0 peer ${publicKey} allowed-ips ${ipAddress}/32`);
            execSync('wg-quick save wg0');
            return true;
        } catch (error) {
            console.warn('Could not add peer to WireGuard server:', error.message);
            return false;
        }
    }

    /**
     * Remove user from WireGuard server
     */
    async removePeerFromServer(publicKey) {
        try {
            execSync(`wg set wg0 peer ${publicKey} remove`);
            execSync('wg-quick save wg0');
            return true;
        } catch (error) {
            console.warn('Could not remove peer from WireGuard server:', error.message);
            return false;
        }
    }

    /**
     * Delete VPN config for a user
     */
    async deleteConfig(userId) {
        return new Promise((resolve, reject) => {
            // Get config first to remove peer
            db.get(
                'SELECT public_key FROM vpn_configs WHERE user_id = ?',
                [userId],
                async (err, row) => {
                    if (err) return reject(err);
                    
                    if (row) {
                        await this.removePeerFromServer(row.public_key);
                    }
                    
                    // Delete from database
                    db.run(
                        'DELETE FROM vpn_configs WHERE user_id = ?',
                        [userId],
                        (err) => {
                            if (err) return reject(err);
                            
                            // Delete config file
                            const configPath = path.join(this.configDir, `user_${userId}.conf`);
                            if (fs.existsSync(configPath)) {
                                fs.unlinkSync(configPath);
                            }
                            
                            resolve();
                        }
                    );
                }
            );
        });
    }
}

module.exports = new WireguardService();
