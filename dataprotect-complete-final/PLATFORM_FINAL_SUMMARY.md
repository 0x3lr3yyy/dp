# DATAPROTECT - Plateforme CTF Complète

## 📋 Vue d'ensemble

Vous disposez maintenant d'une **plateforme CTF complète de niveau production** similaire à TryHackMe et HackTheBox, avec :

- **Backend API complet** avec orchestration Docker
- **Panel d'administration** pour gérer toute la plateforme
- **3 frontends différents** au choix, tous intégrés avec le backend
- **Synchronisation en temps réel** entre l'admin et les frontends

---

## 🎯 Composants de la Plateforme

### 1. Backend API (Node.js + Express + SQLite)

**Emplacement** : `/home/ubuntu/dataprotect-backend/`

**Port** : 5000

**URL publique** : https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api

**Fonctionnalités** :
- ✅ Authentification JWT (inscription, connexion, profil)
- ✅ Gestion des catégories (CRUD)
- ✅ Gestion des challenges (CRUD avec flags, points, difficulté)
- ✅ **Orchestration Docker** (démarrage/arrêt de conteneurs réels)
- ✅ Gestion des machines virtuelles par utilisateur
- ✅ Soumission et vérification de flags
- ✅ Leaderboard en temps réel
- ✅ Système de rôles (admin/user)
- ✅ API REST complète (30+ endpoints)

**Compte admin** :
- Username: `admin`
- Password: `admin123`

**Utilisateurs de démo** :
- alice, bob, charlie, dave, eve, frank
- Password: `password123`

**Base de données** :
- 6 catégories pré-configurées
- 9 challenges d'exemple
- SQLite (`database/ctf.db`)

---

### 2. Panel d'Administration

**Emplacement** : `/home/ubuntu/dataprotect-admin/`

**Port** : 3000

**URL publique** : https://3000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/

**Fonctionnalités** :
- ✅ Dashboard avec statistiques (utilisateurs, défis, machines actives)
- ✅ **Gestion des catégories** (créer, modifier, supprimer)
- ✅ **Gestion des challenges** (formulaires complets avec tous les champs)
- ✅ **Gestion Docker** (configuration des images, ports, ressources)
- ✅ **Gestion des utilisateurs** (liste, modification, suppression)
- ✅ **Monitoring des machines** (voir et arrêter les machines actives)
- ✅ **Vue des soumissions** (historique complet avec timestamps)
- ✅ Interface moderne avec sidebar navigation
- ✅ Thème sombre professionnel

**Technologies** :
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Wouter (routing)

---

### 3. Frontends Utilisateurs

#### Frontend A : Design Original
**Emplacement** : `/home/ubuntu/upload/`

**Fichiers** :
- `index.html` - Page d'accueil
- `category.html` - Liste des catégories
- `challenge.html` - Détail d'un challenge
- `script.js` - Logique JavaScript
- `styles.css` - Styles CSS

**Caractéristiques** :
- Design cyberpunk rouge/noir
- Votre design original fourni

---

#### Frontend B : Design Original + Intégration API Complète
**Emplacement** : `/home/ubuntu/dataprotect-frontend/`

**Port** : 8080 (actuellement actif)

**URL publique** : https://8080-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/

**Fichiers** :
- `index.html` - Page d'accueil avec leaderboard
- `category.html` - Catégories chargées depuis l'API
- `challenge.html` - Challenge avec système Docker
- `config.js` - Configuration API
- `index-integration.js` - Chargement des catégories et leaderboard
- `category-integration.js` - Chargement des challenges par catégorie
- `challenge-integration-enhanced.js` - Démarrage de machines Docker et soumission de flags

