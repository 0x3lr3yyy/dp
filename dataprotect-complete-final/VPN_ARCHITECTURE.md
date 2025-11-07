# Architecture VPN pour DATAPROTECT CTF Platform

## Vue d'ensemble

Cette architecture permet aux utilisateurs de se connecter aux machines Docker via VPN, similaire à TryHackMe et HackTheBox.

## Composants

### 1. Serveur VPN (WireGuard)

**Pourquoi WireGuard ?**
- Plus moderne et rapide qu'OpenVPN
- Configuration plus simple
- Meilleure performance
- Intégration native dans le noyau Linux

**Configuration :**
- Serveur WireGuard sur le port 51820 (UDP)
- Réseau VPN : 10.10.0.0/16
- Chaque utilisateur reçoit une IP unique : 10.10.x.x

### 2. Réseaux Docker Isolés

**Architecture réseau :**
```
┌─────────────────────────────────────────┐
│         Serveur Principal               │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ WireGuard    │    │   Docker     │  │
│  │ 10.10.0.1    │◄───┤   Engine     │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
│         │                    │          │
│  ┌──────▼────────────────────▼───────┐  │
│  │   Bridge Network (br-ctf)        │  │
│  │   10.11.0.0/16                   │  │
│  └──────────────────────────────────┘  │
│         │                               │
│    ┌────┴────┬────────┬────────┐       │
│    │         │        │        │       │
│  ┌─▼──┐   ┌─▼──┐  ┌──▼─┐   ┌──▼─┐    │
│  │ C1 │   │ C2 │  │ C3 │   │ C4 │    │
│  └────┘   └────┘  └────┘   └────┘    │
│  10.11.1.2 10.11.1.3 ...              │
└─────────────────────────────────────────┘
```

**Isolation :**
- Chaque challenge a son propre conteneur
- Tous les conteneurs sont sur le même réseau bridge
- Les utilisateurs accèdent via VPN

### 3. Attribution d'IP

**Système d'attribution :**
1. Utilisateur démarre une machine
2. Backend crée un conteneur Docker avec IP fixe
3. Backend génère une config WireGuard pour l'utilisateur
4. L'utilisateur télécharge le fichier .conf
5. L'utilisateur se connecte via WireGuard
6. L'utilisateur peut accéder à la machine via son IP (10.11.x.x)

**Table d'attribution :**
```sql
CREATE TABLE vpn_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. Génération de Config VPN

**Processus :**
1. Générer une paire de clés WireGuard pour l'utilisateur
2. Attribuer une IP unique (10.10.x.x)
3. Créer le fichier .conf avec :
   - Clé privée de l'utilisateur
   - Clé publique du serveur
   - IP de l'utilisateur
   - Routes vers le réseau Docker (10.11.0.0/16)

**Exemple de config WireGuard :**
```ini
[Interface]
PrivateKey = <USER_PRIVATE_KEY>
Address = 10.10.1.5/32
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = your-server.com:51820
AllowedIPs = 10.11.0.0/16
PersistentKeepalive = 25
```

### 5. API Endpoints

**Nouveaux endpoints :**
- `POST /api/vpn/generate` - Générer une config VPN pour l'utilisateur
- `GET /api/vpn/download` - Télécharger le fichier .conf
- `GET /api/vpn/status` - Vérifier le statut de la connexion VPN
- `GET /api/machines/:id/ip` - Obtenir l'IP de la machine

### 6. Frontend

**Modifications nécessaires :**
1. Bouton "Download VPN Config" sur la page de profil
2. Affichage de l'IP de la machine sur la page challenge
3. Instructions de connexion VPN
4. Indicateur de statut VPN (connecté/déconnecté)

## Implémentation

### Étape 1 : Installation de WireGuard

```bash
# Sur le serveur
sudo apt update
sudo apt install wireguard wireguard-tools
```

### Étape 2 : Configuration du serveur WireGuard

```bash
# Générer les clés du serveur
wg genkey | tee server_private.key | wg pubkey > server_public.key

# Créer /etc/wireguard/wg0.conf
[Interface]
Address = 10.10.0.1/16
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Démarrer WireGuard
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

### Étape 3 : Configuration Docker Network

```bash
# Créer le réseau bridge pour les challenges
docker network create --driver bridge --subnet=10.11.0.0/16 ctf-network
```

### Étape 4 : Démarrer une machine avec IP fixe

```javascript
// Dans dockerService.js
async startMachine(challengeId, userId) {
    const ipAddress = await this.allocateIP(challengeId);
    
    const container = await docker.createContainer({
        Image: challenge.docker_image,
        name: `ctf-${challengeId}-${userId}`,
        NetworkingConfig: {
            EndpointsConfig: {
                'ctf-network': {
                    IPAMConfig: {
                        IPv4Address: ipAddress
                    }
                }
            }
        }
    });
    
    await container.start();
    return { containerId: container.id, ipAddress };
}
```

## Sécurité

1. **Isolation réseau** - Chaque utilisateur ne peut accéder qu'à ses propres machines
2. **Chiffrement** - Tout le trafic VPN est chiffré
3. **Timeout automatique** - Les machines s'arrêtent après X heures
4. **Rate limiting** - Limiter le nombre de machines par utilisateur

## Limitations

- Nécessite un serveur avec accès root
- Nécessite l'ouverture du port 51820 (UDP)
- Les utilisateurs doivent installer WireGuard client
- Complexité de configuration initiale

## Alternative : Guacamole (Web-based)

Si VPN est trop complexe, une alternative est Apache Guacamole :
- Accès web sans VPN
- Support SSH/RDP/VNC dans le navigateur
- Plus simple pour les utilisateurs
- Mais moins flexible

## Prochaines étapes

1. Installer WireGuard sur le serveur
2. Créer les scripts de génération de configs
3. Implémenter les API endpoints
4. Modifier le frontend
5. Tester avec plusieurs utilisateurs
