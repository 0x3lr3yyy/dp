# Guide de Déploiement DATAPROTECT

Ce guide explique comment déployer le backend API et le panel d'administration DATAPROTECT.

## Architecture

Le projet se compose de deux parties :

1. **Backend API** (`dataprotect-backend/`) - API REST Node.js + Express + SQLite
2. **Panel Admin** (`dataprotect-admin/`) - Interface React pour gérer la plateforme

## Prérequis

- Node.js 18+ et npm
- Un serveur avec accès SSH (pour le déploiement)

## Installation Locale

### 1. Backend API

```bash
cd dataprotect-backend
npm install
npm run init-db
npm start
```

Le backend démarre sur `http://localhost:5000` (ou le port configuré dans `.env`).

**Compte admin par défaut :**
- Username: `admin`
- Password: `admin123`

### 2. Panel d'Administration

Le panel admin est déjà déployé sur Manus. Pour le connecter à votre backend :

1. Ouvrez le panel admin dans Manus
2. Allez dans **Settings** (icône en haut à droite)
3. Allez dans **Secrets**
4. Ajoutez ou modifiez la variable `VITE_API_BASE_URL` avec l'URL de votre backend :
   - Local : `http://localhost:5000/api`
   - Production : `https://votre-domaine.com/api`

## Déploiement en Production

### Backend API

#### Option 1 : Serveur VPS (recommandé)

1. **Transférer les fichiers**
   ```bash
   scp dataprotect-backend.tar.gz user@serveur:/home/user/
   ssh user@serveur
   tar -xzf dataprotect-backend.tar.gz
   cd dataprotect-backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install --production
   ```

3. **Configurer l'environnement**
   ```bash
   nano .env
   ```
   
   Modifiez :
   ```env
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=CHANGEZ_CETTE_CLE_SECRETE_LONGUE_ET_ALEATOIRE
   CORS_ORIGIN=https://votre-panel-admin.manus.space
   ```

4. **Initialiser la base de données**
   ```bash
   npm run init-db
   ```

5. **Démarrer avec PM2** (gestionnaire de processus)
   ```bash
   npm install -g pm2
   pm2 start server.js --name dataprotect-api
   pm2 save
   pm2 startup
   ```

6. **Configurer Nginx comme reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name api.votre-domaine.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Activer HTTPS avec Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.votre-domaine.com
   ```

#### Option 2 : Déploiement Docker

1. **Créer un Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   RUN npm run init-db
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Construire et lancer**
   ```bash
   docker build -t dataprotect-api .
   docker run -d -p 5000:5000 --name dataprotect-api dataprotect-api
   ```

### Panel d'Administration

Le panel est déjà hébergé sur Manus. Pour le publier :

1. Dans Manus, cliquez sur le bouton **Publish** en haut à droite
2. Votre panel sera accessible sur `https://votre-projet.manus.space`
3. Configurez `VITE_API_BASE_URL` dans Settings → Secrets pour pointer vers votre backend

## Configuration CORS

Le backend doit autoriser les requêtes depuis le domaine du panel admin.

Dans `dataprotect-backend/.env` :
```env
CORS_ORIGIN=https://votre-panel.manus.space
```

Pour autoriser plusieurs origines, modifiez `src/app.js` :
```javascript
app.use(cors({
    origin: [
        'https://votre-panel.manus.space',
        'http://localhost:3000'
    ],
    credentials: true
}));
```

## Sécurité en Production

### Backend

1. **Changez le secret JWT**
   ```env
   JWT_SECRET=une_cle_tres_longue_et_aleatoire_generee_securisee
   ```

2. **Changez le mot de passe admin**
   Connectez-vous avec `admin/admin123` puis changez-le immédiatement.

3. **Limitez CORS**
   Ne mettez pas `CORS_ORIGIN=*` en production.

4. **Activez HTTPS**
   Utilisez toujours HTTPS en production (Let's Encrypt gratuit).

5. **Sauvegardes régulières**
   ```bash
   # Sauvegarde de la base de données
   cp database/ctf.db database/ctf.db.backup-$(date +%Y%m%d)
   ```

### Panel Admin

1. **Variables d'environnement**
   - Configurez `VITE_API_BASE_URL` via Settings → Secrets dans Manus
   - Ne commitez jamais de secrets dans le code

2. **Domaine personnalisé**
   - Configurez un domaine personnalisé dans Manus Settings → Domains

## Maintenance

### Logs Backend

```bash
# Avec PM2
pm2 logs dataprotect-api

# Logs directs
tail -f /var/log/dataprotect-api.log
```

### Mise à jour

```bash
cd dataprotect-backend
git pull  # ou transférez les nouveaux fichiers
npm install
pm2 restart dataprotect-api
```

### Nettoyage de la base de données

```bash
# Supprimer les machines expirées
sqlite3 database/ctf.db "DELETE FROM machines WHERE status = 'expired' AND stopped_at < datetime('now', '-7 days');"

# Supprimer les anciennes soumissions
sqlite3 database/ctf.db "DELETE FROM submissions WHERE submitted_at < datetime('now', '-30 days');"
```

## Dépannage

### Le backend ne démarre pas

1. Vérifiez les logs : `pm2 logs dataprotect-api`
2. Vérifiez que le port n'est pas déjà utilisé : `netstat -tlnp | grep 5000`
3. Vérifiez les permissions de la base de données : `ls -l database/ctf.db`

### Le panel admin ne se connecte pas au backend

1. Vérifiez `VITE_API_BASE_URL` dans Settings → Secrets
2. Vérifiez CORS dans le backend (`.env` → `CORS_ORIGIN`)
3. Ouvrez la console du navigateur pour voir les erreurs réseau
4. Testez l'API directement : `curl https://votre-api.com/health`

### Erreur CORS

```
Access to fetch at 'https://api.com' from origin 'https://panel.com' has been blocked by CORS policy
```

**Solution :** Ajoutez l'origine du panel dans `CORS_ORIGIN` du backend.

## Support

Pour toute question ou problème :
- Consultez les logs du backend
- Vérifiez la configuration CORS
- Assurez-vous que le backend est accessible depuis le panel
