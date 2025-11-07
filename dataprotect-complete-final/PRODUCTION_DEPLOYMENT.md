# DATAPROTECT Platform - Guide de Déploiement Production

## 🎯 Vue d'ensemble

Ce guide vous permettra de déployer une plateforme CTF complète style TryHackMe sur votre serveur de production.

## 📋 Prérequis Serveur

### Spécifications Minimales
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disque**: 100 GB SSD
- **Réseau**: IP publique fixe

### Logiciels Requis
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Installer WireGuard
sudo apt install -y wireguard

# Installer Nginx
sudo apt install -y nginx

# Installer SQLite
sudo apt install -y sqlite3

# Installer certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

## 🚀 Installation

### 1. Télécharger et Extraire

```bash
# Créer le dossier de l'application
sudo mkdir -p /opt/dataprotect
cd /opt/dataprotect

# Extraire les archives
tar -xzf dataprotect-backend-docker.tar.gz
tar -xzf dataprotect-frontend-complete.tar.gz

# Structure finale:
# /opt/dataprotect/
# ├── backend/
# ├── frontend/
# └── admin/
```

### 2. Configuration Backend

```bash
cd /opt/dataprotect/backend

# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env
nano .env
```

**Fichier .env:**
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=VOTRE_SECRET_TRES_LONG_ET_ALEATOIRE
DATABASE_PATH=./database/ctf.db

# WireGuard
WIREGUARD_SERVER_IP=VOTRE_IP_PUBLIQUE
WIREGUARD_SERVER_PORT=51820
WIREGUARD_SUBNET=10.10.0.0/16

# Docker
DOCKER_NETWORK=ctf-network
```

```bash
# Initialiser la base de données
npm run init-db

# Créer un utilisateur admin
sqlite3 database/ctf.db
```

```sql
INSERT INTO users (username, email, password, role, createdAt)
VALUES ('admin', 'admin@dataprotect.com', '$2b$10$HASH', 'admin', datetime('now'));
```

### 3. Configuration WireGuard

```bash
# Générer les clés serveur
cd /etc/wireguard
wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key
sudo chmod 600 server_private.key

# Créer la configuration serveur
sudo nano /etc/wireguard/wg0.conf
```

**Fichier wg0.conf:**
```ini
[Interface]
PrivateKey = CONTENU_DE_server_private.key
Address = 10.10.0.1/16
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

```bash
# Activer le forwarding IP
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Démarrer WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### 4. Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/dataprotect
```

