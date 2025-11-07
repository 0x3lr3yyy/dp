# DATAPROTECT Backend API

Backend API REST pour la plateforme CTF DATAPROTECT.

## Installation

```bash
npm install
```

## Configuration

Copiez `.env.example` vers `.env` et configurez les variables :

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=24h
DATABASE_PATH=./database/ctf.db
CORS_ORIGIN=*
MACHINE_SESSION_DURATION=3600
```

## Initialisation de la base de données

```bash
npm run init-db
```

Cette commande crée la base de données SQLite avec :
- Les tables nécessaires
- Les catégories de défis (Web, Crypto, Reverse, Network, Forensics, OSINT)
- Des défis d'exemple
- Un compte admin (username: `admin`, password: `admin123`)
- Des utilisateurs de démonstration (password: `password123`)

## Démarrage

```bash
npm start
```

Le serveur démarre sur le port configuré (par défaut 5000).

## Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (authentifié)
- `POST /api/auth/logout` - Déconnexion

### Catégories
- `GET /api/categories` - Liste des catégories
- `GET /api/categories/:id` - Détails d'une catégorie
- `GET /api/categories/slug/:slug` - Catégorie par slug
- `POST /api/categories` - Créer une catégorie (admin)
- `PUT /api/categories/:id` - Modifier une catégorie (admin)
- `DELETE /api/categories/:id` - Supprimer une catégorie (admin)

### Défis
- `GET /api/challenges` - Liste des défis actifs
- `GET /api/challenges/:id` - Détails d'un défi
- `GET /api/challenges/category/:category` - Défis par catégorie
- `GET /api/challenges/admin/all` - Tous les défis (admin)
- `POST /api/challenges` - Créer un défi (admin)
- `PUT /api/challenges/:id` - Modifier un défi (admin)
- `DELETE /api/challenges/:id` - Supprimer un défi (admin)

### Machines
- `POST /api/machines/start/:challengeId` - Démarrer une machine (authentifié)
- `POST /api/machines/stop/:machineId` - Arrêter une machine (authentifié)
- `GET /api/machines/status/:machineId` - Statut d'une machine (authentifié)
- `GET /api/machines/user` - Machines de l'utilisateur (authentifié)
- `GET /api/machines/admin/all` - Toutes les machines (admin)

### Soumissions
- `POST /api/submissions/submit` - Soumettre un flag (authentifié)
- `GET /api/submissions/user` - Soumissions de l'utilisateur (authentifié)
- `GET /api/submissions/admin/all` - Toutes les soumissions (admin)
- `GET /api/submissions/admin/challenge/:challengeId` - Soumissions par défi (admin)

### Leaderboard
- `GET /api/leaderboard` - Classement global
- `GET /api/leaderboard/top/:limit` - Top N utilisateurs
- `GET /api/leaderboard/user/rank` - Rang de l'utilisateur (authentifié)

### Admin
- `GET /api/admin/dashboard` - Statistiques du dashboard (admin)
- `GET /api/admin/users` - Liste des utilisateurs (admin)
- `PUT /api/admin/users/:id` - Modifier un utilisateur (admin)
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur (admin)
- `GET /api/admin/machines` - Liste des machines (admin)
- `POST /api/admin/machines/:id/stop` - Arrêter une machine (admin)

## Authentification

Les routes protégées nécessitent un token JWT dans l'en-tête :

```
Authorization: Bearer <token>
```

Le token est obtenu lors de la connexion (`/api/auth/login`).

## Structure du projet

```
dataprotect-backend/
├── src/
│   ├── config/          # Configuration (DB, JWT)
│   ├── models/          # Modèles de données
│   ├── controllers/     # Contrôleurs
│   ├── routes/          # Routes API
│   ├── middleware/      # Middlewares (auth, validation, erreurs)
│   ├── utils/           # Utilitaires
│   └── app.js           # Configuration Express
├── database/
│   ├── schema.sql       # Schéma de la base de données
│   ├── seed.sql         # Données initiales
│   └── ctf.db           # Base de données SQLite
├── .env                 # Variables d'environnement
├── server.js            # Point d'entrée
└── package.json
```

## Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite3** - Base de données
- **bcrypt** - Hachage de mots de passe
- **jsonwebtoken** - Authentification JWT
- **express-validator** - Validation des données
- **helmet** - Sécurité HTTP
- **cors** - Cross-Origin Resource Sharing
- **morgan** - Logging HTTP

## Sécurité

- Mots de passe hachés avec bcrypt (10 rounds)
- Authentification JWT
- Validation des entrées avec express-validator
- Protection CORS
- Headers de sécurité avec helmet

## Notes

- Les machines virtuelles sont simulées avec des IPs générées aléatoirement (10.x.x.x)
- Durée de session par défaut : 1 heure (3600 secondes)
- Les machines expirées sont nettoyées automatiquement toutes les 5 minutes
