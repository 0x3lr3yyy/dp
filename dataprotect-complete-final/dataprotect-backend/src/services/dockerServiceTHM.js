/**
 * Docker Service - TryHackMe Style
 * Gère le démarrage, l'arrêt et le monitoring des machines Docker
 * avec attribution d'IP fixes dans le réseau VPN
 */

const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Configuration du réseau
const DOCKER_NETWORK = process.env.DOCKER_NETWORK || 'ctf-network';
const IP_SUBNET = '10.10.0.0/16'; // Réseau TryHackMe style
const IP_RANGE_START = '10.10.1.1';
const IP_RANGE_END = '10.10.255.254';

// Pool d'IP disponibles
let ipPool = [];
let usedIPs = new Set();

/**
 * Initialiser le pool d'IP
 */
function initializeIPPool() {
  // Générer les IP de 10.10.1.1 à 10.10.255.254
  for (let i = 1; i <= 255; i++) {
    for (let j = 1; j <= 254; j++) {
      ipPool.push(`10.10.${i}.${j}`);
    }
  }
  console.log(`IP Pool initialized with ${ipPool.length} addresses`);
}

/**
 * Obtenir une IP disponible
 */
function getAvailableIP() {
  for (const ip of ipPool) {
    if (!usedIPs.has(ip)) {
      usedIPs.add(ip);
      return ip;
    }
  }
  throw new Error('No available IP addresses');
}

/**
 * Libérer une IP
 */
function releaseIP(ip) {
  usedIPs.delete(ip);
}

/**
 * Créer le réseau Docker si nécessaire
 */
