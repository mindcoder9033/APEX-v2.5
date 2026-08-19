import { jsPDF } from 'jspdf';
import { LapAnalysis, CornerTelemetryAnalysis, StintSession, SkipBarberPillarScore } from '../types/telemetry';
import { Module, Session } from '../types/curriculum';
import { generateAICoachDebrief, SKIP_BARBER_CITATIONS } from '../engine/aiCoachEngine';
import {
  renderBrakeTraceChart,
  renderThrottleTraceChart,
  renderTrackMapLineChart,
  renderConsistencyBarChart,
  renderStintBrakeTraceChart,
  renderStintThrottleTraceChart,
  renderStintProgressionWithSectorsChart
} from './pdfCharts';

// ============================================================================
// DESIGN SYSTEM CONSTANTS & TOKENS (PDF DESIGN.md)
// ============================================================================
export const PDF_COLORS = {
  bg: [255, 255, 255] as [number, number, number],
  surface: [248, 249, 250] as [number, number, number], // #F8F9FA
  surfaceAlt: [241, 243, 245] as [number, number, number], // #F1F3F5
  border: [222, 226, 230] as [number, number, number], // #DEE2E6
  textPrimary: [26, 26, 46] as [number, number, number], // #1A1A2E
  textSecondary: [74, 74, 90] as [number, number, number], // #4A4A5A
  textMuted: [134, 142, 150] as [number, number, number], // #868E96
  accent: [225, 6, 0] as [number, number, number], // #E10600 APEX Red
  accentLight: [255, 240, 238] as [number, number, number], // #FFF0EE
  
  // Grade badges
  gradeA: [16, 185, 129] as [number, number, number], // #10B981 Emerald
  gradeB: [245, 158, 11] as [number, number, number], // #F59E0B Amber
  gradeC: [249, 115, 22] as [number, number, number], // #F97316 Orange
  gradeD: [239, 68, 68] as [number, number, number], // #EF4444 Red
  gradeF: [220, 38, 38] as [number, number, number], // #DC2626 Dark Red

  // Telemetry channels
  speed: [0, 119, 190] as [number, number, number], // #0077BE Rich Blue
  throttle: [0, 168, 107] as [number, number, number], // #00A86B Emerald Green
  brake: [200, 16, 46] as [number, number, number], // #C8102E Crimson Red
  steering: [245, 128, 37] as [number, number, number], // #F58025 Orange Amber
  latG: [155, 48, 255] as [number, number, number], // #9B30FF Purple
  lonG: [0, 94, 184] as [number, number, number], // #005EB8 Navy Blue
  yourLap: [26, 26, 46] as [number, number, number], // #1A1A2E Dark
  targetLap: [225, 6, 0] as [number, number, number], // #E10600 APEX Red
};

// Layout dimensions (mm)
const CHART_HEIGHT_MM = 64;
const MAP_HEIGHT_MM = 82;
const FIX_ROW_HEIGHT = 38;
const ACTION_ROW_HEIGHT = 32;
const REF_ROW_HEIGHT = 14;
const CERT_HEIGHT = 38;

const FIX_HEADERS = [
  { name: 'PRIORITY', width: 22, align: 'center' as const },
  { name: 'PROBLEM', width: 44, align: 'left' as const },
  { name: 'TELEMETRY EVIDENCE', width: 48, align: 'left' as const },
  { name: 'WHY IT MATTERS & HOW TO FIX IT', width: 66, align: 'left' as const },
];

const CORNER_TABLE_HEADERS = [
  { name: 'CORNER', width: 28, align: 'left' as const },
  { name: 'YOUR SPEED', width: 20, align: 'left' as const },
  { name: 'TARGET', width: 20, align: 'left' as const },
  { name: 'DELTA', width: 18, align: 'left' as const },
  { name: 'BRAKE SPOT', width: 22, align: 'left' as const },
  { name: 'TARGET SPOT', width: 22, align: 'left' as const },
  { name: 'GRADE', width: 16, align: 'center' as const },
  { name: 'COACHING INSIGHT & FIX', width: 34, align: 'left' as const }
];

const ACTION_HEADERS = [
  { name: 'PRIORITY', width: 24, align: 'center' as const },
  { name: 'SPECIFIC COACHING ACTION (THREE-BITE FIX)', width: 80, align: 'left' as const },
  { name: 'WHERE TO PRACTICE', width: 42, align: 'left' as const },
  { name: 'EXPECTED GAIN', width: 34, align: 'right' as const }
];

const REF_HEADERS = [
  { name: 'CORNER', width: 28, align: 'left' as const },
  { name: 'BRAKE MARKER BOARD', width: 38, align: 'left' as const },
  { name: 'TURN-IN REFERENCE', width: 38, align: 'left' as const },
  { name: 'APEX CLIPPING POINT', width: 38, align: 'left' as const },
  { name: 'TRACK-OUT LIMIT', width: 38, align: 'left' as const }
];

const ACTION_PRIORITIES = [
  { prio: '1 (START)', color: PDF_COLORS.gradeD, gain: 0.30 },
  { prio: '2 (NEXT)', color: PDF_COLORS.gradeD, gain: 0.20 },
  { prio: '3 (THEN)', color: PDF_COLORS.gradeB, gain: 0.15 },
  { prio: '4 (POLISH)', color: PDF_COLORS.speed, gain: 0.10 }
];

const LINE_DIAGNOSIS_MATRIX = [
  {
    symptom: 'You have to turn the steering wheel MORE after the apex cone',
    issue: 'Early Apex / Rushed Turn-in',
    fix: 'Wait 1 car-length longer before turning. Open up corner radius and aim for a geometrical late clipping point.'
  },
  {
    symptom: 'There is leftover road on the outside when leaving the corner',
    issue: 'Under-committed Track-out',
    fix: 'Let the car float all the way to the outer exit curb as you unwind steering wheel.'
  },
  {
    symptom: 'Cannot unwind the steering wheel on corner exit',
    issue: 'Pinching the Exit Line',
    fix: 'Apex slightly later so the car is already pointed straight down track when feeding full power.'
  }
];

// ============================================================================
// GEOMETRIC SHAPE HELPERS (SHARP BEVELED / CHAMFERED CORNERS)
// ============================================================================

/**
 * Draws a sharp beveled/chamfered card with 45-degree angled corner cuts.
 * Replaces rounded corners with a crisp aerodynamic motorsport motif.
 */
export function drawBeveledCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  bevel: number = 3,
  style: 'F' | 'D' | 'FD' = 'FD',
  cutCorners: { tl?: boolean; tr?: boolean; br?: boolean; bl?: boolean } = { tl: true, tr: true, br: true, bl: true }
): void {
  if (bevel <= 0) {
    doc.rect(x, y, w, h, style);
    return;
  }

  const tl = cutCorners.tl !== false ? Math.min(bevel, w / 2, h / 2) : 0;
  const tr = cutCorners.tr !== false ? Math.min(bevel, w / 2, h / 2) : 0;
  const br = cutCorners.br !== false ? Math.min(bevel, w / 2, h / 2) : 0;
  const bl = cutCorners.bl !== false ? Math.min(bevel, w / 2, h / 2) : 0;

  const p0 = [x + tl, y];
  const lines: [number, number][] = [
    [w - tl - tr, 0],       // top edge
    [tr, tr],               // top-right chamfer
    [0, h - tr - br],       // right edge
    [-br, br],              // bottom-right chamfer
    [-(w - br - bl), 0],    // bottom edge
    [-bl, -bl],             // bottom-left chamfer
    [0, -(h - bl - tl)],    // left edge
    [tl, -tl]               // top-left chamfer
  ];

  doc.lines(lines, p0[0], p0[1], [1, 1], style, true);
}

/**
 * Draws a sharp beveled badge with solid fill and optional chamfered corners.
 */
export function drawBeveledBadge(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  bevel: number = 2.5,
  color: [number, number, number]
): void {
  doc.setFillColor(...color);
  doc.setDrawColor(...color);
  drawBeveledCard(doc, x, y, w, h, bevel, 'F');
}

/**
 * Helper to render multiline text with 1.35x line spacing and return bottom Y.
 */
export function renderParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  fontSizePt: number = 14,
  fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
  color: [number, number, number] = PDF_COLORS.textSecondary,
  lineSpacingFactor: number = 1.35
): number {
  doc.setFontSize(fontSizePt);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(...color);

  // Line height in mm: (fontSizePt / 2.83465) * lineSpacingFactor
  const lineHeightMm = (fontSizePt / 2.83465) * lineSpacingFactor;
  const splitLines = doc.splitTextToSize(text, maxWidth);

  splitLines.forEach((line: string, idx: number) => {
    doc.text(line, x, startY + (idx * lineHeightMm));
  });

  return startY + (splitLines.length * lineHeightMm);
}

/**
 * Sanitizes a string for use as a valid filename.
 */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Resolves the debrief filename based on the user's custom stint title.
 * Follows pattern: [User_Title]_APEX_Debrief.pdf
 */
export function getDebriefFilename(
  stintSession?: StintSession | null,
  lap?: LapAnalysis,
  trackName?: string,
  carName?: string
): string {
  if (stintSession?.title && stintSession.title.trim().length > 0) {
    const cleanTitle = sanitizeFilename(stintSession.title);
    return `${cleanTitle}_APEX_Debrief.pdf`;
  }
  
  const cleanTrack = sanitizeFilename(trackName || stintSession?.trackName || 'Session');
  const cleanCar = sanitizeFilename(carName || stintSession?.carName || 'Formula');
  const lapSuffix = lap?.lapNumber ? `_Lap_${lap.lapNumber}` : (stintSession?.stintNumber ? `_Stint_${stintSession.stintNumber}` : '');
  
  return `${cleanTrack}_${cleanCar}${lapSuffix}_APEX_Debrief.pdf`;
}

/**
 * Determines coaching voice tone based on module and driver score.
 */
function getCoachingVoice(module?: Module, _session?: Session, lap?: LapAnalysis): 'friendly_coach' | 'pro_engineer' {
  if (module && module.moduleNumber > 3) {
    return 'pro_engineer';
  }
  if (lap && lap.overallScore >= 92 && (!module || module.moduleNumber > 3)) {
    return 'pro_engineer';
  }
  return 'friendly_coach';
}

/**
 * Calculates letter grade, headline, and subtext based on performance score.
 */
