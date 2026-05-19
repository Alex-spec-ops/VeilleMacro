# Design UX pour VeilleMacro — Agent Orchestrator

## 📋 Vue d'ensemble

Ce document présente une refonte UX complète pour VeilleMacro, une plateforme d'orchestration d'agents de veille macro-économique.

---

## 🎯 Objectifs UX prioritaires

### 1. Clarté de l'information
- Hiérarchie visuelle claire des données macro-économiques
- Accès rapide aux insights critiques
- Réduction de la charge cognitive

### 2. Efficacité opérationnelle
- Workflows optimisés pour les analystes
- Actions rapides sur les alertes
- Personnalisation des tableaux de bord

### 3. Confiance et transparence
- Traçabilité des sources de données
- Visualisation de la fiabilité des agents
- Historique complet des analyses

---

## 🏗️ Architecture de l'information

```
📱 VeilleMacro
│
├── 🏠 Dashboard Principal
│   ├── Vue synthétique temps réel
│   ├── Alertes prioritaires
│   └── Indicateurs clés
│
├── 🤖 Agents
│   ├── Liste des agents actifs
│   ├── Configuration & paramétrage
│   └── Performance & monitoring
│
├── 📊 Analyses
│   ├── Rapports macro-économiques
│   ├── Tendances & prédictions
│   └── Comparatifs historiques
│
├── 🔔 Alertes & Notifications
│   ├── Flux temps réel
│   ├── Filtres intelligents
│   └── Archive
│
└── ⚙️ Paramètres
    ├── Profil utilisateur
    ├── Préférences agents
    └── Intégrations
```

---

## 🎨 Principes de design

### 1. Design System cohérent

**Palette de couleurs**
```
Primaire : #1E3A8A (Bleu marine - confiance, stabilité)
Secondaire : #10B981 (Vert - positif, croissance)
Accent : #F59E0B (Orange - alertes, attention)
Danger : #EF4444 (Rouge - risques, baisse)
Neutre : #6B7280 (Gris - textes secondaires)
Background : #F9FAFB (Gris clair)
```

**Typographie**
- Titres : Inter Bold (24-32px)
- Sous-titres : Inter SemiBold (16-20px)
- Corps : Inter Regular (14-16px)
- Data : JetBrains Mono (chiffres, codes)

**Espacements**
- Marges externes : 24px
- Marges internes : 16px
- Espacement entre cartes : 20px
- Grid : 12 colonnes avec gap de 16px

### 2. Composants clés

#### Card d'agent
```
┌─────────────────────────────────┐
│ 🤖 Agent Inflation EUR          │
│ ─────────────────────────────── │
│ Status: ● Actif                 │
│ Dernière mise à jour: Il y a 5m │
│ Fiabilité: ████████░░ 82%      │
│                                 │
│ [Voir détails] [Configurer]    │
└─────────────────────────────────┘
```

#### Alerte prioritaire
```
┌─────────────────────────────────┐
│ ⚠️ ALERTE HAUTE PRIORITÉ        │
│ ─────────────────────────────── │
│ Inflation US: +0.4% (vs +0.2% attendu) │
│ Impact: Hausse probable des taux│
│ Source: BLS • Il y a 2min       │
│                                 │
│ [Analyser] [Ignorer] [Archive]  │
└─────────────────────────────────┘
```

#### Graphique macro
```
┌─────────────────────────────────┐
│ PIB Zone Euro - Évolution T/T   │
│ ─────────────────────────────── │
│  %                              │
│ 2.5 •                           │
│ 2.0     •─•                     │
│ 1.5 •─•     •─•                 │
│ 1.0             •─•─•           │
│      Q1 Q2 Q3 Q4 Q1 Q2          │
│                                 │
│ [Exporter] [Comparer] [Détails] │
└─────────────────────────────────┘
```

---

## 📱 Pages principales

### 1. Dashboard (Page d'accueil)

