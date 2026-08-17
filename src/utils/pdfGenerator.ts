import { jsPDF } from 'jspdf';
import { LapAnalysis } from '../types/telemetry';
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

  // Background Fill (Deep Motorsport Dark)
  doc.setFillColor(10, 10, 14);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let currentY = margin;

  // ==============================
  // 1. HEADER BANNER
  // ==============================
  doc.setFillColor(18, 18, 26);
  doc.setDrawColor(35, 35, 50);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  // Red Brand Accent Left Bar
  doc.setFillColor(225, 6, 0);
  doc.rect(margin, currentY, 4, 26, 'F');

  // Brand Icon & Title
  doc.setFillColor(225, 6, 0);
  doc.roundedRect(margin + 7, currentY + 4, 7, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('A', margin + 9, currentY + 9);

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('APEX RACE DEBRIEF', margin + 17, currentY + 9);

  // OFFICIAL Badge
  doc.setFillColor(225, 6, 0);
  doc.roundedRect(margin + 72, currentY + 4.5, 18, 5.5, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL', margin + 74.5, currentY + 8.5);

  // Subtitle / Track & Session Info
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 170);
  const sessionSubtitle = module
    ? `Module ${module.moduleNumber}: ${module.title} • ${session?.title || 'Academy Stint'}`
    : lap.sessionTitle || 'Skip Barber Telemetric Debrief & Corner Diagnosis';
  doc.text(sessionSubtitle, margin + 7, currentY + 18);

  // Date & Lap Status Info (Right-Aligned)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 160);
  const dateStr = lap.recordedAt ? new Date(lap.recordedAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 6, currentY + 7, { align: 'right' });
  doc.text(`Lap Number: #${lap.lapNumber}`, pageWidth - margin - 6, currentY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // Emerald
  doc.text('Validated Telemetry Stint', pageWidth - margin - 6, currentY + 17, { align: 'right' });

  currentY += 30;

  // ==============================
  // 2. EXECUTIVE KPI MATRIX (6 TILES)
  // ==============================
  const kpiCols = 6;
  const kpiGap = 2.5;
  const kpiWidth = (contentWidth - kpiGap * (kpiCols - 1)) / kpiCols;
  const kpiHeight = 16;

  const kpis = [
    { label: 'LAP TIME', value: `${lap.lapTimeSec.toFixed(2)}s`, color: [255, 255, 255] },
    { label: 'TOP VELOCITY', value: `${lap.maxSpeedKph} km/h`, color: [0, 240, 255] },
    { label: 'TRACTION BUDGET', value: `${lap.avgTractionBudgetPct}%`, color: [52, 211, 153] },
    { label: 'MASTERY SCORE', value: `${lap.overallScore}%`, color: [251, 191, 36] },
    { label: 'PEAK LAT G', value: `${lap.peakLatG.toFixed(2)}G`, color: [192, 132, 252] },
    { label: 'PEAK BRAKE G', value: `${lap.peakBrakingG.toFixed(2)}G`, color: [255, 77, 77] },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(20, 20, 30);
    doc.setDrawColor(38, 38, 56);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(140, 140, 160);
    doc.text(kpi.label, kpiX + 2.5, currentY + 4.5);

    // Value
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, kpiX + 2.5, currentY + 11.5);
  });

  currentY += kpiHeight + 5;

  // ==============================
  // 3. EXECUTIVE ACTION PLAN
  // ==============================
  if (lap.actionItems && lap.actionItems.length > 0) {
    const actionPlanHeight = 7 + lap.actionItems.length * 6;
    doc.setFillColor(20, 20, 30);
    doc.setDrawColor(42, 42, 62);
    doc.roundedRect(margin, currentY, contentWidth, actionPlanHeight, 1.5, 1.5, 'FD');

    // Section title
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 77, 77);
    doc.text('EXECUTIVE ACTION PLAN & SKIP BARBER COACHING', margin + 4, currentY + 5);

    lap.actionItems.forEach((item, i) => {
      const itemY = currentY + 10 + i * 5.5;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 6, 0);
      doc.text(`[${i + 1}]`, margin + 4, itemY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(215, 215, 230);
      const splitText = doc.splitTextToSize(item, contentWidth - 14);
      doc.text(splitText[0] || item, margin + 11, itemY);
    });

    currentY += actionPlanHeight + 5;
  }

  // ==============================
  // 4. TURN-BY-TURN DIAGNOSTICS TABLE
  // ==============================
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TURN-BY-TURN TELEMETRIC BREAKDOWN', margin, currentY + 4);
  currentY += 7;

  // Table Header
  const tableHeaders = [
    { name: 'CORNER', width: 34, align: 'left' as const },
    { name: 'TYPE', width: 22, align: 'left' as const },
    { name: 'TRAIL-BRAKE DECAY', width: 28, align: 'left' as const },
    { name: 'APEX MIN SPEED', width: 25, align: 'left' as const },
    { name: 'GRIP UTIL', width: 18, align: 'left' as const },
    { name: 'SCORE', width: 15, align: 'right' as const },
    { name: 'KEY COACHING NOTE', width: 44, align: 'left' as const },
  ];

  doc.setFillColor(25, 25, 38);
  doc.setDrawColor(38, 38, 56);
  doc.rect(margin, currentY, contentWidth, 6, 'FD');

  let curX = margin + 2;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(160, 160, 180);

  tableHeaders.forEach((th) => {
    if (th.align === 'right') {
      doc.text(th.name, curX + th.width - 2, currentY + 4, { align: 'right' });
    } else {
      doc.text(th.name, curX, currentY + 4);
    }
    curX += th.width;
  });

  currentY += 6;

  // Rows
  const rowHeight = 7.5;
  lap.corners.forEach((c, idx) => {
    // Check if new page is needed
    if (currentY + rowHeight > pageHeight - 16) {
      doc.addPage();
      doc.setFillColor(10, 10, 14);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      currentY = margin;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 16 : 20, isEven ? 16 : 20, isEven ? 24 : 30);
    doc.setDrawColor(32, 32, 46);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

    let xPos = margin + 2;
    doc.setFontSize(6.8);

    // Corner Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const cornerLabel = `T${c.cornerIndex} - ${c.cornerName.split('(')[0].trim().slice(0, 14)}`;
    doc.text(cornerLabel, xPos, currentY + 4.8);
    xPos += tableHeaders[0].width;

    // Type
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 160);
    doc.text(c.type.replace('_', ' ').toUpperCase().slice(0, 10), xPos, currentY + 4.8);
    xPos += tableHeaders[1].width;

    // Trail Braking Decay
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text(`${c.trailBrakingDecayDurationSec.toFixed(2)}s`, xPos, currentY + 4.8);
    xPos += tableHeaders[2].width;

    // Apex Min Speed
    doc.setTextColor(52, 211, 153);
    doc.text(`${c.apexMinSpeedKph} km/h`, xPos, currentY + 4.8);
    xPos += tableHeaders[3].width;

    // Grip Util
    doc.setTextColor(192, 132, 252);
    doc.text(`${c.apexGripUtilizationPct}%`, xPos, currentY + 4.8);
    xPos += tableHeaders[4].width;

    // Score
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 191, 36);
    doc.text(`${c.cornerScore}%`, xPos + tableHeaders[5].width - 2, currentY + 4.8, { align: 'right' });
    xPos += tableHeaders[5].width;

    // Advice / Diagnosis (Truncated nicely)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 180);
    const adviceText = c.skipBarberAdvice || c.diagnosis || 'Balanced corner execution';
    const splitAdvice = doc.splitTextToSize(adviceText, tableHeaders[6].width - 3);
    doc.text(splitAdvice[0] || adviceText, xPos + 1, currentY + 4.8);

    currentY += rowHeight;
  });

  // ==============================
  // 5. FOOTER
  // ==============================
  const footerY = pageHeight - 8;
  doc.setDrawColor(35, 35, 50);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 140);
  doc.text('APEX Simracing Engineering System • Skip Barber Analytical Engine', margin, footerY + 2);
  doc.text(
    `Certified Analytical Record • Exported ${new Date().toLocaleTimeString()}`,
    pageWidth - margin,
    footerY + 2,
    { align: 'right' }
  );

  // Save the PDF directly to download
  const filename = `APEX_Debrief_Lap_${lap.lapNumber}_${Date.now()}.pdf`;
  doc.save(filename);
};