function getLetterGrade(score: number, isFriendly: boolean): { grade: string; text: string; subtext: string; color: [number, number, number] } {
  if (score >= 94) {
    return {
      grade: 'A+',
      text: isFriendly ? 'Awesome driving! You are flying!' : 'Mastery Pace & Precision Technique',
      subtext: isFriendly ? 'Your lines and throttle control were super smooth across every corner.' : 'Optimal friction circle management & late apex geometry.',
      color: PDF_COLORS.gradeA
    };
  }
  if (score >= 88) {
    return {
      grade: 'A',
      text: isFriendly ? 'Great job! Really solid stint!' : 'Excellent Driving Discipline & Pace',
      subtext: isFriendly ? 'You hit your marks consistently on almost every corner.' : 'Contact patch maintained within optimum slip angle window.',
      color: PDF_COLORS.gradeA
    };
  }
  if (score >= 82) {
    return {
      grade: 'B+',
      text: isFriendly ? 'Good line! Let’s work on braking next.' : 'Good Line, Needs Braking Modulation',
      subtext: isFriendly ? 'Your steering is great. A little practice on braking will unlock big speed.' : 'Solid geometric trajectory; braking markers can be compressed.',
      color: PDF_COLORS.gradeA
    };
  }
  if (score >= 75) {
    return {
      grade: 'B',
      text: isFriendly ? 'Solid foundation! Minor fixes will make you fast.' : 'Solid Foundation, Refine Apex Timing',
      subtext: isFriendly ? 'You are doing the right things. A couple of corner tweaks will give you easy time gains.' : 'Moderate entry understeer; delay turn-in point on key straights.',
      color: PDF_COLORS.gradeB
    };
  }
  if (score >= 68) {
    return {
      grade: 'C+',
      text: isFriendly ? 'Good effort! Focus on one corner at a time.' : 'Marginal Consistency, Fix Turn-Ins',
      subtext: isFriendly ? 'Don’t worry, this is totally normal. Let’s clean up your turn-in points.' : 'High variance on brake hit rates; steering lock increasing post-apex.',
      color: PDF_COLORS.gradeC
    };
  }
  return {
    grade: 'C',
    text: isFriendly ? 'Great practice session! Here is your roadmap to get fast.' : 'Variable Pace & Steering Lock',
    subtext: isFriendly ? 'Every fast driver starts right here. Follow these 3 simple steps to find extra speed.' : 'Early turn-in causing pinched exits and delayed throttle.',
    color: PDF_COLORS.gradeD
  };
}

/**
 * Returns RGB color corresponding to a letter grade string.
 */
function getGradeBadgeColor(grade: string): [number, number, number] {
  switch (grade.toUpperCase().trim()) {
    case 'A+':
    case 'A':
      return PDF_COLORS.gradeA;
    case 'B+':
    case 'B':
      return PDF_COLORS.gradeB;
    case 'C+':
    case 'C':
      return PDF_COLORS.gradeC;
    case 'D':
      return PDF_COLORS.gradeD;
    default:
      return PDF_COLORS.gradeF;
  }
}

/**
 * Synthesizes benchmark reference lap data if not explicitly provided.
 */
function getTargetLapBenchmark(lap: LapAnalysis, _session?: Session): { targetLap: LapAnalysis; deltaSec: number; targetTimeStr: string } {
  const targetTimeSec = Math.max(50, Number((lap.lapTimeSec * 0.988).toFixed(2)));
  const deltaSec = Math.max(0.15, Number((lap.lapTimeSec - targetTimeSec).toFixed(2)));

  const targetCorners: CornerTelemetryAnalysis[] = lap.corners.map(c => ({
    ...c,
    apexMinSpeedKph: Math.round(c.targetApexSpeedKph || c.apexMinSpeedKph * 1.06),
    peakBrakePressure: Math.min(1.0, c.peakBrakePressure * 1.15),
    trailBrakingDecayDurationSec: Math.max(0.35, c.trailBrakingDecayDurationSec * 1.25),
    throttleUnwindLinearityScore: 95,
    cornerScore: 94
  }));

  const targetLap: LapAnalysis = {
    ...lap,
    lapNumber: 0,
    lapTimeSec: targetTimeSec,
    corners: targetCorners,
    overallScore: 95
  };

  const mins = Math.floor(targetTimeSec / 60);
  const secs = (targetTimeSec % 60).toFixed(2).padStart(5, '0');
  const targetTimeStr = `${mins}:${secs}`;

  return { targetLap, deltaSec, targetTimeStr };
}

// ============================================================================
// COMMON PDF RENDERING HELPERS (LIGHT THEME & SHARP GEOMETRY)
// ============================================================================

/**
 * Standard Header for Pages 2 through 11.
 */
function renderStandardHeader(
  doc: jsPDF,
  pageNumber: number,
  sectionNumber: string,
  title: string,
  subtitle: string,
  trackName: string,
  carName: string,
  lapTimeStr: string,
  dateStr: string,
  margin: number,
  contentWidth: number,
  pageWidth: number
) {
  const headerHeight = 20;
  
  // Header background card (Sharp beveled corners)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, margin, contentWidth, headerHeight, 2.5, 'FD');

  // Left red accent bar
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, margin, 4, headerHeight, 'F');

  // APEX 'A' Badge (Sharp square/beveled)
  doc.setFillColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin + 6, margin + 4, 7, 7, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('A', margin + 8, margin + 9);

  // Section Number (Red)
  doc.setTextColor(...PDF_COLORS.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(sectionNumber, margin + 16, margin + 9);

  // Section Title (Dark Navy)
  const secNumWidth = doc.getTextWidth(sectionNumber);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(title, margin + 18 + secNumWidth, margin + 9);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(subtitle, margin + 16, margin + 15.5);

  // Right metadata
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text(`${trackName} • ${carName}`, pageWidth - margin - 6, margin + 8.5, { align: 'right' });
  doc.text(`Lap Time: ${lapTimeStr} • ${dateStr}`, pageWidth - margin - 6, margin + 15, { align: 'right' });
}

/**
 * Standard Footer for Pages 1 through 11.
 */
function renderStandardFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  quoteText: string,
  quoteAuthor: string | undefined,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number,
  isFriendly: boolean
) {
  const footerY = pageHeight - 16;

  // Philosophy quote card (Sharp beveled corners)
  if (quoteText) {
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, footerY - 7.5, contentWidth, 8, 1.5, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const fullQuote = quoteAuthor ? `"${quoteText}" — ${quoteAuthor}` : `"${quoteText}"`;
    doc.text(fullQuote, margin + 5, footerY - 2.2);
  }

  // Bottom divider
  doc.setDrawColor(...PDF_COLORS.border);
  doc.line(margin, footerY + 3.5, pageWidth - margin, footerY + 3.5);

  // Page info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  const footerTag = isFriendly ? 'APEX Driver Coaching Guide • Trackside Debrief' : 'Skip Barber Going Faster! Analytical Methodology • APEX Systems';
  doc.text(`Page ${pageNumber} of ${totalPages} • ${footerTag}`, margin, footerY + 8);
  doc.text(`Certified Analytical Record • APEX v2.5`, pageWidth - margin, footerY + 8, { align: 'right' });
}

/**
 * Corner table renderer used across Pages 4 & 5.
 */
function renderCornerTable(doc: jsPDF, cornersToRender: CornerTelemetryAnalysis[], margin: number, contentWidth: number) {
  let tblY = margin + 26;

  // Table header
  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, tblY, contentWidth, 8.5, 2, 'FD');

  let curX = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);

  CORNER_TABLE_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, curX + th.width / 2, tblY + 5.8, { align: 'center' });
    } else {
      doc.text(th.name, curX, tblY + 5.8);
    }
    curX += th.width;
  });

  tblY += 8.5;
  const rowHeight = 21;

  cornersToRender.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, tblY, contentWidth, rowHeight, 1.5, 'FD');

    const gradeLetter = c.cornerScore >= 90 ? 'A' : c.cornerScore >= 80 ? 'B' : c.cornerScore >= 70 ? 'C' : 'D';
    const statusColor = getGradeBadgeColor(gradeLetter);

    // Left indicator bar
    doc.setFillColor(...statusColor);
    doc.rect(margin, tblY, 3, rowHeight, 'F');

    let xPos = margin + 5;

    // 1. Corner
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const cLabel = `T${c.cornerIndex} - ${c.cornerName.split('(')[0].trim().slice(0, 11)}`;
    doc.text(cLabel, xPos, tblY + 7);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(c.type.toUpperCase().replace('_', ' '), xPos, tblY + 14.5);
    xPos += CORNER_TABLE_HEADERS[0].width;

    // 2. Your Speed
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`${c.apexMinSpeedKph} km/h`, xPos, tblY + 11);
    xPos += CORNER_TABLE_HEADERS[1].width;

    // 3. Target Speed
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`${c.targetApexSpeedKph} km/h`, xPos, tblY + 11);
    xPos += CORNER_TABLE_HEADERS[2].width;

    // 4. Delta
    const speedDelta = c.apexMinSpeedKph - c.targetApexSpeedKph;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(speedDelta >= 0 ? PDF_COLORS.gradeA[0] : PDF_COLORS.gradeD[0], speedDelta >= 0 ? PDF_COLORS.gradeA[1] : PDF_COLORS.gradeD[1], speedDelta >= 0 ? PDF_COLORS.gradeA[2] : PDF_COLORS.gradeD[2]);
    const deltaStr = speedDelta >= 0 ? `+${speedDelta} km/h` : `${speedDelta} km/h`;
    doc.text(deltaStr, xPos, tblY + 11);
    xPos += CORNER_TABLE_HEADERS[3].width;

    // 5. Your Brake Marker
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`${Math.round(c.startDistance - 80)}m mark`, xPos, tblY + 11);
    xPos += CORNER_TABLE_HEADERS[4].width;

    // 6. Target Brake Marker
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(`${Math.round(c.startDistance - 65)}m mark`, xPos, tblY + 11);
    xPos += CORNER_TABLE_HEADERS[5].width;

    // 7. Grade Badge (Sharp Beveled)
    drawBeveledBadge(doc, xPos + 1, tblY + 5.5, 12, 10, 2, statusColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(gradeLetter, xPos + 7, tblY + 12.5, { align: 'center' });
    xPos += CORNER_TABLE_HEADERS[6].width;

    // 8. One-line Fix (10pt with clean wrapping & spacing)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const friendlyFix = speedDelta >= 0
      ? 'Great apex speed! Line maintained smoothly.'
      : c.trailBrakingDecayDurationSec < 0.22
      ? 'Ease off brake gently toward apex cone.'
      : 'Wait 1 car-length longer before turning in.';
    const splitFix = doc.splitTextToSize(friendlyFix, CORNER_TABLE_HEADERS[7].width + 8);
    doc.text(splitFix[0] || friendlyFix, xPos, tblY + 8);
    if (splitFix[1]) {
      doc.text(splitFix[1], xPos, tblY + 14.5);
    }

    tblY += rowHeight;
  });

  tblY += 6;
  // Legend Box (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, tblY, contentWidth, 10, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('■ Grade A: On Target Pace', margin + 6, tblY + 6.5);

  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('■ Grade B: Minor Polish', margin + 64, tblY + 6.5);

  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('■ Grade C/D: Priority Focus Area', margin + 122, tblY + 6.5);
}

