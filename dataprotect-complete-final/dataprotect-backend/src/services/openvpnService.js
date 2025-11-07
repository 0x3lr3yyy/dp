/**
 * OpenVPN Service - TryHackMe Style
 * Gère la génération de configurations OpenVPN pour les utilisateurs
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const OPENVPN_DIR = '/etc/openvpn';
const CLIENT_CONFIGS_DIR = path.join(OPENVPN_DIR, 'client-configs');
const CA_CERT = path.join(OPENVPN_DIR, 'ca.crt');
const SERVER_CERT = path.join(OPENVPN_DIR, 'server.crt');
const TA_KEY = path.join(OPENVPN_DIR, 'ta.key');

const VPN_SERVER_IP = process.env.VPN_SERVER_IP || 'YOUR_SERVER_IP';
const VPN_SERVER_PORT = process.env.VPN_SERVER_PORT || '1194';
const VPN_SUBNET = '10.8.0.0/24'; // Réseau OpenVPN (différent du réseau Docker)

// Pool d'IP VPN disponibles (10.8.0.x)
let vpnIPPool = [];
let usedVPNIPs = new Set();

/**
 * Initialiser le pool d'IP VPN
 */
function initializeVPNIPPool() {
  // Générer les IP de 10.8.0.2 à 10.8.0.254 (10.8.0.1 est le serveur)
  for (let i = 2; i <= 254; i++) {
    vpnIPPool.push(`10.8.0.${i}`);
  }
  console.log(`VPN IP Pool initialized with ${vpnIPPool.length} addresses`);
}

/**
 * Obtenir une IP VPN disponible
 */
function getAvailableVPNIP() {
  for (const ip of vpnIPPool) {
    if (!usedVPNIPs.has(ip)) {
      usedVPNIPs.add(ip);
      return ip;
    }
  }
  throw new Error('No available VPN IP addresses');
}

/**
 * Libérer une IP VPN
 */
function releaseVPNIP(ip) {
  usedVPNIPs.delete(ip);
}

/**
 * Générer les clés client pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Object} - Chemins des fichiers générés
 */
async function generateClientKeys(username) {
  try {
    const clientName = `client-${username}`;
    const clientDir = path.join(CLIENT_CONFIGS_DIR, clientName);

    // Créer le dossier client
    await fs.mkdir(clientDir, { recursive: true });

    // Générer la clé privée
    await execPromise(`openssl genrsa -out ${clientDir}/${clientName}.key 2048`);

    // Générer la demande de certificat
    await execPromise(`openssl req -new -key ${clientDir}/${clientName}.key -out ${clientDir}/${clientName}.csr -subj "/CN=${clientName}"`);

    // Signer le certificat avec le CA
    await execPromise(`openssl x509 -req -in ${clientDir}/${clientName}.csr -CA ${CA_CERT} -CAkey ${OPENVPN_DIR}/ca.key -CAcreateserial -out ${clientDir}/${clientName}.crt -days 365`);

    return {
      key: path.join(clientDir, `${clientName}.key`),
      cert: path.join(clientDir, `${clientName}.crt`)
    };

  } catch (error) {
    console.error('Error generating client keys:', error);
    throw error;
  }
}

/**
 * Générer la configuration OpenVPN pour un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Object} - Configuration générée
 */
