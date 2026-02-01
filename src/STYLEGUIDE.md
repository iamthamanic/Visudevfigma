# VisuDEV - Kompletter Styleguide

## 🎨 Farbpalette

### Primärfarben

- **Primary (Türkis/Grün)**: `#03ffa3`
  - Hover: `#02e591`
  - Active: `#02cc80`
  - Light: `#33ffb8`
  - Lighter: `#99ffd9`

### UI Hintergrundfarben

- **Background**: `#000000` (Schwarz)
- **Surface**: `#0a0a0a` (Fast-Schwarz)
- **Card Background**: `#111111`
- **Sidebar Background**: `#000000`
- **Hover State**: `#1a1a1a`

### Textfarben

- **Primary Text**: `#ffffff`
- **Secondary Text**: `#a0a0a0`
- **Muted Text**: `#666666`
- **Disabled Text**: `#404040`

### Border/Divider

- **Border**: `#222222`
- **Border Hover**: `#333333`
- **Divider**: `#1a1a1a`

### Flow-Knoten Farbkodierung

- **UI Layer**: `#03ffa3` (Primary Türkis)
- **Code Layer**: `#00d4ff` (Cyan)
- **API Layer**: `#ff9500` (Orange)
- **Database/SQL**: `#af52de` (Lila)
- **RLS Policy**: `#ff375f` (Rot)
- **ERP System**: `#ffcc00` (Gold)
- **Success State**: `#34c759` (Grün)
- **Warning State**: `#ff9500` (Orange)
- **Error State**: `#ff3b30` (Rot)

---

## 📝 Typografie

### Font Family

- **Primary**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Monospace**: `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`

### Font Sizes

- **Heading 1**: `32px` / `2rem` - Line Height: `1.2`
- **Heading 2**: `24px` / `1.5rem` - Line Height: `1.3`
- **Heading 3**: `20px` / `1.25rem` - Line Height: `1.4`
- **Heading 4**: `18px` / `1.125rem` - Line Height: `1.4`
- **Body Large**: `16px` / `1rem` - Line Height: `1.5`
- **Body**: `14px` / `0.875rem` - Line Height: `1.5`
- **Body Small**: `12px` / `0.75rem` - Line Height: `1.5`
- **Caption**: `11px` / `0.6875rem` - Line Height: `1.4`

### Font Weights

- **Regular**: `400`
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`

---

## 📐 Spacing System

Basierend auf 4px Grid:

- **xs**: `4px`
- **sm**: `8px`
- **md**: `16px`
- **lg**: `24px`
- **xl**: `32px`
- **2xl**: `48px`
- **3xl**: `64px`

---

## 🔲 Layout

### Sidebar Navigation

- **Width**: `240px`
- **Background**: `#000000`
- **Border Right**: `1px solid #222222`
- **Padding**: `24px 16px`
- **Position**: Fixed Left

### Main Content Area

- **Margin Left**: `240px` (Sidebar Width)
- **Padding**: `32px 48px`
- **Max Width**: `1600px`
- **Background**: `#0a0a0a`

### Grid System

- **Container Max Width**: `1600px`
- **Gutter**: `24px`
- **Columns**: 12

---

## 🎴 Komponenten

### Cards

```
Background: #111111
Border: 1px solid #222222
Border Radius: 8px
Padding: 24px
Box Shadow: none

Hover State:
Border: 1px solid #333333
Transform: translateY(-2px)
Transition: all 0.2s ease
```

### Buttons

**Primary Button**

```
Background: #03ffa3
Color: #000000
Padding: 12px 24px
Border Radius: 6px
Font Weight: 600
Font Size: 14px

Hover: Background #02e591
Active: Background #02cc80
Disabled: Background #1a1a1a, Color #404040
```

**Secondary Button**

```
Background: transparent
Border: 1px solid #03ffa3
Color: #03ffa3
Padding: 12px 24px
Border Radius: 6px

Hover: Background #03ffa3, Color #000000
```

**Ghost Button**

```
Background: transparent
Color: #a0a0a0
Padding: 12px 24px

Hover: Background #1a1a1a, Color #ffffff
```

### Input Fields

```
Background: #0a0a0a
Border: 1px solid #222222
Border Radius: 6px
Padding: 10px 16px
Color: #ffffff
Font Size: 14px

Focus:
Border: 1px solid #03ffa3
Outline: none
Box Shadow: 0 0 0 3px rgba(3, 255, 163, 0.1)

Placeholder: #666666
```

### Navigation Items

```
Padding: 12px 16px
Border Radius: 6px
Color: #a0a0a0
Font Size: 14px
Font Weight: 500

Hover:
Background: #1a1a1a
Color: #ffffff

Active:
Background: #1a1a1a
Color: #03ffa3
Border Left: 3px solid #03ffa3
```

### Badges/Tags

```
Background: rgba(3, 255, 163, 0.1)
Color: #03ffa3
Padding: 4px 12px
Border Radius: 12px
Font Size: 12px
Font Weight: 600
```

### Code Blocks

