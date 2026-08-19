# APEX PDF Report Design System

## Light Theme - PDF Export

---

## 1. Design Philosophy

> *"The PDF report should feel like a professional debrief document - clean, readable, and print-friendly, while maintaining APEX's racing identity."*

### 1.1 Core Principles

| Principle | Application |
|-----------|-------------|
| **Print-First** | Optimized for black & white or color printing |
| **High Contrast** | Dark text on light background for readability |
| **Professional** | Clean layout, generous whitespace |
| **Racing DNA** | Subtle motorsport accents (red, carbon textures) |
| **Telemetry-Focused** | Graphs and charts take priority |
| **Beginner-Friendly** | Clear hierarchy, simple language |

---

## 2. Color System (Light Theme)

### 2.1 Base Palette

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `pdf-bg` | `#FFFFFF` | Page background - pure white |
| `pdf-surface` | `#F8F9FA` | Card backgrounds, section blocks |
| `pdf-surfaceAlt` | `#F1F3F5` | Alternating rows, table zebra stripes |
| `pdf-border` | `#DEE2E6` | Dividers, borders, grid lines |
| `pdf-textPrimary` | `#1A1A2E` | Main body text - near black |
| `pdf-textSecondary` | `#4A4A5A` | Labels, units, subtitles |
| `pdf-textMuted` | `#868E96` | Helper text, small print |
| `pdf-accent` | `#E10600` | APEX Red - headings, CTAs |
| `pdf-accentLight` | `#FFF0EE` | Red tinted backgrounds |

### 2.2 Telemetry Channel Colors (PDF Optimized)

| Metric | Hex Code | Purpose |
| :--- | :--- | :--- |
| Speed | `#0077BE` | Rich Blue |
| Throttle | `#00A86B` | Emerald Green |
| Brake | `#C8102E` | Crimson Red |
| Steering | `#F58025` | Orange Amber |
| Lateral G | `#9B30FF` | Purple |
| Longitudinal G | `#005EB8` | Navy Blue |
| Your Lap | `#1A1A2E` | Dark - Your Data |
| Target Lap | `#E10600` | APEX Red - Target |

---

## 3. Typography System

### 3.1 Font Hierarchy

| Level | Font | Size | Weight | Case | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 - Title** | Michroma | 24pt | 700 | UPPER | Cover page |
| **H2 - Section** | Barlow Condensed | 18pt | 700 | UPPER | Section headers |
| **H3 - Subsection** | Barlow Condensed | 14pt | 600 | UPPER | Subsection titles |
| **H4 - Cards** | Inter | 12pt | 600 | Title | Card headers |
| **Body** | Inter | 11pt | 400 | Sentence | Main text |
| **Body (Alt)** | Barlow | 11pt | 400 | Sentence | Telemetry explanations |
| **Small** | Inter | 9pt | 400 | Sentence | Footnotes, units |
| **Monospace** | JetBrains Mono | 11pt | 400 | Tabular | Lap times, deltas |
| **Metric** | Orbitron | 16pt | 600 | UPPER | Speed, G-force numbers |

### 3.2 Numeric Rules

- **All lap times, speeds, and deltas** MUST use `tabular-nums` (monospace width)
- **Numbers must align perfectly** in tables (decimal points aligned)
- **Use `JetBrains Mono`** for all timing and delta values

---

## 4. Page Structure & Layout

### 4.1 Page Margins

| Margin | Size |
| :--- | :--- |
| Top | 25mm |
| Bottom | 25mm |
| Left | 20mm |
| Right | 20mm |

### 4.2 Grid System

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header (Brand Bar - 8mm height)                                    │
├──────────────────────────────────────────────────────────────────────┤
│  │  Content Area - Full Width (160mm)                            │  │
│  │                                                               │  │
│  │  ┌───────────────────────────────────────────────────────────┐ │  │
│  │  │  Card / Section                                          │ │  │
│  │  └───────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  ┌──────────────────────┐ ┌──────────────────────────────────┐ │  │
│  │  │  Card - Left          │ │  Card - Right                    │ │  │
│  │  └──────────────────────┘ └──────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  ┌───────────────────────────────────────────────────────────┐ │  │
│  │  │  Full Width Graph / Chart                               │ │  │
│  │  └───────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
├──────────────────────────────────────────────────────────────────────┤
│  Footer (Page X of Y)                                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Styles

