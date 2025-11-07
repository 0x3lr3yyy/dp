# Guide d'installation VPN pour DATAPROTECT CTF Platform

## Prérequis

- Serveur Ubuntu 22.04 ou supérieur
- Accès root
- Port 51820 (UDP) ouvert dans le firewall
- Docker installé et configuré

## Étape 1 : Installation de WireGuard

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer WireGuard
sudo apt install wireguard wireguard-tools -y

# Activer le forwarding IP
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Étape 2 : Génération des clés du serveur

```bash
# Créer le répertoire de configuration
sudo mkdir -p /etc/wireguard
cd /etc/wireguard

# Générer les clés
wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key

# Sécuriser les permissions
sudo chmod 600 server_private.key
```

## Étape 3 : Configuration du serveur WireGuard

```bash
# Créer le fichier de configuration
sudo nano /etc/wireguard/wg0.conf
```

Contenu du fichier :

```ini
[Interface]
Address = 10.10.0.1/16
ListenPort = 51820
PrivateKey = <CONTENU_DE_server_private.key>

# Règles de routage
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE; iptables -A FORWARD -o wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE; iptables -D FORWARD -o wg0 -j ACCEPT
```

**Note :** Remplacez `eth0` par le nom de votre interface réseau principale (utilisez `ip a` pour le trouver).

## Étape 4 : Démarrage de WireGuard

```bash
# Démarrer WireGuard
sudo wg-quick up wg0

# Activer au démarrage
sudo systemctl enable wg-quick@wg0

# Vérifier le statut
sudo wg show
```

## Étape 5 : Configuration du réseau Docker

```bash
# Créer le réseau bridge pour les challenges CTF
docker network create \
  --driver bridge \
  --subnet=10.11.0.0/16 \
  --gateway=10.11.0.1 \
  ctf-network

# Vérifier la création
docker network ls
docker network inspect ctf-network
```

## Étape 6 : Configuration du backend

Ajoutez ces variables d'environnement dans le fichier `.env` du backend :

```bash
# WireGuard Configuration
WG_SERVER_PUBLIC_KEY=<CONTENU_DE_server_public.key>
WG_SERVER_ENDPOINT=votre-domaine.com:51820

# Docker Network
DOCKER_NETWORK=ctf-network
DOCKER_SUBNET=10.11.0.0/16
```

## Étape 7 : Configuration du firewall

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 51820/udp
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Vérifier les règles
sudo ufw status
```

## Étape 8 : Test de la configuration

### Test 1 : Vérifier WireGuard

```bash
# Afficher la configuration
sudo wg show wg0

# Devrait afficher :
# interface: wg0
#   public key: <votre_clé_publique>
#   private key: (hidden)
#   listening port: 51820
```

### Test 2 : Générer une config VPN via l'API

```bash
# Se connecter en tant qu'utilisateur
curl -X POST https://votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Sauvegarder le token
TOKEN="<token_reçu>"

# Générer une config VPN
curl -X POST https://votre-domaine.com/api/vpn/generate \
  -H "Authorization: Bearer $TOKEN"

# Télécharger la config
curl -X GET https://votre-domaine.com/api/vpn/download \
  -H "Authorization: Bearer $TOKEN" \
  -o test.conf
```

### Test 3 : Tester la connexion VPN

```bash
# Sur votre machine locale
sudo wg-quick up ./test.conf

# Vérifier la connexion
ping 10.10.0.1

# Déconnecter
sudo wg-quick down ./test.conf
```

## Étape 9 : Démarrer une machine de test

```bash
# Créer un conteneur de test
docker run -d \
  --name test-challenge \
  --network ctf-network \
  --ip 10.11.1.10 \
  nginx:alpine

# Vérifier
docker ps
docker inspect test-challenge | grep IPAddress
```

### Test depuis le VPN

```bash
# Connecter le VPN
sudo wg-quick up ./test.conf

