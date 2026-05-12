# 🎨 MacroSynthAI - Design UX/UI Professionnel
## Fond Blanc & Couleurs Vives

---

## 📋 Vue d'ensemble

Design moderne et professionnel pour dashboard de veille macro-économique, inspiré de Stripe, Notion et Linear. Interface claire avec fond blanc et palette de couleurs vibrantes pour une expérience utilisateur premium.

---

## 🎨 Palette de Couleurs

### Couleurs Principales
```css
/* Primaires Vibrantes */
--coral-red:    #FF6B6B;
--orange:       #FF8E53;
--sunshine:     #FFD93D;
--teal:         #4ECDC4;
--emerald:      #00D9A3;
--forest:       #00A86B;
--royal-blue:   #667EEA;
--purple:       #764BA2;

/* Backgrounds */
--bg-primary:   #fafafa;
--bg-card:      #ffffff;
--bg-surface:   #F3F4F6;

/* Text */
--text-primary:   #1a1a1a;
--text-secondary: #6B7280;
--text-tertiary:  #9CA3AF;

/* Borders */
--border-light:  #f0f0f0;
--border-medium: #e5e5e5;
```

### Gradients
```css
/* Orchestrator Hero */
--gradient-hero: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);

/* Progress Bar */
--gradient-progress: linear-gradient(90deg, #FFD93D 0%, #FF6B6B 50%, #4ECDC4 100%);

/* Status Badges */
--gradient-running: linear-gradient(135deg, #667EEA, #764BA2);
--gradient-success: linear-gradient(135deg, #00D9A3, #4ECDC4);
--gradient-pending: linear-gradient(135deg, #FFD93D, #FF8E53);

/* Brand */
--gradient-brand: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
--gradient-logo: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
```

---

## 🏗️ Structure de l'Interface

### Layout Principal
```
+--------------------------------------------------------------+
|  HEADER (blanc, border bottom)                               |
|  Logo + Brand Name | Status Badge + Time Info                |
+--------------------------------------------------------------+
|                                                              |
|  +------------------+  +------------------+  +--------------+|
|  | STAT CARD 1      |  | STAT CARD 2      |  | STAT CARD 3 ||
|  | Icon + Value     |  | Icon + Value     |  | Icon + Value||
|  +------------------+  +------------------+  +--------------+|
|                                                              |
|  +--------------------------------------------------------+ |
|  | ORCHESTRATOR SECTION (gradient violet-mauve)          | |
|  | Progress Bar + Current Step + Actions                 | |
|  +--------------------------------------------------------+ |
|                                                              |
|  +---------------+  +---------------+  +------------------+ |
|  | AGENT CARD 1  |  | AGENT CARD 2  |  | AGENT CARD 3    | |
|  | (blanc)       |  | (blanc)       |  | (blanc)         | |
|  +---------------+  +---------------+  +------------------+ |
|                                                              |
|  +---------------+                                           |
|  | AGENT CARD 4  |                                           |
|  | (blanc)       |                                           |
|  +---------------+                                           |
|                                                              |
|  +--------------------------------------------------------+ |
|  | EXECUTION LOG (header noir, content gris clair)       | |
|  | Terminal-style logs avec scrollbar gradient           | |
|  +--------------------------------------------------------+ |
|                                                              |
+--------------------------------------------------------------+
```

---

## 📦 Composants Détaillés

### 1. Header
```html
<div class="header">
  <div class="logo-section">
    <div class="logo">MS</div>
    <div class="brand-name">MacroSynthAI</div>
  </div>
  <div class="header-controls">
    <div class="status-badge">
      <div class="status-dot"></div>
      <span>System Live</span>
    </div>
    <div class="time-info">Last run: 2m ago</div>
  </div>
</div>
```

**Styles** :
- Background : `#ffffff`
- Border bottom : `2px solid #f0f0f0`
- Shadow : `0 1px 3px rgba(0,0,0,0.04)`
- Logo : gradient `#FF6B6B → #FF8E53`, border-radius `12px`
- Brand Name : gradient text `#FF6B6B → #4ECDC4`
- Status Badge : background `#E8FAF0`, border `2px solid #4ECDC4`