**Configuration Nginx:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.votredomaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend Utilisateur
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;

    root /opt/dataprotect/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/dataprotect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL/TLS (Let's Encrypt)

```bash
# Obtenir les certificats
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
sudo certbot --nginx -d api.votredomaine.com
sudo certbot --nginx -d admin.votredomaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### 6. Services Systemd

**Backend Service:**
```bash
sudo nano /etc/systemd/system/dataprotect-backend.service
```

```ini
[Unit]
Description=DATAPROTECT Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/dataprotect/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Admin Panel Service:**
```bash
sudo nano /etc/systemd/system/dataprotect-admin.service
```

```ini
[Unit]
Description=DATAPROTECT Admin Panel
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/dataprotect/admin
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer les services
sudo systemctl daemon-reload
sudo systemctl enable dataprotect-backend
sudo systemctl enable dataprotect-admin
sudo systemctl start dataprotect-backend
sudo systemctl start dataprotect-admin

# Vérifier le statut
sudo systemctl status dataprotect-backend
sudo systemctl status dataprotect-admin
```

### 7. Firewall

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 51820/udp  # WireGuard
sudo ufw enable
```

## 🐳 Configuration Docker

### Créer le réseau CTF

```bash
docker network create \
  --driver bridge \
  --subnet 10.10.0.0/16 \
  --gateway 10.10.0.1 \
  ctf-network
```

### Préparer des images Docker exemple

```bash
# Exemple: Challenge Web
cd /opt/dataprotect/docker-images
mkdir web-challenge-1
cd web-challenge-1
```

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY flag.txt /root/flag.txt
RUN chmod 600 /root/flag.txt
EXPOSE 80
```

```bash
# Build l'image
docker build -t ctf/web-challenge-1 .
```

## 📊 Monitoring

### Logs

```bash
# Backend logs
sudo journalctl -u dataprotect-backend -f

# Admin logs
sudo journalctl -u dataprotect-admin -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker logs
docker logs -f CONTAINER_ID
```

### Monitoring Docker

```bash
# Voir les conteneurs actifs
docker ps

# Stats en temps réel
docker stats

# Nettoyer les conteneurs arrêtés
docker container prune -f
```

## 🔒 Sécurité

### Recommandations

1. **Changer le mot de passe admin** immédiatement
2. **Configurer fail2ban** pour protéger SSH
3. **Limiter les tentatives de connexion** dans le backend
4. **Mettre à jour régulièrement** le système et Docker
5. **Backup quotidien** de la base de données
6. **Monitoring des ressources** (CPU, RAM, disque)

### Backup Automatique

```bash
# Créer un script de backup
sudo nano /opt/dataprotect/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/dataprotect/backups"
mkdir -p $BACKUP_DIR

# Backup database
cp /opt/dataprotect/backend/database/ctf.db $BACKUP_DIR/ctf_$DATE.db

# Backup WireGuard configs
tar -czf $BACKUP_DIR/wireguard_$DATE.tar.gz /etc/wireguard/

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Rendre exécutable
sudo chmod +x /opt/dataprotect/backup.sh

# Ajouter au cron (tous les jours à 3h du matin)
sudo crontab -e
```

```
0 3 * * * /opt/dataprotect/backup.sh >> /var/log/dataprotect-backup.log 2>&1
```

## 🧪 Tests

### Tester le Backend

```bash
curl https://api.votredomaine.com/api/categories
```

### Tester le Frontend

```bash
curl https://votredomaine.com
```

### Tester Docker

```bash
docker run --rm --network ctf-network alpine ping -c 3 10.10.0.1
```

### Tester WireGuard

```bash
sudo wg show
```

## 📈 Performance

### Optimisations Recommandées

1. **Nginx caching** pour les assets statiques
2. **Gzip compression** activée
3. **Docker resource limits** configurées
4. **Database indexes** optimisés
5. **CDN** pour les assets (optionnel)

### Limites Docker par défaut

Dans `dockerService-production.js`:
- **Memory**: 512 MB par conteneur
- **CPU**: 1 core par conteneur
- **Timeout**: 1 heure par défaut

## 🆘 Dépannage

### Backend ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u dataprotect-backend -n 50

# Vérifier les permissions
sudo chown -R www-data:www-data /opt/dataprotect/backend

# Tester manuellement
cd /opt/dataprotect/backend
node server.js
```

### Docker ne démarre pas les conteneurs

```bash
# Vérifier Docker
sudo systemctl status docker

# Vérifier le réseau
docker network ls
docker network inspect ctf-network

# Vérifier les images
docker images
```

### WireGuard ne fonctionne pas

```bash
# Vérifier le service
sudo systemctl status wg-quick@wg0

# Vérifier la configuration
sudo wg show

# Redémarrer
sudo systemctl restart wg-quick@wg0
```

## 📞 Support

Pour toute question ou problème:
- Email: support@dataprotect.com
- Documentation: https://docs.dataprotect.com
- GitHub: https://github.com/dataprotect/platform

## 📝 Checklist de Déploiement

- [ ] Serveur Ubuntu 22.04 configuré
- [ ] Docker installé et fonctionnel
- [ ] WireGuard installé et configuré
- [ ] Nginx installé avec reverse proxy
- [ ] SSL/TLS activé (Let's Encrypt)
- [ ] Backend déployé et démarré
- [ ] Frontend déployé
- [ ] Admin panel déployé
- [ ] Base de données initialisée
- [ ] Utilisateur admin créé
- [ ] Réseau Docker ctf-network créé
- [ ] Firewall configuré
- [ ] Services systemd activés
- [ ] Backup automatique configuré
- [ ] Tests de fonctionnement effectués
- [ ] Monitoring en place

**Félicitations ! Votre plateforme DATAPROTECT est maintenant en production ! 🎉**