async function ensureNetwork() {
  try {
    const networks = await docker.listNetworks();
    const networkExists = networks.some(n => n.Name === DOCKER_NETWORK);

    if (!networkExists) {
      console.log(`Creating Docker network: ${DOCKER_NETWORK}`);
      await docker.createNetwork({
        Name: DOCKER_NETWORK,
        Driver: 'bridge',
        IPAM: {
          Config: [{
            Subnet: IP_SUBNET,
            Gateway: '10.10.0.1'
          }]
        },
        Options: {
          'com.docker.network.bridge.name': 'ctf0'
        }
      });
      console.log(`Network ${DOCKER_NETWORK} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring network:', error);
    throw error;
  }
}

/**
 * Démarrer une machine Docker
 * @param {Object} options - Options de démarrage
 * @returns {Object} - Informations de la machine démarrée
 */
async function startMachine(options) {
  const {
    challengeId,
    userId,
    imageName,
    exposedPorts = [],
    env = [],
    memory = 512 * 1024 * 1024, // 512 MB
    cpus = 1,
    timeout = 3600 // 1 heure en secondes
  } = options;

  try {
    // S'assurer que le réseau existe
    await ensureNetwork();

    // Obtenir une IP disponible
    const machineIP = getAvailableIP();

    // Nom unique du conteneur
    const containerName = `ctf-${challengeId}-${userId}-${Date.now()}`;

    // Configuration des ports
    const portBindings = {};
    const exposedPortsConfig = {};
    
    exposedPorts.forEach(port => {
      const portKey = `${port}/tcp`;
      exposedPortsConfig[portKey] = {};
      // Pas de binding sur l'hôte, accès uniquement via VPN
    });

    // Créer le conteneur
    console.log(`Creating container ${containerName} with IP ${machineIP}`);
    
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Hostname: `machine-${challengeId}`,
      ExposedPorts: exposedPortsConfig,
      Env: env,
      HostConfig: {
        Memory: memory,
        NanoCpus: cpus * 1000000000,
        NetworkMode: DOCKER_NETWORK,
        AutoRemove: false, // On gère manuellement la suppression
        RestartPolicy: {
          Name: 'no'
        }
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [DOCKER_NETWORK]: {
            IPAMConfig: {
              IPv4Address: machineIP
            }
          }
        }
      },
      Labels: {
        'ctf.challenge_id': String(challengeId),
        'ctf.user_id': String(userId),
        'ctf.created_at': new Date().toISOString(),
        'ctf.expires_at': new Date(Date.now() + timeout * 1000).toISOString()
      }
    });

    // Démarrer le conteneur
    await container.start();
    console.log(`Container ${containerName} started successfully`);

    // Obtenir les informations du conteneur
    const containerInfo = await container.inspect();

    return {
      containerId: containerInfo.Id,
      containerName: containerName,
      machineIP: machineIP,
      status: 'running',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + timeout * 1000),
      timeout: timeout
    };

  } catch (error) {
    console.error('Error starting machine:', error);
    throw error;
  }
}

/**
 * Arrêter et supprimer une machine
 * @param {string} containerId - ID du conteneur
 * @param {string} machineIP - IP de la machine à libérer
 */
async function stopMachine(containerId, machineIP) {
  try {
    const container = docker.getContainer(containerId);
    
    // Arrêter le conteneur
    await container.stop({ t: 10 });
    console.log(`Container ${containerId} stopped`);

    // Supprimer le conteneur
    await container.remove();
    console.log(`Container ${containerId} removed`);

    // Libérer l'IP
    if (machineIP) {
      releaseIP(machineIP);
      console.log(`IP ${machineIP} released`);
    }

    return { success: true };

  } catch (error) {
    console.error('Error stopping machine:', error);
    // Essayer de libérer l'IP même en cas d'erreur
    if (machineIP) {
      releaseIP(machineIP);
    }
    throw error;
  }
}

/**
 * Obtenir le statut d'une machine
 * @param {string} containerId - ID du conteneur
 * @returns {Object} - Statut de la machine
 */
async function getMachineStatus(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();

    return {
      status: containerInfo.State.Status,
      running: containerInfo.State.Running,
      startedAt: containerInfo.State.StartedAt,
      finishedAt: containerInfo.State.FinishedAt,
      ip: containerInfo.NetworkSettings.Networks[DOCKER_NETWORK]?.IPAddress || null
    };

  } catch (error) {
    console.error('Error getting machine status:', error);
    return { status: 'not_found', running: false };
  }
}

/**
 * Étendre le temps de session d'une machine
 * @param {string} containerId - ID du conteneur
 * @param {number} additionalTime - Temps supplémentaire en secondes
 */
async function extendMachineTime(containerId, additionalTime) {
  try {
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();

    const currentExpiresAt = new Date(containerInfo.Config.Labels['ctf.expires_at']);
    const newExpiresAt = new Date(currentExpiresAt.getTime() + additionalTime * 1000);

    // Mettre à jour le label (note: nécessite de recréer le conteneur pour persister)
    // Pour l'instant, on retourne juste la nouvelle date
    // La gestion du timer se fait dans la base de données

    return {
      success: true,
      newExpiresAt: newExpiresAt
    };

  } catch (error) {
    console.error('Error extending machine time:', error);
    throw error;
  }
}

/**
 * Lister toutes les machines actives
 * @returns {Array} - Liste des machines
 */
async function listActiveMachines() {
  try {
    const containers = await docker.listContainers({
      filters: {
        label: ['ctf.challenge_id']
      }
    });

    return containers.map(container => ({
      containerId: container.Id,
      containerName: container.Names[0].replace('/', ''),
      challengeId: container.Labels['ctf.challenge_id'],
      userId: container.Labels['ctf.user_id'],
      createdAt: container.Labels['ctf.created_at'],
      expiresAt: container.Labels['ctf.expires_at'],
      status: container.State,
      ip: container.NetworkSettings.Networks[DOCKER_NETWORK]?.IPAddress || null
    }));

  } catch (error) {
    console.error('Error listing active machines:', error);
    return [];
  }
}

/**
 * Nettoyer les machines expirées
 */
async function cleanupExpiredMachines() {
  try {
    const machines = await listActiveMachines();
    const now = new Date();

    for (const machine of machines) {
      const expiresAt = new Date(machine.expiresAt);
      if (expiresAt < now) {
        console.log(`Cleaning up expired machine: ${machine.containerName}`);
        await stopMachine(machine.containerId, machine.ip);
      }
    }

  } catch (error) {
    console.error('Error cleaning up expired machines:', error);
  }
}

/**
 * Obtenir les logs d'un conteneur
 * @param {string} containerId - ID du conteneur
 * @param {number} tail - Nombre de lignes à retourner
 * @returns {string} - Logs du conteneur
 */
async function getMachineLogs(containerId, tail = 100) {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail
    });

    return logs.toString('utf8');

  } catch (error) {
    console.error('Error getting machine logs:', error);
    throw error;
  }
}

/**
 * Obtenir les statistiques d'un conteneur
 * @param {string} containerId - ID du conteneur
 * @returns {Object} - Statistiques du conteneur
 */
async function getMachineStats(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    // Calculer l'utilisation CPU
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculer l'utilisation mémoire
    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    return {
      cpu: cpuPercent.toFixed(2),
      memory: {
        usage: (memoryUsage / 1024 / 1024).toFixed(2), // MB
        limit: (memoryLimit / 1024 / 1024).toFixed(2), // MB
        percent: memoryPercent.toFixed(2)
      }
    };

  } catch (error) {
    console.error('Error getting machine stats:', error);
    throw error;
  }
}

// Initialiser le pool d'IP au démarrage
initializeIPPool();

// Nettoyer les machines expirées toutes les 5 minutes
setInterval(cleanupExpiredMachines, 5 * 60 * 1000);

module.exports = {
  startMachine,
  stopMachine,
  getMachineStatus,
  extendMachineTime,
  listActiveMachines,
  cleanupExpiredMachines,
  getMachineLogs,
  getMachineStats,
  ensureNetwork
};
