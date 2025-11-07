const Docker = require('dockerode');
const docker = new Docker();

class DockerService {
    constructor() {
        this.networkName = 'ctf-network';
        this.ipPool = new Set();
        this.initializeNetwork();
    }

    /**
     * Initialize CTF network
     */
    async initializeNetwork() {
        try {
            // Check if network exists
            const networks = await docker.listNetworks();
            const exists = networks.some(n => n.Name === this.networkName);

            if (!exists) {
                // Create network with custom subnet
                await docker.createNetwork({
                    Name: this.networkName,
                    Driver: 'bridge',
                    IPAM: {
                        Config: [{
                            Subnet: '10.10.0.0/16',
                            Gateway: '10.10.0.1'
                        }]
                    }
                });
                console.log(`✓ Created Docker network: ${this.networkName}`);
            }
        } catch (error) {
            console.error('Failed to initialize network:', error.message);
        }
    }

    /**
     * Generate unique IP address
     */
    generateIP() {
        let ip;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            const octet2 = Math.floor(Math.random() * 254) + 1;
            const octet3 = Math.floor(Math.random() * 254) + 1;
            const octet4 = Math.floor(Math.random() * 254) + 2; // Avoid .1 (gateway)
            ip = `10.10.${octet3}.${octet4}`;
            attempts++;
        } while (this.ipPool.has(ip) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique IP');
        }

