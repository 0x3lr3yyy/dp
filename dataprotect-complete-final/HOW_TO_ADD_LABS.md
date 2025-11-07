# Guide Complet : Comment Ajouter un Lab et le Voir sur le Frontend

## 📋 Vue d'Ensemble

Votre plateforme DATAPROTECT est **entièrement synchronisée**. Quand vous ajoutez un lab dans le panel admin, il apparaît **automatiquement** sur le frontend utilisateur sans aucune action supplémentaire.

## 🔄 Flux de Synchronisation

```
Admin Panel → Backend API → Frontend Utilisateur
     ↓              ↓              ↓
  Ajouter Lab   Sauvegarder    Charger depuis API
  + Config      dans DB        Afficher en temps réel
```

## 📝 Étape par Étape : Ajouter un Nouveau Lab

### Étape 1 : Accéder au Panel Admin

1. Ouvrez : `https://3000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/`
2. Connectez-vous avec :
   - **Username** : `admin`
   - **Password** : `admin123`

### Étape 2 : Naviguer vers Challenges

1. Dans la sidebar, cliquez sur **"Challenges"**
2. Vous verrez la liste de tous les challenges existants (actuellement 9)

### Étape 3 : Créer un Nouveau Challenge

1. Cliquez sur le bouton **"Add Challenge"** (en haut à droite)
2. Remplissez le formulaire :

**Informations de Base :**
- **Title** : Nom du lab (ex: "SQL Injection Advanced")
- **Description** : Description détaillée du challenge
- **Category** : Sélectionnez une catégorie (Web, Crypto, Reverse, Network, Forensics, OSINT)
- **Difficulty** : Easy, Medium, ou Hard
- **Points** : Nombre de points (ex: 100, 200, 500)
- **Flag** : Le flag à trouver (ex: `FLAG{sql_1nj3ct10n_m4st3r}`)

3. Cliquez sur **"Create Challenge"**

✅ **Le challenge est maintenant créé dans la base de données !**

### Étape 4 : Configurer Docker (Optionnel mais Recommandé)

Si votre lab nécessite une machine Docker :

1. Restez sur la page Challenges
2. Trouvez votre nouveau challenge dans la liste
3. Cliquez sur **"Configure Docker"** ou allez dans **"Docker"** dans la sidebar
4. Sélectionnez votre challenge
5. Configurez :

**Configuration Docker :**
- **Docker Image** : Nom de l'image (ex: `vulnerables/web-dvwa:latest`)
- **Exposed Ports** : Ports à exposer (ex: `80, 3306`)
- **Environment Variables** : Variables d'environnement (format: `KEY=value`)
  ```
  MYSQL_ROOT_PASSWORD=password
  MYSQL_DATABASE=dvwa
  ```
- **Memory Limit** : Limite RAM en MB (ex: `512`)
- **CPU Shares** : Limite CPU (ex: `512`)
- **Timeout** : Durée de session en secondes (ex: `3600` = 1 heure)

6. Cliquez sur **"Save Configuration"**

✅ **Le challenge est maintenant prêt avec Docker !**

### Étape 5 : Vérifier sur le Frontend Utilisateur

1. Ouvrez le frontend : `https://8080-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/`
2. **Faites défiler** jusqu'à la section "Challenge Categories"
3. Cliquez sur la **catégorie** que vous avez sélectionnée (ex: Web Exploitation)
4. **Votre nouveau lab apparaît dans la liste !**

## 🎯 Exemple Complet : Ajouter un Lab Web

### Exemple : Lab "SQL Injection Basics"

**Dans l'Admin Panel :**

```
Title: SQL Injection Basics
Description: Learn to exploit SQL injection vulnerabilities in a vulnerable login form. Find the admin password!
Category: Web
Difficulty: Easy
Points: 150
Flag: FLAG{sql_1s_fun_r1ght?}
```

**Configuration Docker :**

```
Docker Image: vulnerables/web-dvwa:latest
Exposed Ports: 80
Environment Variables:
  MYSQL_ROOT_PASSWORD=toor
  MYSQL_DATABASE=dvwa
Memory Limit: 512 MB
CPU Shares: 512
Timeout: 3600 seconds
```

**Résultat sur le Frontend :**

1. Le lab apparaît dans **"Web Exploitation"**
2. Les utilisateurs voient :
   - Titre : "SQL Injection Basics"
   - Difficulté : Badge "EASY"
   - Points : "150 points"
3. Bouton **"Start Machine"** disponible
4. Quand ils cliquent :
   - Docker démarre le conteneur
   - IP et ports s'affichent
   - Timer de 1 heure commence
5. Ils peuvent soumettre le flag
6. Si correct → +150 points + leaderboard mis à jour

## 🔍 Vérification de la Synchronisation

### Test Rapide

1. **Admin Panel** : Ajoutez un challenge nommé "Test Challenge"
2. **Frontend** : Rafraîchissez la page (F5)
3. **Résultat** : Le challenge apparaît immédiatement dans la catégorie correspondante

### API Endpoints Utilisés

Le frontend charge les données via ces endpoints :

```javascript
// Charger toutes les catégories
GET /api/categories

// Charger tous les challenges
GET /api/challenges

// Charger les challenges d'une catégorie
GET /api/challenges?category=web

// Charger un challenge spécifique
GET /api/challenges/:id
```

