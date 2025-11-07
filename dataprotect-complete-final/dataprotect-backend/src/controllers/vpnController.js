const wireguardService = require('../services/vpn/wireguardService');

class VPNController {
    /**
     * Generate VPN configuration for the authenticated user
     */
    static async generateConfig(req, res, next) {
        try {
            const userId = req.user.id;
            
            const config = await wireguardService.generateConfig(userId);
            
            // Add peer to server if possible
            await wireguardService.addPeerToServer(config.publicKey, config.ipAddress);
            
            res.json({
                message: 'VPN configuration generated successfully',
                ipAddress: config.ipAddress,
                instructions: 'Download the configuration file and import it into your WireGuard client'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Download VPN configuration file
     */
    static async downloadConfig(req, res, next) {
        try {
            const userId = req.user.id;
            
            const config = await wireguardService.getConfig(userId);
            
            if (!config) {
                return res.status(404).json({ error: 'VPN configuration not found. Please generate it first.' });
            }
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/x-wireguard-profile');
            res.setHeader('Content-Disposition', `attachment; filename="dataprotect_${userId}.conf"`);
            
            res.send(config.configContent);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get VPN status for the authenticated user
     */
    static async getStatus(req, res, next) {
        try {
            const userId = req.user.id;
            
            const config = await wireguardService.getConfig(userId);
            
            if (!config) {
                return res.json({
                    configured: false,
                    message: 'VPN not configured. Generate a configuration to get started.'
                });
            }
            
            res.json({
                configured: true,
                ipAddress: config.ipAddress,
                message: 'VPN configuration exists. Download and connect to access machines.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete VPN configuration
     */
    static async deleteConfig(req, res, next) {
        try {
            const userId = req.user.id;
            
            await wireguardService.deleteConfig(userId);
            
            res.json({
                message: 'VPN configuration deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get VPN setup instructions
     */
    static async getInstructions(req, res, next) {
        try {
            const instructions = {
                windows: {
                    steps: [
                        'Download and install WireGuard from https://www.wireguard.com/install/',
                        'Click "Add Tunnel" and select "Import tunnel(s) from file"',
                        'Select the downloaded .conf file',
                        'Click "Activate" to connect'
                    ]
                },
                macos: {
                    steps: [
                        'Download and install WireGuard from the App Store',
                        'Click "Import tunnel(s) from file"',
                        'Select the downloaded .conf file',
                        'Toggle the switch to connect'
                    ]
                },
                linux: {
                    steps: [
                        'Install WireGuard: sudo apt install wireguard',
                        'Copy the .conf file to /etc/wireguard/',
                        'Connect: sudo wg-quick up dataprotect',
                        'Disconnect: sudo wg-quick down dataprotect'
                    ]
                },
                android: {
                    steps: [
                        'Install WireGuard from Google Play Store',
                        'Tap the + button and select "Import from file or archive"',
                        'Select the downloaded .conf file',
                        'Tap the toggle to connect'
                    ]
                },
                ios: {
                    steps: [
                        'Install WireGuard from the App Store',
                        'Tap "Add a tunnel" and select "Create from file or archive"',
                        'Select the downloaded .conf file',
                        'Toggle the switch to connect'
                    ]
                }
            };
            
            res.json({ instructions });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = VPNController;
