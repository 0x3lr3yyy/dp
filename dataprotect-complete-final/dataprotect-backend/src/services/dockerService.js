const Docker = require('dockerode');
const crypto = require('crypto');

class DockerService {
    constructor() {
        // Connect to Docker daemon
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        this.activeContainers = new Map();
        this.networkName = 'ctf-network';
        this.initializeNetwork();
    }

    async initializeNetwork() {
        try {
            // Create isolated network for CTF containers
            const networks = await this.docker.listNetworks();
            const networkExists = networks.some(net => net.Name === this.networkName);
            
            if (!networkExists) {
                await this.docker.createNetwork({
                    Name: this.networkName,
                    Driver: 'bridge',
                    Internal: false,
                    Attachable: true,
                    Labels: {
                        'ctf.network': 'true'
                    }
                });
                console.log(`✓ Created Docker network: ${this.networkName}`);
            }
        } catch (error) {
            console.error('Error initializing Docker network:', error.message);
        }
    }

    /**
     * Start a Docker container for a challenge
     * @param {Object} params - Container parameters
     * @param {number} params.challengeId - Challenge ID
     * @param {number} params.userId - User ID
     * @param {string} params.imageName - Docker image name
     * @param {Array} params.exposedPorts - Ports to expose
     * @param {Object} params.env - Environment variables
     * @param {number} params.duration - Session duration in seconds
     * @returns {Promise<Object>} Container info
     */
    async startContainer({ challengeId, userId, imageName, exposedPorts = [], env = {}, duration = 3600 }) {
        try {
            const containerName = `ctf-${challengeId}-${userId}-${Date.now()}`;
            const instanceId = crypto.randomBytes(16).toString('hex');

            // Check if image exists, pull if not
            await this.ensureImage(imageName);

            // Prepare port bindings
            const portBindings = {};
            const exposedPortsConfig = {};
            const assignedPorts = [];

            for (const port of exposedPorts) {
                const hostPort = await this.findAvailablePort();
                const containerPort = `${port}/tcp`;
                portBindings[containerPort] = [{ HostPort: hostPort.toString() }];
                exposedPortsConfig[containerPort] = {};
                assignedPorts.push({ container: port, host: hostPort });
            }

            // Prepare environment variables
            const envArray = Object.entries(env).map(([key, value]) => `${key}=${value}`);
            envArray.push(`CTF_USER_ID=${userId}`);
            envArray.push(`CTF_CHALLENGE_ID=${challengeId}`);
            envArray.push(`CTF_INSTANCE_ID=${instanceId}`);

            // Create container
            const container = await this.docker.createContainer({
                Image: imageName,
                name: containerName,
                Env: envArray,
                ExposedPorts: exposedPortsConfig,
                HostConfig: {
                    PortBindings: portBindings,
                    NetworkMode: this.networkName,
                    Memory: 512 * 1024 * 1024, // 512MB limit
                    MemorySwap: 512 * 1024 * 1024,
                    CpuShares: 512,
                    AutoRemove: false,
                    RestartPolicy: { Name: 'no' }
                },
                Labels: {
                    'ctf.challenge': challengeId.toString(),
                    'ctf.user': userId.toString(),
                    'ctf.instance': instanceId,
                    'ctf.expires': (Date.now() + duration * 1000).toString()
                }
            });

            // Start container
            await container.start();

            // Get container info
            const containerInfo = await container.inspect();
            const ipAddress = containerInfo.NetworkSettings.Networks[this.networkName]?.IPAddress || 
                            containerInfo.NetworkSettings.IPAddress;

            const machineInfo = {
                containerId: container.id,
                containerName,
                instanceId,
                ipAddress,
                ports: assignedPorts,
                status: 'running',
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + duration * 1000)
            };

            // Store in active containers map
            this.activeContainers.set(container.id, {
                ...machineInfo,
                container,
                challengeId,
                userId
            });

            // Schedule auto-stop
            setTimeout(() => {
                this.stopContainer(container.id).catch(err => 
                    console.error(`Auto-stop failed for ${container.id}:`, err.message)
                );
            }, duration * 1000);

            console.log(`✓ Started container ${containerName} for user ${userId}`);
            return machineInfo;

        } catch (error) {
            console.error('Error starting container:', error.message);
            throw new Error(`Failed to start container: ${error.message}`);
        }
    }

    /**
     * Stop a running container
     * @param {string} containerId - Container ID
     * @returns {Promise<boolean>}
     */
    async stopContainer(containerId) {
        try {
            const containerData = this.activeContainers.get(containerId);
            if (!containerData) {
                throw new Error('Container not found in active list');
            }

            const container = this.docker.getContainer(containerId);
            await container.stop({ t: 10 }); // 10 seconds grace period
            await container.remove();

            this.activeContainers.delete(containerId);
            console.log(`✓ Stopped and removed container ${containerId}`);
            return true;

        } catch (error) {
            console.error('Error stopping container:', error.message);
            throw new Error(`Failed to stop container: ${error.message}`);
        }
    }

    /**
     * Get container status
     * @param {string} containerId - Container ID
     * @returns {Promise<Object>}
     */
    async getContainerStatus(containerId) {
        try {
            const container = this.docker.getContainer(containerId);
            const info = await container.inspect();
            
            return {
                id: info.Id,
                name: info.Name,
                status: info.State.Status,
                running: info.State.Running,
                startedAt: info.State.StartedAt,
                ipAddress: info.NetworkSettings.Networks[this.networkName]?.IPAddress || 
                          info.NetworkSettings.IPAddress
            };
        } catch (error) {
            throw new Error(`Failed to get container status: ${error.message}`);
        }
    }

    /**
     * Get container logs
     * @param {string} containerId - Container ID
     * @param {number} tail - Number of lines to return
     * @returns {Promise<string>}
     */
    async getContainerLogs(containerId, tail = 100) {
        try {
            const container = this.docker.getContainer(containerId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail,
                timestamps: true
            });
            return logs.toString('utf8');
        } catch (error) {
            throw new Error(`Failed to get container logs: ${error.message}`);
        }
    }

    /**
     * List all active CTF containers
     * @returns {Promise<Array>}
     */
    async listActiveContainers() {
        try {
            const containers = await this.docker.listContainers({
                filters: {
                    label: ['ctf.challenge']
                }
            });

            return containers.map(c => ({
                id: c.Id,
                name: c.Names[0],
                image: c.Image,
                status: c.Status,
                state: c.State,
                challengeId: c.Labels['ctf.challenge'],
                userId: c.Labels['ctf.user'],
                instanceId: c.Labels['ctf.instance'],
                expiresAt: new Date(parseInt(c.Labels['ctf.expires']))
            }));
        } catch (error) {
            throw new Error(`Failed to list containers: ${error.message}`);
        }
    }

    /**
     * Clean up expired containers
     * @returns {Promise<number>} Number of containers cleaned
     */
    async cleanupExpiredContainers() {
        try {
            const containers = await this.listActiveContainers();
            const now = Date.now();
            let cleaned = 0;

            for (const container of containers) {
                if (container.expiresAt.getTime() < now) {
                    try {
                        await this.stopContainer(container.id);
                        cleaned++;
                    } catch (error) {
                        console.error(`Failed to cleanup container ${container.id}:`, error.message);
                    }
                }
            }

            if (cleaned > 0) {
                console.log(`✓ Cleaned up ${cleaned} expired containers`);
            }
            return cleaned;
        } catch (error) {
            console.error('Error during cleanup:', error.message);
            return 0;
        }
    }

    /**
     * Ensure Docker image exists, pull if not
     * @param {string} imageName - Image name with tag
     * @returns {Promise<void>}
     */
    async ensureImage(imageName) {
        try {
            const images = await this.docker.listImages();
            const imageExists = images.some(img => 
                img.RepoTags && img.RepoTags.includes(imageName)
            );

            if (!imageExists) {
                console.log(`Pulling image ${imageName}...`);
                await new Promise((resolve, reject) => {
                    this.docker.pull(imageName, (err, stream) => {
                        if (err) return reject(err);
                        
                        this.docker.modem.followProgress(stream, (err, output) => {
                            if (err) return reject(err);
                            console.log(`✓ Image ${imageName} pulled successfully`);
                            resolve();
                        });
                    });
                });
            }
        } catch (error) {
            throw new Error(`Failed to ensure image: ${error.message}`);
        }
    }

    /**
     * Find an available port on the host
     * @returns {Promise<number>}
     */
    async findAvailablePort() {
        const net = require('net');
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            server.unref();
            server.on('error', reject);
            server.listen(0, () => {
                const { port } = server.address();
                server.close(() => resolve(port));
            });
        });
    }

    /**
     * Get Docker system info
     * @returns {Promise<Object>}
     */
    async getSystemInfo() {
        try {
            const info = await this.docker.info();
            return {
                containers: info.Containers,
                containersRunning: info.ContainersRunning,
                containersPaused: info.ContainersPaused,
                containersStopped: info.ContainersStopped,
                images: info.Images,
                memTotal: info.MemTotal,
                cpus: info.NCPU,
                dockerVersion: info.ServerVersion
            };
        } catch (error) {
            throw new Error(`Failed to get system info: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new DockerService();