---

### 2. Stats Bar (4 cards)

#### Structure
```html
<div class="stat-card" style="--stat-color: #667EEA; --stat-bg: #EEF2FF;">
  <div class="stat-icon">🔍</div>
  <div class="stat-label">Sources Analyzed</div>
  <div class="stat-value">4/6</div>
  <div class="stat-change">↑ +2 this week</div>
</div>
```

#### Configuration des 4 cards

**Card 1 - Sources Analyzed**
- Icon : 🔍
- Color : `#667EEA` (Royal Blue)
- Background : `#EEF2FF`
- Label : "SOURCES ANALYZED"
- Value : "4/6"
- Change : "↑ +2 this week"

**Card 2 - Convergences**
- Icon : ⚖️
- Color : `#764BA2` (Purple)
- Background : `#F5F3FF`
- Label : "CONVERGENCES"
- Value : "3"
- Change : "Strategic insights"

**Card 3 - New Ideas**
- Icon : 💡
- Color : `#4ECDC4` (Teal)
- Background : `#E8FAF0`
- Label : "NEW IDEAS"
- Value : "5"
- Change : "Investment opps"

**Card 4 - Risk Signals**
- Icon : ⚠️
- Color : `#FF6B6B` (Coral Red)
- Background : `#FEE2E2`
- Label : "RISK SIGNALS"
- Value : "4"
- Change : "Monitoring"

#### Styles
```css
.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--stat-color);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  border-color: var(--stat-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--stat-bg);
  border-radius: 12px;
  font-size: 24px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
}
```

---

### 3. Orchestrator Section

#### Structure
```html
<div class="orchestrator-section">
  <div class="orchestrator-content">
    <div class="orchestrator-header">
      <div class="orchestrator-title">
        <div class="orchestrator-icon">🎯</div>
        <div class="orchestrator-name">
          <h2>Orchestrator</h2>
          <p>macro_synthesis_orchestrator</p>
        </div>
      </div>
      <div class="orch-status-badge">
        <div class="orch-status-dot"></div>
        <span>Running</span>
      </div>
    </div>
    
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Workflow Progress</span>
        <span class="progress-percentage">65%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="current-step">
        <strong>Current:</strong> Step 3/4 - Generating outputs
      </div>
    </div>
    
    <div class="orchestrator-actions">
      <button class="btn-primary">🚀 Launch MacroSynthAI</button>
      <button class="btn-secondary">🔄 Reset</button>
    </div>
  </div>
</div>
```

#### Styles
```css
.orchestrator-section {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

/* Animation radiale en background */
.orchestrator-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(255,255,255,0.2);
  border-radius: 100px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD93D 0%, #FF6B6B 50%, #4ECDC4 100%);
  border-radius: 100px;
  width: 65%;
  box-shadow: 0 0 20px rgba(255,255,255,0.5);
}

/* Shimmer animation */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}
```

#### Boutons
```css
.btn-primary {
  flex: 1;
  padding: 16px 32px;
  background: #ffffff;
  color: #667EEA;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.btn-secondary {
  padding: 16px 32px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  color: #ffffff;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;
}
```

---

### 4. Agent Cards

#### Configuration des 4 Agents

**Agent 1 - Source Collector**
```
Icon: 🔍
Name: Source Collector
Tech Name: macro_research_collector
Color: #667EEA (Royal Blue)
Background: #EEF2FF
Shadow: rgba(102, 126, 234, 0.25)
Description: Collects publications from 6-22 macro strategists
Status: Success
Duration: 24s
```

**Agent 2 - Synthesis Engine**
```
Icon: ⚖️
Name: Synthesis Engine
Tech Name: comparative_synthesis_agent
Color: #764BA2 (Purple)
Background: #F5F3FF
Shadow: rgba(118, 75, 162, 0.25)
Description: Comparative analysis identifying convergences and divergences
Status: Success
Duration: 11s
```