**Layout**
```
┌────────────────────────────────────────────┐
│ [Logo] VeilleMacro    [🔔] [👤] [⚙️]      │
├────────────────────────────────────────────┤
│                                            │
│ Bonjour [Nom] 👋                           │
│ Vue d'ensemble - [Aujourd'hui ▾]           │
│                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Alertes  │ │ Agents   │ │ Analyses │   │
│ │   12     │ │ 8/10 ●   │ │   45     │   │
│ │ actives  │ │ actifs   │ │ ce mois  │   │
│ └──────────┘ └──────────┘ └──────────┘   │
│                                            │
│ Alertes prioritaires                       │
│ ┌────────────────────────────────────┐   │
│ │ ⚠️ [Alerte 1]                      │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ 📊 [Alerte 2]                      │   │
│ └────────────────────────────────────┘   │
│                                            │
│ Agents actifs          [Voir tout →]      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Agent1│ │Agent2│ │Agent3│ │Agent4│     │
│ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
│ Tendances macro                            │
│ [Graphique interactif]                     │
│                                            │
└────────────────────────────────────────────┘
```

**Éléments clés**
- **Header sticky** : Navigation toujours accessible
- **Métriques en un coup d'œil** : Cartes de synthèse cliquables
- **Flux d'alertes** : Mise à jour en temps réel avec badges
- **Vue agents** : Status visuel immédiat (vert/orange/rouge)
- **Graphiques interactifs** : Hover pour détails, clic pour approfondir

### 2. Page Agents

**Fonctionnalités**
- **Vue grille/liste** : Toggle pour préférences utilisateur
- **Filtres avancés** : Par statut, type, performance
- **Recherche** : Instantanée avec suggestions
- **Actions en masse** : Activer/désactiver plusieurs agents
- **Création guidée** : Wizard en 3 étapes

**Formulaire de création d'agent**
```
Étape 1/3 : Type d'agent
┌─────────────────────────────────┐
│ ○ Veille inflation              │
│ ○ Surveillance taux directeurs  │
│ ○ Analyse PIB                   │
│ ○ Monitoring devises            │
│ ● Personnalisé                  │
└─────────────────────────────────┘

Étape 2/3 : Sources & Paramètres
[Configuration détaillée]

Étape 3/3 : Alertes & Notifications
[Seuils et canaux]
```

### 3. Page Analyses

**Structure**
- **Timeline interactive** : Navigation chronologique intuitive
- **Tags intelligents** : Catégorisation automatique
- **Comparaison** : Mode côte à côte pour 2+ analyses
- **Export flexible** : PDF, Excel, API
- **Annotations collaboratives** : Commentaires et highlights

**Vue analyse détaillée**
```
┌─────────────────────────────────────────┐
│ ← Retour aux analyses                   │
│                                         │
│ Analyse inflation Zone Euro - Q4 2024   │
│ Généré par Agent Inflation EUR          │
│ 📅 15 Jan 2025 • 📊 Haute confiance     │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 📋 Synthèse exécutive                   │
│ [Texte synthétique en langage clair]   │
│                                         │
│ 📊 Données clés                         │
│ [Tableaux et visualisations]            │
│                                         │
│ 🔍 Analyse approfondie                  │
│ [Sections détaillées]                   │
│                                         │
│ 🔗 Sources                              │
│ • Source 1 (Eurostat)                   │
│ • Source 2 (BCE)                        │
│                                         │
│ [Exporter] [Partager] [Archiver]        │
└─────────────────────────────────────────┘
```

### 4. Page Alertes

**Fonctionnalités**
- **Tri intelligent** : Par priorité, date, catégorie
- **Actions rapides** : Swipe (mobile) ou hover (desktop)
- **Règles personnalisées** : Création de filtres avancés
- **Vue unifiée/séparée** : Toggle agents individuels
- **Mode focus** : Masquer alertes mineures temporairement

---

## 🔄 Flows utilisateur critiques

### Flow 1 : Configuration d'un nouvel agent

```
1. Dashboard → Clic "Nouveau agent"
2. Sélection du type (template ou custom)
3. Configuration sources de données
4. Paramétrage seuils d'alerte
5. Test de validation
6. Activation
7. Confirmation avec premier rapport
```

**Points d'attention**
- ✅ Validation en temps réel des paramètres
- ✅ Prévisualisation avant activation
- ✅ Templates prêts à l'emploi
- ✅ Documentation contextuelle

### Flow 2 : Traitement d'une alerte

```
1. Réception notification (in-app + email optionnel)
2. Vue rapide dans le dashboard
3. Clic pour détails complets
4. Consultation analyse associée
5. Actions possibles :
   - Ignorer (avec raison)
   - Approfondir (lance analyse secondaire)
   - Partager (équipe/externe)
   - Archiver
```