# Tester l'accès à la machine
curl http://10.11.1.10

# Devrait afficher la page par défaut de nginx
```

## Dépannage

### Problème : WireGuard ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u wg-quick@wg0 -n 50

# Vérifier la configuration
sudo wg-quick strip wg0
```

### Problème : Pas de connectivité VPN

```bash
# Vérifier le forwarding IP
cat /proc/sys/net/ipv4/ip_forward
# Devrait afficher 1

# Vérifier les règles iptables
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v
```

### Problème : Impossible d'accéder aux conteneurs Docker

```bash
# Vérifier le réseau Docker
docker network inspect ctf-network

# Vérifier les routes
ip route show

# Ajouter une route manuelle si nécessaire
sudo ip route add 10.11.0.0/16 via 10.10.0.1
```

## Sécurité

### Bonnes pratiques

1. **Limiter les connexions** : Configurer un rate limiting sur le port 51820
2. **Monitoring** : Surveiller les connexions actives avec `sudo wg show`
3. **Logs** : Activer les logs de connexion VPN
4. **Rotation des clés** : Régénérer les clés du serveur tous les 6 mois
5. **Firewall** : Bloquer tout le trafic sauf les ports nécessaires

### Commandes utiles

```bash
# Voir les peers connectés
sudo wg show wg0

# Supprimer un peer
sudo wg set wg0 peer <PUBLIC_KEY> remove

# Recharger la configuration
sudo wg-quick down wg0 && sudo wg-quick up wg0

# Voir les logs en temps réel
sudo journalctl -u wg-quick@wg0 -f
```

## Maintenance

### Ajouter un peer manuellement

```bash
sudo wg set wg0 peer <USER_PUBLIC_KEY> allowed-ips 10.10.0.X/32
sudo wg-quick save wg0
```

### Supprimer un peer

```bash
sudo wg set wg0 peer <USER_PUBLIC_KEY> remove
sudo wg-quick save wg0
```

### Backup de la configuration

```bash
# Sauvegarder
sudo tar -czf wireguard-backup-$(date +%Y%m%d).tar.gz /etc/wireguard/

# Restaurer
sudo tar -xzf wireguard-backup-YYYYMMDD.tar.gz -C /
```

## Automatisation

Le backend gère automatiquement :
- ✅ Génération des clés utilisateur
- ✅ Attribution des IP
- ✅ Création des fichiers .conf
- ✅ Ajout/suppression des peers (si exécuté avec privilèges root)

**Note :** Pour que le backend puisse ajouter/supprimer des peers automatiquement, il doit être exécuté avec des privilèges sudo ou via un service dédié.

## Monitoring

### Voir les statistiques

```bash
# Afficher les statistiques de WireGuard
sudo wg show wg0

# Afficher les connexions actives
sudo wg show wg0 latest-handshakes

# Afficher le trafic
sudo wg show wg0 transfer
```

### Dashboard (optionnel)

Installer WireGuard UI pour une interface web :

```bash
docker run -d \
  --name wg-ui \
  --cap-add=NET_ADMIN \
  -p 5001:5001 \
  -v /etc/wireguard:/etc/wireguard \
  ngoduykhanh/wireguard-ui:latest
```

## Support

Pour toute question ou problème :
1. Vérifier les logs : `sudo journalctl -u wg-quick@wg0`
2. Tester la connectivité : `ping 10.10.0.1`
3. Vérifier le firewall : `sudo ufw status`
4. Consulter la documentation officielle : https://www.wireguard.com/

## Conclusion

Votre infrastructure VPN est maintenant opérationnelle ! Les utilisateurs peuvent :
1. Se connecter à la plateforme
2. Générer leur config VPN
3. Télécharger le fichier .conf
4. Se connecter via WireGuard
5. Accéder aux machines CTF sur le réseau 10.11.0.0/16

**Prochaine étape :** Déployer des challenges Docker et les rendre accessibles via le VPN.