        this.ipPool.add(ip);
        return ip;
    }

    /**
     * Release IP address
     */
    releaseIP(ip) {
        this.ipPool.delete(ip);
    }

    /**
     * Start a Docker container
     */
    async startContainer(options) {
        const {
            challengeId,
            userId,
            imageName,
            exposedPorts = [],
            env = {},
            duration = 3600 // 1 hour in seconds
        } = options;

        try {
            // Generate unique IP
            const ipAddress = this.generateIP();
            
            // Generate container name
            const containerName = `ctf-${challengeId}-${userId}-${Date.now()}`;
            
            // Calculate expiration time
            const startedAt = new Date();
            const expiresAt = new Date(startedAt.getTime() + duration * 1000);

            // Prepare port bindings
            const exposedPortsConfig = {};
            const portBindings = {};
            
            exposedPorts.forEach(port => {
                const containerPort = `${port}/tcp`;
                exposedPortsConfig[containerPort] = {};
                // Bind to random host port
                portBindings[containerPort] = [{ HostPort: '0' }];
            });

            // Prepare environment variables
            const envArray = Object.entries(env).map(([key, value]) => `${key}=${value}`);

            // Pull image if not exists
            try {
                await docker.getImage(imageName).inspect();
            } catch (error) {
                console.log(`Pulling image: ${imageName}...`);
                await new Promise((resolve, reject) => {
                    docker.pull(imageName, (err, stream) => {
                        if (err) return reject(err);
                        docker.modem.followProgress(stream, (err, output) => {
                            if (err) return reject(err);
                            resolve(output);
                        });
                    });
                });
            }

            // Create container
            const container = await docker.createContainer({
                Image: imageName,
                name: containerName,
                Env: envArray,
                ExposedPorts: exposedPortsConfig,
                HostConfig: {
                    PortBindings: portBindings,
                    NetworkMode: this.networkName,
                    Memory: 512 * 1024 * 1024, // 512MB
                    NanoCpus: 1000000000, // 1 CPU
                    AutoRemove: false
                },
                NetworkingConfig: {
                    EndpointsConfig: {
                        [this.networkName]: {
                            IPAMConfig: {
                                IPv4Address: ipAddress
                            }
                        }
                    }
                },
                Labels: {
                    'ctf.challenge_id': challengeId.toString(),
                    'ctf.user_id': userId.toString(),
                    'ctf.expires_at': expiresAt.toISOString()
                }
            });

            // Start container
            await container.start();

            // Get container info
            const containerInfo = await container.inspect();
            const containerId = containerInfo.Id;

            // Get mapped ports
            const ports = {};
            if (containerInfo.NetworkSettings.Ports) {
                Object.entries(containerInfo.NetworkSettings.Ports).forEach(([containerPort, hostBindings]) => {
                    if (hostBindings && hostBindings.length > 0) {
                        ports[containerPort] = hostBindings[0].HostPort;
                    }
                });
            }

            console.log(`✓ Started container: ${containerName} (IP: ${ipAddress})`);

            return {
                containerId,
                instanceId: containerName,
                ipAddress,
                ports,
                startedAt: startedAt.toISOString(),
                expiresAt: expiresAt.toISOString()
            };

        } catch (error) {
            console.error('Failed to start container:', error);
            throw new Error(`Docker error: ${error.message}`);
        }
    }

    /**
     * Stop a Docker container
     */
    async stopContainer(containerId) {
        try {
            const container = docker.getContainer(containerId);
            const info = await container.inspect();
            
            // Get IP to release
            const ipAddress = info.NetworkSettings.Networks[this.networkName]?.IPAddress;
            
            // Stop container
            await container.stop({ t: 10 }); // 10 seconds timeout
            
            // Remove container
            await container.remove();
            
            // Release IP
            if (ipAddress) {
                this.releaseIP(ipAddress);
            }

            console.log(`✓ Stopped container: ${containerId}`);
            return true;

        } catch (error) {
            console.error('Failed to stop container:', error);
            throw new Error(`Failed to stop container: ${error.message}`);
        }
    }

    /**
     * Get container status
     */
    async getContainerStatus(containerId) {
        try {
            const container = docker.getContainer(containerId);
            const info = await container.inspect();

            return {
                status: info.State.Status,
                running: info.State.Running,
                startedAt: info.State.StartedAt,
                ipAddress: info.NetworkSettings.Networks[this.networkName]?.IPAddress,
                ports: info.NetworkSettings.Ports
            };

        } catch (error) {
            throw new Error(`Failed to get container status: ${error.message}`);
        }
    }

    /**
     * Get container logs
     */
    async getContainerLogs(containerId, tail = 100) {
        try {
            const container = docker.getContainer(containerId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail
            });

            return logs.toString('utf8');

        } catch (error) {
            throw new Error(`Failed to get logs: ${error.message}`);
        }
    }

    /**
     * List active containers
     */
    async listActiveContainers() {
        try {
            const containers = await docker.listContainers({
                filters: {
                    label: ['ctf.challenge_id']
                }
            });

            return containers.map(c => ({
                id: c.Id,
                name: c.Names[0],
                image: c.Image,
                status: c.Status,
                created: c.Created,
                labels: c.Labels
            }));

        } catch (error) {
            throw new Error(`Failed to list containers: ${error.message}`);
        }
    }

    /**
     * Cleanup expired containers
     */
    async cleanupExpiredContainers() {
        try {
            const containers = await this.listActiveContainers();
            const now = new Date();
            let cleaned = 0;

            for (const container of containers) {
                const expiresAt = container.labels['ctf.expires_at'];
                if (expiresAt && new Date(expiresAt) < now) {
                    try {
                        await this.stopContainer(container.id);
                        cleaned++;
                    } catch (error) {
                        console.error(`Failed to cleanup ${container.id}:`, error.message);
                    }
                }
            }

            console.log(`✓ Cleaned up ${cleaned} expired containers`);
            return cleaned;

        } catch (error) {
            console.error('Cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Get Docker system info
     */
    async getSystemInfo() {
        try {
            const info = await docker.info();
            return {
                containers: info.Containers,
                containersRunning: info.ContainersRunning,
                containersPaused: info.ContainersPaused,
                containersStopped: info.ContainersStopped,
                images: info.Images,
                memTotal: info.MemTotal,
                cpus: info.NCPU
            };
        } catch (error) {
            throw new Error(`Failed to get system info: ${error.message}`);
        }
    }
}

// Start cleanup cron job (every 5 minutes)
const dockerService = new DockerService();

setInterval(async () => {
    try {
        await dockerService.cleanupExpiredContainers();
    } catch (error) {
        console.error('Cleanup cron failed:', error);
    }
}, 5 * 60 * 1000);

module.exports = dockerService;