### 5.1 Cover Page

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  [APEX Logo - Large]                                                │
│  RACING ACADEMY                                                     │
│                                                                      │
│                          COACHING REPORT                            │
│                                                                      │
│                          [Track Name]                               │
│                          [Date]                                     │
│                          [Car Name]                                 │
│                                                                      │
│                          Grade: B                                   │
│                                                                      │
│                          "Great line! Let's work on braking."       │
│                                                                      │
│  ──────────────────────────────────────────────────────────────────  │
│  APEX v2.5  ·  UDP Telemetry Analysis  ·  10 Laps Analyzed          │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Centered alignment
- White background with subtle red accent border (4pt at top)
- Grade displayed as large 48pt text with circular background
- Quote in Italic with smaller font

### 5.2 Section Headers

```
┌──────────────────────────────────────────────────────────────────────┐
│  1  WHAT YOU DID WELL                                               │
│  ──────────────────────────────────────────────────────────────────  │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Section number: Red, 14pt, bold
- Section title: Barlow Condensed, 18pt, UPPERCASE, bold
- Underline: 2pt red line, 40mm width
- Padding: 4mm above, 2mm below

### 5.3 Cards

**Card Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  │  Card Title                                │  Icon              │
│  ├──────────────────────────────────────────────────────────────────┤
│  │  Content Area                                                    │
│  │                                                               │
│  │  - Key point 1                                                │
│  │  - Key point 2                                                │
│  │                                                               │
│  │  [Optional: Telemetry Insight Box]                            │
│  └──────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Background: `#F8F9FA`
- Border: `#DEE2E6`, 1pt, rounded 4px
- Padding: 12pt (top, bottom), 16pt (left, right)
- Title: Inter, 12pt, bold, red text
- Shadow: light (for digital viewing only)

### 5.4 Telemetry Insight Box

```
┌──────────────────────────────────────────────────────────────────────┐
│  📊  TELEMETRY INSIGHT                                              │
│  ──────────────────────────────────────────────────────────────────  │
│  "Your brake trace (blue) starts 50ft before target (green). That's │
│   why you're losing 0.25s at Turn 1."                              │
│                                                                      │
│  [Mini Graph / Sparkline]                                           │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Background: `#FFF0EE` (red tint)
- Border left: 4pt solid `#E10600`
- Padding: 10pt
- Icon: Emoji or simple icon

### 5.5 Data Tables

```
┌──────────────────────────────────────────────────────────────────────┐
│  Corner  │ Your Speed │ Target │ Delta  │ Grade  │ Fix              │
│──────────┼────────────┼────────┼────────┼────────┼─────────────────│
│  T1      │ 52 mph     │ 58 mph │ -6 mph │   C   │ Brake later      │
│  T2      │ 47 mph     │ 49 mph │ -2 mph │   B   │ Smooth throttle  │
│  T3      │ 63 mph     │ 62 mph │ +1 mph │   A   │ Keep doing this  │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Header: Barlow Condensed, 10pt, UPPERCASE, bold, `#E10600`
- Body: Inter, 10pt, regular
- Column widths: Proportionate to content
- Zebra stripes: `#F1F3F5` (alternating rows)
- Grade column: circular badge with color coding

**Grade Badge Colors:**
- A: `#10B981` (Green)
- B: `#F59E0B` (Yellow)
- C: `#F97316` (Orange)
- D: `#EF4444` (Red)
- F: `#DC2626` (Dark Red)

### 5.6 Telemetry Graphs