```
Background: #0a0a0a
Border: 1px solid #222222
Border Radius: 6px
Padding: 16px
Font Family: 'JetBrains Mono', monospace
Font Size: 13px
Line Height: 1.6
Color: #ffffff
```

---

## 🌊 Flow Visualisierung

### Flow Knoten

```
Width: 160px (min)
Height: 80px (min)
Border Radius: 8px
Padding: 16px
Border: 2px solid [Layer Color]
Background: rgba([Layer Color], 0.05)
Box Shadow: 0 4px 12px rgba([Layer Color], 0.15)

Hover:
Transform: scale(1.05)
Box Shadow: 0 6px 20px rgba([Layer Color], 0.25)
Transition: all 0.2s ease
```

### Flow Verbindungen

```
Stroke Width: 2px
Stroke Color: #333333
Stroke Dash Array: none

Active Path:
Stroke Width: 3px
Stroke Color: #03ffa3
Animation: dash 1s linear infinite
```

### Knoten Label

```
Font Size: 12px
Font Weight: 600
Color: #ffffff
Margin Bottom: 4px
```

### Knoten Description

```
Font Size: 11px
Color: #a0a0a0
Line Height: 1.4
```

---

## 💫 Shadows & Elevation

- **Level 0**: `none`
- **Level 1**: `0 2px 4px rgba(0, 0, 0, 0.4)`
- **Level 2**: `0 4px 12px rgba(0, 0, 0, 0.5)`
- **Level 3**: `0 8px 24px rgba(0, 0, 0, 0.6)`
- **Level 4**: `0 16px 48px rgba(0, 0, 0, 0.7)`

**Glow Effect** (für Primary Color):

```
box-shadow: 0 0 20px rgba(3, 255, 163, 0.3)
```

---

## 🔄 Transitions & Animations

### Standard Transition

```
transition: all 0.2s ease
```

### Easing Functions

- **Default**: `cubic-bezier(0.4, 0.0, 0.2, 1)`
- **Enter**: `cubic-bezier(0.0, 0.0, 0.2, 1)`
- **Exit**: `cubic-bezier(0.4, 0.0, 1, 1)`
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

### Loading Spinner

```
Animation: spin 1s linear infinite
Border: 2px solid #1a1a1a
Border Top Color: #03ffa3
Border Radius: 50%
Size: 20px
```

---

## 📊 Data Visualization

### Progress Bars

```
Background: #1a1a1a
Height: 8px
Border Radius: 4px

Fill:
Background: linear-gradient(90deg, #03ffa3 0%, #02e591 100%)
Border Radius: 4px
```

### Charts

- **Stroke Color**: `#03ffa3`
- **Grid Lines**: `#222222`
- **Axis Labels**: `#666666`
- **Data Points**: `#03ffa3`
- **Tooltip Background**: `#111111`
- **Tooltip Border**: `#03ffa3`

---

## 🎯 States & Feedback

### Success State

```
Background: rgba(52, 199, 89, 0.1)
Border: 1px solid #34c759
Color: #34c759
Icon: CheckCircle
```

### Warning State

```
Background: rgba(255, 149, 0, 0.1)
Border: 1px solid #ff9500
Color: #ff9500
Icon: AlertTriangle
```

### Error State

```
Background: rgba(255, 59, 48, 0.1)
Border: 1px solid #ff3b30
Color: #ff3b30
Icon: XCircle
```

### Info State

```
Background: rgba(0, 212, 255, 0.1)
Border: 1px solid #00d4ff
Color: #00d4ff
Icon: Info
```

---

## 📱 Responsive Breakpoints

- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `1024px - 1440px`
- **Large Desktop**: `> 1440px`

**Note**: VisuDEV ist primär für Desktop optimiert (1440px+)

---

## ♿ Accessibility

- **Minimum Click Target**: `44px × 44px`
- **Contrast Ratio Text**: Mindestens `4.5:1`
- **Contrast Ratio UI**: Mindestens `3:1`
- **Focus Indicator**: `2px solid #03ffa3`, `offset: 2px`

---

## 🚫 Don'ts

- ❌ Keine Mock-Daten in Cards
- ❌ Keine bunten Verläufe außerhalb der Flow-Knoten
- ❌ Keine runden Buttons (nur Border Radius 6-8px)
- ❌ Keine 3D-Effekte oder Skeuomorphismus
- ❌ Keine unnötigen Animationen
- ❌ Keine hellen Hintergründe
- ❌ Keine Icon-Überlastung

---

## ✅ Do's

- ✅ Cleanes, minimalistisches Design
- ✅ Fokus auf Funktionalität
- ✅ Klare Hierarchien
- ✅ Konsistente Abstände (4px Grid)
- ✅ Farbkodierung für schnelle Orientierung
- ✅ Developer-freundliche Monospace Fonts für Code
- ✅ Screen-zentrierte Navigation
- ✅ Schnelle Ladezeiten durch minimale Grafiken

---

**Version**: 1.0  
**Last Updated**: Dezember 2024  
**Platform**: VisuDEV - Professional Developer Flow Visualization