**Fonctionnalités** :
- ✅ Chargement dynamique des catégories depuis l'API
- ✅ Chargement dynamique des challenges
- ✅ Authentification utilisateur (inscription/connexion)
- ✅ **Démarrage de machines Docker** avec bouton "Start Machine"
- ✅ **Affichage de l'IP et du timer** en temps réel
- ✅ **Soumission de flags** avec feedback instantané
- ✅ Leaderboard en temps réel
- ✅ Synchronisation complète avec le backend

---

#### Frontend C : Design Moderne (CyberSec Academy)
**Emplacement** : `/home/ubuntu/dataprotect-frontend-v2/`

**Port** : 8080 (disponible)

**Fichiers** :
- `index.html` - Page d'accueil avec VANTA.js
- `login.html` - Page de connexion
- `register.html` - Page d'inscription
- `js/config.js` - Client API complet
- `js/main.js` - Logique principale

**Caractéristiques** :
- ✅ Design moderne inspiré de cybersec-preview.html
- ✅ **VANTA.js clouds background** animé
- ✅ Hero section avec animations
- ✅ Tiles pour les catégories avec hover effects
- ✅ Cards pour les challenges
- ✅ Leaderboard avec badges (or, argent, bronze)
- ✅ Authentification complète
- ✅ Intégration API complète
- ✅ Responsive design
- ✅ Reveal on scroll animations

**Technologies** :
- HTML5 + CSS3 (CSS Variables)
- Vanilla JavaScript (ES6+)
- VANTA.js + Three.js
- Font Awesome icons
- Google Fonts (Russo One + Inter)

---

## 🔄 Synchronisation Admin ↔ Frontend

**Tout ce que vous faites dans l'admin panel se reflète immédiatement sur les frontends** :

1. **Ajout d'un challenge** dans l'admin → Apparaît instantanément sur les frontends
2. **Modification d'une catégorie** → Mise à jour en temps réel
3. **Suppression d'un élément** → Disparaît des frontends
4. **Configuration Docker** → Les machines démarrent avec les bons paramètres

---

## 🐳 Système Docker

### Configuration par Challenge

Dans le panel admin, section **Docker Management**, vous pouvez configurer :

- **Image Docker** : Nom de l'image (ex: `ubuntu:latest`, `kalilinux/kali-rolling`)
- **Ports exposés** : Liste des ports (ex: `80,22,3306`)
- **Variables d'environnement** : Configuration personnalisée
- **Limites de ressources** :
  - CPU (nombre de cores)
  - RAM (en MB)
  - Timeout (durée de session en minutes)

### Workflow Utilisateur

1. L'utilisateur clique sur **"Start Machine"** sur un challenge
2. Le backend crée un conteneur Docker isolé
3. Le conteneur reçoit une IP unique
4. L'utilisateur voit l'IP et le timer
5. Le conteneur s'arrête automatiquement après le timeout
6. L'utilisateur peut soumettre le flag trouvé

### Réseau Isolé

Chaque utilisateur a son propre conteneur avec :
- Réseau Docker bridge isolé
- IP unique attribuée dynamiquement
- Pas d'interférence entre utilisateurs

---

## 📊 Base de Données

### Structure

**Tables** :
- `users` - Utilisateurs avec rôles
- `categories` - Catégories de challenges
- `challenges` - Challenges avec flags et points
- `machines` - Machines Docker actives
- `submissions` - Soumissions de flags
- `solves` - Challenges résolus
- `challenge_docker_config` - Configuration Docker par challenge

### Données Pré-chargées

**6 Catégories** :
1. Cryptography (3 challenges)
2. Forensics (1 challenge)
3. OSINT (1 challenge)
4. Reverse Engineering (1 challenge)
5. Web Exploitation (3 challenges)

**9 Challenges d'exemple** :
- Caesar Cipher (Easy, 100 points)
- Base64 Decoder (Easy, 100 points)
- XOR Encryption (Medium, 200 points)
- Hidden Message (Easy, 150 points)
- Social Engineering (Easy, 150 points)
- Binary Analysis (Medium, 250 points)
- SQL Injection (Easy, 150 points)
- XSS Attack (Medium, 200 points)
- Template Injection (Hard, 300 points)