**Graph Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Brake Pressure Comparison                                          │
│  Your Lap (Blue)  vs.  Target Lap (Red)                            │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  [  ████████████████████████████████████████████████████  ]        │
│  [  ████████████████████████████████████████████████████  ]        │
│  [  ████████████████████████████████████████████████████  ]        │
│                                                                      │
│  ──────────────────────────────────────────────────────────────────  │
│  █  Your Lap (Blue)  █  Target (Red)                               │
│  "See how the blue line drops vertically? That's lost time."        │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Graph background: `#FFFFFF`
- Grid: `#DEE2E6`, 0.5pt lines
- Axis labels: Inter, 8pt, `#868E96`
- Legend: Below graph
- Annotation: Red text, italic, 9pt
- Line widths: 1.5pt (Your lap), 1.5pt dashed (Target lap)

**Graph Types Used:**
1. **Brake Trace** - Line chart, pressure vs. distance
2. **Throttle Trace** - Line chart, throttle % vs. distance  
3. **Speed Trace** - Line chart, speed vs. distance
4. **Lap Times** - Bar chart, lap number vs. time
5. **Steering Angle** - Line chart, degrees vs. distance

### 5.7 Action Plan

```
┌──────────────────────────────────────────────────────────────────────┐
│  NEXT SESSION: 3 STEPS                                              │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  STEP 1:  BRAKE LATER AT TURN 1                                     │
│  ──────────────────────────────────────────────────────────────────  │
│  Focus: 5 laps                                                      │
│  How: Try braking at the 150m board instead of 200m                │
│  Check: Look for blue line moving right on brake trace             │
│  Expected Gain: 0.3s                                                │
│                                                                      │
│  STEP 2:  TURN LATER AT TURN 9                                      │
│  ──────────────────────────────────────────────────────────────────  │
│  Focus: 5 laps                                                      │
│  How: Wait 1 car-length longer before turning                      │
│  Check: Look for smoother speed trace on exit                      │
│  Expected Gain: 0.2s                                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Styles:**
- Step number: Large bold red number (48pt), inline
- Step title: Inter, 14pt, bold
- Focus/How/Check: Inter, 10pt, with icons
- Expected Gain: Green text, 10pt, bold
- Divider: 1pt `#DEE2E6` between steps

### 5.8 Quick Reference Sheet

```
┌──────────────────────────────────────────────────────────────────────┐
│  YOUR REFERENCE CARD                                                │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ┌─────────────┬─────────────┬─────────────┬───────────────────────┐│
│  │ Corner      │ Brake At    │ Turn-In     │ Telemetry Check      ││
│  ├─────────────┼─────────────┼─────────────┼───────────────────────┤│
│  │ T1          │ 150m board  │ After shadow│ Brake trace moved    ││
│  │ T2          │ Lift only   │ Concrete    │ Throttle smooth      ││
│  │ T9          │ 100m board  │ Wait longer │ Speed trace overlap  ││
│  └─────────────┴─────────────┴─────────────┴───────────────────────┘│
│                                                                      │
│  Save this page. Look at it before every session.                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Telemetry Graph Design Guidelines

### 6.1 Graph Rules

| Rule | Specification |
| :--- | :--- |
| **Simplicity** | Never more than 3 data series per graph |
| **Color Coding** | Your lap = Dark Blue, Target = APEX Red |
| **Annotations** | Callout boxes for key differences |
| **Units** | Always show units (mph, %, °, G) |
| **Axes** | Clearly labeled, 10pt Inter, `#868E96` |
| **Grid** | Light gray `#DEE2E6`, minimal |

### 6.2 Graph Layout Per Page

| Page | Graph Type | Data Shown |
| :--- | :--- | :--- |
| Page 2 | Speed Trace | Speed vs. Distance (Your vs. Target) |
| Page 4 | Brake Trace | Brake Pressure vs. Distance |
| Page 5 | Throttle Trace | Throttle % vs. Distance |
| Page 6 | Lap Times | Bar chart - All analyzed laps |
| Page 7 | Corner Delta | Corner-by-corner time gain/loss |

### 6.3 Graph Colors (Light Theme)

| Element | Color | Hex |
| :--- | :--- | :--- |
| Your Lap (Primary) | Dark Blue | `#1A1A2E` |
| Target Lap (Primary) | APEX Red | `#E10600` |
| Grid Lines | Light Gray | `#DEE2E6` |
| Axis Labels | Muted Text | `#868E96` |
| Annotations | Red Text | `#E10600` |
| Background | White | `#FFFFFF` |