**Points d'attention**
- ✅ Contexte complet sans navigation excessive
- ✅ Actions en 1 clic maximum
- ✅ Traçabilité des décisions
- ✅ Undo possible dans les 30s

### Flow 3 : Analyse comparative multi-périodes

```
1. Analyses → Sélection période 1
2. Mode comparaison activé
3. Sélection période(s) additionnelle(s)
4. Vue synchronisée side-by-side
5. Highlight automatique des différences
6. Export ou sauvegarde vue personnalisée
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px (1 colonne)
- **Tablet** : 768px - 1024px (2 colonnes)
- **Desktop** : > 1024px (3-4 colonnes)

### Adaptations mobiles

**Dashboard mobile**
```
┌────────────────────┐
│ ☰  VeilleMacro  🔔│
├────────────────────┤
│ Bonjour [Nom] 👋   │
│                    │
│ [Alertes: 12]      │
│ [Agents: 8/10 ●]   │
│ [Analyses: 45]     │
│                    │
│ Alertes ▼          │
│ ┌────────────────┐ │
│ │ Alerte 1       │ │
│ │ ← Swipe actions│ │
│ └────────────────┘ │
│                    │
│ Agents ▼           │
│ [Carrousel]        │
│                    │
│ [+ Fab button]     │
└────────────────────┘
```

**Principes mobile-first**
- Bottom navigation fixe
- Floating Action Button (FAB) pour actions principales
- Swipe gestures pour actions rapides
- Modals full-screen pour formulaires
- Pull-to-refresh sur les listes

---

## ♿ Accessibilité (WCAG 2.1 AA)

### Contraste
- Texte normal : minimum 4.5:1
- Texte large : minimum 3:1
- Éléments interactifs : minimum 3:1

### Navigation clavier
- `Tab` : Navigation séquentielle
- `Enter/Space` : Activation
- `Esc` : Fermeture modals
- `Arrow keys` : Navigation dans listes/graphiques
- Skip links : "Aller au contenu principal"

### Technologies assistives
- Labels ARIA sur tous les contrôles
- Landmarks sémantiques (header, nav, main, aside)
- Live regions pour alertes temps réel
- Alt text descriptif sur graphiques
- Focus visible et logique

### États
```css
/* Focus visible */
:focus-visible {
  outline: 3px solid #3B82F6;
  outline-offset: 2px;
}

/* États interactifs */
button:hover { /* Hover state */ }
button:active { /* Active state */ }
button:disabled { /* Disabled state */ }
```

---

## 🎬 Animations & Micro-interactions

### Principes
- **Purposeful** : Chaque animation guide ou informe
- **Performant** : 60fps, GPU-accelerated
- **Respectueux** : Respect de `prefers-reduced-motion`

### Exemples

**Chargement de données**
```
Skeleton screens → Fade in content
Durée : 200-300ms
Easing : ease-out
```

**Notification d'alerte**
```
Slide in from top + subtle bounce
Durée : 400ms
Auto-dismiss : 5s (ou action utilisateur)
```

**Transition entre vues**
```
Fade + slight scale (0.95 → 1)
Durée : 250ms
Easing : cubic-bezier(0.4, 0, 0.2, 1)
```

**Hover sur cartes**
```css
.card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
```

---

## 🔐 États et feedback utilisateur

### États de chargement
- **Initial load** : Skeleton screens
- **Refresh** : Spinner discret en header
- **Actions** : Button avec loading indicator
- **Background** : Toast "Synchronisation en cours"

### Messages de succès
```
✅ Agent créé avec succès
✅ Analyse exportée
✅ Paramètres sauvegardés
```

### Messages d'erreur
```
❌ Erreur de connexion à la source
💡 Suggestion : Vérifier les credentials