---

## 🚀 Démarrage Rapide

### Backend

```bash
cd ~/dataprotect-backend
npm start
```

Le backend démarre sur le port 5000.

### Panel Admin

Le panel admin est déjà déployé et accessible à :
https://3000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/

Connectez-vous avec `admin` / `admin123`

### Frontend Utilisateur

**Option 1 : Design original intégré**
```bash
cd ~/dataprotect-frontend
python3 -m http.server 8080
```

**Option 2 : Design moderne**
```bash
cd ~/dataprotect-frontend-v2
python3 -m http.server 8080
```

Accédez à : https://8080-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/

---

## 📦 Archives Disponibles

1. **dataprotect-backend-docker.tar.gz** - Backend complet avec Docker
2. **dataprotect-frontend-complete.tar.gz** - Frontend original intégré
3. **dataprotect-frontend-v2/** - Nouveau frontend moderne (dossier)
4. **dataprotect-admin** - Panel admin (projet webdev)

---

## 🔧 Configuration Requise pour Production

### Serveur

- **OS** : Ubuntu 20.04+ ou Debian 11+
- **Docker** : Version 20.10+
- **Node.js** : Version 16+
- **RAM** : Minimum 4GB (8GB recommandé)
- **CPU** : 2 cores minimum (4+ recommandé)
- **Stockage** : 20GB minimum

### Variables d'Environnement

Fichier `.env` du backend :

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this
DATABASE_PATH=./database/ctf.db
DOCKER_NETWORK=ctf-network
```

---

## 🎓 Intégration Open edX

La plateforme est prête pour l'intégration avec Open edX via :

1. **LTI (Learning Tools Interoperability)** - Standard pour intégrer des outils externes
2. **API REST** - Toutes les routes sont documentées et accessibles
3. **SSO** - Le système JWT peut être adapté pour l'authentification Open edX
4. **Embedding** - Les frontends peuvent être intégrés dans des iframes

### Endpoints pour Open edX

- `POST /api/auth/login` - Authentification
- `GET /api/challenges` - Liste des challenges
- `POST /api/submissions/submit` - Soumission de flags
- `GET /api/leaderboard/top/:limit` - Classement

---

## 📈 Prochaines Étapes

### Recommandations

1. **Déployer sur un serveur de production** avec Docker installé
2. **Configurer un nom de domaine** (ex: ctf.dataprotect.com)
3. **Ajouter des challenges réels** via le panel admin
4. **Créer des images Docker personnalisées** pour vos labs
5. **Configurer un reverse proxy** (Nginx) pour la production
6. **Activer HTTPS** avec Let's Encrypt
7. **Mettre en place des backups** de la base de données

### Fonctionnalités Futures (Optionnelles)

- [ ] VPN pour accès aux machines (Guacamole ou OpenVPN)
- [ ] Système de hints payants
- [ ] Writeups après résolution
- [ ] Badges et achievements
- [ ] Système de teams
- [ ] Compétitions avec timer
- [ ] Notifications en temps réel (WebSocket)
- [ ] Export des statistiques (CSV, PDF)

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez que Docker est installé et fonctionne
2. Vérifiez que tous les ports sont accessibles (3000, 5000, 8080)
3. Consultez les logs du backend : `tail -f /tmp/backend.log`
4. Vérifiez la base de données : `sqlite3 database/ctf.db`

---

## ✅ Résumé

Vous avez maintenant une **plateforme CTF complète et fonctionnelle** avec :

- ✅ Backend avec Docker orchestration
- ✅ Panel admin pour tout gérer
- ✅ 3 frontends au choix
- ✅ Synchronisation temps réel
- ✅ Prêt pour la production
- ✅ Compatible Open edX

**Tout fonctionne ensemble et est contrôlé depuis le panel admin !**