---

## 7. Print Considerations

### 7.1 Print-Specific Rules

| Element | Specification |
| :--- | :--- |
| **Color Mode** | CMYK (for professional printing) |
| **Embedded Fonts** | All fonts MUST be embedded in PDF |
| **Images** | 300 DPI minimum for graphics |
| **Bleed** | 3mm bleed for edge-to-edge printing |
| **Black Text** | Use `#1A1A2E` not pure black `#000000` (less harsh) |

### 7.2 Screen vs. Print Differences

| Element | Screen View | Printed View |
| :--- | :--- | :--- |
| Background | `#F8F9FA` cards | White with subtle borders |
| Shadows | Soft shadow | No shadow (border only) |
| Gradients | Subtle | Minimal or none |
| Graphics | PNG/SVG | High-res embedded |

---

## 8. Component Code Examples

### 8.1 Cover Page (HTML/CSS)
```html
<div class="cover-page">
  <div class="brand-bar">
    <span class="logo">APEX</span>
    <span class="subtitle">RACING ACADEMY</span>
  </div>
  <div class="cover-content">
    <h1 class="main-title">COACHING REPORT</h1>
    <div class="session-info">
      <p class="track-name">Sebring International Raceway</p>
      <p class="date">August 18, 2026</p>
      <p class="car">Formula Dodge RT/2000</p>
    </div>
    <div class="grade-display">
      <span class="grade-letter">B</span>
      <span class="grade-label">Overall Grade</span>
    </div>
    <p class="summary-quote">"Great line! Let's work on braking consistency."</p>
    <div class="footer-stats">
      APEX v2.5 · UDP Telemetry Analysis · 10 Laps Analyzed
    </div>
  </div>
</div>
```

### 8.2 Section Header (HTML/CSS)
```html
<div class="section-header">
  <span class="section-number">1</span>
  <h2 class="section-title">WHAT YOU DID WELL</h2>
  <div class="section-underline"></div>
</div>
```

```css
.section-header {
  margin-top: 16pt;
  margin-bottom: 8pt;
}
.section-number {
  color: #E10600;
  font-size: 14pt;
  font-weight: 700;
  margin-right: 8pt;
}
.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 18pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #1A1A2E;
  letter-spacing: 0.5pt;
}
.section-underline {
  width: 40mm;
  height: 2pt;
  background: #E10600;
  margin-top: 2pt;
}
```

### 8.3 Telemetry Card (HTML/CSS)
```html
<div class="telemetry-card">
  <div class="card-header">
    <span class="card-title">Brake Pressure Comparison</span>
    <span class="card-badge">Your Lap vs. Target</span>
  </div>
  <div class="card-body">
    <div class="chart-container">
      <!-- Graph goes here -->
    </div>
    <div class="telemetry-insight">
      <span class="insight-icon">📊</span>
      <p class="insight-text">
        <strong>TELEMETRY INSIGHT:</strong>
        "Your brake trace (blue) shows a vertical drop. Target (red) decays smoothly. 
        This means you're not trail-braking, costing 0.15s per corner."
      </p>
    </div>
    <div class="graph-legend">
      <span class="legend-item">
        <span class="legend-color" style="background:#1A1A2E;"></span>
        Your Lap
      </span>
      <span class="legend-item">
        <span class="legend-color" style="background:#E10600;"></span>
        Target Lap
      </span>
    </div>
  </div>
</div>
```

```css
.telemetry-card {
  background: #F8F9FA;
  border: 1pt solid #DEE2E6;
  border-radius: 4pt;
  padding: 12pt 16pt;
  margin-bottom: 12pt;
}
.card-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1pt solid #DEE2E6;
  padding-bottom: 6pt;
  margin-bottom: 10pt;
}
.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 12pt;
  font-weight: 600;
  color: #1A1A2E;
}
.card-badge {
  font-family: 'Inter', sans-serif;
  font-size: 9pt;
  color: #868E96;
  background: #F1F3F5;
  padding: 2pt 8pt;
  border-radius: 12pt;
}
.telemetry-insight {
  background: #FFF0EE;
  border-left: 4pt solid #E10600;
  padding: 10pt 12pt;
  margin: 10pt 0;
  border-radius: 2pt;
}
.insight-text {
  font-family: 'Inter', sans-serif;
  font-size: 10pt;
  color: #1A1A2E;
  line-height: 1.4;
}
.insight-text strong {
  color: #E10600;
}
```

