# Analyse du Frontend DATAPROTECT

## Structure du Frontend

### Pages HTML
1. **index.html** - Page d'accueil
   - Section Hero avec titre DATAPROTECT
   - Section Challenges avec 6 catégories (Web, Crypto, Reverse, Network, Forensics, OSINT)
   - Section Leaderboard avec classement des utilisateurs
   
2. **category.html** - Page de catégorie
   - Affiche les défis d'une catégorie spécifique
   - Données hardcodées dans le JavaScript (CHALLENGES object)
   - Paramètre URL: `?category=web|crypto|reverse|network|forensics|osint`

3. **challenge.html** - Page de défi individuel
   - Affiche les détails d'un défi spécifique
   - Système de machine virtuelle (Start/Stop)
   - Timer de session (1 heure)
   - Génération d'IP simulée
   - Paramètres URL: `?category=xxx&id=xxx`

## Fonctionnalités Identifiées

### Données Actuellement Hardcodées
1. **Catégories de défis** (6 catégories)
   - web, crypto, reverse, network, forensics, osint
   
2. **Défis par catégorie** (exemples dans category.html)
   - web: w1, w2, w3 (Login Bypass, SSRF Playground, Template Injection)
   - crypto: c1, c2 (Broken OTP, RSA Factoring)
   - reverse: r1 (Crackme 1)
   - network: n1 (Pcap Forensics)
   - forensics: f1 (Disk Recovery)
   - osint: o1 (Find the Admin)

3. **Leaderboard** (données statiques dans index.html)
   - Classement avec rang, nom d'équipe, score, défis résolus

### Fonctionnalités à Implémenter dans le Backend

#### 1. Authentification & Utilisateurs
- Inscription/Connexion
- Gestion des profils utilisateurs
- Sessions JWT

#### 2. Gestion des Défis (Challenges)
- CRUD des catégories
- CRUD des défis
- Propriétés: id, titre, catégorie, difficulté, description, points, flag

#### 3. Gestion des Machines Virtuelles
- Démarrage de machine (provisioning)
- Arrêt de machine
- Gestion du timer de session
- Attribution d'IP (simulée ou réelle)

#### 4. Système de Soumission de Flags
- Vérification de flag
- Attribution de points
- Historique des soumissions

#### 5. Leaderboard
- Calcul des scores en temps réel
- Classement des utilisateurs/équipes
- Nombre de défis résolus

#### 6. API REST Endpoints Nécessaires

**Auth:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- POST /api/auth/logout

**Categories:**
- GET /api/categories
- GET /api/categories/:id

**Challenges:**
- GET /api/challenges
- GET /api/challenges/:id
- GET /api/challenges/category/:category

**Machines:**
- POST /api/machines/start/:challengeId
- POST /api/machines/stop/:machineId
- GET /api/machines/status/:machineId

**Submissions:**
- POST /api/submissions/submit
- GET /api/submissions/user/:userId

**Leaderboard:**
- GET /api/leaderboard

## Technologies Backend Recommandées
- **Framework:** Node.js + Express
- **Base de données:** SQLite (simple) ou PostgreSQL (production)
- **Authentification:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Sécurité:** helmet, cors, bcrypt
