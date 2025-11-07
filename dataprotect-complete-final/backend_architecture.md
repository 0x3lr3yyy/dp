# Architecture Backend DATAPROTECT

## Vue d'ensemble

Le backend est construit avec **Node.js** et **Express**, utilisant **SQLite** comme base de données. L'architecture suit un modèle MVC (Model-View-Controller) adapté pour une API REST.

## Structure des Dossiers

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Configuration SQLite
│   │   └── jwt.js            # Configuration JWT
│   ├── models/
│   │   ├── User.js           # Modèle utilisateur
│   │   ├── Category.js       # Modèle catégorie
│   │   ├── Challenge.js      # Modèle défi
│   │   ├── Machine.js        # Modèle machine virtuelle
│   │   ├── Submission.js     # Modèle soumission
│   │   └── Solve.js          # Modèle résolution
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── challengeController.js
│   │   ├── machineController.js
│   │   ├── submissionController.js
│   │   └── leaderboardController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── challenges.js
│   │   ├── machines.js
│   │   ├── submissions.js
│   │   └── leaderboard.js
│   ├── middleware/
│   │   ├── auth.js           # Middleware d'authentification JWT
│   │   ├── validation.js     # Middleware de validation
│   │   └── errorHandler.js   # Gestionnaire d'erreurs
│   ├── utils/
│   │   ├── logger.js         # Système de logging
│   │   └── helpers.js        # Fonctions utilitaires
│   └── app.js                # Configuration Express
├── database/
│   ├── schema.sql            # Schéma de base de données
│   ├── seed.sql              # Données initiales
│   └── ctf.db                # Base de données SQLite
├── .env                      # Variables d'environnement
├── .env.example              # Exemple de configuration
├── package.json
├── server.js                 # Point d'entrée
└── README.md                 # Documentation
```

## API Endpoints

### Authentification (`/api/auth`)
- `POST /register` - Inscription d'un nouvel utilisateur
- `POST /login` - Connexion et génération de JWT
- `GET /profile` - Récupération du profil (authentifié)
- `POST /logout` - Déconnexion

### Catégories (`/api/categories`)
- `GET /` - Liste toutes les catégories
- `GET /:id` - Détails d'une catégorie
- `GET /:slug/challenges` - Défis d'une catégorie

### Défis (`/api/challenges`)
- `GET /` - Liste tous les défis
- `GET /:id` - Détails d'un défi
- `GET /category/:category` - Défis par catégorie

### Machines (`/api/machines`)
- `POST /start/:challengeId` - Démarrer une machine (authentifié)
- `POST /stop/:machineId` - Arrêter une machine (authentifié)
- `GET /status/:machineId` - Statut d'une machine (authentifié)
- `GET /user` - Machines actives de l'utilisateur (authentifié)

### Soumissions (`/api/submissions`)
- `POST /submit` - Soumettre un flag (authentifié)
- `GET /user` - Historique des soumissions (authentifié)
- `GET /challenge/:challengeId` - Soumissions pour un défi (authentifié)

### Leaderboard (`/api/leaderboard`)
- `GET /` - Classement global
- `GET /top/:limit` - Top N utilisateurs

## Modèles de Données

### User
- id, username, email, password_hash, team_name, role, total_score, created_at, updated_at

### Category
- id, slug, name, description, icon, created_at

### Challenge
- id, challenge_id, category_id, title, description, difficulty, points, flag, is_active, created_at, updated_at

### Machine
- id, user_id, challenge_id, machine_ip, status, started_at, expires_at, stopped_at

### Submission
- id, user_id, challenge_id, submitted_flag, is_correct, points_awarded, submitted_at

### Solve
- id, user_id, challenge_id, solved_at

## Sécurité

### Authentification JWT
Les tokens JWT sont générés lors de la connexion et doivent être inclus dans l'en-tête `Authorization: Bearer <token>` pour les routes protégées.

### Hachage des Mots de Passe
Les mots de passe sont hachés avec **bcrypt** (10 rounds) avant stockage.

### Validation des Entrées
Toutes les entrées utilisateur sont validées avec **express-validator**.

### Protection CORS
Configuration CORS pour autoriser uniquement les origines de confiance.

### Rate Limiting
Limitation du nombre de requêtes pour prévenir les abus.

## Gestion des Machines Virtuelles

### Simulation
Dans cette version, les machines sont simulées avec des IPs générées aléatoirement (10.x.x.x).

### Durée de Session
Chaque machine a une durée de vie de **1 heure** (3600 secondes).

### Nettoyage Automatique
Un job cron vérifie périodiquement les machines expirées et les marque comme "expired".

## Variables d'Environnement

```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=24h
DATABASE_PATH=./database/ctf.db
CORS_ORIGIN=http://localhost:3000
```

## Technologies Utilisées

- **Node.js** (v18+)
- **Express** (Framework web)
- **SQLite3** (Base de données)
- **bcrypt** (Hachage de mots de passe)
- **jsonwebtoken** (Authentification JWT)
- **express-validator** (Validation)
- **helmet** (Sécurité HTTP)
- **cors** (Cross-Origin Resource Sharing)
- **dotenv** (Variables d'environnement)
- **morgan** (Logging HTTP)