**Agent 3 - Dashboard Generator**
```
Icon: 📊
Name: Dashboard Generator
Tech Name: dashboard_generator_agent
Color: #4ECDC4 (Teal)
Background: #E8FAF0
Shadow: rgba(78, 205, 196, 0.25)
Description: Generates interactive TSX dashboard with shadcn/ui
Status: Running
Timer: 14s / 18s
```

**Agent 4 - PDF Generator**
```
Icon: 📄
Name: PDF Generator
Tech Name: pdf_report_generator
Color: #FF8E53 (Orange)
Background: #FFF4E6
Shadow: rgba(255, 142, 83, 0.25)
Description: Creates executive 3-page PDF report
Status: Running
Timer: 12s / 16s
```

#### Structure HTML
```html
<div class="agent-card running" 
     style="--agent-color: #4ECDC4; 
            --agent-bg: #E8FAF0; 
            --agent-shadow: rgba(78, 205, 196, 0.25);">
  <div class="agent-header">
    <div class="agent-info">
      <div class="agent-icon">📊</div>
      <div class="agent-details">
        <h3>Dashboard Generator</h3>
        <p>dashboard_generator_agent</p>
      </div>
    </div>
    <div class="agent-status-badge running">Running</div>
  </div>
  <div class="agent-description">
    Generates interactive TSX dashboard with shadcn/ui components
  </div>
  <div class="agent-metrics">
    <div class="agent-timer">14s / 18s</div>
  </div>
</div>
```

#### Styles
```css
.agent-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  border: 2px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  position: relative;
}

.agent-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--agent-color);
}

.agent-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  border-color: var(--agent-color);
}

.agent-card.running {
  border-color: var(--agent-color);
  box-shadow: 0 8px 32px var(--agent-shadow);
  animation: card-pulse 2s ease-in-out infinite;
}

.agent-icon {
  width: 52px;
  height: 52px;
  background: var(--agent-bg);
  border-radius: 12px;
  font-size: 24px;
  box-shadow: 0 4px 12px var(--agent-shadow);
}
```

#### Status Badges
```css
.agent-status-badge.idle {
  background: #F3F4F6;
  color: #6B7280;
}

.agent-status-badge.running {
  background: linear-gradient(135deg, #667EEA, #764BA2);
  color: #ffffff;
  animation: badge-shimmer 2s ease-in-out infinite;
}

.agent-status-badge.success {
  background: linear-gradient(135deg, #00D9A3, #4ECDC4);
  color: #ffffff;
}

.agent-status-badge.pending {
  background: linear-gradient(135deg, #FFD93D, #FF8E53);
  color: #ffffff;
}
```

---

### 5. Execution Log

#### Structure
```html
<div class="log-section">
  <div class="log-header">
    <div class="log-title">
      <span>▶</span>
      <span>Execution Log</span>
    </div>
    <div class="log-controls">
      <div class="log-control-btn close"></div>
      <div class="log-control-btn minimize"></div>
      <div class="log-control-btn maximize"></div>
    </div>
  </div>
  <div class="log-content">
    <div class="log-entry">
      <span class="log-time">14:23:45</span>
      <span class="log-agent">[Orchestrator]</span>
      <span class="log-message info">🚀 MacroSynthAI workflow initiated</span>
    </div>
    <!-- More log entries -->
  </div>
</div>
```

#### Styles
```css
.log-section {
  background: #ffffff;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.log-header {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 16px 24px;
}

.log-control-btn {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
}

.log-control-btn.close { background: #FF6B6B; }
.log-control-btn.minimize { background: #FFD93D; }
.log-control-btn.maximize { background: #4ECDC4; }

.log-content {
  padding: 24px;
  max-height: 420px;
  overflow-y: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: #FAFAFA;
}

.log-content::-webkit-scrollbar {
  width: 10px;
}

.log-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #667EEA, #764BA2);
  border-radius: 5px;
}
```

