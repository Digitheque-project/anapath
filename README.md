# 🧬 Anapath System

> *Système d'Information Hospitalier pour la gestion des examens d'Anatomie Pathologique*

[![Made with NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Made with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Deploy](https://img.shields.io/badge/Render-Ready-purple)](https://render.com/)

---

## 📖 Vue d'ensemble

**Anapath System** est une application web complète dédiée au service d'anatomie pathologique d'un établissement hospitalier.

Elle orchestre l'intégralité du cycle de vie des demandes d'examens :
- De la **création** de la requête par un médecin prescripteur
- Jusqu'à l'**archivage** final du rapport signé

L'application intègre un suivi de statuts en temps réel, la saisie sécurisée des résultats microscopiques/macroscopiques, une validation numérique par le pathologiste, ainsi qu'un système de notifications inter-services pour fluidifier les échanges.

---

## ✨ Fonctionnalités clés

- **Gestion des demandes** : Création, modification et suivi des examens
- **Workflow de validation** : Signature électronique intégrée pour les pathologistes
- **Traçabilité complète** : Historique des statuts et des actions utilisateurs
- **Notifications** : Alertes automatiques entre les services prescripteurs et le laboratoire
- **Interface responsive** : Accès via poste fixe, tablette ou mobile
- **Export de rapports** : Génération de documents au format PDF pour les dossiers patients

---

## 🛠️ Architecture technique

| Couche | Technologie | Version |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) | 15 / 19 |
| **Backend** | NestJS + TypeORM | 10 |
| **Base de données** | PostgreSQL | 16 |
| **Hébergement** | Render (PaaS) | - |

---

## 📁 Structure du projet

```text
anapath/
├── back_anapath/              # API REST (NestJS)
│   ├── src/                   # Code source (modules, contrôleurs, services)
│   ├── test/                  # Tests unitaires et e2e
│   └── .env.example           # Exemple des variables d'environnement
│
├── front_anapath/             # Interface utilisateur (Next.js)
│   ├── app/                   # App Router (pages et API routes)
│   ├── components/            # Composants React réutilisables
│   └── public/                # Assets statiques (images, icônes)
│
└── render.yaml                # Configuration du déploiement automatisé


## 🚀 Démarrage rapide
```bash
# Backend
cd back_anapath
npm install
npm run start:dev

# Frontend
cd front_anapath
npm install
npm run dev

📚 Documentation
Swagger : https://anapath-backend-ar7u.onrender.com/api/docs
Frontend : http://localhost:3031

📄 License
MIT
EOF