async function generateVPNConfig(userId, username) {
  try {
    // Obtenir une IP VPN disponible
    const clientIP = getAvailableVPNIP();

    // Générer les clés client
    const keys = await generateClientKeys(username);

    // Lire les certificats
    const caCert = await fs.readFile(CA_CERT, 'utf8');
    const clientCert = await fs.readFile(keys.cert, 'utf8');
    const clientKey = await fs.readFile(keys.key, 'utf8');
    const taKey = await fs.readFile(TA_KEY, 'utf8');

    // Générer le fichier de configuration .ovpn
    const ovpnConfig = `
# DATAPROTECT CTF Platform - OpenVPN Configuration
# User: ${username}
# Generated: ${new Date().toISOString()}

client
dev tun
proto udp
remote ${VPN_SERVER_IP} ${VPN_SERVER_PORT}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
key-direction 1
verb 3

# Routing - Access to CTF machines (10.10.0.0/16)
route 10.10.0.0 255.255.0.0

<ca>
${caCert}
</ca>

<cert>
${clientCert}
</cert>

<key>
${clientKey}
</key>

<tls-auth>
${taKey}
</tls-auth>
`;

    // Sauvegarder le fichier de configuration
    const configPath = path.join(CLIENT_CONFIGS_DIR, `${username}.ovpn`);
    await fs.writeFile(configPath, ovpnConfig.trim());

    return {
      configPath: configPath,
      clientIP: clientIP,
      serverIP: VPN_SERVER_IP,
      serverPort: VPN_SERVER_PORT,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error generating VPN config:', error);
    throw error;
  }
}

/**
 * Régénérer la configuration VPN d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} oldIP - Ancienne IP à libérer
 * @returns {Object} - Nouvelle configuration
 */
async function regenerateVPNConfig(userId, username, oldIP) {
  try {
    // Libérer l'ancienne IP
    if (oldIP) {
      releaseVPNIP(oldIP);
    }

    // Supprimer l'ancienne configuration
    const oldConfigPath = path.join(CLIENT_CONFIGS_DIR, `${username}.ovpn`);
    try {
      await fs.unlink(oldConfigPath);
    } catch (err) {
      // Ignorer si le fichier n'existe pas
    }

    // Générer une nouvelle configuration
    return await generateVPNConfig(userId, username);

  } catch (error) {
    console.error('Error regenerating VPN config:', error);
    throw error;
  }
}

/**
 * Obtenir le statut de connexion VPN d'un utilisateur
 * @param {string} clientIP - IP VPN du client
 * @returns {Object} - Statut de connexion
 */
async function getVPNStatus(clientIP) {
  try {
    // Lire le fichier de statut OpenVPN
    const statusFile = '/var/log/openvpn/openvpn-status.log';
    
    try {
      const statusContent = await fs.readFile(statusFile, 'utf8');
      
      // Chercher l'IP du client dans le fichier de statut
      const connected = statusContent.includes(clientIP);

      return {
        connected: connected,
        clientIP: clientIP,
        lastChecked: new Date()
      };

    } catch (err) {
      // Si le fichier n'existe pas, le client n'est pas connecté
      return {
        connected: false,
        clientIP: clientIP,
        lastChecked: new Date()
      };
    }

  } catch (error) {
    console.error('Error getting VPN status:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Lister tous les clients VPN connectés
 * @returns {Array} - Liste des clients connectés
 */
async function listConnectedClients() {
  try {
    const statusFile = '/var/log/openvpn/openvpn-status.log';
    const statusContent = await fs.readFile(statusFile, 'utf8');

    // Parser le fichier de statut
    const lines = statusContent.split('\n');
    const clients = [];

    let inClientList = false;
    for (const line of lines) {
      if (line.includes('Common Name,Real Address')) {
        inClientList = true;
        continue;
      }
      if (inClientList && line.includes('ROUTING TABLE')) {
        break;
      }
      if (inClientList && line.trim()) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          clients.push({
            commonName: parts[0],
            realAddress: parts[1],
            bytesReceived: parts[2],
            bytesSent: parts[3],
            connectedSince: parts[4]
          });
        }
      }
    }

    return clients;

  } catch (error) {
    console.error('Error listing connected clients:', error);
    return [];
  }
}

/**
 * Révoquer l'accès VPN d'un utilisateur
 * @param {string} username - Nom d'utilisateur
 */
async function revokeVPNAccess(username) {
  try {
    const clientName = `client-${username}`;
    
    // Révoquer le certificat
    await execPromise(`openssl ca -revoke ${CLIENT_CONFIGS_DIR}/${clientName}/${clientName}.crt -config ${OPENVPN_DIR}/openssl.cnf`);

    // Générer la CRL
    await execPromise(`openssl ca -gencrl -out ${OPENVPN_DIR}/crl.pem -config ${OPENVPN_DIR}/openssl.cnf`);

    // Supprimer les fichiers du client
    const clientDir = path.join(CLIENT_CONFIGS_DIR, clientName);
    await fs.rm(clientDir, { recursive: true, force: true });

    return { success: true };

  } catch (error) {
    console.error('Error revoking VPN access:', error);
    throw error;
  }
}

// Initialiser le pool d'IP VPN au démarrage
initializeVPNIPPool();

module.exports = {
  generateVPNConfig,
  regenerateVPNConfig,
  getVPNStatus,
  listConnectedClients,
  revokeVPNAccess,
  getAvailableVPNIP,
  releaseVPNIP
};