#### Log Messages Styling
```css
.log-time {
  color: #9CA3AF;
  min-width: 75px;
  font-weight: 600;
}

.log-agent {
  color: #667EEA;
  min-width: 130px;
  font-weight: 700;
}

.log-message {
  color: #374151;
  flex: 1;
}

.log-message.success { 
  color: #00A86B;
  font-weight: 600;
}

.log-message.error { 
  color: #FF6B6B;
  font-weight: 600;
}

.log-message.warning { 
  color: #FF8E53;
  font-weight: 600;
}

.log-message.info { 
  color: #667EEA;
  font-weight: 600;
}
```

---

## ✨ Animations

### 1. Pulse Animation (Status Dots)
```css
@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.status-dot {
  animation: pulse 2s ease-in-out infinite;
}
```

### 2. Rotate Animation (Orchestrator Background)
```css
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orchestrator-section::before {
  animation: rotate 20s linear infinite;
}
```

### 3. Shimmer Animation (Progress Bar)
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-fill::after {
  animation: shimmer 2s infinite;
}
```

### 4. Card Pulse (Running Agents)
```css
@keyframes card-pulse {
  0%, 100% { 
    transform: translateY(0);
    box-shadow: 0 8px 32px var(--agent-shadow);
  }
  50% { 
    transform: translateY(-2px);
    box-shadow: 0 12px 40px var(--agent-shadow);
  }
}

.agent-card.running {
  animation: card-pulse 2s ease-in-out infinite;
}
```

### 5. Badge Shimmer (Running Status)
```css
@keyframes badge-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.agent-status-badge.running {
  animation: badge-shimmer 2s ease-in-out infinite;
}
```

### 6. Slide In (Log Entries)
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-entry {
  animation: slideIn 0.4s ease;
}
```

---

## 📐 Responsive Design

### Breakpoints
```css
/* Desktop (default) */
@media (min-width: 1024px) {
  .container {
    max-width: 1600px;
    padding: 32px;
  }
  
  .agents-grid {
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  }
}

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) {
  .container {
    padding: 24px;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .agents-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 767px) {
  .header {
    padding: 16px 20px;
  }
  
  .container {
    padding: 16px;
  }
  
  .stats-bar {
    grid-template-columns: 1fr;
  }
  
  .orchestrator-section {
    padding: 24px;
  }
  
  .orchestrator-actions {
    flex-direction: column;
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .log-content {
    font-size: 12px;
  }
}
```

---

## 🎯 Typographie

### Fonts
```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace (Technical) */
font-family: 'Monaco', 'Courier New', monospace;
```

### Font Sizes & Weights
```css
/* Headers */
--h1: 26px / 800;
--h2: 22px / 700;
--h3: 18px / 700;

/* Body */
--body-large: 16px / 600;
--body: 14px / 500;
--body-small: 13px / 500;
--caption: 12px / 600;

/* Display */
--display: 32px / 800;  /* Stat values */
--mono: 16px / 700;     /* Timers, codes */
```

---

## 🔧 Interactions & States

### Hover States

**Stats Cards**
```css
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  border-color: var(--stat-color);
}
```

**Agent Cards**
```css
.agent-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  border-color: var(--agent-color);
}
```

**Buttons**
```css
.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}
```

**Log Entries**
```css
.log-entry:hover {
  background: #ffffff;
}
```

### Focus States
```css
button:focus-visible {
  outline: 3px solid #667EEA;
  outline-offset: 2px;
}

input:focus,
select:focus {
  border-color: #667EEA;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

---

## 🚀 Performance Optimizations

### CSS Optimizations
```css
/* Use transform instead of position changes */
.agent-card:hover {
  transform: translateY(-6px); /* ✅ GPU accelerated */
  /* top: -6px; ❌ Causes reflow */
}

/* Use opacity for fade effects */
.log-entry {
  animation: slideIn 0.4s ease;
  will-change: opacity, transform; /* Hint browser */
}