### 8.4 Data Table (HTML/CSS)
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Corner</th>
      <th>Your Speed</th>
      <th>Target Speed</th>
      <th>Delta</th>
      <th>Grade</th>
      <th>Fix</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>T1</strong></td>
      <td>52 mph</td>
      <td>58 mph</td>
      <td class="negative">-6 mph</td>
      <td><span class="grade-badge grade-c">C</span></td>
      <td>Brake later</td>
    </tr>
    <tr>
      <td><strong>T2</strong></td>
      <td>47 mph</td>
      <td>49 mph</td>
      <td class="negative">-2 mph</td>
      <td><span class="grade-badge grade-b">B</span></td>
      <td>Smooth throttle</td>
    </tr>
    <tr>
      <td><strong>T3</strong></td>
      <td>63 mph</td>
      <td>62 mph</td>
      <td class="positive">+1 mph</td>
      <td><span class="grade-badge grade-a">A</span></td>
      <td>Keep doing this</td>
    </tr>
  </tbody>
</table>
```

```css
.data-table {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 10pt;
  border-collapse: collapse;
}
.data-table thead th {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10pt;
  text-transform: uppercase;
  color: #E10600;
  background: #F8F9FA;
  padding: 6pt 8pt;
  text-align: left;
  border-bottom: 2pt solid #DEE2E6;
}
.data-table tbody td {
  padding: 6pt 8pt;
  border-bottom: 1pt solid #DEE2E6;
}
.data-table tbody tr:nth-child(even) {
  background: #F1F3F5;
}
.data-table .negative {
  color: #EF4444;
  font-weight: 600;
}
.data-table .positive {
  color: #10B981;
  font-weight: 600;
}
.grade-badge {
  display: inline-block;
  width: 24pt;
  height: 24pt;
  line-height: 24pt;
  text-align: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 11pt;
  color: white;
}
.grade-a { background: #10B981; }
.grade-b { background: #F59E0B; }
.grade-c { background: #F97316; }
.grade-d { background: #EF4444; }
```

---

## 9. PDF Generation Settings

### 9.1 Technical Specifications

| Setting | Value |
| :--- | :--- |
| **Paper Size** | A4 (210mm × 297mm) |
| **Orientation** | Portrait |
| **Margins** | 25mm top/bottom, 20mm left/right |
| **Font Embedding** | All fonts MUST be embedded |
| **Color Profile** | sRGB for screen, CMYK optional for print |
| **Compression** | Standard (lossless for text, JPEG for images) |
| **Metadata** | Include: Title, Author (APEX), Date, Version |

### 9.2 PDF Generation Checklist

- [ ] All fonts embedded
- [ ] Images at 300 DPI minimum
- [ ] Hyperlinks removed (static PDF only)
- [ ] Bookmarks added for sections (optional)
- [ ] Page numbers added
- [ ] Color contrast verified (WCAG compliant for readability)
- [ ] File size optimized (under 5MB recommended)

---

## 10. Summary: Light Theme Rules

| Element | DO | DON'T |
| :--- | :--- | :--- |
| **Background** | Pure white `#FFFFFF` | Dark colors or gradients |
| **Text** | High contrast `#1A1A2E` | Gray or light text |
| **Accents** | APEX Red `#E10600` | Too many accent colors |
| **Cards** | Light gray `#F8F9FA` | Heavy borders or shadows |
| **Graphs** | Colorful traces, white bg | Dark backgrounds |
| **Tables** | Zebra stripes, clear headers | Dense, unreadable |
| **Print** | Optimized for B&W | Color-dependent only |

---

> *"The PDF report should be as clear and actionable as a driver's briefing - professional, precise, and print-friendly."*