## 📊 Flux de Données Détaillé

### 1. Admin Ajoute un Challenge

```
Admin Panel (React)
    ↓
POST /api/challenges
    ↓
Backend (Express)
    ↓
Database (SQLite)
    ↓
Challenge créé avec ID
```

### 2. Frontend Charge les Challenges

```
User Frontend (HTML/JS)
    ↓
GET /api/challenges
    ↓
Backend (Express)
    ↓
Database (SQLite)
    ↓
Retourne tous les challenges (JSON)
    ↓
Frontend affiche dynamiquement
```

### 3. User Démarre une Machine

```
User clique "Start Machine"
    ↓
POST /api/machines/start/:challengeId
    ↓
Backend vérifie Docker config
    ↓
Docker démarre le conteneur
    ↓
Retourne IP + Ports + Timer
    ↓
Frontend affiche les infos
```

### 4. User Soumet un Flag

```
User entre le flag
    ↓
POST /api/submissions/submit
    ↓
Backend vérifie le flag
    ↓
Si correct → Update points
    ↓
Retourne résultat + points
    ↓
Frontend affiche succès/échec
```

## 🎨 Personnalisation de l'Affichage

### Badges de Difficulté

Les badges sont automatiquement colorés selon la difficulté :

- **Easy** → Badge rose
- **Medium** → Badge orange
- **Hard** → Badge rouge

### Icônes de Catégories

Chaque catégorie a une icône automatique :

- **Web** → 🌐 Globe
- **Crypto** → 🔒 Cadenas
- **Reverse** → 💻 Code
- **Network** → 🌐 Réseau
- **Forensics** → 🔍 Loupe
- **OSINT** → 👁️ Œil

## 🐛 Troubleshooting

### Le challenge n'apparaît pas sur le frontend

**Solutions :**

1. **Rafraîchir la page** (F5)
2. **Vider le cache** (Ctrl+Shift+R)
3. **Vérifier la console** :
   - Ouvrir DevTools (F12)
   - Onglet Console
   - Chercher des erreurs
4. **Vérifier l'API** :
   - Ouvrir : `https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api/challenges`
   - Votre challenge doit être dans la liste JSON

### Le bouton "Start Machine" ne fonctionne pas

**Causes possibles :**

1. **Pas de configuration Docker** → Allez dans Docker section et configurez
2. **Image Docker invalide** → Vérifiez le nom de l'image
3. **Docker non installé** → Sur le serveur de production, installez Docker
4. **User non connecté** → L'utilisateur doit être logged in

### Les points ne s'ajoutent pas

**Vérifications :**

1. **Flag correct** → Vérifiez l'orthographe exacte
2. **Challenge déjà résolu** → Un user ne peut résoudre qu'une fois
3. **User connecté** → Nécessite authentification

## 📈 Statistiques en Temps Réel

### Dashboard Admin

Le dashboard montre automatiquement :

- **Total Users** : Nombre d'utilisateurs inscrits
- **Total Challenges** : Nombre de challenges (mis à jour quand vous ajoutez)
- **Categories** : Nombre de catégories
- **Active Machines** : Machines Docker en cours d'exécution

### Leaderboard

Le leaderboard se met à jour automatiquement quand :

- Un user soumet un flag correct
- Les points sont ajoutés
- Le classement est recalculé

## 🚀 Workflow de Production

### Pour Ajouter 10 Labs Rapidement

1. **Préparez vos images Docker** :
   ```bash
   docker pull vulnerables/web-dvwa
   docker pull webgoat/webgoat
   docker pull bkimminich/juice-shop
   ```

2. **Dans l'Admin Panel** :
   - Allez dans Challenges
   - Cliquez "Add Challenge" 10 fois
   - Remplissez les formulaires
   - Configurez Docker pour chacun

3. **Vérification** :
   - Frontend → Catégories → Tous les labs sont là !

### Script d'Import (Future Enhancement)

Pour importer en masse, vous pourrez utiliser l'API directement :

```bash
curl -X POST https://api.yourdomain.com/api/challenges \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SQL Injection Advanced",
    "description": "Advanced SQL injection techniques",
    "category": "Web",
    "difficulty": "Hard",
    "points": 500,
    "flag": "FLAG{adv4nc3d_sql}"
  }'
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs du backend** :
   ```bash
   # Dans le terminal où le backend tourne
   # Vous verrez les requêtes API en temps réel
   ```

2. **Vérifiez la console du frontend** :
   - F12 → Console
   - Cherchez les erreurs en rouge

3. **Testez l'API directement** :
   ```bash
   curl https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api/challenges
   ```

## ✅ Checklist : Ajouter un Lab Complet

- [ ] Connecté au panel admin
- [ ] Challenge créé avec toutes les infos
- [ ] Docker configuré (si nécessaire)
- [ ] Image Docker disponible
- [ ] Vérifié sur le frontend
- [ ] Testé le bouton "Start Machine"
- [ ] Testé la soumission de flag
- [ ] Vérifié les points ajoutés
- [ ] Vérifié le leaderboard mis à jour

---

**Résumé** : Votre plateforme est **100% synchronisée**. Ajoutez un lab dans l'admin → Il apparaît instantanément sur le frontend. C'est aussi simple que ça ! 🎉
