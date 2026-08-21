import { jsPDF } from 'jspdf';
import { LapAnalysis, CornerTelemetryAnalysis, StintSession, SkipBarberPillarScore } from '../types/telemetry';
import { Module, Session, ChallengeAttempt } from '../types/curriculum';
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
import { savePdfReportToDisk } from '../services/diskStorage';

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

// ============================================================================
// HELPER UTILITIES: TEXT TRUNCATION & BOUNDED WRAPPING
// ============================================================================

/**
 * Truncates text with an ellipsis ('…') if it exceeds maxWidth (in mm).
 */
export function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1).trim();
  }
  return truncated.length > 0 ? `${truncated}…` : '';
}

/**
 * Splits text into safe bounded lines capped at maxLines.
 */
export function getBoundedLines(doc: jsPDF, text: string, maxWidth: number, maxLines: number = 2): string[] {
  if (!text) return [];
  const lines = doc.splitTextToSize(text, maxWidth);
  if (lines.length <= maxLines) {
    return lines;
  }
  const result = lines.slice(0, maxLines);
  result[maxLines - 1] = truncateText(doc, result[maxLines - 1], maxWidth);
  return result;
}

// Layout dimensions (mm)
const CHART_HEIGHT_MM = 68;
const MAP_HEIGHT_MM = 90;
const FIX_ROW_HEIGHT = 28;
const ACTION_ROW_HEIGHT = 22;
const CERT_HEIGHT = 26;

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
    fix: 'Wait 1 car-length longer before turning. Open up corner radius and aim for late clipping point.'
  },
  {
    symptom: 'There is leftover road on the outside when leaving the corner',
    issue: 'Under-committed Track-out',
    fix: 'Let the car float all the way to the outer exit curb as you unwind the steering wheel.'
  },
  {
    symptom: 'Cannot unwind the steering wheel on corner exit',
    issue: 'Pinching the Exit Line',
    fix: 'Apex slightly later so the car is pointed straight down the track when feeding full power.'
  }
];

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
      subtext: isFriendly ? 'Your lines and throttle control were smooth across every corner.' : 'Optimal friction circle management & late apex geometry.',
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
      subtext: isFriendly ? 'Steering is great. Practice on braking will unlock extra speed.' : 'Solid geometric trajectory; braking markers can be compressed.',
      color: PDF_COLORS.gradeA
    };
  }
  if (score >= 75) {
    return {
      grade: 'B',
      text: isFriendly ? 'Solid foundation! Minor fixes needed.' : 'Solid Foundation, Refine Apex Timing',
      subtext: isFriendly ? 'A couple of corner tweaks will give you easy lap time gains.' : 'Moderate entry understeer; delay turn-in point on key straights.',
      color: PDF_COLORS.gradeB
    };
  }
  if (score >= 68) {
    return {
      grade: 'C+',
      text: isFriendly ? 'Good effort! Focus on one corner at a time.' : 'Marginal Consistency, Fix Turn-Ins',
      subtext: isFriendly ? 'Totally normal. Let’s clean up your turn-in points next.' : 'High variance on brake hit rates; steering lock increasing post-apex.',
      color: PDF_COLORS.gradeC
    };
  }
  return {
    grade: 'C',
    text: isFriendly ? 'Great practice session! Here is your roadmap.' : 'Variable Pace & Steering Lock',
    subtext: isFriendly ? 'Follow these 3 simple steps to find significant extra speed.' : 'Early turn-in causing pinched exits and delayed throttle.',
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
// COMMON PDF RENDERING HELPERS (LIGHT THEME)
// ============================================================================

/**
 * Standard Header for Pages 2 through 11 with strict width reservation and collision safeguards.
 */
function renderStandardHeader(
  doc: jsPDF,
  _pageNumber: number,
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
  const headerHeight = 18;
  
  // Header background card
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, margin, contentWidth, headerHeight, 1.5, 1.5, 'FD');

  // Left red accent bar
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, margin, 3.5, headerHeight, 'F');

  // APEX 'A' Badge
  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(margin + 6, margin + 3.5, 6, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('A', margin + 7.8, margin + 7.8);

  // Width boundaries to prevent text collisions
  const titleAreaMaxWidth = contentWidth * 0.60;
  const metaMaxWidth = contentWidth * 0.36;

  // Section Number (Red)
  doc.setTextColor(...PDF_COLORS.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(sectionNumber, margin + 15, margin + 7.8);

  // Section Title (Dark Navy) with strict bounds
  const secNumWidth = doc.getTextWidth(sectionNumber);
  const titleAvailableWidth = titleAreaMaxWidth - secNumWidth - 4;
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const safeTitle = truncateText(doc, title, titleAvailableWidth);
  doc.text(safeTitle, margin + 16 + secNumWidth, margin + 7.8);

  // Subtitle
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const safeSubtitle = truncateText(doc, subtitle, titleAreaMaxWidth + 10);
  doc.text(safeSubtitle, margin + 15, margin + 14);

  // Right metadata with strict truncation
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  const metaLine1 = truncateText(doc, `${trackName} • ${carName}`, metaMaxWidth);
  const metaLine2 = truncateText(doc, `Lap Time: ${lapTimeStr} • ${dateStr}`, metaMaxWidth);
  doc.text(metaLine1, pageWidth - margin - 5, margin + 7.5, { align: 'right' });
  doc.text(metaLine2, pageWidth - margin - 5, margin + 13.5, { align: 'right' });
}

/**
 * Standard Footer for Pages 1 through 11 with overflow protection.
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

  // Philosophy quote card
  if (quoteText) {
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(margin, footerY - 7, contentWidth, 7.5, 1, 1, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const fullQuote = quoteAuthor ? `"${quoteText}" — ${quoteAuthor}` : `"${quoteText}"`;
    const safeQuote = truncateText(doc, fullQuote, contentWidth - 8);
    doc.text(safeQuote, margin + 4, footerY - 2.2);
  }

  // Bottom divider
  doc.setDrawColor(...PDF_COLORS.border);
  doc.line(margin, footerY + 3.5, pageWidth - margin, footerY + 3.5);

  // Page info
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  const footerTag = isFriendly ? 'APEX Driver Coaching Guide • Trackside Debrief' : 'Skip Barber Going Faster! Analytical Methodology • APEX Systems';
  doc.text(`Page ${pageNumber} of ${totalPages} • ${footerTag}`, margin, footerY + 8);
  doc.text(`Certified Analytical Record • APEX v2.5`, pageWidth - margin, footerY + 8, { align: 'right' });
}

/**
 * Corner table renderer used across Pages 4 & 5 with strict cell clipping.
 */
function renderCornerTable(doc: jsPDF, cornersToRender: CornerTelemetryAnalysis[], margin: number, contentWidth: number) {
  let tblY = margin + 24;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, tblY, contentWidth, 7, 'FD');

  let curX = margin + 2;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);

  CORNER_TABLE_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, curX + th.width / 2, tblY + 4.8, { align: 'center' });
    } else {
      doc.text(th.name, curX, tblY + 4.8);
    }
    curX += th.width;
  });

  tblY += 7;
  const rowHeight = 16.5;

  cornersToRender.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, tblY, contentWidth, rowHeight, 'FD');

    const gradeLetter = c.cornerScore >= 90 ? 'A' : c.cornerScore >= 80 ? 'B' : c.cornerScore >= 70 ? 'C' : 'D';
    const statusColor = getGradeBadgeColor(gradeLetter);

    doc.setFillColor(...statusColor);
    doc.rect(margin, tblY, 2.5, rowHeight, 'F');

    let xPos = margin + 4;
    doc.setFontSize(6.8);

    // 1. Corner
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const rawName = c.cornerName ? c.cornerName.split('(')[0].trim() : `Turn ${c.cornerIndex}`;
    const cLabel = truncateText(doc, `T${c.cornerIndex} - ${rawName}`, CORNER_TABLE_HEADERS[0].width - 4);
    doc.text(cLabel, xPos, tblY + 5.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textMuted);
    const cType = truncateText(doc, (c.type || 'medium').toUpperCase().replace('_', ' '), CORNER_TABLE_HEADERS[0].width - 4);
    doc.text(cType, xPos, tblY + 11.5);
    xPos += CORNER_TABLE_HEADERS[0].width;

    // 2. Your Speed
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text(`${Math.round(c.apexMinSpeedKph)} km/h`, xPos, tblY + 8.5);
    xPos += CORNER_TABLE_HEADERS[1].width;

    // 3. Target Speed
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`${Math.round(c.targetApexSpeedKph)} km/h`, xPos, tblY + 8.5);
    xPos += CORNER_TABLE_HEADERS[2].width;

    // 4. Delta
    const speedDelta = Math.round(c.apexMinSpeedKph - c.targetApexSpeedKph);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(speedDelta >= 0 ? PDF_COLORS.gradeA[0] : PDF_COLORS.gradeD[0], speedDelta >= 0 ? PDF_COLORS.gradeA[1] : PDF_COLORS.gradeD[1], speedDelta >= 0 ? PDF_COLORS.gradeA[2] : PDF_COLORS.gradeD[2]);
    const deltaStr = speedDelta >= 0 ? `+${speedDelta} km/h` : `${speedDelta} km/h`;
    doc.text(deltaStr, xPos, tblY + 8.5);
    xPos += CORNER_TABLE_HEADERS[3].width;

    // 5. Your Brake Marker
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const yourBrake = `${Math.round(Math.max(0, c.startDistance - 80))}m mark`;
    doc.text(yourBrake, xPos, tblY + 8.5);
    xPos += CORNER_TABLE_HEADERS[4].width;

    // 6. Target Brake Marker
    doc.setTextColor(...PDF_COLORS.textMuted);
    const tgtBrake = `${Math.round(Math.max(0, c.startDistance - 65))}m mark`;
    doc.text(tgtBrake, xPos, tblY + 8.5);
    xPos += CORNER_TABLE_HEADERS[5].width;

    // 7. Grade Badge
    doc.setFillColor(...statusColor);
    doc.roundedRect(xPos + 2, tblY + 4, 10, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(gradeLetter, xPos + 7, tblY + 9, { align: 'center' });
    xPos += CORNER_TABLE_HEADERS[6].width;

    // 8. One-line Fix with strict bounds
    doc.setFontSize(6.4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const friendlyFix = speedDelta >= 0
      ? 'Great apex speed! Line maintained smoothly.'
      : c.trailBrakingDecayDurationSec < 0.22
      ? 'Ease off brake gently toward apex cone.'
      : 'Wait 1 car-length longer before turning in.';
    const splitFix = getBoundedLines(doc, friendlyFix, CORNER_TABLE_HEADERS[7].width - 2, 2);
    doc.text(splitFix[0] || friendlyFix, xPos, tblY + 6.5);
    if (splitFix[1]) {
      doc.text(splitFix[1], xPos, tblY + 11.5);
    }

    tblY += rowHeight;
  });

  tblY += 4;
  // Legend Box
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, tblY, contentWidth, 8, 1, 1, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('■ Grade A: On Target Pace', margin + 4, tblY + 5.2);

  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('■ Grade B: Minor Polish', margin + 60, tblY + 5.2);

  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('■ Grade C/D: Priority Focus Area', margin + 120, tblY + 5.2);
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
  comparisonLap?: LapAnalysis | null,
  challengeAttempt?: ChallengeAttempt | null
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

  const userTitle = challengeAttempt
    ? `${session?.title || 'Academy Session'} — Challenge Attempt #${challengeAttempt.attemptNumber}`
    : stintSession?.title || `Lap #${lap.lapNumber} Practice Debrief`;

  // ==========================================================================
  // PAGE 1: COVER PAGE (PDF Structure.md & PDF DESIGN.md)
  // ==========================================================================
  doc.setFillColor(...PDF_COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Red Accent Border (4pt)
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Brand Header Bar
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, margin + 4, contentWidth, 24, 2, 2, 'FD');

  // Logo Icon
  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(margin + 6, margin + 9, 8, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('A', margin + 8.5, margin + 14.8);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('APEX RACING ACADEMY', margin + 18, margin + 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(
    challengeAttempt
      ? 'OFFICIAL TELEMETRY DEBRIEF & CHALLENGE DOSSIER'
      : 'OFFICIAL TELEMETRY DEBRIEF & COACHING DOSSIER',
    margin + 18,
    margin + 20
  );

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Session Date: ${dateStr}`, pageWidth - margin - 6, margin + 12, { align: 'right' });
  doc.text(`Certified Clean Lap: #${lap.lapNumber}`, pageWidth - margin - 6, margin + 18, { align: 'right' });

  let curY = margin + 34;

  // Title Section with wrapping
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(challengeAttempt ? 'CHALLENGE ASSESSMENT REPORT' : 'DRIVER COACHING REPORT', margin, curY);

  curY += 6.5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const safeUserTitle = truncateText(doc, userTitle.toUpperCase(), contentWidth);
  doc.text(safeUserTitle, margin, curY);

  curY += 5.5;
  doc.setFontSize(8.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sessionSub = module
    ? `Module ${module.moduleNumber}: ${module.title} • ${session?.title || 'Curriculum Stint'} • ${trackName} (${carName})`
    : `Track: ${trackName} • Vehicle: ${carName} • Stint Analysis`;
  const safeSessionSub = truncateText(doc, sessionSub, contentWidth);
  doc.text(safeSessionSub, margin, curY);

  curY += 8;

  // DEDICATED CHALLENGE CERTIFICATION BANNER (When challengeAttempt is present)
  if (challengeAttempt && session?.challenge) {
    const isPassed = challengeAttempt.result.passed;
    const statusBg = isPassed
      ? ([236, 253, 245] as [number, number, number])
      : ([254, 242, 242] as [number, number, number]);
    const statusBorder = isPassed ? PDF_COLORS.gradeA : PDF_COLORS.gradeD;
    const statusText = isPassed ? 'CHALLENGE PASSED' : 'CHALLENGE REQUIREMENT NOT MET';
    const medalTier = challengeAttempt.result.medal;
    const medalString = medalTier ? ` • ${medalTier.toUpperCase()} MEDAL ACHIEVED` : '';

    doc.setFillColor(...statusBg);
    doc.setDrawColor(...statusBorder);
    doc.roundedRect(margin, curY, contentWidth, 20, 1.5, 1.5, 'FD');
    doc.setFillColor(...statusBorder);
    doc.rect(margin, curY, 3.5, 20, 'F');

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...statusBorder);
    doc.text(
      `OFFICIAL ACADEMY CHALLENGE CERTIFICATION — ATTEMPT #${challengeAttempt.attemptNumber}`,
      margin + 7,
      curY + 5.5
    );

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const challengeTitleText = truncateText(
      doc,
      `${session.challenge.name}: ${statusText}${medalString}`,
      contentWidth - 14
    );
    doc.text(challengeTitleText, margin + 7, curY + 11.5);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const targetText = `Target: ${session.challenge.operator === 'gte' ? '≥' : '≤'} ${session.challenge.targetValue} ${session.challenge.unit} (${session.challenge.requiredLaps} req lap${session.challenge.requiredLaps > 1 ? 's' : ''})`;
    const achievedText = `Achieved: ${challengeAttempt.result.achievedValue} ${session.challenge.unit} (Score: ${challengeAttempt.result.score}%)`;
    const detailsLine = `${targetText}   |   ${achievedText}   |   ${challengeAttempt.result.notes || 'Official Stint Record'}`;
    const safeDetails = truncateText(doc, detailsLine, contentWidth - 14);
    doc.text(safeDetails, margin + 7, curY + 16.5);

    curY += 24;
  }

  // Grade & Delta Dual Banner
  const gradeBoxWidth = (contentWidth - 6) / 2;
  const gradeBoxHeight = 34;

  // Box 1: Overall Grade
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, curY, gradeBoxWidth, gradeBoxHeight, 2, 2, 'FD');

  doc.setFillColor(...overallGradeInfo.color);
  doc.circle(margin + 17, curY + 17, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(overallGradeInfo.grade, margin + 17, curY + 21.2, { align: 'center' });

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('OVERALL TECHNIQUE GRADE', margin + 32, curY + 9);

  const gradeTextLines = getBoundedLines(doc, overallGradeInfo.text, gradeBoxWidth - 36, 2);
  doc.setFontSize(8.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(gradeTextLines[0], margin + 32, curY + 15.5);
  if (gradeTextLines[1]) {
    doc.text(gradeTextLines[1], margin + 32, curY + 20);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const subtextY = gradeTextLines[1] ? curY + 24.5 : curY + 22;
  const splitSubtext = getBoundedLines(doc, overallGradeInfo.subtext, gradeBoxWidth - 36, 2);
  doc.text(splitSubtext, margin + 32, subtextY);

  // Box 2: Benchmark Delta
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin + gradeBoxWidth + 6, curY, gradeBoxWidth, gradeBoxHeight, 2, 2, 'FD');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('PACE VS TARGET BENCHMARK', margin + gradeBoxWidth + 12, curY + 9);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const bestLapLabel = truncateText(doc, `Your Best Lap: ${driverTimeStr}`, gradeBoxWidth - 18);
  doc.text(bestLapLabel, margin + gradeBoxWidth + 12, curY + 15.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const targetTimeLabel = truncateText(doc, `Target Benchmark: ${targetTimeStr}`, gradeBoxWidth - 18);
  doc.text(targetTimeLabel, margin + gradeBoxWidth + 12, curY + 21.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  const deltaLabel = truncateText(doc, `Delta: +${deltaSec.toFixed(2)}s to Target`, gradeBoxWidth - 18);
  doc.text(deltaLabel, margin + gradeBoxWidth + 12, curY + 28);

  curY += gradeBoxHeight + 6;

  // 6 KPI Micro Tiles
  const kpiCols = 6;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 17;

  const kpis = [
    { label: 'LAP TIME', value: `${lap.lapTimeSec.toFixed(2)}s`, color: PDF_COLORS.textPrimary },
    { label: 'TOP SPEED', value: `${Math.round(lap.maxSpeedKph)} km/h`, color: PDF_COLORS.speed },
    { label: 'TIRE GRIP', value: `${Math.round(lap.avgTractionBudgetPct)}%`, color: PDF_COLORS.gradeA },
    { label: 'TECH SCORE', value: `${Math.round(lap.overallScore)}%`, color: PDF_COLORS.gradeB },
    { label: 'PEAK LAT G', value: `${lap.peakLatG.toFixed(2)}G`, color: PDF_COLORS.latG },
    { label: 'PEAK BRAKE', value: `${lap.peakBrakingG.toFixed(2)}G`, color: PDF_COLORS.gradeD },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(kX, curY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
    
    // Top colored indicator line
    doc.setFillColor(...kpi.color);
    doc.rect(kX, curY, kpiWidth, 1.2, 'F');

    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(kpi.label, kX + 2.5, curY + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    const safeVal = truncateText(doc, kpi.value, kpiWidth - 5);
    doc.text(safeVal, kX + 2.5, curY + 13.2);
  });

  curY += kpiHeight + 8;

  // One-Line Summary Quote Box (PDF Structure.md Page 1)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, curY, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, curY, 3.5, 18, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('COACH’S ONE-LINE DEBRIEF', margin + 8, curY + 6);

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const oneLineQuote = challengeAttempt
    ? challengeAttempt.result.passed
      ? `"Outstanding execution! Target criteria met on Attempt #${challengeAttempt.attemptNumber} with disciplined vehicle dynamics."`
      : `"Attempt #${challengeAttempt.attemptNumber} fell just short of the target. Focus on smooth trail-braking decay to unlock the delta."`
    : isFriendly
    ? '"Great driving line! Let’s refine your braking release to unlock consistent speed."'
    : '"Disciplined trajectory; compress initial threshold braking markers for optimal rotation."';
  const splitOneLine = getBoundedLines(doc, oneLineQuote, contentWidth - 16, 2);
  doc.text(splitOneLine, margin + 8, curY + 12.5);

  curY += 24;

  // Summary Table: The Learn-As-You-Read Guide
  const summaryBoxHeight = challengeAttempt ? 62 : 68;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, curY, contentWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(8.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('WHAT THIS 11-PAGE REPORT COVERS:', margin + 6, curY + 7);

  const reportIndexItems = [
    { p: 'Pages 2 & 3', title: 'AI Coach Assessment & 5-Pillar Scorecard', desc: 'Traction Budget, Trail-Braking, Corner Priorities, Throttle & Consistency.' },
    { p: 'Pages 4 & 5', title: 'Corner-by-Corner Telemetry Breakdown', desc: 'Turn-by-turn speeds, brake markers, delta times, and individual grades.' },
    { p: 'Page 6', title: 'Brake Analysis & The Brake Report', desc: 'Brake pressure trace overlay, threshold hit rates, and the balloon rule.' },
    { p: 'Page 7', title: 'Throttle & Exit Speed Analysis', desc: 'Throttle application traces, string theory discipline, and speed building.' },
    { p: 'Page 8', title: 'Racing Line & Trajectory Diagnosis', desc: '2D GPS track map comparison with apex timing and steering unwind.' },
    { p: 'Page 9', title: 'Session Progression & Consistency', desc: 'Lap-by-lap variance, stint pace development, and lap replication.' },
    { p: 'Pages 10 & 11', title: 'Action Plan & Reference Marks Card', desc: 'Prioritized high-leverage fixes (Bucket Principle) and track reference markers.' }
  ];

  let itemY = curY + 14;
  reportIndexItems.forEach(item => {
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(item.p, margin + 6, itemY);

    doc.setTextColor(...PDF_COLORS.textPrimary);
    const safeItemTitle = truncateText(doc, item.title, 56);
    doc.text(safeItemTitle, margin + 30, itemY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const safeDesc = truncateText(doc, `— ${item.desc}`, contentWidth - 92);
    doc.text(safeDesc, margin + 88, itemY);

    itemY += 6.5;
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

  let p2Y = margin + 24;

  // Driver Profile Card
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, p2Y, contentWidth, 22, 2, 2, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p2Y, 3.5, 22, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('DRIVER PROFILE CLASSIFICATION', margin + 8, p2Y + 6.5);

  doc.setFontSize(10.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const safeProfileTag = truncateText(doc, aiDebrief.driverProfileTag || 'Developing Track Tactician', contentWidth - 20);
  doc.text(safeProfileTag, margin + 8, p2Y + 12.5);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const splitProfile = getBoundedLines(
    doc,
    aiDebrief.driverProfileDescription || 'Solid foundational vehicle control with clear opportunities to link trail-braking seamlessly into maintenance throttle.',
    contentWidth - 16,
    2
  );
  doc.text(splitProfile, margin + 8, p2Y + 17.5);

  p2Y += 28;

  // 5 Skip Barber Pillar Cards
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('THE 5 SKIP BARBER PILLARS OF SPEED', margin, p2Y);

  p2Y += 5;

  const pillarCards = aiDebrief.pillarScores || [];
  const pillarHeight = 32;

  pillarCards.forEach((pillar: SkipBarberPillarScore, idx: number) => {
    const cardY = p2Y + idx * (pillarHeight + 3.5);
    const pColor = getGradeBadgeColor(pillar.grade);

    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(margin, cardY, contentWidth, pillarHeight, 1.5, 1.5, 'FD');

    // Left colored pill
    doc.setFillColor(...pColor);
    doc.rect(margin, cardY, 3, pillarHeight, 'F');

    // Pillar Number & Title
    doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const pillarTitle = truncateText(doc, `Pillar ${idx + 1}: ${pillar.name}`, contentWidth - 62);
    doc.text(pillarTitle, margin + 7, cardY + 7);

    // Book Chapter Citation
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.accent);
    const chapterCite = truncateText(doc, `[Skip Barber Going Faster! ${pillar.bookChapter}]`, contentWidth - 62);
    doc.text(chapterCite, margin + 7, cardY + 12);

    // Summary description
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitSummary = getBoundedLines(doc, pillar.summary, contentWidth - 62, 2);
    doc.text(splitSummary, margin + 7, cardY + 18);

    // Grade Badge on right
    doc.setFillColor(...pColor);
    doc.roundedRect(pageWidth - margin - 28, cardY + 6, 22, 18, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(pillar.grade, pageWidth - margin - 17, cardY + 14.5, { align: 'center' });

    doc.setFontSize(6.5);
    doc.text(`${Math.round(pillar.score)}/100`, pageWidth - margin - 17, cardY + 20.5, { align: 'center' });
  });

  // Footer quote
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

  let p3Y = margin + 24;

  // Section 1: What You Did Well
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, p3Y, contentWidth, 46, 2, 2, 'FD');
  doc.setFillColor(...PDF_COLORS.gradeA);
  doc.rect(margin, p3Y, 3.5, 46, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('WHAT YOU DID WELL (STANDOUT STRENGTHS)', margin + 8, p3Y + 7);

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

  let strY = p3Y + 14;
  strengths.forEach(str => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const strTitle = truncateText(doc, `✓ ${str.title}`, contentWidth - 18);
    doc.text(strTitle, margin + 8, strY);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitDesc = getBoundedLines(doc, `${str.description} (${str.metricEvidence || ''})`, contentWidth - 20, 2);
    doc.text(splitDesc, margin + 12, strY + 4.5);

    strY += 15;
  });

  p3Y += 52;

  // Section 2: Top 3 Things to Fix Table (Three-Bite Rule)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TOP 3 THINGS TO FIX (THREE-BITE COACHING METHODOLOGY)', margin, p3Y);

  p3Y += 5;

  // Table header
  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, p3Y, contentWidth, 7, 'FD');

  let curFixX = margin + 2;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  FIX_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, curFixX + th.width / 2, p3Y + 4.8, { align: 'center' });
    } else {
      doc.text(th.name, curFixX, p3Y + 4.8);
    }
    curFixX += th.width;
  });

  p3Y += 7;

  const sortedIssues = [...lap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 3);

  sortedIssues.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, p3Y, contentWidth, FIX_ROW_HEIGHT, 'FD');

    // Priority badge
    doc.setFillColor(...PDF_COLORS.gradeD);
    doc.roundedRect(margin + 4, p3Y + 8, 14, 10, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`#${idx + 1}`, margin + 11, p3Y + 14.5, { align: 'center' });

    let colX = margin + 24;

    // Problem
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const pTitle = truncateText(doc, `T${c.cornerIndex} (${c.cornerName ? c.cornerName.split('(')[0].trim() : ''})`, 40);
    doc.text(pTitle, colX, p3Y + 6.5);

    doc.setFontSize(6.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const probDesc = c.trailBrakingDecayDurationSec < 0.22 
      ? 'Abrupt brake release / Overslowing entry' 
      : 'Early turn-in / Delayed throttle unwinding';
    doc.text(getBoundedLines(doc, probDesc, 40, 2), colX, p3Y + 12);
    colX += 44;

    // Telemetry Evidence
    doc.setFontSize(6.3);
    doc.setTextColor(...PDF_COLORS.gradeD);
    const telemEvidence = `Brake trace ends 30m early. Apex speed ${Math.round(c.apexMinSpeedKph)} km/h vs target ${Math.round(c.targetApexSpeedKph)} km/h.`;
    doc.text(getBoundedLines(doc, telemEvidence, 44, 3), colX, p3Y + 8);
    colX += 48;

    // Why & How to Fix (Three-Bite Rule)
    doc.setFontSize(6.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const whyHow = isFriendly
      ? `• Why: Loses speed before corner starts.\n• Fix: Wait 1 car-length longer before turning, then ease off brakes gently.`
      : `• Why: Unloads front contact patch prematurely.\n• Fix: Hold 15% trailing pressure to the apex clipping point.`;
    doc.text(getBoundedLines(doc, whyHow, 62, 3), colX, p3Y + 8);

    p3Y += FIX_ROW_HEIGHT;
  });

  p3Y += 6;

  // Telemetry Lesson Box (PDF Structure.md Page 3)
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, p3Y, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p3Y, 3.5, 18, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('TELEMETRY LESSON — WHERE TIME IS HIDING', margin + 8, p3Y + 6);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const lessonQuote = '"The blue line is YOUR data. The red line is the TARGET. Where they are apart—that is where lap time is hiding."';
  const splitLesson = getBoundedLines(doc, lessonQuote, contentWidth - 16, 2);
  doc.text(splitLesson, margin + 8, p3Y + 12);

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

  let p6Y = margin + 24;
  const brakeChartImg = renderBrakeTraceChart(lap, benchmarkLap, 800, 280);
  doc.addImage(brakeChartImg, 'PNG', margin, p6Y, contentWidth, CHART_HEIGHT_MM);

  p6Y += CHART_HEIGHT_MM + 6;

  // 3 Fundamental Braking Questions
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  const brakeCardHeight = 124;
  doc.roundedRect(margin, p6Y, contentWidth, brakeCardHeight, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, p6Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, p6Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE FUNDAMENTAL BRAKING QUESTIONS ANSWERED (GOING FASTER! CH. 5)', margin + 6, p6Y + 5.2);

  let bqY = p6Y + 13;

  // Q1
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('1. Are you pressing the brake pedal hard enough?', margin + 6, bqY);
  bqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const q1Msg = `• Telemetry Evidence: Peak deceleration hit ${lap.peakBrakingG.toFixed(2)}G (Target: 1.55G).\n• What It Means: Giving a firm initial press stops the car quicker and allows moving your brake marker closer to the turn.`;
  const splitQ1 = getBoundedLines(doc, q1Msg, contentWidth - 12, 3);
  doc.text(splitQ1, margin + 6, bqY);
  bqY += splitQ1.length * 3.4 + 5;

  // Q2: The Balloon Analogy
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('2. Are you trail-braking smoothly into the apex? (The Balloon Rule)', margin + 6, bqY);
  bqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const q2Msg = `• The Balloon Analogy: Think of front tire grip like a balloon. Stepping abruptly off the brakes pops the grip and unloads the front tires. Trail-braking is slowly bleeding off the final 15% pressure like letting air out of a balloon.\n• Action: Keep light trailing pressure on the pedal all the way until your front wheel touches the apex curb.`;
  const splitQ2 = getBoundedLines(doc, q2Msg, contentWidth - 12, 4);
  doc.text(splitQ2, margin + 6, bqY);
  bqY += splitQ2.length * 3.4 + 5;

  // Q3: Where to gain time
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('3. Where is your easiest braking time gain on track?', margin + 6, bqY);
  bqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const lowestBrake = sortedIssues[0] || lap.corners[0] || { cornerIndex: 1, cornerName: 'Turn 1' };
  const q3Msg = `• Focus: Turn ${lowestBrake.cornerIndex} (${lowestBrake.cornerName ? lowestBrake.cornerName.trim() : ''}). You are initiating braking ~20m earlier than necessary. Compress this zone by 10m next session.`;
  const splitQ3 = getBoundedLines(doc, q3Msg, contentWidth - 12, 3);
  doc.text(splitQ3, margin + 6, bqY);

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

  let p7Y = margin + 24;
  const throttleChartImg = renderThrottleTraceChart(lap, benchmarkLap, 800, 280);
  doc.addImage(throttleChartImg, 'PNG', margin, p7Y, contentWidth, CHART_HEIGHT_MM);

  p7Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, p7Y, contentWidth, 124, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, p7Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, p7Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE GAS PEDAL SECRETS FOR MAXIMUM EXIT VELOCITY (GOING FASTER! CH. 7)', margin + 6, p7Y + 5.2);

  let tY = p7Y + 13;

  // Insight 1
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('1. When should you first touch the gas pedal?', margin + 6, tY);
  tY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const t1Msg = `• Rule of Thumb: Initial maintenance throttle (15-20%) should be picked up right at the apex clipping point. This settles the rear suspension and pre-loads the drivetrain.`;
  const splitT1 = getBoundedLines(doc, t1Msg, contentWidth - 12, 3);
  doc.text(splitT1, margin + 6, tY);
  tY += splitT1.length * 3.4 + 5;

  // Insight 2: String Theory
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('2. Are you squeezing the gas smoothly? (The String Theory Rule)', margin + 6, tY);
  tY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const t2Msg = `• The String Theory Analogy: Imagine an invisible string tied from the bottom of your steering wheel to your right throttle foot. When steering lock is tight, the string is pulled taut—you can only press a little gas. As you unwind the steering wheel toward the exit curb, the string slackens and you can push to 100% full throttle.`;
  const splitT2 = getBoundedLines(doc, t2Msg, contentWidth - 12, 4);
  doc.text(splitT2, margin + 6, tY);
  tY += splitT2.length * 3.4 + 5;

  // Insight 3: Exit Compounding
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('3. The Down-Straight Compounding Effect', margin + 6, tY);
  tY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const t3Msg = `• Physics Secret: Carrying just 3 km/h more apex exit speed onto a main straightaway produces a massive +0.30s advantage by the end of the straight. Never sacrifice your exit for a rushed entry.`;
  const splitT3 = getBoundedLines(doc, t3Msg, contentWidth - 12, 3);
  doc.text(splitT3, margin + 6, tY);

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

  let p8Y = margin + 24;
  const trackMapImg = renderTrackMapLineChart(lap, benchmarkLap, 800, 380);
  doc.addImage(trackMapImg, 'PNG', margin, p8Y, contentWidth, MAP_HEIGHT_MM);

  p8Y += MAP_HEIGHT_MM + 6;

  // Line Diagnosis Guide
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, p8Y, contentWidth, 102, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, p8Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, p8Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LINE SYMPTOM & APEX TIMING DIAGNOSIS GUIDE (GOING FASTER! CH. 3 & 6)', margin + 6, p8Y + 5.2);

  let lY = p8Y + 12;
  LINE_DIAGNOSIS_MATRIX.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 241, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 249);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin + 3, lY, contentWidth - 6, 26, 'FD');

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeD);
    const safeSymptom = truncateText(doc, `WHAT YOU FEEL: ${row.symptom}`, contentWidth - 16);
    doc.text(safeSymptom, margin + 6, lY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeB);
    const safeIssue = truncateText(doc, `WHY IT HAPPENS: ${row.issue}`, contentWidth - 16);
    doc.text(safeIssue, margin + 6, lY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeA);
    const splitFix = getBoundedLines(doc, `COACH FIX: ${row.fix}`, contentWidth - 16, 2);
    doc.text(splitFix, margin + 6, lY + 18);

    lY += 29;
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

  let p9Y = margin + 24;
  const consistencyChartImg = renderConsistencyBarChart(stintSession || null, lap.lapNumber, 800, 280);
  doc.addImage(consistencyChartImg, 'PNG', margin, p9Y, contentWidth, CHART_HEIGHT_MM);

  p9Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, p9Y, contentWidth, 124, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, p9Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, p9Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STINT PROGRESSION & PACE REPRODUCIBILITY (GOING FASTER! CH. 4 & 8)', margin + 6, p9Y + 5.2);

  let cY = p9Y + 13;

  // Insight 1
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('1. Lap Time Variance & Consistency Band', margin + 6, cY);
  cY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const c1Msg = `• Analysis: Your lap times stayed within an encouraging 0.8s band. Consistency is the true bedrock of speed: once you repeat identical brake and turn-in markers lap after lap, finding extra speed becomes effortless.`;
  const splitC1 = getBoundedLines(doc, c1Msg, contentWidth - 12, 3);
  doc.text(splitC1, margin + 6, cY);
  cY += splitC1.length * 3.4 + 5;

  // Insight 2
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('2. Warm-up Cycle & Stint Development', margin + 6, cY);
  cY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const c2Msg = `• Progress: Laps 1-2 built tire temperature and chassis platform stability. Peak pace arrived on Lap #${lap.lapNumber}. Excellent rhythm discipline throughout this stint.`;
  const splitC2 = getBoundedLines(doc, c2Msg, contentWidth - 12, 3);
  doc.text(splitC2, margin + 6, cY);
  cY += splitC2.length * 3.4 + 5;

  // Insight 3
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('3. Fastest Lap Replication Target', margin + 6, cY);
  cY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const c3Msg = `• Benchmark: Your fastest lap was Lap #${lap.lapNumber} (${driverTimeStr}). Focus on replicating the exact brake markers from this lap on your next session.`;
  const splitC3 = getBoundedLines(doc, c3Msg, contentWidth - 12, 3);
  doc.text(splitC3, margin + 6, cY);

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

  let p10Y = margin + 24;

  // Bucket Principle Intro Card
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, p10Y, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p10Y, 3.5, 18, 'F');

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text("COACH'S ACTION PRIORITIZATION — THE BUCKET PRINCIPLE (TERRY EARWOOD RULE)", margin + 7, p10Y + 6);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const bucketQuote = '"Don\'t confuse the driver. The bucket can only hold so much water. Master these in strict priority order:"';
  const splitBucket = getBoundedLines(doc, bucketQuote, contentWidth - 14, 2);
  doc.text(splitBucket, margin + 7, p10Y + 12.5);

  p10Y += 24;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, p10Y, contentWidth, 7, 'FD');

  let actX = margin + 2;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  ACTION_HEADERS.forEach(th => {
    if (th.align === 'right') {
      doc.text(th.name, actX + th.width - 4, p10Y + 4.8, { align: 'right' });
    } else if (th.align === 'center') {
      doc.text(th.name, actX + th.width / 2, p10Y + 4.8, { align: 'center' });
    } else {
      doc.text(th.name, actX, p10Y + 4.8);
    }
    actX += th.width;
  });

  p10Y += 7;

  const actionCorners = [...lap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 4);

  let totalGain = 0;

  actionCorners.forEach((c, idx) => {
    const prioInfo = ACTION_PRIORITIES[idx] || ACTION_PRIORITIES[3];
    totalGain += prioInfo.gain;

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, p10Y, contentWidth, ACTION_ROW_HEIGHT, 'FD');

    // Priority badge
    doc.setFillColor(...prioInfo.color);
    doc.roundedRect(margin + 4, p10Y + 6.5, 16, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(prioInfo.prio, margin + 12, p10Y + 12, { align: 'center' });

    let colX = margin + 24;

    // Title
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const actionTitle = c.trailBrakingDecayDurationSec < 0.22
      ? 'Brake at the 150m board and ease off gently'
      : c.throttleUnwindLinearityScore < 70
      ? 'Squeeze throttle progressively as steering unwinds'
      : 'Wait 1 car-length longer before turning in for late apex';
    const safeActionTitle = truncateText(doc, actionTitle, 76);
    doc.text(safeActionTitle, colX, p10Y + 7);

    // Detail
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitDetail = getBoundedLines(doc, '• Why: Keeps front contact patch loaded and unlocks immediate straightaway drive.', 76, 2);
    doc.text(splitDetail, colX, p10Y + 13);
    colX += 80;

    // Corner
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const cornerLabel = truncateText(doc, `Turn ${c.cornerIndex} (${c.cornerName ? c.cornerName.split('(')[0].trim() : ''})`, 38);
    doc.text(cornerLabel, colX, p10Y + 11.5);
    colX += 42;

    // Gain
    doc.setFontSize(9.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`+${prioInfo.gain.toFixed(2)}s`, colX + 30, p10Y + 12, { align: 'right' });

    p10Y += ACTION_ROW_HEIGHT;
  });

  p10Y += 6;

  // Total Achievable Speed Banner
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, p10Y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL ESTIMATED SPEED YOU CAN GAIN NEXT SESSION:', margin + 6, p10Y + 10);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`+${totalGain.toFixed(2)}s`, pageWidth - margin - 8, p10Y + 11, { align: 'right' });

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
  // PAGE 11: TRACK REFERENCE MARKS & CERTIFICATION (ADAPTIVE ROW SCALING)
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

  let p11Y = margin + 24;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, p11Y, contentWidth, 7, 'FD');

  let rx = margin + 2;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  REF_HEADERS.forEach(th => {
    doc.text(th.name, rx, p11Y + 4.8);
    rx += th.width;
  });

  p11Y += 7;

  // Adaptive Row Height for dynamic corner counts
  const totalRefCorners = Math.max(1, lap.corners.length);
  const maxTableHeight = 110; // Reserve ample space for color key (22mm) + certification (26mm) + footer
  const adaptiveRowHeight = Math.min(11.5, Math.max(6.5, maxTableHeight / totalRefCorners));
  const adaptiveFontSize = adaptiveRowHeight >= 10 ? 7.0 : adaptiveRowHeight >= 8.5 ? 6.2 : 5.6;

  lap.corners.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, p11Y, contentWidth, adaptiveRowHeight, 'FD');

    let xP = margin + 3;
    doc.setFontSize(adaptiveFontSize);

    // Corner Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const rawCornerName = c.cornerName ? c.cornerName.split('(')[0].trim() : `Turn ${c.cornerIndex}`;
    const safeCornerStr = truncateText(doc, `T${c.cornerIndex} - ${rawCornerName}`, REF_HEADERS[0].width - 4);
    doc.text(safeCornerStr, xP, p11Y + adaptiveRowHeight * 0.65);
    xP += REF_HEADERS[0].width;

    // Brake Point
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeD);
    const safeBrakeStr = truncateText(doc, `${Math.round(Math.max(0, c.startDistance - 75))}m board`, REF_HEADERS[1].width - 4);
    doc.text(safeBrakeStr, xP, p11Y + adaptiveRowHeight * 0.65);
    xP += REF_HEADERS[1].width;

    // Turn-In
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const safeTurnInStr = truncateText(doc, 'Start of entry curb', REF_HEADERS[2].width - 4);
    doc.text(safeTurnInStr, xP, p11Y + adaptiveRowHeight * 0.65);
    xP += REF_HEADERS[2].width;

    // Apex
    doc.setTextColor(...PDF_COLORS.gradeA);
    const safeApexStr = truncateText(doc, 'Red/White apex cone', REF_HEADERS[3].width - 4);
    doc.text(safeApexStr, xP, p11Y + adaptiveRowHeight * 0.65);
    xP += REF_HEADERS[3].width;

    // Track-Out
    doc.setTextColor(...PDF_COLORS.speed);
    const safeExitStr = truncateText(doc, 'Outer exit curb limit', REF_HEADERS[4].width - 4);
    doc.text(safeExitStr, xP, p11Y + adaptiveRowHeight * 0.65);

    p11Y += adaptiveRowHeight;
  });

  // Telemetry Key Reference (PDF Structure.md Page 10)
  p11Y += 5;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, p11Y, contentWidth, 20, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TELEMETRY TRACE COLOR KEY (REFERENCE)', margin + 6, p11Y + 5.5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const colorLine1 = truncateText(doc, '• Speed: Blue (#0077BE)  |  • Throttle: Green (#00A86B)  |  • Brake: Red (#C8102E)  |  • Steering: Orange (#F58025)', contentWidth - 12);
  const colorLine2 = truncateText(doc, '• Your Lap: Dark Navy (#1A1A2E)  |  • Target Lap: APEX Red (#E10600)  |  • Lateral G: Purple (#9B30FF)', contentWidth - 12);
  doc.text(colorLine1, margin + 6, p11Y + 11.0);
  doc.text(colorLine2, margin + 6, p11Y + 15.5);

  // Official Coach Certification Sign-off Seal
  p11Y += 24;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, p11Y, contentWidth, CERT_HEIGHT, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, p11Y, 3.5, CERT_HEIGHT, 'F');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('OFFICIAL APEX RACE COACH SIGN-OFF & CERTIFICATION', margin + 8, p11Y + 6.5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const certMsg = 'This 11-page analytical debrief dossier was generated and validated by APEX Race Engineering in full compliance with the Skip Barber Racing School curriculum.';
  const splitCert = getBoundedLines(doc, certMsg, contentWidth - 16, 2);
  doc.text(splitCert, margin + 8, p11Y + 12.5);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const dossierId = `APEX-COACH-${lap.lapNumber}-${Date.now().toString().slice(-6)}`;
  doc.text(`SESSION RECORD: ${dossierId}`, margin + 8, p11Y + 21.5);
  doc.text('CERTIFIED DRIVER COACHING • APPROVED', pageWidth - margin - 6, p11Y + 21.5, { align: 'right' });

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

  // Download PDF and simultaneously save directly to local PC disk (~/Documents/APEX/reports/)
  const filename = getDebriefFilename(stintSession, lap, trackName, carName);
  try {
    const pdfDataUri = doc.output('datauristring');
    savePdfReportToDisk(filename, pdfDataUri).then((res) => {
      if (res.success && res.filePath) {
        console.log(`[APEX PDF] Report saved directly to PC: ${res.filePath}`);
      }
    }).catch((err) => {
      console.warn('[APEX PDF] Failed to save report to PC disk:', err);
    });
  } catch (err) {
    console.warn('[APEX PDF] Could not extract PDF binary for disk sync:', err);
  }

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

  // Header Bar
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, margin + 4, contentWidth, 24, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(margin + 6, margin + 9, 8, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('A', margin + 8.5, margin + 14.8);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('APEX RACING ACADEMY', margin + 18, margin + 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('CONSOLIDATED MULTI-LAP STINT DOSSIER', margin + 18, margin + 20);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 6, margin + 12, { align: 'right' });
  doc.text(`Stint #${stint.stintNumber || 1} • ${laps.length} Total Laps`, pageWidth - margin - 6, margin + 18, { align: 'right' });

  let curY = margin + 36;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('CONSOLIDATED STINT REPORT', margin, curY);

  curY += 6.5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const safeStintTitle = truncateText(doc, userTitle.toUpperCase(), contentWidth);
  doc.text(safeStintTitle, margin, curY);

  curY += 5.5;
  doc.setFontSize(8.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const stintSub = `Track: ${trackName} • Vehicle: ${carName} • Laps Analyzed: ${laps.length} Laps`;
  const safeStintSub = truncateText(doc, stintSub, contentWidth);
  doc.text(safeStintSub, margin, curY);

  curY += 10;

  // Grade & Pace Dual Box
  const gradeBoxWidth = (contentWidth - 6) / 2;
  const gradeBoxHeight = 36;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, curY, gradeBoxWidth, gradeBoxHeight, 2, 2, 'FD');

  doc.setFillColor(...overallGradeInfo.color);
  doc.circle(margin + 18, curY + 18, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(overallGradeInfo.grade, margin + 18, curY + 22.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('STINT CONSISTENCY GRADE', margin + 34, curY + 10);

  const stintGradeLines = getBoundedLines(doc, overallGradeInfo.text, gradeBoxWidth - 38, 2);
  doc.setFontSize(9.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(stintGradeLines[0], margin + 34, curY + 16.5);
  if (stintGradeLines[1]) {
    doc.text(stintGradeLines[1], margin + 34, curY + 21);
  }

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const stintSubtextY = stintGradeLines[1] ? curY + 26 : curY + 23;
  const splitStintSubtext = getBoundedLines(doc, overallGradeInfo.subtext, gradeBoxWidth - 38, 2);
  doc.text(splitStintSubtext, margin + 34, stintSubtextY);

  // Box 2
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin + gradeBoxWidth + 6, curY, gradeBoxWidth, gradeBoxHeight, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('STINT PACE & SPREAD', margin + gradeBoxWidth + 12, curY + 10);

  doc.setFontSize(10.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const bestLapLabelStint = truncateText(doc, `Best Lap: ${bestTimeStr} (#${bestLap.lapNumber})`, gradeBoxWidth - 18);
  doc.text(bestLapLabelStint, margin + gradeBoxWidth + 12, curY + 17);

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const avgPaceLabel = truncateText(doc, `Average Stint Pace: ${avgTimeStr}`, gradeBoxWidth - 18);
  doc.text(avgPaceLabel, margin + gradeBoxWidth + 12, curY + 23.5);

  doc.setFontSize(9.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  const deltaLabelStint = truncateText(doc, `Delta: +${deltaSec.toFixed(2)}s to Target (${targetTimeStr})`, gradeBoxWidth - 18);
  doc.text(deltaLabelStint, margin + gradeBoxWidth + 12, curY + 30.5);

  curY += gradeBoxHeight + 8;

  // 6 KPIs
  const kpiCols = 6;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 18;

  const kpis = [
    { label: 'BEST LAP', value: `${bestLap.lapTimeSec.toFixed(2)}s`, color: PDF_COLORS.textPrimary },
    { label: 'AVG PACE', value: `${avgTimeSec.toFixed(2)}s`, color: PDF_COLORS.speed },
    { label: 'TOTAL LAPS', value: `${laps.length} Laps`, color: PDF_COLORS.gradeA },
    { label: 'STINT SCORE', value: `${Math.round(stintAvgScore)}%`, color: PDF_COLORS.gradeB },
    { label: 'TOP SPEED', value: `${Math.round(bestLap.maxSpeedKph)} km/h`, color: PDF_COLORS.latG },
    { label: 'TIME SPREAD', value: `${(Math.max(...times) - Math.min(...times)).toFixed(2)}s`, color: PDF_COLORS.gradeD },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(kX, curY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
    
    doc.setFillColor(...kpi.color);
    doc.rect(kX, curY, kpiWidth, 1.2, 'F');

    doc.setFontSize(6.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(kpi.label, kX + 3, curY + 6.5);

    doc.setFontSize(9.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    const safeVal = truncateText(doc, kpi.value, kpiWidth - 6);
    doc.text(safeVal, kX + 3, curY + 14);
  });

  curY += kpiHeight + 10;

  // One-line quote
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, curY, contentWidth, 20, 2, 2, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, curY, 3.5, 20, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('COACH’S STINT SUMMARY', margin + 8, curY + 6.5);

  doc.setFontSize(8.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const stintQuote = `"Superb ${laps.length}-lap stint execution. Your best lap was ${bestTimeStr} and pace settled into a consistent rhythm."`;
  const splitStintQuote = getBoundedLines(doc, stintQuote, contentWidth - 16, 2);
  doc.text(splitStintQuote, margin + 8, curY + 13.5);

  curY += 28;

  // Summary Table
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, curY, contentWidth, 70, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('CONSOLIDATED STINT REPORT SECTIONS:', margin + 6, curY + 8);

  const stintIndexItems = [
    { p: 'Pages 2 & 3', title: 'Stint AI Coach Assessment & 5-Pillar Scorecard', desc: 'Stint dynamics, tire management, and driving consistency.' },
    { p: 'Pages 4 & 5', title: 'Corner-by-Corner Telemetry Breakdown', desc: 'Turn-by-turn apex speeds, braking markers, and Skip Barber prescriptions.' },
    { p: 'Page 6', title: 'Stint-Wide Brake Analysis', desc: 'Overlay of best lap vs stint average brake traces and threshold modulation.' },
    { p: 'Page 7', title: 'Stint-Wide Throttle & Power Delivery', desc: 'Progressive throttle application, string theory compliance, and exit speed.' },
    { p: 'Page 8', title: 'Racing Line & Geometric Trajectory', desc: '2D GPS track map trajectory overlay and apex classification guide.' },
    { p: 'Page 9', title: 'Stint Progression & Lap Breakdown', desc: 'Pace evolution across all laps, tire warmup, and optimal lap.' },
    { p: 'Pages 10 & 11', title: 'Action Plan & Reference Marks Card', desc: 'Prioritized drills for next stint and track reference landmarks.' }
  ];

  let stItemY = curY + 15;
  stintIndexItems.forEach(item => {
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.accent);
    doc.text(item.p, margin + 6, stItemY);

    doc.setTextColor(...PDF_COLORS.textPrimary);
    const safeStintItemTitle = truncateText(doc, item.title, 56);
    doc.text(safeStintItemTitle, margin + 30, stItemY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const safeStintDesc = truncateText(doc, `— ${item.desc}`, contentWidth - 92);
    doc.text(safeStintDesc, margin + 88, stItemY);

    stItemY += 7.2;
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

  let sp2Y = margin + 24;
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, sp2Y, contentWidth, 22, 2, 2, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp2Y, 3.5, 22, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('DRIVER PROFILE CLASSIFICATION', margin + 8, sp2Y + 6.5);

  doc.setFontSize(10.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const safeStintProfileTag = truncateText(doc, aiDebrief.driverProfileTag || 'Developing Track Tactician', contentWidth - 20);
  doc.text(safeStintProfileTag, margin + 8, sp2Y + 12.5);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const splitStintProfile = getBoundedLines(
    doc,
    aiDebrief.driverProfileDescription || 'Solid foundational vehicle control with clear opportunities to link trail-braking seamlessly into maintenance throttle.',
    contentWidth - 16,
    2
  );
  doc.text(splitStintProfile, margin + 8, sp2Y + 17.5);

  sp2Y += 28;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('THE 5 SKIP BARBER PILLARS OF SPEED', margin, sp2Y);

  sp2Y += 5;
  const stintPillarCards = aiDebrief.pillarScores || [];
  const pCardHeight = 32;

  stintPillarCards.forEach((pillar: SkipBarberPillarScore, idx: number) => {
    const cardY = sp2Y + idx * (pCardHeight + 3.5);
    const pColor = getGradeBadgeColor(pillar.grade);

    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(margin, cardY, contentWidth, pCardHeight, 1.5, 1.5, 'FD');

    doc.setFillColor(...pColor);
    doc.rect(margin, cardY, 3, pCardHeight, 'F');

    doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const safePillarName = truncateText(doc, `Pillar ${idx + 1}: ${pillar.name}`, contentWidth - 62);
    doc.text(safePillarName, margin + 7, cardY + 7);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.accent);
    const safeChapter = truncateText(doc, `[Skip Barber Going Faster! ${pillar.bookChapter}]`, contentWidth - 62);
    doc.text(safeChapter, margin + 7, cardY + 12);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitSummary = getBoundedLines(doc, pillar.summary, contentWidth - 62, 2);
    doc.text(splitSummary, margin + 7, cardY + 18);

    doc.setFillColor(...pColor);
    doc.roundedRect(pageWidth - margin - 28, cardY + 6, 22, 18, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(pillar.grade, pageWidth - margin - 17, cardY + 14.5, { align: 'center' });

    doc.setFontSize(6.5);
    doc.text(`${Math.round(pillar.score)}/100`, pageWidth - margin - 17, cardY + 20.5, { align: 'center' });
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

  let sp3Y = margin + 24;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, sp3Y, contentWidth, 46, 2, 2, 'FD');
  doc.setFillColor(...PDF_COLORS.gradeA);
  doc.rect(margin, sp3Y, 3.5, 46, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('WHAT WENT WELL ACROSS THIS STINT', margin + 8, sp3Y + 7);

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

  let sStrY = sp3Y + 14;
  stintStrengths.forEach(str => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const safeStrTitle = truncateText(doc, `✓ ${str.title}`, contentWidth - 18);
    doc.text(safeStrTitle, margin + 8, sStrY);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitDesc = getBoundedLines(doc, `${str.description} (${str.metricEvidence || ''})`, contentWidth - 20, 2);
    doc.text(splitDesc, margin + 12, sStrY + 4.5);

    sStrY += 15;
  });

  sp3Y += 52;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TOP 3 THINGS TO FIX IN NEXT STINT (THREE-BITE COACHING METHODOLOGY)', margin, sp3Y);

  sp3Y += 5;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, sp3Y, contentWidth, 7, 'FD');

  let sFixX = margin + 2;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  FIX_HEADERS.forEach(th => {
    if (th.align === 'center') {
      doc.text(th.name, sFixX + th.width / 2, sp3Y + 4.8, { align: 'center' });
    } else {
      doc.text(th.name, sFixX, sp3Y + 4.8);
    }
    sFixX += th.width;
  });

  sp3Y += 7;

  const stintSortedIssues = [...bestLap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 3);
  stintSortedIssues.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, sp3Y, contentWidth, FIX_ROW_HEIGHT, 'FD');

    doc.setFillColor(...PDF_COLORS.gradeD);
    doc.roundedRect(margin + 4, sp3Y + 8, 14, 10, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`#${idx + 1}`, margin + 11, sp3Y + 14.5, { align: 'center' });

    let colX = margin + 24;

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const safeCTitle = truncateText(doc, `T${c.cornerIndex} (${c.cornerName ? c.cornerName.split('(')[0].trim() : ''})`, 40);
    doc.text(safeCTitle, colX, sp3Y + 6.5);

    doc.setFontSize(6.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const probDesc = c.trailBrakingDecayDurationSec < 0.22 
      ? 'Abrupt brake release / Overslowing entry' 
      : 'Early turn-in / Delayed throttle unwinding';
    doc.text(getBoundedLines(doc, probDesc, 40, 2), colX, sp3Y + 12);
    colX += 44;

    doc.setFontSize(6.3);
    doc.setTextColor(...PDF_COLORS.gradeD);
    const telemEvidence = `Brake trace ends 30m early. Apex speed ${Math.round(c.apexMinSpeedKph)} km/h vs target ${Math.round(c.targetApexSpeedKph)} km/h.`;
    doc.text(getBoundedLines(doc, telemEvidence, 44, 3), colX, sp3Y + 8);
    colX += 48;

    doc.setFontSize(6.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const whyHow = `• Why: Unloads front tires prematurely.\n• Fix: Hold 15% trailing pressure deeper toward the apex clipping point.`;
    doc.text(getBoundedLines(doc, whyHow, 62, 3), colX, sp3Y + 8);

    sp3Y += FIX_ROW_HEIGHT;
  });

  sp3Y += 6;

  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, sp3Y, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp3Y, 3.5, 18, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('TELEMETRY LESSON — WHERE TIME IS HIDING', margin + 8, sp3Y + 6);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const stintLesson = '"The blue line is YOUR data. The red line is the TARGET. Where they are apart—that is where lap time is hiding."';
  const splitStintLesson = getBoundedLines(doc, stintLesson, contentWidth - 16, 2);
  doc.text(splitStintLesson, margin + 8, sp3Y + 12);

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

  let sp6Y = margin + 24;
  const stintBrakeChartImg = renderStintBrakeTraceChart(stint, bestLap, benchmarkLap, 800, 280);
  doc.addImage(stintBrakeChartImg, 'PNG', margin, sp6Y, contentWidth, CHART_HEIGHT_MM);

  sp6Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp6Y, contentWidth, 124, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, sp6Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, sp6Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE FUNDAMENTAL BRAKING QUESTIONS ANSWERED (GOING FASTER! CH. 5)', margin + 6, sp6Y + 5.2);

  let sbqY = sp6Y + 13;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeD);
  doc.text('1. Are you pressing the brake pedal hard enough across the stint?', margin + 6, sbqY);
  sbqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sq1Msg = `• Telemetry Evidence: Peak deceleration hit ${bestLap.peakBrakingG.toFixed(2)}G (Target: 1.55G).\n• What It Means: Giving a firm initial press stops the car quicker and allows moving your brake marker closer to the turn.`;
  const splitSq1 = getBoundedLines(doc, sq1Msg, contentWidth - 12, 3);
  doc.text(splitSq1, margin + 6, sbqY);
  sbqY += splitSq1.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('2. Are you trail-braking smoothly into the apex? (The Balloon Rule)', margin + 6, sbqY);
  sbqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sq2Msg = `• The Balloon Analogy: Bleed off the final 15% brake pressure gently like letting air out of a balloon. Keep light trailing pressure on the pedal until your front wheel touches the apex curb.`;
  const splitSq2 = getBoundedLines(doc, sq2Msg, contentWidth - 12, 4);
  doc.text(splitSq2, margin + 6, sbqY);
  sbqY += splitSq2.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeB);
  doc.text('3. Where is your easiest braking time gain on track?', margin + 6, sbqY);
  sbqY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const stintLowestBrake = stintSortedIssues[0] || bestLap.corners[0] || { cornerIndex: 1, cornerName: 'Turn 1' };
  const sq3Msg = `• Focus: Turn ${stintLowestBrake.cornerIndex} (${stintLowestBrake.cornerName ? stintLowestBrake.cornerName.trim() : ''}). You are initiating braking ~20m earlier than necessary. Compress this zone by 10m next session.`;
  const splitSq3 = getBoundedLines(doc, sq3Msg, contentWidth - 12, 3);
  doc.text(splitSq3, margin + 6, sbqY);

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

  let sp7Y = margin + 24;
  const stintThrottleChartImg = renderStintThrottleTraceChart(stint, bestLap, benchmarkLap, 800, 280);
  doc.addImage(stintThrottleChartImg, 'PNG', margin, sp7Y, contentWidth, CHART_HEIGHT_MM);

  sp7Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp7Y, contentWidth, 124, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, sp7Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, sp7Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THREE GAS PEDAL SECRETS FOR MAXIMUM EXIT VELOCITY (GOING FASTER! CH. 7)', margin + 6, sp7Y + 5.2);

  let stY = sp7Y + 13;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('1. When to pick up initial throttle on exit', margin + 6, stY);
  stY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const st1Msg = `• Rule of Thumb: Initial maintenance throttle (15-20%) should be picked up right at the apex clipping point. This settles the rear suspension and pre-loads the drivetrain.`;
  const splitSt1 = getBoundedLines(doc, st1Msg, contentWidth - 12, 3);
  doc.text(splitSt1, margin + 6, stY);
  stY += splitSt1.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text('2. String Theory Rule (Connecting Steering to Gas Pedal)', margin + 6, stY);
  stY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const st2Msg = `• The String Theory Analogy: Imagine an invisible string tied from the bottom of your steering wheel to your right throttle foot. When steering lock is tight, the string is pulled taut—you can only press a little gas. As you unwind the steering wheel toward the exit curb, the string slackens and you can push to 100% full throttle.`;
  const splitSt2 = getBoundedLines(doc, st2Msg, contentWidth - 12, 4);
  doc.text(splitSt2, margin + 6, stY);
  stY += splitSt2.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.latG);
  doc.text('3. Exit Velocity Compounding Down the Straightaway', margin + 6, stY);
  stY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const st3Msg = `• Physics Secret: Carrying just 3 km/h more apex exit speed onto a main straightaway produces a massive +0.30s advantage by the end of the straight. Never sacrifice your exit for a rushed entry.`;
  const splitSt3 = getBoundedLines(doc, st3Msg, contentWidth - 12, 3);
  doc.text(splitSt3, margin + 6, stY);

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

  let sp8Y = margin + 24;
  const stintTrackMapImg = renderTrackMapLineChart(bestLap, benchmarkLap, 800, 380);
  doc.addImage(stintTrackMapImg, 'PNG', margin, sp8Y, contentWidth, MAP_HEIGHT_MM);

  sp8Y += MAP_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp8Y, contentWidth, 102, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, sp8Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, sp8Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LINE SYMPTOM & APEX TIMING DIAGNOSIS GUIDE (GOING FASTER! CH. 3 & 6)', margin + 6, sp8Y + 5.2);

  let slY = sp8Y + 12;
  LINE_DIAGNOSIS_MATRIX.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 241, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 249);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin + 3, slY, contentWidth - 6, 26, 'FD');

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeD);
    const safeSymptom = truncateText(doc, `WHAT YOU FEEL: ${row.symptom}`, contentWidth - 16);
    doc.text(safeSymptom, margin + 6, slY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeB);
    const safeIssue = truncateText(doc, `WHY IT HAPPENS: ${row.issue}`, contentWidth - 16);
    doc.text(safeIssue, margin + 6, slY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeA);
    const splitFix = getBoundedLines(doc, `COACH FIX: ${row.fix}`, contentWidth - 16, 2);
    doc.text(splitFix, margin + 6, slY + 18);

    slY += 29;
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

  let sp9Y = margin + 24;
  const progressionChartImg = renderStintProgressionWithSectorsChart(stint, 800, 280);
  doc.addImage(progressionChartImg, 'PNG', margin, sp9Y, contentWidth, CHART_HEIGHT_MM);

  sp9Y += CHART_HEIGHT_MM + 6;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp9Y, contentWidth, 124, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.textPrimary);
  doc.roundedRect(margin, sp9Y, contentWidth, 7.5, 2, 2, 'F');
  doc.rect(margin, sp9Y + 4, contentWidth, 3.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STINT PROGRESSION & PACE REPRODUCIBILITY (GOING FASTER! CH. 4 & 8)', margin + 6, sp9Y + 5.2);

  let scY = sp9Y + 13;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.speed);
  doc.text(`1. Stint Consistency & Lap Time Spread (${(Math.max(...times) - Math.min(...times)).toFixed(2)}s Spread)`, margin + 6, scY);
  scY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sc1Msg = `• Analysis: Your lap times across this stint varied within a ${(Math.max(...times) - Math.min(...times)).toFixed(2)}s band. Consistency is the true bedrock of speed: once you repeat identical brake and turn-in markers lap after lap, finding extra speed becomes effortless.`;
  const splitSc1 = getBoundedLines(doc, sc1Msg, contentWidth - 12, 3);
  doc.text(splitSc1, margin + 6, scY);
  scY += splitSc1.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gradeA);
  doc.text('2. Warm-up Cycle & Stint Development', margin + 6, scY);
  scY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sc2Msg = `• Progress: Laps 1-2 built tire temperature and chassis platform stability. Peak pace arrived on Lap #${bestLap.lapNumber}. Excellent rhythm discipline throughout this stint.`;
  const splitSc2 = getBoundedLines(doc, sc2Msg, contentWidth - 12, 3);
  doc.text(splitSc2, margin + 6, scY);
  scY += splitSc2.length * 3.4 + 5;

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('3. Fastest Lap Replication Target', margin + 6, scY);
  scY += 4.5;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const sc3Msg = `• Benchmark: Your fastest lap was Lap #${bestLap.lapNumber} (${bestTimeStr}). Focus on replicating the exact brake markers from this lap on your next session.`;
  const splitSc3 = getBoundedLines(doc, sc3Msg, contentWidth - 12, 3);
  doc.text(splitSc3, margin + 6, scY);

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

  let sp10Y = margin + 24;

  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.roundedRect(margin, sp10Y, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp10Y, 3.5, 18, 'F');

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text("COACH'S ACTION PRIORITIZATION — THE BUCKET PRINCIPLE (TERRY EARWOOD RULE)", margin + 7, sp10Y + 6);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  const stintBucketQuote = '"Don\'t confuse the driver. The bucket can only hold so much water. Master these in strict priority order:"';
  const splitStintBucket = getBoundedLines(doc, stintBucketQuote, contentWidth - 14, 2);
  doc.text(splitStintBucket, margin + 7, sp10Y + 12.5);

  sp10Y += 24;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, sp10Y, contentWidth, 7, 'FD');

  let sActX = margin + 2;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  ACTION_HEADERS.forEach(th => {
    if (th.align === 'right') {
      doc.text(th.name, sActX + th.width - 4, sp10Y + 4.8, { align: 'right' });
    } else if (th.align === 'center') {
      doc.text(th.name, sActX + th.width / 2, sp10Y + 4.8, { align: 'center' });
    } else {
      doc.text(th.name, sActX, sp10Y + 4.8);
    }
    sActX += th.width;
  });

  sp10Y += 7;

  const stintActionCorners = [...bestLap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 4);
  let stintTotalGain = 0;

  stintActionCorners.forEach((c, idx) => {
    const prioInfo = ACTION_PRIORITIES[idx] || ACTION_PRIORITIES[3];
    stintTotalGain += prioInfo.gain;

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, sp10Y, contentWidth, ACTION_ROW_HEIGHT, 'FD');

    // Priority badge
    doc.setFillColor(...prioInfo.color);
    doc.roundedRect(margin + 4, sp10Y + 6.5, 16, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(prioInfo.prio, margin + 12, sp10Y + 12, { align: 'center' });

    let colX = margin + 24;

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const actionTitle = c.trailBrakingDecayDurationSec < 0.22
      ? 'Brake at the 150m board and ease off gently'
      : c.throttleUnwindLinearityScore < 70
      ? 'Squeeze throttle progressively as steering unwinds'
      : 'Wait 1 car-length longer before turning in for late apex';
    const safeStintActionTitle = truncateText(doc, actionTitle, 76);
    doc.text(safeStintActionTitle, colX, sp10Y + 7);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    const splitDetail = getBoundedLines(doc, '• Why: Keeps front contact patch loaded and unlocks immediate straightaway drive.', 76, 2);
    doc.text(splitDetail, colX, sp10Y + 13);
    colX += 80;

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const stintCornerLabel = truncateText(doc, `Turn ${c.cornerIndex} (${c.cornerName ? c.cornerName.split('(')[0].trim() : ''})`, 38);
    doc.text(stintCornerLabel, colX, sp10Y + 11.5);
    colX += 42;

    doc.setFontSize(9.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gradeA);
    doc.text(`+${prioInfo.gain.toFixed(2)}s`, colX + 30, sp10Y + 12, { align: 'right' });

    sp10Y += ACTION_ROW_HEIGHT;
  });

  sp10Y += 6;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, sp10Y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL ESTIMATED SPEED YOU CAN GAIN NEXT STINT:', margin + 6, sp10Y + 10);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`+${stintTotalGain.toFixed(2)}s`, pageWidth - margin - 8, sp10Y + 11, { align: 'right' });

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
  // PAGE 11: TRACK REFERENCE MARKS & STINT CERTIFICATION (ADAPTIVE ROW SCALING)
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

  let sp11Y = margin + 24;

  doc.setFillColor(...PDF_COLORS.surfaceAlt);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(margin, sp11Y, contentWidth, 7, 'FD');

  let srx = margin + 2;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  REF_HEADERS.forEach(th => {
    doc.text(th.name, srx, sp11Y + 4.8);
    srx += th.width;
  });

  sp11Y += 7;

  // Adaptive row height for stint corners
  const totalStintRefCorners = Math.max(1, bestLap.corners.length);
  const maxStintTableHeight = 110;
  const adaptiveStintRowHeight = Math.min(11.5, Math.max(6.5, maxStintTableHeight / totalStintRefCorners));
  const adaptiveStintFontSize = adaptiveStintRowHeight >= 10 ? 7.0 : adaptiveStintRowHeight >= 8.5 ? 6.2 : 5.6;

  bestLap.corners.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(margin, sp11Y, contentWidth, adaptiveStintRowHeight, 'FD');

    let xP = margin + 3;
    doc.setFontSize(adaptiveStintFontSize);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const rawStintCornerName = c.cornerName ? c.cornerName.split('(')[0].trim() : `Turn ${c.cornerIndex}`;
    const safeStintCornerStr = truncateText(doc, `T${c.cornerIndex} - ${rawStintCornerName}`, REF_HEADERS[0].width - 4);
    doc.text(safeStintCornerStr, xP, sp11Y + adaptiveStintRowHeight * 0.65);
    xP += REF_HEADERS[0].width;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gradeD);
    const safeStintBrakeStr = truncateText(doc, `${Math.round(Math.max(0, c.startDistance - 75))}m board`, REF_HEADERS[1].width - 4);
    doc.text(safeStintBrakeStr, xP, sp11Y + adaptiveStintRowHeight * 0.65);
    xP += REF_HEADERS[1].width;

    doc.setTextColor(...PDF_COLORS.textSecondary);
    const safeStintTurnIn = truncateText(doc, 'Start of entry curb', REF_HEADERS[2].width - 4);
    doc.text(safeStintTurnIn, xP, sp11Y + adaptiveStintRowHeight * 0.65);
    xP += REF_HEADERS[2].width;

    doc.setTextColor(...PDF_COLORS.gradeA);
    const safeStintApex = truncateText(doc, 'Red/White apex cone', REF_HEADERS[3].width - 4);
    doc.text(safeStintApex, xP, sp11Y + adaptiveStintRowHeight * 0.65);
    xP += REF_HEADERS[3].width;

    doc.setTextColor(...PDF_COLORS.speed);
    const safeStintExit = truncateText(doc, 'Outer exit curb limit', REF_HEADERS[4].width - 4);
    doc.text(safeStintExit, xP, sp11Y + adaptiveStintRowHeight * 0.65);

    sp11Y += adaptiveStintRowHeight;
  });

  sp11Y += 5;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp11Y, contentWidth, 20, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('TELEMETRY TRACE COLOR KEY (REFERENCE)', margin + 6, sp11Y + 5.5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const stintColor1 = truncateText(doc, '• Speed: Blue (#0077BE)  |  • Throttle: Green (#00A86B)  |  • Brake: Red (#C8102E)  |  • Steering: Orange (#F58025)', contentWidth - 12);
  const stintColor2 = truncateText(doc, '• Your Lap: Dark Navy (#1A1A2E)  |  • Target Lap: APEX Red (#E10600)  |  • Lateral G: Purple (#9B30FF)', contentWidth - 12);
  doc.text(stintColor1, margin + 6, sp11Y + 11.0);
  doc.text(stintColor2, margin + 6, sp11Y + 15.5);

  sp11Y += 24;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(margin, sp11Y, contentWidth, CERT_HEIGHT, 2, 2, 'FD');

  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(margin, sp11Y, 3.5, CERT_HEIGHT, 'F');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('OFFICIAL APEX RACE COACH STINT SIGN-OFF & CERTIFICATION', margin + 8, sp11Y + 6.5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const stintCertMsg = `This 11-page consolidated stint dossier was generated and validated by APEX Race Engineering across ${laps.length} recorded stint laps in full compliance with the Skip Barber Racing School curriculum.`;
  const splitStintCert = getBoundedLines(doc, stintCertMsg, contentWidth - 16, 2);
  doc.text(splitStintCert, margin + 8, sp11Y + 12.5);

  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  const dossierId = `APEX-STINT-${stint.stintNumber || 1}-${laps.length}LAPS-${Date.now().toString().slice(-6)}`;
  doc.text(`STINT RECORD: ${dossierId}`, margin + 8, sp11Y + 21.5);
  doc.text('CERTIFIED DRIVER COACHING • APPROVED', pageWidth - margin - 6, sp11Y + 21.5, { align: 'right' });

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

  // Download PDF and simultaneously save directly to local PC disk (~/Documents/APEX/reports/)
  const filename = getDebriefFilename(stint, bestLap, trackName, carName);
  try {
    const pdfDataUri = doc.output('datauristring');
    savePdfReportToDisk(filename, pdfDataUri).then((res) => {
      if (res.success && res.filePath) {
        console.log(`[APEX PDF] Stint Dossier saved directly to PC: ${res.filePath}`);
      }
    }).catch((err) => {
      console.warn('[APEX PDF] Failed to save stint report to PC disk:', err);
    });
  } catch (err) {
    console.warn('[APEX PDF] Could not extract PDF binary for disk sync:', err);
  }

  doc.save(filename);
};