❌ Échec de la création d'agent
💡 Le nom est déjà utilisé
```

### États vides (Empty states)
```
┌─────────────────────────────┐
│                             │
│         📭                  │
│                             │
│   Aucune alerte active      │
│   Tout est sous contrôle !  │
│                             │
│   [Configurer alertes]      │
│                             │
└─────────────────────────────┘
```

---

## 🧪 Tests UX recommandés

### Tests d'usabilité
1. **Task completion** : Créer un agent en < 2min
2. **Navigation** : Trouver une analyse spécifique < 30s
3. **Compréhension** : Interpréter une alerte sans formation
4. **Mobile** : Accomplir tâches critiques sur smartphone

### Métriques à suivre
- **Time on task** : Temps pour actions clés
- **Error rate** : Taux d'erreur utilisateur
- **Task success rate** : % de tâches complétées
- **SUS Score** : System Usability Scale (cible > 70)
- **NPS** : Net Promoter Score

### A/B testing suggéré
- Disposition des alertes (liste vs cards)
- Couleurs des graphiques
- Wording des CTA
- Placement des actions secondaires

---

## 🚀 Roadmap d'implémentation

### Phase 1 : Foundation (Semaines 1-3)
- [ ] Design system (couleurs, typo, composants)
- [ ] Architecture de l'information
- [ ] Wireframes basse fidélité
- [ ] Navigation principale

### Phase 2 : Core Features (Semaines 4-6)
- [ ] Dashboard redesign
- [ ] Page agents (liste + détails)
- [ ] Système d'alertes
- [ ] Responsive mobile

### Phase 3 : Advanced (Semaines 7-9)
- [ ] Analyses & comparaisons
- [ ] Graphiques interactifs
- [ ] Personnalisation dashboard
- [ ] Notifications avancées

### Phase 4 : Polish (Semaines 10-12)
- [ ] Animations & transitions
- [ ] Accessibilité WCAG AA
- [ ] Performance optimization
- [ ] Tests utilisateurs

---

## 📚 Ressources et composants

### Libraries recommandées
- **UI Framework** : Shadcn/ui (React) ou DaisyUI (Vue)
- **Charts** : Recharts ou Apache ECharts
- **Tables** : TanStack Table
- **Forms** : React Hook Form + Zod
- **Animations** : Framer Motion
- **Icons** : Lucide Icons

### Design tokens (CSS Variables)
```css
:root {
  /* Colors */
  --color-primary: #1E3A8A;
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-danger: #EF4444;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 🎯 Checklist de lancement

### Design
- [ ] Prototype haute fidélité validé
- [ ] Design system documenté
- [ ] Responsive testé (3 devices min)
- [ ] Dark mode fonctionnel (optionnel)

### Développement
- [ ] Composants réutilisables
- [ ] Code accessible (WCAG AA)
- [ ] Performance (Lighthouse > 90)
- [ ] SEO optimisé

### Contenu
- [ ] Microcopy rédigé (tous les états)
- [ ] Tooltips et aide contextuelle
- [ ] Documentation utilisateur
- [ ] Onboarding préparé

### QA
- [ ] Tests multi-navigateurs
- [ ] Tests lecteurs d'écran
- [ ] Tests avec vraies données
- [ ] Tests de charge

---

## 📞 Contact & Support

Pour toute question sur cette refonte UX :
- **Documentation** : [Lien vers documentation]
- **Feedback** : [Formulaire de retours]
- **Support** : [Contact équipe produit]

---

**Version** : 1.0  
**Dernière mise à jour** : Janvier 2025  
**Auteur** : Claude (Anthropic)

---

## Annexes

### A. Glossaire UX
- **Agent** : Module automatisé de veille sur un indicateur spécifique
- **Alerte** : Notification déclenchée par dépassement de seuil
- **Dashboard** : Vue d'ensemble personnalisable
- **Orchestrator** : Système central de gestion des agents

### B. Inspirations & Benchmarks
- Bloomberg Terminal (data density)
- Datadog (monitoring & alertes)
- Grafana (dashboards personnalisables)
- Notion (ergonomie & flexibilité)

### C. Personas utilisateurs
**Pierre - Analyste macro junior**
- Besoin : Comprendre rapidement les alertes
- Pain point : Trop d'informations, pas assez de contexte
- Solution : Dashboard simplifié, tooltips explicatifs

**Marie - Trader senior**
- Besoin : Actions ultra-rapides, données temps réel
- Pain point : Navigation trop lente
- Solution : Raccourcis clavier, alertes push prioritaires

**Thomas - Risk manager**
- Besoin : Vue d'ensemble risques, traçabilité
- Besoin : Rapports complets, exports faciles
- Solution : Analyses détaillées, exports automatiques

---

*Fin du document*