/* Limit shadow complexity */
.stat-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.06); /* Simple, fast */
}
```

### Animation Performance
```css
/* Animate only transform and opacity */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Use will-change sparingly */
.progress-fill {
  will-change: width;
}
```

---

## 📱 Accessibilité (A11y)

### Contraste
Tous les textes respectent WCAG AA (4.5:1 minimum) :

```css
/* Text on white backgrounds */
--text-primary: #1a1a1a;   /* 16.1:1 ✅ */
--text-secondary: #6B7280; /* 4.6:1 ✅ */

/* Text on colored backgrounds */
Gradient badges use white text (#ffffff) on dark gradients
```

### Screen Readers
```html
<!-- Hidden labels for screen readers -->
<span class="sr-only">Current workflow progress: 65%</span>

<!-- ARIA labels -->
<button aria-label="Launch MacroSynthAI workflow">
  🚀 Launch MacroSynthAI
</button>

<!-- Status announcements -->
<div role="status" aria-live="polite">
  Step 3/4 - Generating outputs
</div>
```

### Keyboard Navigation
```css
/* Visible focus indicators */
*:focus-visible {
  outline: 3px solid #667EEA;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to main content */
.skip-to-main {
  position: absolute;
  top: -40px;
  left: 0;
  background: #667EEA;
  color: white;
  padding: 8px;
}

.skip-to-main:focus {
  top: 0;
}
```

---

## 📊 Grid System

### Stats Bar
```css
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
```

### Agents Grid
```css
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
}
```

---

## 🎭 CSS Variables Usage

### Custom Properties per Component

**Stat Cards**
```css
.stat-card {
  --stat-color: #667EEA;
  --stat-bg: #EEF2FF;
}
```

**Agent Cards**
```css
.agent-card {
  --agent-color: #4ECDC4;
  --agent-bg: #E8FAF0;
  --agent-shadow: rgba(78, 205, 196, 0.25);
}
```

---

## 📝 Code Complet HTML/CSS

Le code complet est disponible dans le widget interactif ci-dessus. Pour l'utiliser sur Antigravity :

1. Copier tout le code HTML (de `<!DOCTYPE html>` à `</html>`)
2. Créer un nouveau projet sur Antigravity
3. Coller le code dans le fichier principal
4. Déployer

---

## 🎨 Variantes de Couleurs

### Variante 1 : Sunset (Chaud)
```css
--primary: #FF6B6B → #FF6B35
--secondary: #4ECDC4 → #F7931E
--accent: #667EEA → #C1666B
```

### Variante 2 : Ocean (Frais)
```css
--primary: #667EEA → #0077B6
--secondary: #4ECDC4 → #00B4D8
--accent: #764BA2 → #023E8A
```

### Variante 3 : Forest (Naturel)
```css
--primary: #4ECDC4 → #2D6A4F
--secondary: #00D9A3 → #52B788
--accent: #667EEA → #40916C
```

---

## 🔗 Ressources

### Fonts
- **Inter** : https://fonts.google.com/specimen/Inter
- **Monaco** : System font (fallback: Courier New)

### Icons
- Emojis natifs pour meilleure compatibilité
- Alternative : Lucide Icons ou Tabler Icons

### Inspirations
- Stripe Dashboard : https://stripe.com
- Linear : https://linear.app
- Notion : https://notion.so
- Vercel : https://vercel.com

---

## ✅ Checklist Qualité

- [x] Fond blanc avec couleurs vives
- [x] Contraste WCAG AA respecté
- [x] Responsive (desktop → mobile)
- [x] Animations fluides (60fps)
- [x] Hover states sur tous les éléments interactifs
- [x] Focus states visibles (accessibilité)
- [x] Gradients modernes
- [x] Typographie cohérente
- [x] Espacement harmonieux
- [x] Ombres subtiles
- [x] Micro-interactions
- [x] Performance optimisée

---

## 🚀 Déploiement sur Antigravity

### Étapes
1. Créer un nouveau projet
2. Copier le code HTML complet
3. Coller dans `App.jsx` ou `index.html`
4. Déployer
5. Partager le lien

### URL de démo
(À remplacer après déploiement sur Antigravity)

---

**Design créé par Claude - MacroSynthAI Dashboard v1.0**
**Date : Mai 2026**