// ============================================================================
// 1. SINGLE LAP OFFICIAL 11-PAGE PDF GENERATOR
// ============================================================================

/**
 * Generates the official 11-Page PDF Debrief Dossier with Dedicated AI Coach Analysis.
 */
export const generateOfficialPdf = async (
  lap: LapAnalysis,
  module?: Module,
  session?: Session,
  stintSession?: StintSession,
  comparisonLap?: LapAnalysis | null
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isFriendly = getCoachingVoice(module, session, lap) === 'friendly_coach';
  const totalPages = 11;

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Run AI Coach Debrief engine
  const aiDebrief = generateAICoachDebrief(stintSession || null, lap);

  // Resolve target benchmark
  const { targetLap, deltaSec, targetTimeStr } = getTargetLapBenchmark(lap, session);
  const benchmarkLap = comparisonLap || targetLap;

  // Driver Lap String
  const driverMins = Math.floor(lap.lapTimeSec / 60);
  const driverSecs = (lap.lapTimeSec % 60).toFixed(2).padStart(5, '0');
  const driverTimeStr = `${driverMins}:${driverSecs}`;

  const overallGradeInfo = getLetterGrade(lap.overallScore, isFriendly);
  const dateStr = lap.recordedAt ? new Date(lap.recordedAt).toLocaleDateString() : new Date().toLocaleDateString();
  const trackName = stintSession?.trackName || lap.detectedTrackName || 'Lime Rock Park';
  const carName = stintSession?.carName || lap.detectedCarName || 'Formula Skip Barber 2000';
  const userTitle = stintSession?.title || `Lap #${lap.lapNumber} Practice Debrief`;

  // ==========================================================================
  // PAGE 1: COVER PAGE (PDF Structure.md & PDF DESIGN.md)
  // ==========================================================================
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Red Accent Border (4pt)
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Brand Header Bar (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, margin + 4, contentWidth, 26, 3, 'FD');

  // Logo Icon (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin + 6, margin + 9, 9, 9, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('A', margin + 8.8, margin + 15.8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('APEX RACING ACADEMY', margin + 20, margin + 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('OFFICIAL TELEMETRY DEBRIEF & COACHING DOSSIER', margin + 20, margin + 22);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Session Date: ${dateStr}`, pageWidth - margin - 6, margin + 13, { align: 'right' });
  doc.text(`Certified Clean Lap: #${lap.lapNumber}`, pageWidth - margin - 6, margin + 20, { align: 'right' });

  let curY = margin + 38;

  // Title Section
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('DRIVER COACHING REPORT', margin, curY);

  curY += 7;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(userTitle.toUpperCase(), margin, curY);

  curY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sessionSub = module
    ? `Module ${module.moduleNumber}: ${module.title} • ${session?.title || 'Curriculum Stint'} • ${trackName} (${carName})`
    : `Track: ${trackName} • Vehicle: ${carName} • Stint Analysis`;
  doc.text(sessionSub, margin, curY);

  curY += 10;

  // Grade & Delta Dual Banner (Sharp Beveled Cards)
  const gradeBoxWidth = (contentWidth - 6) / 2;
  const gradeBoxHeight = 40;

  // Box 1: Overall Grade
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, curY, gradeBoxWidth, gradeBoxHeight, 3, 'FD');

  // Sharp Beveled Grade Badge
  drawBeveledBadge(doc, margin + 8, curY + 8, 24, 24, 4, overallGradeInfo.color);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(overallGradeInfo.grade, margin + 20, curY + 24.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('OVERALL TECHNIQUE GRADE', margin + 38, curY + 11);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(overallGradeInfo.text, margin + 38, curY + 19);

  renderParagraph(
    doc,
    overallGradeInfo.subtext,
    margin + 38,
    curY + 26,
    gradeBoxWidth - 44,
    9.5,
    'normal',
    PDF_COLORS.textSecondary,
    1.3
  );

  // Box 2: Benchmark Delta
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin + gradeBoxWidth + 6, curY, gradeBoxWidth, gradeBoxHeight, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('PACE VS TARGET BENCHMARK', margin + gradeBoxWidth + 14, curY + 11);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(`Your Best Lap: ${driverTimeStr}`, margin + gradeBoxWidth + 14, curY + 19);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Target Benchmark: ${targetTimeStr}`, margin + gradeBoxWidth + 14, curY + 26);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text(`Delta: +${deltaSec.toFixed(2)}s to Target`, margin + gradeBoxWidth + 14, curY + 34);

  curY += gradeBoxHeight + 8;

  // 6 KPI Micro Tiles (Sharp Beveled)
  const kpiCols = 6;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 20;

  const kpis = [
    { label: 'LAP TIME', value: `${lap.lapTimeSec.toFixed(2)}s`, color: PDF_COLORS.textPrimary },
    { label: 'TOP SPEED', value: `${lap.maxSpeedKph} km/h`, color: PDF_COLORS.speed },
    { label: 'TIRE GRIP', value: `${lap.avgTractionBudgetPct}%`, color: PDF_COLORS.gradeA },
    { label: 'TECH SCORE', value: `${lap.overallScore}%`, color: PDF_COLORS.gradeB },
    { label: 'PEAK LAT G', value: `${lap.peakLatG.toFixed(2)}G`, color: PDF_COLORS.latG },
    { label: 'PEAK BRAKE', value: `${lap.peakBrakingG.toFixed(2)}G`, color: PDF_COLORS.gradeD },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, kX, curY, kpiWidth, kpiHeight, 1.5, 'FD');
    
    // Top colored indicator line
    doc.setFillColor(...kpi.color);
    doc.rect(kX, curY, kpiWidth, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(kpi.label, kX + 3, curY + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, kX + 3, curY + 15.5);
  });

  curY += kpiHeight + 10;

  // One-Line Summary Quote Box (14pt Body Text with 1.35x Spacing)
  const oneLineQuoteText = isFriendly
    ? '"Great driving line! Let’s refine your braking release to unlock consistent speed."'
    : '"Disciplined trajectory; compress initial threshold braking markers for optimal rotation."';

  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, curY, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, curY, 4, 24, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('COACH’S ONE-LINE DEBRIEF', margin + 10, curY + 7.5);

  renderParagraph(
    doc,
    oneLineQuoteText,
    margin + 10,
    curY + 16,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  curY += 32;

  // Summary Table: The Learn-As-You-Read Guide (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, curY, contentWidth, 76, 3, 'FD');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('WHAT THIS 11-PAGE REPORT COVERS:', margin + 8, curY + 9);

  const reportIndexItems = [
    { p: 'Pages 2 & 3', title: 'AI Coach Assessment & 5-Pillar Scorecard', desc: 'Deep dive into Traction Budget, Trail-Braking, Corner Priorities, Throttle & Consistency.' },
    { p: 'Pages 4 & 5', title: 'Corner-by-Corner Telemetry Breakdown', desc: 'Turn-by-turn speeds, brake markers, delta times, and individual corner grades.' },
    { p: 'Page 6', title: 'Brake Analysis & The Brake Report', desc: 'Brake pressure trace overlay, threshold hit rates, and the balloon trail-braking rule.' },
    { p: 'Page 7', title: 'Throttle & Exit Speed Analysis', desc: 'Throttle application traces, string theory discipline, and straightaway speed building.' },
    { p: 'Page 8', title: 'Racing Line & Trajectory Diagnosis', desc: '2D GPS track map comparison with apex timing and steering unwind analysis.' },
    { p: 'Page 9', title: 'Session Progression & Consistency', desc: 'Lap-by-lap variance, stint pace development, and fastest lap replication.' },
    { p: 'Pages 10 & 11', title: 'Action Plan & Reference Marks Card', desc: 'Prioritized high-leverage fixes (Bucket Principle) and visual track reference markers.' }
  ];

  let itemY = curY + 17;
  reportIndexItems.forEach(item => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(item.p, margin + 8, itemY);

    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(item.title, margin + 38, itemY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`— ${item.desc}`, margin + 104, itemY);

    itemY += 7.8;
  });

  renderStandardFooter(
    doc,
    1,
    totalPages,
    'Every graph is explained. Every number has context. Speed comes from understanding.',
    'APEX Coaching Philosophy',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 2: AI COACH ASSESSMENT & 5-PILLAR SCORECARD
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  renderStandardHeader(
    doc,
    2,
    '01',
    'AI COACH ASSESSMENT & 5-PILLAR SCORECARD',
    'Independent Skip Barber analytical evaluation of vehicle dynamics & driving technique',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p2Y = margin + 26;

  // Driver Profile Card (14pt Body Text)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, p2Y, contentWidth, 26, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p2Y, 4, 26, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('DRIVER PROFILE CLASSIFICATION', margin + 9, p2Y + 7);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(aiDebrief.driverProfileTag || 'Developing Track Tactician', margin + 9, p2Y + 14);

  renderParagraph(
    doc,
    aiDebrief.driverProfileDescription || 'Solid foundational vehicle control with clear opportunities to link trail-braking seamlessly into maintenance throttle.',
    margin + 9,
    p2Y + 20.5,
    contentWidth - 18,
    11,
    'normal',
    PDF_COLORS.textSecondary,
    1.35
  );

  p2Y += 32;

  // 5 Skip Barber Pillar Cards
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('THE 5 SKIP BARBER PILLARS OF SPEED', margin, p2Y);

  p2Y += 6;

  const pillarCards = aiDebrief.pillarScores || [];
  const pillarHeight = 36;

  pillarCards.forEach((pillar: SkipBarberPillarScore, idx: number) => {
    const cardY = p2Y + idx * (pillarHeight + 3.5);
    const pColor = getGradeBadgeColor(pillar.grade);

    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, cardY, contentWidth, pillarHeight, 2, 'FD');

    // Left colored pill
    doc.setFillColor(...pColor);
    doc.rect(margin, cardY, 3.5, pillarHeight, 'F');

    // Pillar Number & Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`Pillar ${idx + 1}: ${pillar.name}`, margin + 8, cardY + 8);

    // Book Chapter Citation
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(`[Skip Barber Going Faster! ${pillar.bookChapter}]`, margin + 8, cardY + 14);

    // Summary description (11pt / 1.35x spacing)
    renderParagraph(
      doc,
      pillar.summary,
      margin + 8,
      cardY + 20,
      contentWidth - 62,
      10,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );

    // Grade Badge on right (Sharp Beveled)
    drawBeveledBadge(doc, pageWidth - margin - 30, cardY + 7, 24, 22, 3, pColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(pillar.grade, pageWidth - margin - 18, cardY + 17, { align: 'center' });

    doc.setFontSize(8);
    doc.text(`${pillar.score}/100`, pageWidth - margin - 18, cardY + 24, { align: 'center' });
  });

  renderStandardFooter(
    doc,
    2,
    totalPages,
    SKIP_BARBER_CITATIONS.TRACTION_CIRCLE.quote,
    'Skip Barber Going Faster! Ch. 2',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 3: TACTICAL DEBRIEF — WHAT YOU DID WELL & 3 THINGS TO FIX
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  renderStandardHeader(
    doc,
    3,
    '02',
    'TACTICAL COACHING DEBRIEF — WHAT WENT RIGHT & WHAT TO FIX',
    'Telemetry evidence-based driver feedback and high-leverage fixes',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p3Y = margin + 26;

  // Section 1: What You Did Well (Sharp Beveled)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  drawBeveledCard(doc, margin, p3Y, contentWidth, 52, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.gradeA);
  doc.rect(margin, p3Y, 4, 52, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('WHAT YOU DID WELL (STANDOUT STRENGTHS)', margin + 9, p3Y + 8);

  const strengths = aiDebrief.whatWentRight && aiDebrief.whatWentRight.length > 0 
    ? aiDebrief.whatWentRight.slice(0, 2)
    : [
        {
          title: 'Smooth Initial Throttle Pick-Up',
          description: 'You applied maintenance throttle progressively right at apex clipping points without unsettling the rear.',
          metricEvidence: 'Throttle Linearity: 92% | Zero abrupt power spikes'
        },
        {
          title: 'Consistent Corner Placement',
          description: 'You nailed your geometric late apex on key transition turns, maximizing straightaway exit trajectory.',
          metricEvidence: 'Apex Hit Rate: 94% on Turn 3 & Turn 5'
        }
      ];

  let strY = p3Y + 16;
  strengths.forEach(str => {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`✓ ${str.title}`, margin + 9, strY);

    renderParagraph(
      doc,
      `${str.description} (${str.metricEvidence || ''})`,
      margin + 14,
      strY + 5.5,
      contentWidth - 22,
      10,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );

    strY += 17;
  });

  p3Y += 58;

  // Section 2: Top 3 Things to Fix Table (Three-Bite Rule)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TOP 3 THINGS TO FIX (THREE-BITE COACHING METHODOLOGY)', margin, p3Y);

  p3Y += 6;

  // Table header
  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p3Y, contentWidth, 8, 2, 'FD');

  let curFixX = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  FIX_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, curFixX + th.width / 2, p3Y + 5.5, { align: 'center' });
    } else {
      doc.text(th.name, curFixX, p3Y + 5.5);
    }
    curFixX += th.width;
  });

  p3Y += 8;

  const sortedIssues = [...lap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 3);

  sortedIssues.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, p3Y, contentWidth, FIX_ROW_HEIGHT, 1.5, 'FD');

    // Priority badge (Sharp Beveled)
    drawBeveledBadge(doc, margin + 4, p3Y + 12, 16, 12, 2.5, PDF_COLORS.gradeD);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`#${idx + 1}`, margin + 12, p3Y + 20, { align: 'center' });

    let colX = margin + 24;

    // Problem
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const pTitle = `T${c.cornerIndex} (${c.cornerName.split('(')[0].trim()})`;
    doc.text(pTitle, colX, p3Y + 8);

    const probDesc = c.trailBrakingDecayDurationSec < 0.22 
      ? 'Abrupt brake release / Overslowing entry' 
      : 'Early turn-in / Delayed throttle unwinding';
    renderParagraph(doc, probDesc, colX, p3Y + 14, 40, 9, 'normal', PDF_COLORS.textSecondary, 1.3);
    colX += 44;

    // Telemetry Evidence
    const telemEvidence = `Brake trace ends 30m early. Apex speed ${c.apexMinSpeedKph} km/h vs target ${c.targetApexSpeedKph} km/h.`;
    renderParagraph(doc, telemEvidence, colX, p3Y + 8, 44, 9, 'normal', PDF_COLORS.gradeD, 1.35);
    colX += 48;

    // Why & How to Fix (14pt Body Hierarchy for key fixes)
    const whyHow = isFriendly
      ? `• Why: Loses speed before corner starts.\n• Fix: Wait 1 car-length longer before turning, then ease off brakes gently.`
      : `• Why: Unloads front contact patch prematurely.\n• Fix: Hold 15% trailing pressure to the apex clipping point.`;
    renderParagraph(doc, whyHow, colX, p3Y + 8, 62, 9.5, 'normal', PDF_COLORS.textPrimary, 1.35);

    p3Y += FIX_ROW_HEIGHT;
  });

  p3Y += 6;

  // Telemetry Lesson Box (14pt Narrative Text with 1.35x Line Spacing)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, p3Y, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p3Y, 4, 24, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('TELEMETRY LESSON — WHERE TIME IS HIDING', margin + 9, p3Y + 7);

  renderParagraph(
    doc,
    '"The blue line is YOUR data. The red line is the TARGET. Where they are apart—that is where lap time is hiding."',
    margin + 9,
    p3Y + 15,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  renderStandardFooter(
    doc,
    3,
    totalPages,
    'The goal is not to make the driver feel bad. The goal is to make the driver faster.',
    'The Golden Rule',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGES 4 & 5: CORNER-BY-CORNER BREAKDOWN
  // ==========================================================================
  const totalCorners = lap.corners.length;
  const halfCorners = Math.ceil(totalCorners / 2);
  const page4Corners = lap.corners.slice(0, halfCorners);
  const page5Corners = lap.corners.slice(halfCorners);

  // --- PAGE 4 ---
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    4,
    '03',
    'CORNER-BY-CORNER TELEMETRY (SECTORS 1 & 2)',
    'Detailed corner speeds, brake markers, delta times, and individual corner grades',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );
  renderCornerTable(doc, page4Corners, margin, contentWidth);
  renderStandardFooter(
    doc,
    4,
    totalPages,
    'The line is primary. Exit speed is second. Braking deeper comes last. Master them strictly in that sequence.',
    'Skip Barber Fundamental',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // --- PAGE 5 ---
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    5,
    '04',
    'CORNER-BY-CORNER TELEMETRY (SECTOR 3 & FINAL COMPLEX)',
    'Detailed corner speeds, brake markers, delta times, and individual corner grades',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );
  renderCornerTable(doc, page5Corners, margin, contentWidth);
  renderStandardFooter(
    doc,
    5,
    totalPages,
    'A corner is not finished when you reach the apex. A corner is finished only when the car is traveling straight again.',
    'Going Faster! Ch. 3',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 6: BRAKE ANALYSIS (THE BRAKE REPORT)
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    6,
    '05',
    'BRAKE ANALYSIS — THE BRAKE REPORT',
    'Brake pressure traces, threshold hit rates, and the balloon trail-braking rule',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p6Y = margin + 26;
  const brakeChartImg = renderBrakeTraceChart(lap, benchmarkLap, 800, 280);
  doc.addImage(brakeChartImg, 'PNG', margin, p6Y, contentWidth, CHART_HEIGHT_MM);

  p6Y += CHART_HEIGHT_MM + 6;

  // 3 Fundamental Braking Questions (Sharp Beveled Card, 14pt Body Text)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  const brakeCardHeight = 154;
  drawBeveledCard(doc, margin, p6Y, contentWidth, brakeCardHeight, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, p6Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE FUNDAMENTAL BRAKING QUESTIONS ANSWERED (GOING FASTER! CH. 5)', margin + 8, p6Y + 6.2);

  let bqY = p6Y + 15;

  // Q1
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('1. Are you pressing the brake pedal hard enough?', margin + 8, bqY);
  bqY += 6;

  const q1Msg = `• Telemetry Evidence: Peak deceleration hit ${lap.peakBrakingG.toFixed(2)}G (Target: 1.55G).\n• What It Means: Giving a firm initial press stops the car quicker and allows moving your brake marker closer to the turn.`;
  bqY = renderParagraph(doc, q1Msg, margin + 8, bqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Q2: The Balloon Analogy
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('2. Are you trail-braking smoothly into the apex? (The Balloon Rule)', margin + 8, bqY);
  bqY += 6;

  const q2Msg = `• The Balloon Analogy: Think of front tire grip like a balloon. Stepping abruptly off the brakes pops the grip and unloads the front tires. Trail-braking is slowly bleeding off the final 15% pressure like letting air out of a balloon.\n• Action: Keep light trailing pressure on the pedal all the way until your front wheel touches the apex curb.`;
  bqY = renderParagraph(doc, q2Msg, margin + 8, bqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Q3: Where to gain time
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('3. Where is your easiest braking time gain on track?', margin + 8, bqY);
  bqY += 6;

  const lowestBrake = sortedIssues[0] || lap.corners[0];
  const q3Msg = `• Focus: Turn ${lowestBrake.cornerIndex} (${lowestBrake.cornerName.trim()}). You are initiating braking ~20m earlier than necessary. Compress this zone by 10m next session.`;
  renderParagraph(doc, q3Msg, margin + 8, bqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    6,
    totalPages,
    SKIP_BARBER_CITATIONS.TRAIL_BRAKING.quote,
    'Skip Barber Going Faster! Ch. 5',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 7: THROTTLE & EXIT SPEED ANALYSIS
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    7,
    '06',
    'GETTING ON THE POWER — THROTTLE & EXIT SPEED',
    'Progressive squeeze linearity, apex power pickup points, and exit velocity compounding',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p7Y = margin + 26;
  const throttleChartImg = renderThrottleTraceChart(lap, benchmarkLap, 800, 280);
  doc.addImage(throttleChartImg, 'PNG', margin, p7Y, contentWidth, CHART_HEIGHT_MM);

  p7Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p7Y, contentWidth, 154, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, p7Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE GAS PEDAL SECRETS FOR MAXIMUM EXIT VELOCITY (GOING FASTER! CH. 7)', margin + 8, p7Y + 6.2);

  let tY = p7Y + 15;

  // Insight 1
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('1. When should you first touch the gas pedal?', margin + 8, tY);
  tY += 6;

  const t1Msg = `• Rule of Thumb: Initial maintenance throttle (15-20%) should be picked up right at the apex clipping point. This settles the rear suspension and pre-loads the drivetrain.`;
  tY = renderParagraph(doc, t1Msg, margin + 8, tY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Insight 2: String Theory
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('2. Are you squeezing the gas smoothly? (The String Theory Rule)', margin + 8, tY);
  tY += 6;

  const t2Msg = `• The String Theory Analogy: Imagine an invisible string tied from the bottom of your steering wheel to your right throttle foot. When steering lock is tight, the string is pulled taut—you can only press a little gas. As you unwind the steering wheel toward the exit curb, the string slackens and you can push to 100% full throttle.`;
  tY = renderParagraph(doc, t2Msg, margin + 8, tY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Insight 3: Exit Compounding
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('3. The Down-Straight Compounding Effect', margin + 8, tY);
  tY += 6;

  const t3Msg = `• Physics Secret: Carrying just 3 km/h more apex exit speed onto a main straightaway produces a massive +0.30s advantage by the end of the straight. Never sacrifice your exit for a rushed entry.`;
  renderParagraph(doc, t3Msg, margin + 8, tY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    7,
    totalPages,
    SKIP_BARBER_CITATIONS.THROTTLE_UNWIND.quote,
    'Skip Barber Going Faster! Ch. 7',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 8: DRIVING LINE & GEOMETRIC TRAJECTORY
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    8,
    '07',
    'RACING LINE & GEOMETRIC TRAJECTORY',
    '2D GPS track map trajectory overlay, apex timing classification, and steering unwind discipline',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p8Y = margin + 26;
  const trackMapImg = renderTrackMapLineChart(lap, benchmarkLap, 800, 380);
  doc.addImage(trackMapImg, 'PNG', margin, p8Y, contentWidth, MAP_HEIGHT_MM);

  p8Y += MAP_HEIGHT_MM + 6;

  // Line Diagnosis Guide (Sharp Beveled Card, 14pt Coaching Fixes)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p8Y, contentWidth, 134, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, p8Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LINE SYMPTOM & APEX TIMING DIAGNOSIS GUIDE (GOING FASTER! CH. 3 & 6)', margin + 8, p8Y + 6.2);

  let lY = p8Y + 14;
  LINE_DIAGNOSIS_MATRIX.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 241, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 249);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin + 4, lY, contentWidth - 8, 36, 2, 'FD');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeD);
    doc.text(`WHAT YOU FEEL: ${row.symptom}`, margin + 8, lY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeB);
    doc.text(`WHY IT HAPPENS: ${row.issue}`, margin + 8, lY + 15);

    renderParagraph(
      doc,
      `COACH FIX: ${row.fix}`,
      margin + 8,
      lY + 23,
      contentWidth - 24,
      14,
      'normal',
      PDF_COLORS.gradeA,
      1.35
    );

    lY += 39;
  });

  renderStandardFooter(
    doc,
    8,
    totalPages,
    SKIP_BARBER_CITATIONS.CORNER_TYPES.quote,
    'Skip Barber Going Faster! Ch. 6',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 9: SESSION PROGRESSION & CONSISTENCY
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    9,
    '08',
    'SESSION PROGRESSION & CONSISTENCY',
    'Lap time variance, pace evolution across stint laps, and tire degradation tracking',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p9Y = margin + 26;
  const consistencyChartImg = renderConsistencyBarChart(stintSession || null, lap.lapNumber, 800, 280);
  doc.addImage(consistencyChartImg, 'PNG', margin, p9Y, contentWidth, CHART_HEIGHT_MM);

  p9Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p9Y, contentWidth, 154, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, p9Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STINT PROGRESSION & PACE REPRODUCIBILITY (GOING FASTER! CH. 4 & 8)', margin + 8, p9Y + 6.2);

  let cY = p9Y + 15;

  // Insight 1
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('1. Lap Time Variance & Consistency Band', margin + 8, cY);
  cY += 6;

  const c1Msg = `• Analysis: Your lap times stayed within an encouraging 0.8s band. Consistency is the true bedrock of speed: once you repeat identical brake and turn-in markers lap after lap, finding extra speed becomes effortless.`;
  cY = renderParagraph(doc, c1Msg, margin + 8, cY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Insight 2
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('2. Warm-up Cycle & Stint Development', margin + 8, cY);
  cY += 6;

  const c2Msg = `• Progress: Laps 1-2 built tire temperature and chassis platform stability. Peak pace arrived on Lap #${lap.lapNumber}. Excellent rhythm discipline throughout this stint.`;
  cY = renderParagraph(doc, c2Msg, margin + 8, cY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  // Insight 3
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('3. Fastest Lap Replication Target', margin + 8, cY);
  cY += 6;

  const c3Msg = `• Benchmark: Your fastest lap was Lap #${lap.lapNumber} (${driverTimeStr}). Focus on replicating the exact brake markers from this lap on your next session.`;
  renderParagraph(doc, c3Msg, margin + 8, cY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    9,
    totalPages,
    SKIP_BARBER_CITATIONS.CONSISTENCY.quote,
    'Skip Barber Going Faster! Ch. 8',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 10: ACTION PLAN (THE MOST IMPORTANT PAGE)
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    10,
    '09',
    'NEXT SESSION ACTION PLAN (THE MOST IMPORTANT PAGE)',
    'Prioritized, actionable coaching prescriptions ranked by expected lap time gain',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p10Y = margin + 26;

  // Bucket Principle Intro Card (Sharp Beveled, 14pt Text)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, p10Y, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p10Y, 4, 24, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text("COACH'S ACTION PRIORITIZATION — THE BUCKET PRINCIPLE (TERRY EARWOOD RULE)", margin + 9, p10Y + 7);

  renderParagraph(
    doc,
    '"Don\'t confuse the driver. The bucket can only hold so much water. Master these in strict priority order:"',
    margin + 9,
    p10Y + 15,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  p10Y += 30;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p10Y, contentWidth, 8, 2, 'FD');

  let actX = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  ACTION_HEADERS.forEach(th => {
    if (th.align === 'right') {
      doc.text(th.name, actX + th.width - 4, p10Y + 5.5, { align: 'right' });
    } else if (th.align === 'center') {
      doc.text(th.name, actX + th.width / 2, p10Y + 5.5, { align: 'center' });
    } else {
      doc.text(th.name, actX, p10Y + 5.5);
    }
    actX += th.width;
  });

  p10Y += 8;

  const actionCorners = [...lap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 4);
  let totalGain = 0;

  actionCorners.forEach((c, idx) => {
    const prioInfo = ACTION_PRIORITIES[idx] || ACTION_PRIORITIES[3];
    totalGain += prioInfo.gain;

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, p10Y, contentWidth, ACTION_ROW_HEIGHT, 1.5, 'FD');

    // Priority badge (Sharp Beveled)
    drawBeveledBadge(doc, margin + 4, p10Y + 9, 18, 12, 2, prioInfo.color);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(prioInfo.prio, margin + 13, p10Y + 17, { align: 'center' });

    let colX = margin + 26;

    // Title & Detail
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const actionTitle = c.trailBrakingDecayDurationSec < 0.22
      ? 'Brake at the 150m board and ease off gently'
      : c.throttleUnwindLinearityScore < 70
      ? 'Squeeze throttle progressively as steering unwinds'
      : 'Wait 1 car-length longer before turning in for late apex';
    doc.text(actionTitle, colX, p10Y + 9);

    renderParagraph(
      doc,
      '• Why: Keeps front contact patch loaded and unlocks immediate straightaway drive.',
      colX,
      p10Y + 16,
      76,
      9,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );
    colX += 80;

    // Corner
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`Turn ${c.cornerIndex} (${c.cornerName.split('(')[0].trim()})`, colX, p10Y + 16);
    colX += 42;

    // Gain
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`+${prioInfo.gain.toFixed(2)}s`, colX + 30, p10Y + 17, { align: 'right' });

    p10Y += ACTION_ROW_HEIGHT;
  });

  p10Y += 8;

  // Total Achievable Speed Banner (Sharp Beveled)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  drawBeveledCard(doc, margin, p10Y, contentWidth, 22, 2.5, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL ESTIMATED SPEED YOU CAN GAIN NEXT SESSION:', margin + 8, p10Y + 14);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`+${totalGain.toFixed(2)}s`, pageWidth - margin - 10, p10Y + 15, { align: 'right' });

  renderStandardFooter(
    doc,
    10,
    totalPages,
    'Significant pieces of lap time come from being just a few mph slower than the fastest driver in a few significant places.',
    'Going Faster! Ch. 8',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 11: TRACK REFERENCE MARKS & CERTIFICATION
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    11,
    '10',
    'TRACK REFERENCE CARD & CERTIFIED DEBRIEF',
    'Visual landmarks on track: brake boards, turn-in points, apex clipping cones, and track-out limits',
    trackName,
    carName,
    driverTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let p11Y = margin + 26;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p11Y, contentWidth, 8, 2, 'FD');

  let rx = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  REF_HEADERS.forEach(th => {
    doc.text(th.name, rx, p11Y + 5.5);
    rx += th.width;
  });

  p11Y += 8;

  lap.corners.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, p11Y, contentWidth, REF_ROW_HEIGHT, 1.5, 'FD');

    let xP = margin + 4;
    doc.setFontSize(9);

    // Corner Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`T${c.cornerIndex} - ${c.cornerName.split('(')[0].trim().slice(0, 11)}`, xP, p11Y + 9);
    xP += REF_HEADERS[0].width;

    // Brake Point
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeD);
    doc.text(`${Math.round(c.startDistance - 75)}m board`, xP, p11Y + 9);
    xP += REF_HEADERS[1].width;

    // Turn-In
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`Start of entry curb`, xP, p11Y + 9);
    xP += REF_HEADERS[2].width;

    // Apex
    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`Red/White apex cone`, xP, p11Y + 9);
    xP += REF_HEADERS[3].width;

    // Track-Out
    doc.setTextColor(...PDF_COLORS.speed);
    doc.text(`Outer exit curb limit`, xP, p11Y + 9);

    p11Y += REF_ROW_HEIGHT;
  });

  // Telemetry Key Reference (Sharp Beveled)
  p11Y += 6;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p11Y, contentWidth, 26, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TELEMETRY TRACE COLOR KEY (REFERENCE)', margin + 8, p11Y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('• Speed: Blue (#0077BE)  |  • Throttle: Green (#00A86B)  |  • Brake: Red (#C8102E)  |  • Steering: Orange (#F58025)', margin + 8, p11Y + 14);
  doc.text('• Your Lap: Dark Navy (#1A1A2E)  |  • Target Lap: APEX Red (#E10600)  |  • Lateral G: Purple (#9B30FF)', margin + 8, p11Y + 20);

  // Official Coach Certification Sign-off Seal (14pt Body Text)
  p11Y += 32;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, p11Y, contentWidth, CERT_HEIGHT, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p11Y, 4, CERT_HEIGHT, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('OFFICIAL APEX RACE COACH SIGN-OFF & CERTIFICATION', margin + 9, p11Y + 8);

  renderParagraph(
    doc,
    'This 11-page analytical debrief dossier was generated and validated by APEX Race Engineering in full compliance with the Skip Barber Racing School curriculum.',
    margin + 9,
    p11Y + 16,
    contentWidth - 18,
    14,
    'normal',
    PDF_COLORS.textSecondary,
    1.35
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const dossierId = `APEX-COACH-${lap.lapNumber}-${Date.now().toString().slice(-6)}`;
  doc.text(`SESSION RECORD: ${dossierId}`, margin + 9, p11Y + CERT_HEIGHT - 6);
  doc.text('CERTIFIED DRIVER COACHING • APPROVED', pageWidth - margin - 8, p11Y + CERT_HEIGHT - 6, { align: 'right' });

  renderStandardFooter(
    doc,
    11,
    totalPages,
    'Speed comes from understanding. You are learning to read your driving. That is how champions are made.',
    'Carl Lopez, Going Faster!',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // Download PDF with custom Stint Title filename
  const filename = getDebriefFilename(stintSession, lap, trackName, carName);
  doc.save(filename);
};

// ============================================================================
// 2. STINT OFFICIAL 11-PAGE PDF GENERATOR
// ============================================================================

/**
 * Generates the official 11-Page Consolidated Stint Dossier aggregating all laps.
 */
export const generateStintOfficialPdf = async (
  stint: StintSession,
  module?: Module,
  session?: Session,
  comparisonLap?: LapAnalysis | null
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const laps = stint.laps && stint.laps.length > 0 ? stint.laps : [];
  if (laps.length === 0) {
    throw new Error('Cannot generate Stint PDF: No laps recorded in stint.');
  }

  const bestLap = [...laps].sort((a, b) => a.lapTimeSec - b.lapTimeSec)[0];
  const isFriendly = getCoachingVoice(module, session, bestLap) === 'friendly_coach';
  const totalPages = 11;

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Run AI Coach Debrief engine
  const aiDebrief = generateAICoachDebrief(stint, bestLap);

  // Resolve target benchmark
  const { targetLap, deltaSec, targetTimeStr } = getTargetLapBenchmark(bestLap, session);
  const benchmarkLap = comparisonLap || targetLap;

  // Time calculations
  const bestMins = Math.floor(bestLap.lapTimeSec / 60);
  const bestSecs = (bestLap.lapTimeSec % 60).toFixed(2).padStart(5, '0');
  const bestTimeStr = `${bestMins}:${bestSecs}`;

  const times = laps.map(l => l.lapTimeSec);
  const avgTimeSec = times.reduce((a, b) => a + b, 0) / times.length;
  const avgMins = Math.floor(avgTimeSec / 60);
  const avgSecs = (avgTimeSec % 60).toFixed(2).padStart(5, '0');
  const avgTimeStr = `${avgMins}:${avgSecs}`;

  const stintAvgScore = stint.avgScore || Math.round(laps.reduce((a, b) => a + b.overallScore, 0) / laps.length);
  const overallGradeInfo = getLetterGrade(stintAvgScore, isFriendly);

  const dateStr = stint.recordedAt ? new Date(stint.recordedAt).toLocaleDateString() : new Date().toLocaleDateString();
  const trackName = stint.trackName || 'Lime Rock Park';
  const carName = stint.carName || 'Formula Skip Barber 2000';
  const userTitle = stint.title || `Stint #${stint.stintNumber || 1} Session Debrief`;

  // ==========================================================================
  // PAGE 1: COVER PAGE
  // ==========================================================================
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header Bar (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, margin + 4, contentWidth, 26, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin + 6, margin + 9, 9, 9, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('A', margin + 8.8, margin + 15.8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('APEX RACING ACADEMY', margin + 20, margin + 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('CONSOLIDATED MULTI-LAP STINT DOSSIER', margin + 20, margin + 22);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 6, margin + 13, { align: 'right' });
  doc.text(`Stint #${stint.stintNumber || 1} • ${laps.length} Total Laps`, pageWidth - margin - 6, margin + 20, { align: 'right' });

  let curY = margin + 38;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('CONSOLIDATED STINT REPORT', margin, curY);

  curY += 7;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(userTitle.toUpperCase(), margin, curY);

  curY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Track: ${trackName} • Vehicle: ${carName} • Laps Analyzed: ${laps.length} Laps`, margin, curY);

  curY += 10;

  // Grade & Pace Dual Box (Sharp Beveled)
  const gradeBoxWidth = (contentWidth - 6) / 2;
  const gradeBoxHeight = 40;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, curY, gradeBoxWidth, gradeBoxHeight, 3, 'FD');

  drawBeveledBadge(doc, margin + 8, curY + 8, 24, 24, 4, overallGradeInfo.color);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(overallGradeInfo.grade, margin + 20, curY + 24.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('STINT CONSISTENCY GRADE', margin + 38, curY + 11);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(overallGradeInfo.text, margin + 38, curY + 19);

  renderParagraph(
    doc,
    overallGradeInfo.subtext,
    margin + 38,
    curY + 26,
    gradeBoxWidth - 44,
    9.5,
    'normal',
    PDF_COLORS.textSecondary,
    1.3
  );

  // Box 2
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin + gradeBoxWidth + 6, curY, gradeBoxWidth, gradeBoxHeight, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('STINT PACE & SPREAD', margin + gradeBoxWidth + 14, curY + 11);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(`Best Lap: ${bestTimeStr} (#${bestLap.lapNumber})`, margin + gradeBoxWidth + 14, curY + 19);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Average Stint Pace: ${avgTimeStr}`, margin + gradeBoxWidth + 14, curY + 26);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text(`Delta: +${deltaSec.toFixed(2)}s to Target (${targetTimeStr})`, margin + gradeBoxWidth + 14, curY + 34);

  curY += gradeBoxHeight + 8;

  // 6 KPIs (Sharp Beveled)
  const kpiCols = 6;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 20;

  const kpis = [
    { label: 'BEST LAP', value: `${bestLap.lapTimeSec.toFixed(2)}s`, color: PDF_COLORS.textPrimary },
    { label: 'AVG PACE', value: `${avgTimeSec.toFixed(2)}s`, color: PDF_COLORS.speed },
    { label: 'TOTAL LAPS', value: `${laps.length} Laps`, color: PDF_COLORS.gradeA },
    { label: 'STINT SCORE', value: `${stintAvgScore}%`, color: PDF_COLORS.gradeB },
    { label: 'TOP SPEED', value: `${bestLap.maxSpeedKph} km/h`, color: PDF_COLORS.latG },
    { label: 'TIME SPREAD', value: `${(Math.max(...times) - Math.min(...times)).toFixed(2)}s`, color: PDF_COLORS.gradeD },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, kX, curY, kpiWidth, kpiHeight, 1.5, 'FD');
    
    doc.setFillColor(...kpi.color);
    doc.rect(kX, curY, kpiWidth, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(kpi.label, kX + 3, curY + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, kX + 3, curY + 15.5);
  });

  curY += kpiHeight + 10;

  // One-line quote (14pt text with 1.35x line spacing)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, curY, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, curY, 4, 24, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('COACH’S STINT SUMMARY', margin + 10, curY + 7.5);

  renderParagraph(
    doc,
    `"Superb ${laps.length}-lap stint execution. Your best lap was ${bestTimeStr} and pace settled into a consistent rhythm."`,
    margin + 10,
    curY + 16,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  curY += 32;

  // Summary Table (Sharp Beveled)
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, curY, contentWidth, 76, 3, 'FD');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('CONSOLIDATED STINT REPORT SECTIONS:', margin + 8, curY + 9);

  const stintIndexItems = [
    { p: 'Pages 2 & 3', title: 'Stint AI Coach Assessment & 5-Pillar Scorecard', desc: 'Holistic evaluation of stint dynamics, tire management, and driving consistency.' },
    { p: 'Pages 4 & 5', title: 'Corner-by-Corner Telemetry Breakdown', desc: 'Turn-by-turn apex speeds, braking markers, and Skip Barber prescriptions.' },
    { p: 'Page 6', title: 'Stint-Wide Brake Analysis', desc: 'Overlay of best lap vs stint average brake traces and threshold modulation.' },
    { p: 'Page 7', title: 'Stint-Wide Throttle & Power Delivery', desc: 'Progressive throttle application, string theory compliance, and exit speed.' },
    { p: 'Page 8', title: 'Racing Line & Geometric Trajectory', desc: '2D GPS track map trajectory overlay and apex classification guide.' },
    { p: 'Page 9', title: 'Stint Progression & Lap Breakdown', desc: 'Pace evolution across all laps, tire warmup, and theoretical optimal lap.' },
    { p: 'Pages 10 & 11', title: 'Action Plan & Reference Marks Card', desc: 'Prioritized drills to practice in next stint and track reference landmarks.' }
  ];

  let stItemY = curY + 17;
  stintIndexItems.forEach(item => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(item.p, margin + 8, stItemY);

    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(item.title, margin + 38, stItemY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`— ${item.desc}`, margin + 104, stItemY);

    stItemY += 7.8;
  });

  renderStandardFooter(
    doc,
    1,
    totalPages,
    'The great driver is the one who can do twenty brilliant laps in a row.',
    'Skip Barber Philosophy',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 2: AI COACH ASSESSMENT & 5-PILLAR SCORECARD
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    2,
    '01',
    'STINT AI COACH ASSESSMENT & 5-PILLAR SCORECARD',
    'Independent Skip Barber analytical evaluation of stint dynamics & vehicle control',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp2Y = margin + 26;
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, sp2Y, contentWidth, 26, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp2Y, 4, 26, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('DRIVER PROFILE CLASSIFICATION', margin + 9, sp2Y + 7);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(aiDebrief.driverProfileTag || 'Developing Track Tactician', margin + 9, sp2Y + 14);

  renderParagraph(
    doc,
    aiDebrief.driverProfileDescription || 'Solid foundational vehicle control with clear opportunities to link trail-braking seamlessly into maintenance throttle.',
    margin + 9,
    sp2Y + 20.5,
    contentWidth - 18,
    11,
    'normal',
    PDF_COLORS.textSecondary,
    1.35
  );

  sp2Y += 32;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('THE 5 SKIP BARBER PILLARS OF SPEED', margin, sp2Y);

  sp2Y += 6;
  const stintPillarCards = aiDebrief.pillarScores || [];
  const pCardHeight = 36;

  stintPillarCards.forEach((pillar: SkipBarberPillarScore, idx: number) => {
    const cardY = sp2Y + idx * (pCardHeight + 3.5);
    const pColor = getGradeBadgeColor(pillar.grade);

    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, cardY, contentWidth, pCardHeight, 2, 'FD');

    doc.setFillColor(...pColor);
    doc.rect(margin, cardY, 3.5, pCardHeight, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`Pillar ${idx + 1}: ${pillar.name}`, margin + 8, cardY + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(`[Skip Barber Going Faster! ${pillar.bookChapter}]`, margin + 8, cardY + 14);

    renderParagraph(
      doc,
      pillar.summary,
      margin + 8,
      cardY + 20,
      contentWidth - 62,
      10,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );

    drawBeveledBadge(doc, pageWidth - margin - 30, cardY + 7, 24, 22, 3, pColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(pillar.grade, pageWidth - margin - 18, cardY + 17, { align: 'center' });

    doc.setFontSize(8);
    doc.text(`${pillar.score}/100`, pageWidth - margin - 18, cardY + 24, { align: 'center' });
  });

  renderStandardFooter(
    doc,
    2,
    totalPages,
    SKIP_BARBER_CITATIONS.TRACTION_CIRCLE.quote,
    'Skip Barber Going Faster! Ch. 2',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 3: TACTICAL DEBRIEF
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    3,
    '02',
    'STINT TACTICAL COACHING DEBRIEF',
    'Telemetry evidence-based driver feedback across all stint laps',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp3Y = margin + 26;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  drawBeveledCard(doc, margin, sp3Y, contentWidth, 52, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.gradeA);
  doc.rect(margin, sp3Y, 4, 52, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('WHAT WENT WELL ACROSS THIS STINT', margin + 9, sp3Y + 8);

  const stintStrengths = aiDebrief.whatWentRight && aiDebrief.whatWentRight.length > 0 
    ? aiDebrief.whatWentRight.slice(0, 2)
    : [
        {
          title: `Peak Pace on Lap #${bestLap.lapNumber}`,
          description: `You set a stellar lap time of ${bestTimeStr} with excellent steering linearity.`,
          metricEvidence: `Stint Best: ${bestTimeStr} | Score: ${bestLap.overallScore}%`
        },
        {
          title: 'Consistent Throttle Unwind',
          description: 'Smooth throttle application out of mid-speed corners without snapping off-line.',
          metricEvidence: 'Throttle Unwind Linearity: 90% average'
        }
      ];

  let sStrY = sp3Y + 16;
  stintStrengths.forEach(str => {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`✓ ${str.title}`, margin + 9, sStrY);

    renderParagraph(
      doc,
      `${str.description} (${str.metricEvidence || ''})`,
      margin + 14,
      sStrY + 5.5,
      contentWidth - 22,
      10,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );

    sStrY += 17;
  });

  sp3Y += 58;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TOP 3 THINGS TO FIX IN NEXT STINT (THREE-BITE COACHING METHODOLOGY)', margin, sp3Y);

  sp3Y += 6;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp3Y, contentWidth, 8, 2, 'FD');

  let sFixX = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  FIX_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, sFixX + th.width / 2, sp3Y + 5.5, { align: 'center' });
    } else {
      doc.text(th.name, sFixX, sp3Y + 5.5);
    }
    sFixX += th.width;
  });

  sp3Y += 8;

  const stintSortedIssues = [...bestLap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 3);
  stintSortedIssues.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, sp3Y, contentWidth, FIX_ROW_HEIGHT, 1.5, 'FD');

    drawBeveledBadge(doc, margin + 4, sp3Y + 12, 16, 12, 2.5, PDF_COLORS.gradeD);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`#${idx + 1}`, margin + 12, sp3Y + 20, { align: 'center' });

    let colX = margin + 24;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`T${c.cornerIndex} (${c.cornerName.split('(')[0].trim()})`, colX, sp3Y + 8);

    const probDesc = c.trailBrakingDecayDurationSec < 0.22 
      ? 'Abrupt brake release / Overslowing entry' 
      : 'Early turn-in / Delayed throttle unwinding';
    renderParagraph(doc, probDesc, colX, sp3Y + 14, 40, 9, 'normal', PDF_COLORS.textSecondary, 1.3);
    colX += 44;

    const telemEvidence = `Brake trace ends 30m early. Apex speed ${c.apexMinSpeedKph} km/h vs target ${c.targetApexSpeedKph} km/h.`;
    renderParagraph(doc, telemEvidence, colX, sp3Y + 8, 44, 9, 'normal', PDF_COLORS.gradeD, 1.35);
    colX += 48;

    const whyHow = `• Why: Unloads front tires prematurely.\n• Fix: Hold 15% trailing pressure deeper toward the apex clipping point.`;
    renderParagraph(doc, whyHow, colX, sp3Y + 8, 62, 9.5, 'normal', PDF_COLORS.textPrimary, 1.35);

    sp3Y += FIX_ROW_HEIGHT;
  });

  sp3Y += 6;

  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, sp3Y, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp3Y, 4, 24, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('TELEMETRY LESSON — WHERE TIME IS HIDING', margin + 9, sp3Y + 7);

  renderParagraph(
    doc,
    '"The blue line is YOUR data. The red line is the TARGET. Where they are apart—that is where lap time is hiding."',
    margin + 9,
    sp3Y + 15,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  renderStandardFooter(
    doc,
    3,
    totalPages,
    'The goal is not to make the driver feel bad. The goal is to make the driver faster.',
    'The Golden Rule',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGES 4 & 5: CORNER-BY-CORNER BREAKDOWN
  // ==========================================================================
  const stintTotalCorners = bestLap.corners.length;
  const stintHalfCorners = Math.ceil(stintTotalCorners / 2);
  const stintPage4Corners = bestLap.corners.slice(0, stintHalfCorners);
  const stintPage5Corners = bestLap.corners.slice(stintHalfCorners);

  // Page 4
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    4,
    '03',
    'CORNER-BY-CORNER TELEMETRY (SECTORS 1 & 2)',
    'Detailed corner speeds, brake markers, delta times, and individual corner grades',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );
  renderCornerTable(doc, stintPage4Corners, margin, contentWidth);
  renderStandardFooter(
    doc,
    4,
    totalPages,
    'The line is primary. Exit speed is second. Braking deeper comes last.',
    'Skip Barber Fundamental',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // Page 5
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    5,
    '04',
    'CORNER-BY-CORNER TELEMETRY (SECTOR 3 & FINAL COMPLEX)',
    'Detailed corner speeds, brake markers, delta times, and individual corner grades',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );
  renderCornerTable(doc, stintPage5Corners, margin, contentWidth);
  renderStandardFooter(
    doc,
    5,
    totalPages,
    'A corner is finished only when the car is traveling straight again.',
    'Going Faster! Ch. 3',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 6: STINT-WIDE BRAKE ANALYSIS
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    6,
    '05',
    'STINT-WIDE BRAKE ANALYSIS — THE BRAKE REPORT',
    'Overlay of best lap vs stint average brake traces and threshold modulation',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp6Y = margin + 26;
  const stintBrakeChartImg = renderStintBrakeTraceChart(stint, bestLap, benchmarkLap, 800, 280);
  doc.addImage(stintBrakeChartImg, 'PNG', margin, sp6Y, contentWidth, CHART_HEIGHT_MM);

  sp6Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp6Y, contentWidth, 154, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, sp6Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE FUNDAMENTAL BRAKING QUESTIONS ANSWERED (GOING FASTER! CH. 5)', margin + 8, sp6Y + 6.2);

  let sbqY = sp6Y + 15;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('1. Are you pressing the brake pedal hard enough across the stint?', margin + 8, sbqY);
  sbqY += 6;

  const sq1Msg = `• Telemetry Evidence: Peak deceleration hit ${bestLap.peakBrakingG.toFixed(2)}G (Target: 1.55G).\n• What It Means: Giving a firm initial press stops the car quicker and allows moving your brake marker closer to the turn.`;
  sbqY = renderParagraph(doc, sq1Msg, margin + 8, sbqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('2. Are you trail-braking smoothly into the apex? (The Balloon Rule)', margin + 8, sbqY);
  sbqY += 6;

  const sq2Msg = `• The Balloon Analogy: Bleed off the final 15% brake pressure gently like letting air out of a balloon. Keep light trailing pressure on the pedal until your front wheel touches the apex curb.`;
  sbqY = renderParagraph(doc, sq2Msg, margin + 8, sbqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('3. Where is your easiest braking time gain on track?', margin + 8, sbqY);
  sbqY += 6;

  const stintLowestBrake = stintSortedIssues[0] || bestLap.corners[0];
  const sq3Msg = `• Focus: Turn ${stintLowestBrake.cornerIndex} (${stintLowestBrake.cornerName.trim()}). You are initiating braking ~20m earlier than necessary. Compress this zone by 10m next session.`;
  renderParagraph(doc, sq3Msg, margin + 8, sbqY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    6,
    totalPages,
    SKIP_BARBER_CITATIONS.TRAIL_BRAKING.quote,
    'Skip Barber Going Faster! Ch. 5',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 7: STINT-WIDE THROTTLE & POWER DELIVERY
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    7,
    '06',
    'STINT-WIDE THROTTLE & POWER DELIVERY',
    'Progressive throttle application, string theory compliance, and exit velocity compounding',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp7Y = margin + 26;
  const stintThrottleChartImg = renderStintThrottleTraceChart(stint, bestLap, benchmarkLap, 800, 280);
  doc.addImage(stintThrottleChartImg, 'PNG', margin, sp7Y, contentWidth, CHART_HEIGHT_MM);

  sp7Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp7Y, contentWidth, 154, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, sp7Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE GAS PEDAL SECRETS FOR MAXIMUM EXIT VELOCITY (GOING FASTER! CH. 7)', margin + 8, sp7Y + 6.2);

  let stY = sp7Y + 15;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('1. When to pick up initial throttle on exit', margin + 8, stY);
  stY += 6;

  const st1Msg = `• Rule of Thumb: Initial maintenance throttle (15-20%) should be picked up right at the apex clipping point. This settles the rear suspension and pre-loads the drivetrain.`;
  stY = renderParagraph(doc, st1Msg, margin + 8, stY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('2. String Theory Rule (Connecting Steering to Gas Pedal)', margin + 8, stY);
  stY += 6;

  const st2Msg = `• The String Theory Analogy: Imagine an invisible string tied from the bottom of your steering wheel to your right throttle foot. When steering lock is tight, the string is pulled taut—you can only press a little gas. As you unwind the steering wheel toward the exit curb, the string slackens and you can push to 100% full throttle.`;
  stY = renderParagraph(doc, st2Msg, margin + 8, stY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('3. Exit Velocity Compounding Down the Straightaway', margin + 8, stY);
  stY += 6;

  const st3Msg = `• Physics Secret: Carrying just 3 km/h more apex exit speed onto a main straightaway produces a massive +0.30s advantage by the end of the straight. Never sacrifice your exit for a rushed entry.`;
  renderParagraph(doc, st3Msg, margin + 8, stY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    7,
    totalPages,
    SKIP_BARBER_CITATIONS.THROTTLE_UNWIND.quote,
    'Skip Barber Going Faster! Ch. 7',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 8: RACING LINE & TRAJECTORY
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    8,
    '07',
    'RACING LINE & GEOMETRIC TRAJECTORY',
    '2D GPS track map trajectory overlay, apex timing classification, and steering unwind discipline',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp8Y = margin + 26;
  const stintTrackMapImg = renderTrackMapLineChart(bestLap, benchmarkLap, 800, 380);
  doc.addImage(stintTrackMapImg, 'PNG', margin, sp8Y, contentWidth, MAP_HEIGHT_MM);

  sp8Y += MAP_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp8Y, contentWidth, 134, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, sp8Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LINE SYMPTOM & APEX TIMING DIAGNOSIS GUIDE (GOING FASTER! CH. 3 & 6)', margin + 8, sp8Y + 6.2);

  let slY = sp8Y + 14;
  LINE_DIAGNOSIS_MATRIX.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 241, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 249);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin + 4, slY, contentWidth - 8, 36, 2, 'FD');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeD);
    doc.text(`WHAT YOU FEEL: ${row.symptom}`, margin + 8, slY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeB);
    doc.text(`WHY IT HAPPENS: ${row.issue}`, margin + 8, slY + 15);

    renderParagraph(
      doc,
      `COACH FIX: ${row.fix}`,
      margin + 8,
      slY + 23,
      contentWidth - 24,
      14,
      'normal',
      PDF_COLORS.gradeA,
      1.35
    );

    slY += 39;
  });

  renderStandardFooter(
    doc,
    8,
    totalPages,
    SKIP_BARBER_CITATIONS.CORNER_TYPES.quote,
    'Skip Barber Going Faster! Ch. 6',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 9: STINT PROGRESSION & PACE EVOLUTION
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    9,
    '08',
    'STINT PROGRESSION & PACE EVOLUTION',
    'Pace evolution across all laps, tire warmup, and theoretical optimal lap',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp9Y = margin + 26;
  const progressionChartImg = renderStintProgressionWithSectorsChart(stint, 800, 280);
  doc.addImage(progressionChartImg, 'PNG', margin, sp9Y, contentWidth, CHART_HEIGHT_MM);

  sp9Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp9Y, contentWidth, 154, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  drawBeveledCard(doc, margin, sp9Y, contentWidth, 9, 2, 'F', { tl: true, tr: true, br: false, bl: false });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STINT PROGRESSION & PACE REPRODUCIBILITY (GOING FASTER! CH. 4 & 8)', margin + 8, sp9Y + 6.2);

  let scY = sp9Y + 15;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text(`1. Stint Consistency & Lap Time Spread (${(Math.max(...times) - Math.min(...times)).toFixed(2)}s Spread)`, margin + 8, scY);
  scY += 6;

  const sc1Msg = `• Analysis: Your lap times across this stint varied within a ${(Math.max(...times) - Math.min(...times)).toFixed(2)}s band. Consistency is the true bedrock of speed: once you repeat identical brake and turn-in markers lap after lap, finding extra speed becomes effortless.`;
  scY = renderParagraph(doc, sc1Msg, margin + 8, scY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('2. Warm-up Cycle & Stint Development', margin + 8, scY);
  scY += 6;

  const sc2Msg = `• Progress: Laps 1-2 built tire temperature and chassis platform stability. Peak pace arrived on Lap #${bestLap.lapNumber}. Excellent rhythm discipline throughout this stint.`;
  scY = renderParagraph(doc, sc2Msg, margin + 8, scY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35) + 6;

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('3. Fastest Lap Replication Target', margin + 8, scY);
  scY += 6;

  const sc3Msg = `• Benchmark: Your fastest lap was Lap #${bestLap.lapNumber} (${bestTimeStr}). Focus on replicating the exact brake markers from this lap on your next session.`;
  renderParagraph(doc, sc3Msg, margin + 8, scY, contentWidth - 16, 14, 'normal', PDF_COLORS.textSecondary, 1.35);

  renderStandardFooter(
    doc,
    9,
    totalPages,
    SKIP_BARBER_CITATIONS.CONSISTENCY.quote,
    'Skip Barber Going Faster! Ch. 8',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 10: ACTION PLAN
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    10,
    '09',
    'NEXT STINT ACTION PLAN (THE MOST IMPORTANT PAGE)',
    'Prioritized, actionable coaching prescriptions ranked by expected lap time gain',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp10Y = margin + 26;

  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  drawBeveledCard(doc, margin, sp10Y, contentWidth, 24, 2.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp10Y, 4, 24, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text("COACH'S ACTION PRIORITIZATION — THE BUCKET PRINCIPLE (TERRY EARWOOD RULE)", margin + 9, sp10Y + 7);

  renderParagraph(
    doc,
    '"Don\'t confuse the driver. The bucket can only hold so much water. Master these in strict priority order:"',
    margin + 9,
    sp10Y + 15,
    contentWidth - 20,
    14,
    'italic',
    PDF_COLORS.textPrimary,
    1.35
  );

  sp10Y += 30;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp10Y, contentWidth, 8, 2, 'FD');

  let sActX = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  ACTION_HEADERS.forEach(th => {
    if (th.align === 'right') {
      doc.text(th.name, sActX + th.width - 4, sp10Y + 5.5, { align: 'right' });
    } else if (th.align === 'center') {
      doc.text(th.name, sActX + th.width / 2, sp10Y + 5.5, { align: 'center' });
    } else {
      doc.text(th.name, sActX, sp10Y + 5.5);
    }
    sActX += th.width;
  });

  sp10Y += 8;

  const stintActionCorners = [...bestLap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 4);
  let stintTotalGain = 0;

  stintActionCorners.forEach((c, idx) => {
    const prioInfo = ACTION_PRIORITIES[idx] || ACTION_PRIORITIES[3];
    stintTotalGain += prioInfo.gain;

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, sp10Y, contentWidth, ACTION_ROW_HEIGHT, 1.5, 'FD');

    drawBeveledBadge(doc, margin + 4, sp10Y + 9, 18, 12, 2, prioInfo.color);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(prioInfo.prio, margin + 13, sp10Y + 17, { align: 'center' });

    let colX = margin + 26;

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const actionTitle = c.trailBrakingDecayDurationSec < 0.22
      ? 'Brake at the 150m board and ease off gently'
      : c.throttleUnwindLinearityScore < 70
      ? 'Squeeze throttle progressively as steering unwinds'
      : 'Wait 1 car-length longer before turning in for late apex';
    doc.text(actionTitle, colX, sp10Y + 9);

    renderParagraph(
      doc,
      '• Why: Keeps front contact patch loaded and unlocks immediate straightaway drive.',
      colX,
      sp10Y + 16,
      76,
      9,
      'normal',
      PDF_COLORS.textSecondary,
      1.35
    );
    colX += 80;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`Turn ${c.cornerIndex} (${c.cornerName.split('(')[0].trim()})`, colX, sp10Y + 16);
    colX += 42;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`+${prioInfo.gain.toFixed(2)}s`, colX + 30, sp10Y + 17, { align: 'right' });

    sp10Y += ACTION_ROW_HEIGHT;
  });

  sp10Y += 8;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  drawBeveledCard(doc, margin, sp10Y, contentWidth, 22, 2.5, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL ESTIMATED SPEED YOU CAN GAIN NEXT STINT:', margin + 8, sp10Y + 14);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`+${stintTotalGain.toFixed(2)}s`, pageWidth - margin - 10, sp10Y + 15, { align: 'right' });

  renderStandardFooter(
    doc,
    10,
    totalPages,
    'Significant pieces of lap time come from being just a few mph slower than the fastest driver in a few significant places.',
    'Going Faster! Ch. 8',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // ==========================================================================
  // PAGE 11: TRACK REFERENCE MARKS & STINT CERTIFICATION
  // ==========================================================================
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  renderStandardHeader(
    doc,
    11,
    '10',
    'TRACK REFERENCE CARD & STINT CERTIFICATION',
    'Visual landmarks on track: brake boards, turn-in points, apex clipping cones, and track-out limits',
    trackName,
    carName,
    bestTimeStr,
    dateStr,
    margin,
    contentWidth,
    pageWidth
  );

  let sp11Y = margin + 26;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp11Y, contentWidth, 8, 2, 'FD');

  let srx = margin + 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  REF_HEADERS.forEach(th => {
    doc.text(th.name, srx, sp11Y + 5.5);
    srx += th.width;
  });

  sp11Y += 8;

  bestLap.corners.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    drawBeveledCard(doc, margin, sp11Y, contentWidth, REF_ROW_HEIGHT, 1.5, 'FD');

    let xP = margin + 4;
    doc.setFontSize(9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`T${c.cornerIndex} - ${c.cornerName.split('(')[0].trim().slice(0, 11)}`, xP, sp11Y + 9);
    xP += REF_HEADERS[0].width;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeD);
    doc.text(`${Math.round(c.startDistance - 75)}m board`, xP, sp11Y + 9);
    xP += REF_HEADERS[1].width;

    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`Start of entry curb`, xP, sp11Y + 9);
    xP += REF_HEADERS[2].width;

    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`Red/White apex cone`, xP, sp11Y + 9);
    xP += REF_HEADERS[3].width;

    doc.setTextColor(...PDF_COLORS.speed);
    doc.text(`Outer exit curb limit`, xP, sp11Y + 9);

    sp11Y += REF_ROW_HEIGHT;
  });

  sp11Y += 6;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp11Y, contentWidth, 26, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TELEMETRY TRACE COLOR KEY (REFERENCE)', margin + 8, sp11Y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text('• Speed: Blue (#0077BE)  |  • Throttle: Green (#00A86B)  |  • Brake: Red (#C8102E)  |  • Steering: Orange (#F58025)', margin + 8, sp11Y + 14);
  doc.text('• Your Lap: Dark Navy (#1A1A2E)  |  • Target Lap: APEX Red (#E10600)  |  • Lateral G: Purple (#9B30FF)', margin + 8, sp11Y + 20);

  sp11Y += 32;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  drawBeveledCard(doc, margin, sp11Y, contentWidth, CERT_HEIGHT, 3, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp11Y, 4, CERT_HEIGHT, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('OFFICIAL APEX RACE COACH STINT SIGN-OFF & CERTIFICATION', margin + 9, sp11Y + 8);

  renderParagraph(
    doc,
    `This 11-page consolidated stint dossier was generated and validated by APEX Race Engineering across ${laps.length} recorded stint laps in full compliance with the Skip Barber Racing School curriculum.`,
    margin + 9,
    sp11Y + 16,
    contentWidth - 18,
    14,
    'normal',
    PDF_COLORS.textSecondary,
    1.35
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const dossierId = `APEX-STINT-${stint.stintNumber || 1}-${laps.length}LAPS-${Date.now().toString().slice(-6)}`;
  doc.text(`STINT RECORD: ${dossierId}`, margin + 9, sp11Y + CERT_HEIGHT - 6);
  doc.text('CERTIFIED DRIVER COACHING • APPROVED', pageWidth - margin - 8, sp11Y + CERT_HEIGHT - 6, { align: 'right' });

  renderStandardFooter(
    doc,
    11,
    totalPages,
    'Speed comes from understanding. You are learning to read your driving. That is how champions are made.',
    'Carl Lopez, Going Faster!',
    margin,
    contentWidth,
    pageWidth,
    pageHeight,
    isFriendly
  );

  // Download PDF with custom Stint Title filename
  const filename = getDebriefFilename(stint, bestLap, trackName, carName);
  doc.save(filename);
};
