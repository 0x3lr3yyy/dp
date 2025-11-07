# TryHackMe - Analyse Technique Complète

## ✅ Fonctionnalités Identifiées

### 1. Système de Machines

**Interface "Target Machine Information" (fond rouge)**
- **Title** : Nom de la machine (ex: "Blue") avec icône
- **Target IP Address** : 10.10.236.153 (IP privée du réseau VPN)
- **Expires** : Timer en temps réel (37min 47s)
- **Boutons** :
  - "Add 1 hour" (bouton bleu) - Étend la session
  - "Terminate" (bouton rouge) - Arrête la machine

**Processus observé :**
1. Utilisateur clique sur "Start Machine" (ou "Start AttackBox")
2. La machine démarre (prend ~1-2 minutes)
3. L'IP apparaît dans "Target IP Address"
4. Le timer démarre (1 heure par défaut)
5. L'utilisateur peut ajouter du temps ou terminer

### 2. Système VPN (OpenVPN)

**Page /access avec deux onglets :**

**Onglet "Machines" (26 machines actives)**
- Liste des machines démarrées
- Statut de chaque machine

**Onglet "Networks" (27 réseaux)**
- Sélection du serveur VPN (ex: EU-Regular-2)
- **OpenVPN Access Details** :
  - VPN Server Name : EU-Regular-2
  - Internal Virtual IP Address : 0.0.0.0 (quand non connecté)
  - Server status : Online (vert)
  - Connection : Not connected (rouge)
- **Boutons** :
  - "Download configuration file" (télécharge le .ovpn)
  - "Regenerate" (regénère une nouvelle config)
  - "Refresh" (rafraîchit le statut)

**Message important :**
> "If you're switching for the first time, you will need to redownload your configuration file"

### 3. Bouton "Access Machines" (Header)

- Bouton rouge dans le header en haut à droite
- Permet d'accéder rapidement à la page /access
- Toujours visible sur toutes les pages

### 4. Structure des Rooms/Challenges

**Informations affichées :**
- Nom du challenge (ex: "Blue")
- Description courte
- Difficulté (easy, medium, hard)
- Durée estimée (30 min)
- Nombre d'utilisateurs (351,265)
- Progression (Room completed 100%)

**Boutons disponibles :**
- "Share your achievement"
- "Start AttackBox" (alternative au VPN)
- "Badge"
- "Save Room"
- "9413 Recommend"
- "Options"

### 5. Tasks (Questions)

Chaque room contient plusieurs tasks :
- Task 1: Recon
- Task 2: Gain Access
- Task 3: Escalate
- Task 4: Cracking
- Task 5: Find flags!

Chaque task contient des questions avec des champs de réponse (flags).

## 🔧 Architecture Technique Déduite

### Backend

**API Endpoints nécessaires :**
```
POST /api/machines/start/:challengeId
GET /api/machines/status/:machineId
POST /api/machines/extend/:machineId
DELETE /api/machines/terminate/:machineId

GET /api/vpn/config
POST /api/vpn/regenerate
GET /api/vpn/status

POST /api/challenges/:id/submit
GET /api/challenges/:id/progress
```

### Infrastructure

**Docker + OpenVPN :**
1. **Réseau VPN** : 10.10.0.0/16 (exemple)
2. **Serveur OpenVPN** : Attribue des IP aux utilisateurs (ex: 10.8.0.x)
3. **Conteneurs Docker** : Connectés au réseau VPN avec IP fixes (ex: 10.10.236.153)
4. **Routing** : Les utilisateurs VPN peuvent accéder aux conteneurs via IP

**Flux technique :**
```
User -> OpenVPN Client -> OpenVPN Server -> Docker Network -> Container (Challenge Machine)
```

### Base de Données

**Tables nécessaires :**
- `machines` : Machines actives (user_id, challenge_id, container_id, ip, expires_at)
- `vpn_configs` : Configs VPN par utilisateur (user_id, config_file, client_ip)
- `submissions` : Soumissions de flags (user_id, challenge_id, flag, correct, submitted_at)
- `progress` : Progression des utilisateurs (user_id, challenge_id, completed_tasks)

## 📊 Fonctionnalités à Implémenter

### Phase 1 : Infrastructure VPN (OpenVPN)
- [ ] Installer et configurer OpenVPN server
- [ ] Créer un script de génération de configs .ovpn
- [ ] Implémenter l'API de téléchargement de config
- [ ] Implémenter l'API de régénération
- [ ] Implémenter le test de connexion

### Phase 2 : Système de Machines Docker
- [ ] Configurer le réseau Docker bridge
- [ ] Créer le service de démarrage de conteneurs
- [ ] Attribuer des IP fixes aux conteneurs
- [ ] Implémenter le timer de session
- [ ] Implémenter l'extension de temps
- [ ] Implémenter la terminaison de machines
- [ ] Auto-cleanup des machines expirées

### Phase 3 : Frontend Utilisateur
- [ ] Créer le bouton "Access Machines" dans le header
- [ ] Créer la page /access avec les deux onglets
- [ ] Afficher les détails VPN (IP, statut, serveur)
- [ ] Créer la section "Target Machine Information"
- [ ] Afficher l'IP de la machine en temps réel
- [ ] Afficher le timer avec compte à rebours
- [ ] Implémenter les boutons "Add 1 hour" et "Terminate"

### Phase 4 : Soumission de Flags
- [ ] Créer les champs de réponse pour chaque task
- [ ] Implémenter la validation de flags
- [ ] Afficher le feedback (correct/incorrect)
- [ ] Mettre à jour la progression
- [ ] Attribuer les points

### Phase 5 : Admin Panel
- [ ] Interface pour uploader des images Docker
- [ ] Configuration des challenges (nom, description, difficulté, durée)
- [ ] Configuration des flags par task
- [ ] Monitoring des machines actives
- [ ] Statistiques de la plateforme

## 🎯 Priorités

1. **VPN OpenVPN** (critique) - Sans VPN, pas d'accès aux machines
2. **Machines Docker** (critique) - Cœur de la plateforme
3. **Frontend** (important) - Interface utilisateur
4. **Flags** (important) - Validation des réponses
5. **Admin** (important) - Gestion de la plateforme

## 📝 Notes Importantes

- TryHackMe utilise **OpenVPN** (pas WireGuard)
- Les IP des machines sont dans un réseau privé (10.10.x.x)
- Les utilisateurs doivent être connectés au VPN pour accéder aux machines
- Le timer par défaut est de 1 heure
- Les machines sont automatiquement terminées après expiration
- L'interface est simple et claire (fond rouge pour les infos machines)

## 🚀 Prochaines Étapes

1. Remplacer WireGuard par OpenVPN dans le backend
2. Créer les scripts de génération de configs OpenVPN
3. Modifier le frontend pour afficher la même interface
4. Tester le système complet sur un serveur de production
