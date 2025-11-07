# DATAPROTECT Platform - Specifications Complètes (Style TryHackMe)

## Vue d'ensemble

Plateforme CTF professionnelle permettant aux utilisateurs de pratiquer la cybersécurité sur des machines virtuelles Docker, avec système VPN pour accès réseau.

## Architecture Technique

### 1. Backend API (Node.js + Express + SQLite)

**Endpoints principaux :**
- `/api/auth/*` - Authentification JWT
- `/api/challenges/*` - Gestion des défis
- `/api/docker/*` - Gestion des machines Docker
- `/api/vpn/*` - Configuration VPN
- `/api/submissions/*` - Soumission de flags
- `/api/leaderboard` - Classement

**Système Docker :**
- Réseau bridge Docker personnalisé (`ctf-network`)
- Attribution automatique d'IP (10.10.x.x)
- Timeout automatique des machines (1h par défaut)
- Cleanup automatique des conteneurs expirés

### 2. Frontend Utilisateur (HTML/CSS/JS)

**Pages principales :**
- `index.html` - Page d'accueil avec hero VANTA.js
- `challenges.html` - Liste des challenges avec filtres
- `challenge.html` - Détail du challenge avec machine Docker
- `leaderboard.html` - Classement des utilisateurs
- `login.html` / `register.html` - Authentification

**Fonctionnalités clés :**
- Section "Target Machine Information" (style TryHackMe)
- Compteur de chargement IP ("Shown in Xmin Ys")
- Timer de session avec compte à rebours
- Boutons "Add 1 hour" et "Terminate"
- Soumission de flags avec feedback instantané

### 3. Admin Panel (React + TypeScript)

**Fonctionnalités :**
- Dashboard avec statistiques
- Gestion des challenges (CRUD)
- Configuration Docker par challenge
- Monitoring des machines actives
- Gestion des utilisateurs
- Vue des soumissions

### 4. Système VPN (WireGuard)

**Implémentation :**
- Petit onglet VPN dans le header (non intrusif)
- Génération automatique de configs VPN par utilisateur
- Attribution d'IP VPN unique (10.10.x.x)
- Téléchargement de fichier .conf
- Instructions de configuration

## Flux Utilisateur

1. **Inscription/Connexion**
   - Créer un compte
   - Se connecter avec JWT

2. **Configuration VPN (Optionnel)**
   - Cliquer sur l'onglet VPN
   - Télécharger la config
   - Installer WireGuard
   - Se connecter au VPN

3. **Parcourir les Challenges**
   - Voir les catégories
   - Filtrer par difficulté
   - Lire les descriptions

4. **Démarrer une Machine**
   - Cliquer sur "Start Machine"
   - Attendre l'attribution de l'IP (30-60s)
   - Voir l'IP dans la section "Target Machine Information"
   - Timer de 1h démarre

5. **Résoudre le Challenge**
   - Accéder à la machine via IP (si VPN activé)
   - Trouver le flag
   - Soumettre le flag
   - Gagner des points

6. **Gérer la Machine**
   - Ajouter du temps (+1h)
   - Terminer la machine
   - Voir le leaderboard

## Flux Admin

1. **Créer un Challenge**
   - Titre, description, difficulté, points
   - Catégorie
   - Flag

2. **Configurer Docker**
   - Nom de l'image Docker
   - Ports exposés
   - Variables d'environnement
   - Ressources (CPU, RAM)
   - Timeout

3. **Publier**
   - Le challenge apparaît sur le frontend
   - Les utilisateurs peuvent le démarrer

4. **Monitoring**
   - Voir les machines actives
   - Arrêter des machines
   - Voir les logs

## Déploiement Production

### Prérequis Serveur
- Ubuntu 22.04 LTS
- Docker + Docker Compose
- WireGuard
- Node.js 22.x
- Nginx (reverse proxy)
- SSL/TLS (Let's Encrypt)

### Services
1. **Backend API** - Port 5000
2. **Frontend** - Port 8080 (ou via Nginx)
3. **Admin Panel** - Port 3000 (ou via Nginx)
4. **WireGuard VPN** - Port 51820/UDP

### Sécurité
- JWT avec expiration
- Rate limiting sur les API
- CORS configuré
- Validation des entrées
- Sanitization SQL
- Secrets dans variables d'environnement

## Différences avec TryHackMe

**Similitudes :**
- Interface utilisateur identique
- Système de machines avec timer
- VPN pour accès réseau
- Leaderboard et points
- Admin panel complet

**Différences :**
- Docker au lieu de VMs complètes (plus léger)
- SQLite au lieu de PostgreSQL (simplicité)
- Pas de subscription payante (gratuit)
- Pas de AttackBox intégré
- Pas de salles (rooms) complexes

## Roadmap Future

- [ ] Système de salles (rooms) avec plusieurs challenges
- [ ] AttackBox dans le navigateur (Guacamole)
- [ ] Webhooks pour intégration Open edX
- [ ] API LTI pour LMS
- [ ] Système de badges et certifications
- [ ] Challenges collaboratifs (équipes)
- [ ] Writeups communautaires
- [ ] Forum de discussion
