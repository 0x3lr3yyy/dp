# Guide de Démarrage Rapide - DATAPROTECT

## ✅ Connexion Résolue !

Le panel d'administration est maintenant **connecté au backend** et **100% fonctionnel**.

## 🚀 Accès Immédiat

### Panel d'Administration
**URL :** https://3000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer

**Identifiants :**
- Username : `admin`
- Password : `admin123`

### Backend API
**URL :** https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer
**Health Check :** https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/health

## 📊 Fonctionnalités Disponibles

### Dashboard
- **6 utilisateurs** enregistrés
- **9 défis** actifs
- **6 catégories** (Web, Crypto, Reverse, Network, Forensics, OSINT)
- **0 machines actives** actuellement

### Gestion des Catégories
- Créer, modifier, supprimer des catégories
- Chaque catégorie a un nom, slug, description et icône

### Gestion des Défis
- Créer des nouveaux labs/challenges
- Modifier les défis existants
- Configurer : titre, description, catégorie, difficulté, points, flag
- Activer/désactiver des défis

### Gestion des Utilisateurs
- Voir tous les utilisateurs
- Supprimer des utilisateurs
- Voir les scores et statistiques

### Gestion des Machines
- Voir les machines actives
- Arrêter des machines
- Voir les IPs et temps restant

### Soumissions
- Historique complet des soumissions
- Voir les flags soumis (corrects/incorrects)
- Filtrer par utilisateur ou défi

## 🎯 Test de Connexion

Pour vérifier que tout fonctionne :

```bash
# Test du backend
curl https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/health

# Test de login
curl -X POST https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test des catégories
curl https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api/categories
```

## 📦 Fichiers du Backend

Le backend complet est disponible dans `/home/ubuntu/dataprotect-backend/` ou dans l'archive `dataprotect-backend.tar.gz`.

### Structure du Backend
```
dataprotect-backend/
├── src/
│   ├── config/          # Configuration DB et JWT
│   ├── models/          # Modèles de données
│   ├── controllers/     # Logique métier
│   ├── routes/          # Routes API
│   ├── middleware/      # Auth, validation, erreurs
│   └── utils/           # Utilitaires
├── database/
│   ├── schema.sql       # Schéma de la base
│   ├── seed.sql         # Données initiales
│   └── ctf.db           # Base SQLite
├── .env                 # Configuration
├── package.json
└── server.js            # Point d'entrée
```

## 🔐 Sécurité

**⚠️ IMPORTANT pour la production :**

1. **Changez le mot de passe admin** immédiatement après le premier login
2. **Changez le JWT_SECRET** dans `.env` du backend
3. **Configurez CORS** pour autoriser uniquement votre domaine
4. **Activez HTTPS** avec Let's Encrypt
5. **Limitez les accès** à la base de données

## 📚 Documentation Complète

- **Guide de déploiement :** `/home/ubuntu/DEPLOYMENT_GUIDE.md`
- **README Backend :** `/home/ubuntu/dataprotect-backend/README.md`
- **README Panel Admin :** `/home/ubuntu/dataprotect-admin/README.md`

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que le backend est démarré : `netstat -tlnp | grep 5000`
2. Consultez les logs : `cd ~/dataprotect-backend && npm start`
3. Vérifiez la configuration CORS dans `.env`
4. Testez l'API avec curl (commandes ci-dessus)

## 🎉 Prêt à Utiliser !

Le système est **100% opérationnel**. Connectez-vous au panel admin et commencez à gérer votre plateforme CTF !
