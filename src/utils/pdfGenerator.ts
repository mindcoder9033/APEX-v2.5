import { jsPDF } from 'jspdf';
import { LapAnalysis, CornerTelemetryAnalysis } from '../types/telemetry';
import { Module, Session } from '../types/curriculum';

export const generateOfficialPdf = async (
  lap: LapAnalysis,
  module?: Module,
  session?: Session
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // ==========================================
  // PAGE 1: EXECUTIVE OVERVIEW & COACH ANALYSIS
  // ==========================================

  // Page 1 Background (Crisp Clean Light)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let currentY = margin;

  // --- 1. OFFICIAL HEADER BANNER ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'FD');

  // Red Left Accent Bar
  doc.setFillColor(225, 6, 0); // Racing Red
  doc.rect(margin, currentY, 3.5, 25, 'F');

  // APEX Brand Logo Icon
  doc.setFillColor(225, 6, 0);
  doc.roundedRect(margin + 6, currentY + 4, 6.5, 6.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('A', margin + 8, currentY + 8.5);

  // Title & Official Tag
  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('APEX RACE COACH DEBRIEF', margin + 15, currentY + 8.5);

  doc.setFillColor(225, 6, 0);
  doc.roundedRect(margin + 83, currentY + 4.5, 28, 5, 1, 1, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SKIP BARBER DOSSIER', margin + 85, currentY + 8);

  // Subtitle / Track & Session Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const sessionSubtitle = module
    ? `Module ${module.moduleNumber}: ${module.title} • ${session?.title || 'Curriculum Academy Stint'}`
    : lap.sessionTitle || 'Skip Barber Telemetric Debrief & Corner Diagnosis';
  doc.text(sessionSubtitle, margin + 6, currentY + 17);

  // Metadata block (Right-Aligned)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const dateStr = lap.recordedAt ? new Date(lap.recordedAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 5, currentY + 6.5, { align: 'right' });
  doc.text(`Lap Number: #${lap.lapNumber}`, pageWidth - margin - 5, currentY + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Validated Official Stint', pageWidth - margin - 5, currentY + 16.5, { align: 'right' });

  currentY += 29;

  // --- 2. EXECUTIVE PERFORMANCE MATRIX (6 TILES) ---
  const kpiCols = 6;
  const kpiGap = 2.5;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 15;

  const kpis = [
    { label: 'LAP TIME', value: `${lap.lapTimeSec.toFixed(2)}s`, color: [15, 23, 42] },
    { label: 'PEAK SPEED', value: `${lap.maxSpeedKph} km/h`, color: [2, 132, 199] },
    { label: 'GRIP BUDGET', value: `${lap.avgTractionBudgetPct}%`, color: [5, 150, 105] },
    { label: 'MASTERY SCORE', value: `${lap.overallScore}%`, color: [217, 119, 6] },
    { label: 'PEAK LAT G', value: `${lap.peakLatG.toFixed(2)}G`, color: [124, 58, 237] },
    { label: 'PEAK BRAKE G', value: `${lap.peakBrakingG.toFixed(2)}G`, color: [220, 38, 38] },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    // Top border subtle accent
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(kpiX, currentY, kpiWidth, 1, 'F');

    // Label
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 2.5, currentY + 4.8);

    // Value
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, kpiX + 2.5, currentY + 11);
  });

  currentY += kpiHeight + 5;

  // --- 3. SKIP BARBER VEHICLE DYNAMICS ASSESSMENT (GOING FASTER METHODOLOGY) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const dynamicsCardHeight = 92;
  doc.roundedRect(margin, currentY, contentWidth, dynamicsCardHeight, 2, 2, 'FD');

  // Header inside card
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, 7, 2, 2, 'F');
  doc.rect(margin, currentY + 4, contentWidth, 3, 'F'); // square bottom corners
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SKIP BARBER VEHICLE DYNAMICS & TRACTION BUDGET ASSESSMENT', margin + 4, currentY + 4.8);

  let innerY = currentY + 11;

  // Subsection A: Traction Circle & Grip Sharing (Ch. 2 & 3)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 6, 0);
  doc.text('1. The Traction Circle & Grip Budget (Going Faster! Ch. 2 & 3)', margin + 4, innerY);
  innerY += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // slate-700
  const gripAnalysis = lap.avgTractionBudgetPct >= 85
    ? `Exceptional tire friction budget management (stint average ${lap.avgTractionBudgetPct}%). You effectively blended lateral cornering grip with trailing longitudinal braking without demanding 100% of both simultaneously. The contact patches remained within their optimum 6-10° slip angle window.`
    : `Tire friction budget was under-utilized or overloaded (stint average ${lap.avgTractionBudgetPct}%). Skip Barber fundamental: Tires have a finite 100% traction envelope. If 90% is spent on straight-line braking, only 10% is available for turn-in. Ensure longitudinal brake pressure is progressively bled off as steering angle increases.`;
  const splitGrip = doc.splitTextToSize(gripAnalysis, contentWidth - 8);
  doc.text(splitGrip, margin + 4, innerY);
  innerY += splitGrip.length * 3.4 + 2.5;

  // Subsection B: Weight Transfer & Pitch Control (Ch. 4)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 6, 0);
  doc.text('2. Weight Transfer & Platform Stability (Going Faster! Ch. 4)', margin + 4, innerY);
  innerY += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const weightTransferAnalysis = `Under initial deceleration, chassis pitch compresses the front suspension and loads the front contact patches with vertical force (Peak Braking: ${lap.peakBrakingG.toFixed(2)}G). Avoid abrupt brake releases before the clipping point—snapping off the pedal unloads the front tires instantly, causing sudden entry understeer and platform oscillation.`;
  const splitWeight = doc.splitTextToSize(weightTransferAnalysis, contentWidth - 8);
  doc.text(splitWeight, margin + 4, innerY);
  innerY += splitWeight.length * 3.4 + 2.5;

  // Subsection C: Line Priority & Apex Timing (Ch. 6 & 7)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 6, 0);
  doc.text('3. Driving Line Discipline & Apex Classification (Going Faster! Ch. 6)', margin + 4, innerY);
  innerY += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const lineAnalysis = `Skip Barber priority order: Line first, Exit speed second, Braking last. For corners leading onto long straights, prioritize a geometrical Late Apex. An early turn-in forces an increasing steering angle past the geometric apex, pinching the exit line, delaying full throttle application, and compromising top speed down the ensuing straightaway.`;
  const splitLine = doc.splitTextToSize(lineAnalysis, contentWidth - 8);
  doc.text(splitLine, margin + 4, innerY);
  innerY += splitLine.length * 3.4 + 2.5;

  // Subsection D: Throttle-Steering "String Theory" (Ch. 2 & 7)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 6, 0);
  doc.text('4. Throttle-Steering Coordination ("String Theory" - Ch. 2 & 7)', margin + 4, innerY);
  innerY += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const throttleAnalysis = `Imagine an inelastic string tied between the bottom of the steering wheel and the throttle pedal. As you unwind steering angle from the clipping point toward the exit curb, the pedal is allowed to travel downward to 100%. Feeding throttle with high steering lock scrubs front tire traction and provokes abrupt exit snap oversteer.`;
  const splitThrottle = doc.splitTextToSize(throttleAnalysis, contentWidth - 8);
  doc.text(splitThrottle, margin + 4, innerY);

  currentY += dynamicsCardHeight + 5;

  // --- 4. TERRY EARWOOD'S "BUCKET PRINCIPLE" 3-POINT ACTION PLAN ---
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(252, 165, 165); // red-300
  const actionCardHeight = 62;
  doc.roundedRect(margin, currentY, contentWidth, actionCardHeight, 2, 2, 'FD');

  // Red accent top bar
  doc.setFillColor(225, 6, 0);
  doc.roundedRect(margin, currentY, contentWidth, 7, 2, 2, 'F');
  doc.rect(margin, currentY + 4, contentWidth, 3, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text("COACH'S 3-POINT ACTION PLAN — THE 'BUCKET PRINCIPLE' (TERRY EARWOOD RULE)", margin + 4, currentY + 4.8);

  let planY = currentY + 11;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(153, 27, 27); // red-800
  doc.text('"Don\'t confuse the driver. The bucket can only hold so much water. Master these in order:"', margin + 4, planY);
  planY += 5;

  const threeBasics = [
    {
      step: '1. LINE FIRST',
      desc: 'Fix turn-in reference points. Move turn-in 1-2 car lengths deeper on key exit corners to guarantee a late apex clip and open up the corner radius.'
    },
    {
      step: '2. EXIT SPEED SECOND',
      desc: 'Eliminate dead coasting between trailing brake release and throttle pickup. Squeeze 15% maintenance throttle immediately at apex to settle rear platform, then feed to 100% as wheel unwinds.'
    },
    {
      step: '3. BRAKING LAST',
      desc: 'Modulate threshold braking and trail-braking decay. Only push braking markers deeper once line geometry and apex throttle synchronization are consistently executed.'
    }
  ];

  threeBasics.forEach((item, idx) => {
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // red-700
    doc.text(item.step, margin + 4, planY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59); // slate-800
    const splitDesc = doc.splitTextToSize(item.desc, contentWidth - 28);
    doc.text(splitDesc, margin + 26, planY);
    planY += splitDesc.length * 3.4 + 2.8;
  });

  // Page 1 Footer
  const footerY1 = pageHeight - 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY1 - 2, pageWidth - margin, footerY1 - 2);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Page 1 of 2 • Skip Barber Going Faster! Analytical Methodology • APEX Simracing Systems', margin, footerY1 + 2);
  doc.text(
    `Certified Analytical Record • Exported ${new Date().toLocaleTimeString()}`,
    pageWidth - margin,
    footerY1 + 2,
    { align: 'right' }
  );

  // ==========================================
  // PAGE 2: TURN-BY-TURN TELEMETRY & COACHING
  // ==========================================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let p2Y = margin;

  // Header Strip Page 2
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, p2Y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFillColor(225, 6, 0);
  doc.rect(margin, p2Y, 3, 14, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TURN-BY-TURN TELEMETRIC DIAGNOSIS & CORNER COACHING', margin + 6, p2Y + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Lap #${lap.lapNumber} (${lap.lapTimeSec.toFixed(2)}s) • Sector Analysis & Skip Barber Corner Prescriptions`, margin + 6, p2Y + 10.5);

  p2Y += 18;

  // --- 5. TURN-BY-TURN DATA TABLE ---
  const tableHeaders = [
    { name: 'CORNER', width: 32, align: 'left' as const },
    { name: 'TYPE', width: 22, align: 'left' as const },
    { name: 'TRAIL-BRAKE', width: 26, align: 'left' as const },
    { name: 'APEX SPEED', width: 26, align: 'left' as const },
    { name: 'TARGET', width: 20, align: 'left' as const },
    { name: 'GRIP UTIL', width: 20, align: 'left' as const },
    { name: 'UNWIND', width: 20, align: 'left' as const },
    { name: 'SCORE', width: 20, align: 'right' as const },
  ];

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(margin, p2Y, contentWidth, 6, 'FD');

  let curX = margin + 2;
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600

  tableHeaders.forEach((th) => {
    if (th.align === 'right') {
      doc.text(th.name, curX + th.width - 4, p2Y + 4.2, { align: 'right' });
    } else {
      doc.text(th.name, curX, p2Y + 4.2);
    }
    curX += th.width;
  });

  p2Y += 6;

  // Render Table Rows
  const tableRowHeight = 6.2;
  lap.corners.forEach((c, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, p2Y, contentWidth, tableRowHeight, 'FD');

    let xPos = margin + 2;
    doc.setFontSize(6.5);

    // Corner Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const cornerLabel = `T${c.cornerIndex} - ${c.cornerName.split('(')[0].trim().slice(0, 13)}`;
    doc.text(cornerLabel, xPos, p2Y + 4.2);
    xPos += tableHeaders[0].width;

    // Type
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(c.type.replace('_', ' ').toUpperCase().slice(0, 10), xPos, p2Y + 4.2);
    xPos += tableHeaders[1].width;

    // Trail Braking Decay
    doc.setTextColor(51, 65, 85);
    doc.text(`${c.trailBrakingDecayDurationSec.toFixed(2)}s`, xPos, p2Y + 4.2);
    xPos += tableHeaders[2].width;

    // Apex Speed
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`${c.apexMinSpeedKph} km/h`, xPos, p2Y + 4.2);
    xPos += tableHeaders[3].width;

    // Target Speed
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${c.targetApexSpeedKph} km/h`, xPos, p2Y + 4.2);
    xPos += tableHeaders[4].width;

    // Grip Util
    doc.setTextColor(124, 58, 237); // purple
    doc.text(`${c.apexGripUtilizationPct}%`, xPos, p2Y + 4.2);
    xPos += tableHeaders[5].width;

    // Throttle Unwind Linearity
    doc.setTextColor(2, 132, 199); // blue
    doc.text(`${c.throttleUnwindLinearityScore}%`, xPos, p2Y + 4.2);
    xPos += tableHeaders[6].width;

    // Score
    doc.setFont('helvetica', 'bold');
    const scoreColor: [number, number, number] = c.cornerScore >= 85 ? [5, 150, 105] : c.cornerScore >= 70 ? [217, 119, 6] : [220, 38, 38];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${c.cornerScore}%`, xPos + tableHeaders[7].width - 4, p2Y + 4.2, { align: 'right' });

    p2Y += tableRowHeight;
  });

  p2Y += 6;

  // --- 6. CRITICAL CORNERS COACHING & TECHNIQUE PRESCRIPTION CARDS ---
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CRITICAL SECTOR COACHING & SKIP BARBER PRESCRIPTIONS', margin, p2Y + 3);
  p2Y += 6;

  // Sort corners by priority (lowest score first, prioritizing lowest 3)
  const sortedCorners = [...lap.corners].sort((a, b) => a.cornerScore - b.cornerScore).slice(0, 3);

  sortedCorners.forEach((c) => {
    const cardHeight = 35;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, p2Y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

    // Header bar of corner card
    const headerColor: [number, number, number] = c.cornerScore < 75 ? [220, 38, 38] : [217, 119, 6];
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(margin, p2Y, 2.5, cardHeight, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `T${c.cornerIndex} — ${c.cornerName.trim()} [Category: ${c.type.toUpperCase()}] • Score: ${c.cornerScore}%`,
      margin + 5,
      p2Y + 5
    );

    // Diagnostics finding
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Telemetry Finding:', margin + 5, p2Y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const diagText = c.diagnosis || `Carried ${c.apexMinSpeedKph} km/h (target: ${c.targetApexSpeedKph} km/h) with ${c.apexGripUtilizationPct}% grip budget.`;
    const splitDiag = doc.splitTextToSize(diagText, contentWidth - 36);
    doc.text(splitDiag[0] || diagText, margin + 30, p2Y + 10);

    // Skip Barber Rule & Prescription
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('Skip Barber Rule:', margin + 5, p2Y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const adviceText = c.skipBarberAdvice || "Look far ahead to the exit tracking marker and smoothly feed throttle as steering angle unwinds.";
    const splitAdvice = doc.splitTextToSize(adviceText, contentWidth - 36);
    doc.text(splitAdvice, margin + 30, p2Y + 16);

    // Immediate Next Stint Drill
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Next Stint Drill:', margin + 5, p2Y + 27);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const drillText = c.trailBrakingDecayDurationSec < 0.22
      ? "Focus on bleeding the trailing 15% brake pressure deeper into the clipping point. Do not snap off the brake."
      : c.throttleUnwindLinearityScore < 70
      ? "Wait for steering wheel unwinding before squeezing beyond 50% throttle. Squeeze progressively, don't stab it."
      : "Move braking reference point 5m deeper while maintaining identical late-apex clipping discipline.";
    doc.text(drillText, margin + 30, p2Y + 27);

    p2Y += cardHeight + 4;
  });

  // --- 7. OFFICIAL COACH SIGN-OFF & CERTIFICATION ---
  const signoffY = pageHeight - 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, signoffY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL COACH CERTIFICATION:', margin + 4, signoffY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This stint debrief was analyzed in accordance with the Skip Barber Racing School curriculum and vehicle dynamics standards.',
    margin + 4,
    signoffY + 9
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 6, 0);
  doc.text('APEX CERTIFIED COACHING RECORD', pageWidth - margin - 4, signoffY + 7, { align: 'right' });

  // Page 2 Footer
  const footerY2 = pageHeight - 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY2 - 2, pageWidth - margin, footerY2 - 2);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Page 2 of 2 • Certified Analytical Driver Record • APEX Simracing Systems', margin, footerY2 + 2);
  doc.text(
    `Official Record ID: APEX-SB-${lap.lapNumber}-${Date.now().toString().slice(-6)}`,
    pageWidth - margin,
    footerY2 + 2,
    { align: 'right' }
  );

  // Save the PDF directly to download
  const filename = `APEX_SkipBarber_Debrief_Lap_${lap.lapNumber}_${Date.now()}.pdf`;
  doc.save(filename);
};
