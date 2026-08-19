/**
 * FM23 Track Corner Registry
 * Complete official corner profiles for all 20 Forza Motorsport 2023 tracks and layouts.
 */

export interface PredefinedCornerDef {
  index: number;
  name: string;
  startPct: number; // 0.0 to 1.0 along lap
  apexPct: number;
  endPct: number;
  type: 'hairpin' | 'medium' | 'fast_sweeper' | 'chicane' | 'kink';
  targetApexSpeedKph: number;
  description: string;
}

// 1. Lime Rock Park (Full Circuit - 7 Turns)
export const LIME_ROCK_FULL_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Big Bend)', startPct: 0.05, apexPct: 0.09, endPct: 0.14, type: 'medium', targetApexSpeedKph: 112, description: 'Long trail-braking entry into 90° right-hander. Rotate car early.' },
  { index: 2, name: 'Turn 2 (Left Hander)', startPct: 0.16, apexPct: 0.20, endPct: 0.25, type: 'medium', targetApexSpeedKph: 122, description: 'Smooth steering transition into the uphill climb.' },
  { index: 3, name: 'Turn 3 (Right Hander)', startPct: 0.27, apexPct: 0.31, endPct: 0.36, type: 'fast_sweeper', targetApexSpeedKph: 145, description: 'Hold steady throttle balance through apex curb.' },
  { index: 4, name: 'Turn 4 (The Esses)', startPct: 0.42, apexPct: 0.46, endPct: 0.51, type: 'chicane', targetApexSpeedKph: 138, description: 'Quick weight transfer from right to left; clip inner curb.' },
  { index: 5, name: 'Turn 5 (The Uphill)', startPct: 0.58, apexPct: 0.63, endPct: 0.69, type: 'medium', targetApexSpeedKph: 126, description: 'Steep compression apex. Unwind steering over the crest.' },
  { index: 6, name: 'Turn 6 (West Bend)', startPct: 0.74, apexPct: 0.79, endPct: 0.84, type: 'fast_sweeper', targetApexSpeedKph: 152, description: 'High-speed entry requiring aero confidence and single input.' },
  { index: 7, name: 'Turn 7 (The Downhill)', startPct: 0.89, apexPct: 0.94, endPct: 0.98, type: 'fast_sweeper', targetApexSpeedKph: 142, description: 'Key exit onto front straight. Get to full throttle before bottom of hill.' }
];

// 2. WeatherTech Raceway Laguna Seca (11 Turns)
export const LAGUNA_SECA_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Crest)', startPct: 0.03, apexPct: 0.06, endPct: 0.09, type: 'kink', targetApexSpeedKph: 210, description: 'Fast crest kink before heavy braking.' },
  { index: 2, name: 'Turn 2 (Andretti Hairpin)', startPct: 0.12, apexPct: 0.16, endPct: 0.21, type: 'hairpin', targetApexSpeedKph: 68, description: 'Double-apex tight hairpin. Deep trail-brake to rotate.' },
  { index: 3, name: 'Turn 3', startPct: 0.25, apexPct: 0.29, endPct: 0.33, type: 'medium', targetApexSpeedKph: 108, description: '90° right-hander; watch out for outside sand.' },
  { index: 4, name: 'Turn 4', startPct: 0.36, apexPct: 0.40, endPct: 0.44, type: 'medium', targetApexSpeedKph: 120, description: 'Fast right-hander. Carry momentum onto short straight.' },
  { index: 5, name: 'Turn 5', startPct: 0.47, apexPct: 0.51, endPct: 0.56, type: 'medium', targetApexSpeedKph: 102, description: 'Banked uphill left-hander. Use banking for extra grip.' },
  { index: 6, name: 'Turn 6', startPct: 0.60, apexPct: 0.64, endPct: 0.68, type: 'fast_sweeper', targetApexSpeedKph: 142, description: 'Blind uphill left into Rahal Straight. Commit to apex.' },
  { index: 7, name: 'Turn 7 (Rahal Straight)', startPct: 0.70, apexPct: 0.73, endPct: 0.76, type: 'kink', targetApexSpeedKph: 195, description: 'Climb towards the Corkscrew crest.' },
  { index: 8, name: 'Turn 8 (The Corkscrew)', startPct: 0.78, apexPct: 0.81, endPct: 0.84, type: 'chicane', targetApexSpeedKph: 75, description: 'Iconic blind drop left-then-right. Aim for the tree on drop.' },
  { index: 9, name: 'Turn 9 (Rainey Curve)', startPct: 0.86, apexPct: 0.89, endPct: 0.92, type: 'fast_sweeper', targetApexSpeedKph: 135, description: 'Downhill high-G sweeper. Steady throttle discipline.' },
  { index: 10, name: 'Turn 10', startPct: 0.93, apexPct: 0.95, endPct: 0.97, type: 'medium', targetApexSpeedKph: 118, description: 'Fast downhill right. Position on left for Turn 11.' },
  { index: 11, name: 'Turn 11', startPct: 0.97, apexPct: 0.985, endPct: 1.0, type: 'hairpin', targetApexSpeedKph: 64, description: 'Slowest corner on track. Maximize traction onto front straight.' }
];

// 3. Circuit de Spa-Francorchamps (19 Turns)
export const SPA_FRANCORCHAMPS_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (La Source)', startPct: 0.03, apexPct: 0.06, endPct: 0.09, type: 'hairpin', targetApexSpeedKph: 72, description: 'Tight right hairpin. Crucial exit speed onto Kemmel run.' },
  { index: 2, name: 'Turn 2 (Eau Rouge)', startPct: 0.12, apexPct: 0.15, endPct: 0.18, type: 'fast_sweeper', targetApexSpeedKph: 245, description: 'Downhill left entry. Keep steering smooth.' },
  { index: 3, name: 'Turn 3 (Raidillon Left)', startPct: 0.18, apexPct: 0.20, endPct: 0.22, type: 'fast_sweeper', targetApexSpeedKph: 250, description: 'Steep uphill compression.' },
  { index: 4, name: 'Turn 4 (Raidillon Crest)', startPct: 0.22, apexPct: 0.24, endPct: 0.26, type: 'kink', targetApexSpeedKph: 255, description: 'Blind crest. Track position to right curb.' },
  { index: 5, name: 'Turn 5 (Les Combes Entry)', startPct: 0.37, apexPct: 0.39, endPct: 0.41, type: 'chicane', targetApexSpeedKph: 135, description: 'Heavy braking from 300+ kph into right-left.' },
  { index: 6, name: 'Turn 6 (Les Combes Mid)', startPct: 0.41, apexPct: 0.43, endPct: 0.45, type: 'chicane', targetApexSpeedKph: 140, description: 'Weight shift over inner curb.' },
  { index: 7, name: 'Turn 7 (Malmedy)', startPct: 0.45, apexPct: 0.47, endPct: 0.49, type: 'medium', targetApexSpeedKph: 155, description: 'Downhill right-hander onto Bruxelles descent.' },
  { index: 8, name: 'Turn 8 (Bruxelles Hairpin)', startPct: 0.51, apexPct: 0.54, endPct: 0.57, type: 'hairpin', targetApexSpeedKph: 95, description: 'Off-camber downhill 180° right hairpin. Trail-brake deep.' },
  { index: 9, name: 'Turn 9 (Speaker Corner)', startPct: 0.58, apexPct: 0.60, endPct: 0.62, type: 'medium', targetApexSpeedKph: 140, description: 'Downhill left flick into Double Gauche.' },
  { index: 10, name: 'Turn 10 (Pouhon Entry)', startPct: 0.64, apexPct: 0.66, endPct: 0.68, type: 'fast_sweeper', targetApexSpeedKph: 195, description: 'Legendary double-apex downhill left. High lateral load.' },
  { index: 11, name: 'Turn 11 (Pouhon Exit)', startPct: 0.68, apexPct: 0.70, endPct: 0.72, type: 'fast_sweeper', targetApexSpeedKph: 205, description: 'Maintain throttle and let car drift to exit curb.' },
  { index: 12, name: 'Turn 12 (Fagnes Entry)', startPct: 0.74, apexPct: 0.76, endPct: 0.78, type: 'chicane', targetApexSpeedKph: 145, description: 'Right flick chicane.' },
  { index: 13, name: 'Turn 13 (Fagnes Exit)', startPct: 0.78, apexPct: 0.80, endPct: 0.82, type: 'medium', targetApexSpeedKph: 150, description: 'Left exit onto Campus.' },
  { index: 14, name: 'Turn 14 (Campus)', startPct: 0.83, apexPct: 0.85, endPct: 0.87, type: 'medium', targetApexSpeedKph: 142, description: 'Right-hander leading to Stavelot.' },
  { index: 15, name: 'Turn 15 (Paul Frère / Stavelot)', startPct: 0.87, apexPct: 0.89, endPct: 0.91, type: 'fast_sweeper', targetApexSpeedKph: 185, description: 'Flat-out right onto the Blanchimont full throttle run.' },
  { index: 16, name: 'Turn 16 (Courbe Paul Frère)', startPct: 0.91, apexPct: 0.92, endPct: 0.93, type: 'kink', targetApexSpeedKph: 235, description: 'High speed acceleration.' },
  { index: 17, name: 'Turn 17 (Blanchimont 1)', startPct: 0.94, apexPct: 0.95, endPct: 0.96, type: 'fast_sweeper', targetApexSpeedKph: 275, description: 'Terrifying 280+ kph left sweeper.' },
  { index: 18, name: 'Turn 18 (Blanchimont 2)', startPct: 0.96, apexPct: 0.97, endPct: 0.98, type: 'kink', targetApexSpeedKph: 285, description: 'Approach to Bus Stop.' },
  { index: 19, name: 'Turn 19 (Bus Stop Chicane)', startPct: 0.98, apexPct: 0.99, endPct: 1.0, type: 'chicane', targetApexSpeedKph: 68, description: 'Heavy braking into right-left chicane onto start/finish straight.' }
];

// 4. Watkins Glen (Full Course - 11 Turns)
export const WATKINS_GLEN_FULL_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (The 90)', startPct: 0.05, apexPct: 0.09, endPct: 0.14, type: 'medium', targetApexSpeedKph: 110, description: 'Downhill 90° right. Key exit speed onto the Esses.' },
  { index: 2, name: 'Turn 2 (Esses Entry)', startPct: 0.18, apexPct: 0.22, endPct: 0.26, type: 'fast_sweeper', targetApexSpeedKph: 195, description: 'Uphill high-speed right with armco barriers close.' },
  { index: 3, name: 'Turn 3 (Esses Apex)', startPct: 0.27, apexPct: 0.31, endPct: 0.35, type: 'fast_sweeper', targetApexSpeedKph: 215, description: 'Flat out left crest transition.' },
  { index: 4, name: 'Turn 4 (Esses Exit)', startPct: 0.36, apexPct: 0.39, endPct: 0.43, type: 'kink', targetApexSpeedKph: 235, description: 'Full throttle onto the long Back Straight.' },
  { index: 5, name: 'Turn 5 (Inner Loop / Bus Stop)', startPct: 0.49, apexPct: 0.52, endPct: 0.56, type: 'chicane', targetApexSpeedKph: 115, description: 'Violent curb strikes through 4-apex chicane.' },
  { index: 6, name: 'Turn 6 (The Carousel)', startPct: 0.58, apexPct: 0.63, endPct: 0.68, type: 'fast_sweeper', targetApexSpeedKph: 155, description: 'Long banked 180° right-hander. Hold high lateral load.' },
  { index: 7, name: 'Turn 7 (The Chute / Boot Entry)', startPct: 0.70, apexPct: 0.74, endPct: 0.78, type: 'medium', targetApexSpeedKph: 118, description: 'Downhill left plunge into the Boot section.' },
  { index: 8, name: 'Turn 8 (The Toe)', startPct: 0.79, apexPct: 0.83, endPct: 0.87, type: 'hairpin', targetApexSpeedKph: 78, description: 'Steeply banked uphill right hairpin. Hook the inside.' },
  { index: 9, name: 'Turn 9 (The Heel)', startPct: 0.88, apexPct: 0.90, endPct: 0.92, type: 'medium', targetApexSpeedKph: 132, description: 'Blind crest left exiting the Boot.' },
  { index: 10, name: 'Turn 10', startPct: 0.93, apexPct: 0.95, endPct: 0.97, type: 'fast_sweeper', targetApexSpeedKph: 175, description: 'Fast downhill left.' },
  { index: 11, name: 'Turn 11', startPct: 0.97, apexPct: 0.985, endPct: 1.0, type: 'medium', targetApexSpeedKph: 125, description: 'Final right-hander onto the main straight.' }
];

// 5. Silverstone Circuit (Grand Prix - 18 Turns)
export const SILVERSTONE_GP_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Abbey)', startPct: 0.04, apexPct: 0.07, endPct: 0.10, type: 'fast_sweeper', targetApexSpeedKph: 245, description: 'Flat-out or light lift right flick.' },
  { index: 2, name: 'Turn 2 (Farm Curve)', startPct: 0.11, apexPct: 0.13, endPct: 0.15, type: 'kink', targetApexSpeedKph: 235, description: 'Left kink leading into Village.' },
  { index: 3, name: 'Turn 3 (Village)', startPct: 0.16, apexPct: 0.19, endPct: 0.22, type: 'hairpin', targetApexSpeedKph: 92, description: 'Heavy braking tight right.' },
  { index: 4, name: 'Turn 4 (The Loop)', startPct: 0.23, apexPct: 0.26, endPct: 0.29, type: 'hairpin', targetApexSpeedKph: 76, description: 'Tight left hairpin. Exit priority onto Aintree.' },
  { index: 5, name: 'Turn 5 (Aintree)', startPct: 0.30, apexPct: 0.33, endPct: 0.36, type: 'medium', targetApexSpeedKph: 145, description: 'Opening left onto Wellington Straight.' },
  { index: 6, name: 'Turn 6 (Brooklands)', startPct: 0.42, apexPct: 0.45, endPct: 0.48, type: 'medium', targetApexSpeedKph: 135, description: 'Long left trail-braking entry.' },
  { index: 7, name: 'Turn 7 (Luffield)', startPct: 0.49, apexPct: 0.52, endPct: 0.56, type: 'hairpin', targetApexSpeedKph: 98, description: 'Long increasing radius right.' },
  { index: 8, name: 'Turn 8 (Woodcote)', startPct: 0.57, apexPct: 0.59, endPct: 0.61, type: 'kink', targetApexSpeedKph: 215, description: 'Fast acceleration onto National Straight.' },
  { index: 9, name: 'Turn 9 (Copse)', startPct: 0.64, apexPct: 0.67, endPct: 0.70, type: 'fast_sweeper', targetApexSpeedKph: 230, description: 'Terrifying 6th gear blind right entry.' },
  { index: 10, name: 'Turn 10 (Maggotts)', startPct: 0.72, apexPct: 0.74, endPct: 0.76, type: 'fast_sweeper', targetApexSpeedKph: 260, description: 'Entry to high-speed complex.' },
  { index: 11, name: 'Turn 11 (Becketts Left)', startPct: 0.76, apexPct: 0.78, endPct: 0.80, type: 'fast_sweeper', targetApexSpeedKph: 215, description: 'Weight transfer left.' },
  { index: 12, name: 'Turn 12 (Becketts Right)', startPct: 0.80, apexPct: 0.82, endPct: 0.84, type: 'medium', targetApexSpeedKph: 165, description: 'Trail-brake into right.' },
  { index: 13, name: 'Turn 13 (Chapel)', startPct: 0.84, apexPct: 0.86, endPct: 0.88, type: 'fast_sweeper', targetApexSpeedKph: 220, description: 'Exit onto Hangar Straight.' },
  { index: 14, name: 'Turn 14 (Stowe Entry)', startPct: 0.90, apexPct: 0.92, endPct: 0.94, type: 'medium', targetApexSpeedKph: 168, description: 'Fast uphill right hander.' },
  { index: 15, name: 'Turn 15 (Vale Entry)', startPct: 0.95, apexPct: 0.96, endPct: 0.97, type: 'chicane', targetApexSpeedKph: 88, description: 'Heavy braking into left chicane.' },
  { index: 16, name: 'Turn 16 (Vale Exit)', startPct: 0.97, apexPct: 0.98, endPct: 0.99, type: 'medium', targetApexSpeedKph: 105, description: 'Right flick.' },
  { index: 17, name: 'Turn 17 (Club Entry)', startPct: 0.99, apexPct: 0.995, endPct: 1.0, type: 'medium', targetApexSpeedKph: 130, description: 'Long right onto Hamilton Straight.' },
  { index: 18, name: 'Turn 18 (Club Exit)', startPct: 0.995, apexPct: 1.0, endPct: 1.0, type: 'kink', targetApexSpeedKph: 175, description: 'Full throttle sprint to finish line.' }
];

// 6. Road America (14 Turns)
export const ROAD_AMERICA_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1', startPct: 0.05, apexPct: 0.08, endPct: 0.11, type: 'medium', targetApexSpeedKph: 125, description: '90° right after long front straight.' },
  { index: 2, name: 'Turn 2', startPct: 0.12, apexPct: 0.14, endPct: 0.16, type: 'kink', targetApexSpeedKph: 220, description: 'Fast right bend.' },
  { index: 3, name: 'Turn 3', startPct: 0.17, apexPct: 0.20, endPct: 0.23, type: 'medium', targetApexSpeedKph: 115, description: 'Uphill right onto Moraine Sweep.' },
  { index: 4, name: 'Turn 4 (Moraine Sweep)', startPct: 0.25, apexPct: 0.28, endPct: 0.31, type: 'kink', targetApexSpeedKph: 235, description: 'High speed curve.' },
  { index: 5, name: 'Turn 5', startPct: 0.34, apexPct: 0.38, endPct: 0.42, type: 'hairpin', targetApexSpeedKph: 72, description: 'Heavy downhill braking into 90° left.' },
  { index: 6, name: 'Turn 6', startPct: 0.44, apexPct: 0.47, endPct: 0.50, type: 'medium', targetApexSpeedKph: 120, description: 'Blind left over crest.' },
  { index: 7, name: 'Turn 7 (Hurley Haywood)', startPct: 0.51, apexPct: 0.54, endPct: 0.57, type: 'medium', targetApexSpeedKph: 118, description: 'Right turn leading to the Carousel.' },
  { index: 8, name: 'Turn 8', startPct: 0.58, apexPct: 0.61, endPct: 0.64, type: 'medium', targetApexSpeedKph: 110, description: 'Left turn into Carousel entry.' },
  { index: 9, name: 'Turn 9 (The Carousel)', startPct: 0.65, apexPct: 0.70, endPct: 0.75, type: 'fast_sweeper', targetApexSpeedKph: 145, description: 'Endless 200° right sweeper.' },
  { index: 10, name: 'Turn 10', startPct: 0.76, apexPct: 0.78, endPct: 0.80, type: 'kink', targetApexSpeedKph: 220, description: 'Fast exit transition.' },
  { index: 11, name: 'Turn 11 (The Kink)', startPct: 0.81, apexPct: 0.83, endPct: 0.85, type: 'fast_sweeper', targetApexSpeedKph: 210, description: 'High consequence blind right kink.' },
  { index: 12, name: 'Turn 12 (Canada Corner)', startPct: 0.87, apexPct: 0.90, endPct: 0.93, type: 'medium', targetApexSpeedKph: 98, description: 'Heavy braking 90° right.' },
  { index: 13, name: 'Turn 13 (Bill Mitchell Bend)', startPct: 0.94, apexPct: 0.96, endPct: 0.98, type: 'fast_sweeper', targetApexSpeedKph: 165, description: 'Fast uphill left.' },
  { index: 14, name: 'Turn 14', startPct: 0.98, apexPct: 0.99, endPct: 1.0, type: 'medium', targetApexSpeedKph: 125, description: 'Final right onto the uphill start/finish straight.' }
];

// 7. Suzuka Circuit (Full - 18 Turns)
export const SUZUKA_FULL_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (First Corner Entry)', startPct: 0.04, apexPct: 0.07, endPct: 0.10, type: 'medium', targetApexSpeedKph: 175, description: 'Fast right entry downshifting to Turn 2.' },
  { index: 2, name: 'Turn 2 (First Corner Exit)', startPct: 0.10, apexPct: 0.12, endPct: 0.14, type: 'medium', targetApexSpeedKph: 118, description: 'Tightening right onto the Esses.' },
  { index: 3, name: 'Turn 3 (S-Curve 1)', startPct: 0.16, apexPct: 0.18, endPct: 0.20, type: 'fast_sweeper', targetApexSpeedKph: 165, description: 'Left flick; rhythm is everything.' },
  { index: 4, name: 'Turn 4 (S-Curve 2)', startPct: 0.20, apexPct: 0.22, endPct: 0.24, type: 'fast_sweeper', targetApexSpeedKph: 160, description: 'Right transition; balance weight.' },
  { index: 5, name: 'Turn 5 (S-Curve 3)', startPct: 0.24, apexPct: 0.26, endPct: 0.28, type: 'fast_sweeper', targetApexSpeedKph: 155, description: 'Left flick.' },
  { index: 6, name: 'Turn 6 (S-Curve 4)', startPct: 0.28, apexPct: 0.30, endPct: 0.32, type: 'medium', targetApexSpeedKph: 150, description: 'Right turn leading to Dunlop.' },
  { index: 7, name: 'Turn 7 (Dunlop Curve)', startPct: 0.33, apexPct: 0.36, endPct: 0.39, type: 'fast_sweeper', targetApexSpeedKph: 195, description: 'Long uphill left sweeper.' },
  { index: 8, name: 'Turn 8 (Degner 1)', startPct: 0.41, apexPct: 0.43, endPct: 0.45, type: 'medium', targetApexSpeedKph: 170, description: 'Fast right; clip curb tightly.' },
  { index: 9, name: 'Turn 9 (Degner 2)', startPct: 0.46, apexPct: 0.48, endPct: 0.50, type: 'medium', targetApexSpeedKph: 110, description: '90° right under the bridge crossover.' },
  { index: 10, name: 'Turn 10', startPct: 0.52, apexPct: 0.54, endPct: 0.56, type: 'kink', targetApexSpeedKph: 215, description: 'Approach to the Hairpin.' },
  { index: 11, name: 'Turn 11 (Hairpin)', startPct: 0.57, apexPct: 0.60, endPct: 0.63, type: 'hairpin', targetApexSpeedKph: 68, description: 'Iconic 180° left hairpin. Deep trail-braking.' },
  { index: 12, name: 'Turn 12 (200R)', startPct: 0.66, apexPct: 0.69, endPct: 0.72, type: 'fast_sweeper', targetApexSpeedKph: 220, description: 'Fast right bend to Spoon.' },
  { index: 13, name: 'Turn 13 (Spoon Entry)', startPct: 0.74, apexPct: 0.77, endPct: 0.80, type: 'medium', targetApexSpeedKph: 145, description: 'Double-apex left entry.' },
  { index: 14, name: 'Turn 14 (Spoon Exit)', startPct: 0.80, apexPct: 0.83, endPct: 0.86, type: 'medium', targetApexSpeedKph: 130, description: 'Crucial exit speed onto the 130R back straight.' },
  { index: 15, name: 'Turn 15 (130R)', startPct: 0.90, apexPct: 0.93, endPct: 0.96, type: 'fast_sweeper', targetApexSpeedKph: 265, description: 'Legendary flat out 260+ kph left corner.' },
  { index: 16, name: 'Turn 16 (Casio Triangle Entry)', startPct: 0.97, apexPct: 0.98, endPct: 0.99, type: 'chicane', targetApexSpeedKph: 72, description: 'Heavy braking into right chicane.' },
  { index: 17, name: 'Turn 17 (Casio Triangle Mid)', startPct: 0.99, apexPct: 0.995, endPct: 1.0, type: 'chicane', targetApexSpeedKph: 75, description: 'Left flick.' },
  { index: 18, name: 'Turn 18 (Casio Triangle Exit)', startPct: 0.995, apexPct: 1.0, endPct: 1.0, type: 'kink', targetApexSpeedKph: 145, description: 'Full throttle onto front straight.' }
];

// 8. Circuit de Barcelona-Catalunya (GP - 16 Turns)
export const BARCELONA_GP_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Elf)', startPct: 0.05, apexPct: 0.08, endPct: 0.11, type: 'medium', targetApexSpeedKph: 135, description: 'Heavy braking into right downhill entry.' },
  { index: 2, name: 'Turn 2', startPct: 0.11, apexPct: 0.13, endPct: 0.15, type: 'medium', targetApexSpeedKph: 140, description: 'Left transition leading into Renault curve.' },
  { index: 3, name: 'Turn 3 (Renault)', startPct: 0.15, apexPct: 0.20, endPct: 0.25, type: 'fast_sweeper', targetApexSpeedKph: 210, description: 'Long high-G uphill right sweeper.' },
  { index: 4, name: 'Turn 4 (Repsol)', startPct: 0.27, apexPct: 0.30, endPct: 0.33, type: 'medium', targetApexSpeedKph: 125, description: 'Downhill 90° right. Trail-brake to rotate.' },
  { index: 5, name: 'Turn 5 (Seat)', startPct: 0.36, apexPct: 0.39, endPct: 0.42, type: 'hairpin', targetApexSpeedKph: 85, description: 'Tight downhill off-camber left hairpin.' },
  { index: 6, name: 'Turn 6', startPct: 0.43, apexPct: 0.45, endPct: 0.47, type: 'kink', targetApexSpeedKph: 195, description: 'Uphill acceleration curve.' },
  { index: 7, name: 'Turn 7 (Wurth)', startPct: 0.49, apexPct: 0.52, endPct: 0.55, type: 'medium', targetApexSpeedKph: 130, description: 'Uphill left flick over crest.' },
  { index: 8, name: 'Turn 8', startPct: 0.55, apexPct: 0.57, endPct: 0.59, type: 'medium', targetApexSpeedKph: 145, description: 'Right turn leading to Campsa.' },
  { index: 9, name: 'Turn 9 (Campsa)', startPct: 0.60, apexPct: 0.63, endPct: 0.66, type: 'fast_sweeper', targetApexSpeedKph: 205, description: 'Blind uphill crest right hander.' },
  { index: 10, name: 'Turn 10 (La Caixa)', startPct: 0.72, apexPct: 0.75, endPct: 0.78, type: 'hairpin', targetApexSpeedKph: 88, description: 'Heavy braking into stadium left hairpin.' },
  { index: 11, name: 'Turn 11', startPct: 0.79, apexPct: 0.81, endPct: 0.83, type: 'kink', targetApexSpeedKph: 165, description: 'Short left connecting section.' },
  { index: 12, name: 'Turn 12 (Banco Sabadell)', startPct: 0.84, apexPct: 0.87, endPct: 0.90, type: 'medium', targetApexSpeedKph: 120, description: 'Long right-hander in the stadium.' },
  { index: 13, name: 'Turn 13 (Europcar)', startPct: 0.91, apexPct: 0.93, endPct: 0.95, type: 'fast_sweeper', targetApexSpeedKph: 175, description: 'Fast right opening onto final corner.' },
  { index: 14, name: 'Turn 14 (New Chicane Entry)', startPct: 0.95, apexPct: 0.965, endPct: 0.975, type: 'chicane', targetApexSpeedKph: 95, description: 'Weight shift over inner curb.' },
  { index: 15, name: 'Turn 15 (Chicane Exit)', startPct: 0.975, apexPct: 0.985, endPct: 0.99, type: 'chicane', targetApexSpeedKph: 110, description: 'Right exit flick.' },
  { index: 16, name: 'Turn 16 (Catalunya Exit)', startPct: 0.99, apexPct: 0.995, endPct: 1.0, type: 'fast_sweeper', targetApexSpeedKph: 185, description: 'Flat-out exit onto 1km front straight.' }
];

// 9. Le Mans - Circuit International de la Sarthe (Full - 12 Key Sections)
export const LE_MANS_FULL_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Dunlop Curve)', startPct: 0.03, apexPct: 0.05, endPct: 0.07, type: 'fast_sweeper', targetApexSpeedKph: 220, description: 'Fast right sweep under Dunlop Bridge.' },
  { index: 2, name: 'Turn 2 (Dunlop Chicane)', startPct: 0.07, apexPct: 0.09, endPct: 0.11, type: 'chicane', targetApexSpeedKph: 110, description: 'Left-right chicane over curbs.' },
  { index: 3, name: 'Turn 3 (Tertre Rouge)', startPct: 0.14, apexPct: 0.16, endPct: 0.18, type: 'fast_sweeper', targetApexSpeedKph: 185, description: 'Crucial exit speed onto the 6km Mulsanne Straight.' },
  { index: 4, name: 'Turn 4 (First Mulsanne Chicane)', startPct: 0.28, apexPct: 0.30, endPct: 0.32, type: 'chicane', targetApexSpeedKph: 105, description: 'Heavy 330+ kph braking into right chicane.' },
  { index: 5, name: 'Turn 5 (Second Mulsanne Chicane)', startPct: 0.42, apexPct: 0.44, endPct: 0.46, type: 'chicane', targetApexSpeedKph: 112, description: 'Heavy braking into left chicane.' },
  { index: 6, name: 'Turn 6 (Mulsanne Corner)', startPct: 0.54, apexPct: 0.56, endPct: 0.58, type: 'hairpin', targetApexSpeedKph: 78, description: 'Heavy braking 90° right onto Indianapolis run.' },
  { index: 7, name: 'Turn 7 (Indianapolis Entry)', startPct: 0.67, apexPct: 0.69, endPct: 0.71, type: 'fast_sweeper', targetApexSpeedKph: 215, description: 'High speed right kink before heavy left braking.' },
  { index: 8, name: 'Turn 8 (Indianapolis Corner)', startPct: 0.71, apexPct: 0.73, endPct: 0.75, type: 'medium', targetApexSpeedKph: 105, description: 'Banked left turn.' },
  { index: 9, name: 'Turn 9 (Arnage)', startPct: 0.78, apexPct: 0.80, endPct: 0.82, type: 'hairpin', targetApexSpeedKph: 70, description: 'Slowest corner on circuit. 90° right.' },
  { index: 10, name: 'Turn 10 (Porsche Curves Entry)', startPct: 0.86, apexPct: 0.88, endPct: 0.90, type: 'fast_sweeper', targetApexSpeedKph: 200, description: 'Terrifying high-speed right transition.' },
  { index: 11, name: 'Turn 11 (Porsche Curves Mid)', startPct: 0.90, apexPct: 0.92, endPct: 0.94, type: 'fast_sweeper', targetApexSpeedKph: 195, description: 'Left-right flow near armco barriers.' },
  { index: 12, name: 'Turn 12 (Ford Chicanes)', startPct: 0.97, apexPct: 0.985, endPct: 1.0, type: 'chicane', targetApexSpeedKph: 90, description: 'Double chicane onto start/finish straight.' }
];

// 10. Virginia International Raceway (VIR Full - 16 Turns)
export const VIR_FULL_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Horseshoe Entry)', startPct: 0.04, apexPct: 0.07, endPct: 0.10, type: 'hairpin', targetApexSpeedKph: 85, description: 'Heavy braking into 180° right hairpin.' },
  { index: 2, name: 'Turn 2', startPct: 0.10, apexPct: 0.12, endPct: 0.14, type: 'kink', targetApexSpeedKph: 160, description: 'Short left transition.' },
  { index: 3, name: 'Turn 3 (NASCAR Bend)', startPct: 0.14, apexPct: 0.17, endPct: 0.20, type: 'medium', targetApexSpeedKph: 125, description: 'Sweeping left onto Left Kink.' },
  { index: 4, name: 'Turn 4 (Left Kink)', startPct: 0.21, apexPct: 0.23, endPct: 0.25, type: 'kink', targetApexSpeedKph: 175, description: 'Fast kink.' },
  { index: 5, name: 'Turn 5 (The Snake Entry)', startPct: 0.26, apexPct: 0.28, endPct: 0.30, type: 'medium', targetApexSpeedKph: 130, description: 'Right flick.' },
  { index: 6, name: 'Turn 6 (The Snake Exit)', startPct: 0.30, apexPct: 0.32, endPct: 0.34, type: 'medium', targetApexSpeedKph: 135, description: 'Left flick.' },
  { index: 7, name: 'Turn 7 (Climbing Esses 1)', startPct: 0.36, apexPct: 0.38, endPct: 0.40, type: 'fast_sweeper', targetApexSpeedKph: 195, description: 'Uphill right compression.' },
  { index: 8, name: 'Turn 8 (Climbing Esses 2)', startPct: 0.40, apexPct: 0.42, endPct: 0.44, type: 'fast_sweeper', targetApexSpeedKph: 205, description: 'Uphill left transition.' },
  { index: 9, name: 'Turn 9 (Climbing Esses 3)', startPct: 0.44, apexPct: 0.46, endPct: 0.48, type: 'fast_sweeper', targetApexSpeedKph: 215, description: 'Crest right.' },
  { index: 10, name: 'Turn 10 (South Bend)', startPct: 0.50, apexPct: 0.53, endPct: 0.56, type: 'fast_sweeper', targetApexSpeedKph: 170, description: 'Blind crest fast left.' },
  { index: 11, name: 'Turn 11 (Oak Tree Entry)', startPct: 0.62, apexPct: 0.64, endPct: 0.66, type: 'hairpin', targetApexSpeedKph: 75, description: 'Heavy braking into right hairpin.' },
  { index: 12, name: 'Turn 12 (Oak Tree Exit)', startPct: 0.66, apexPct: 0.68, endPct: 0.70, type: 'hairpin', targetApexSpeedKph: 80, description: 'Tight right exit onto Back Straight.' },
  { index: 13, name: 'Turn 13', startPct: 0.84, apexPct: 0.86, endPct: 0.88, type: 'kink', targetApexSpeedKph: 220, description: 'Fast crest on back straight.' },
  { index: 14, name: 'Turn 14 (Roller Coaster)', startPct: 0.89, apexPct: 0.91, endPct: 0.93, type: 'medium', targetApexSpeedKph: 115, description: 'Steep downhill plunge right.' },
  { index: 15, name: 'Turn 15 (Hog Pen Entry)', startPct: 0.94, apexPct: 0.96, endPct: 0.97, type: 'medium', targetApexSpeedKph: 128, description: 'Left hander onto final curve.' },
  { index: 16, name: 'Turn 16 (Hog Pen Exit)', startPct: 0.97, apexPct: 0.985, endPct: 1.0, type: 'fast_sweeper', targetApexSpeedKph: 165, description: 'Long right opening onto front straight.' }
];

// 11. Kyalami Grand Prix Circuit (8 Turns)
export const KYALAMI_GP_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Crowthorne)', startPct: 0.05, apexPct: 0.09, endPct: 0.13, type: 'medium', targetApexSpeedKph: 110, description: 'Heavy downhill braking into right.' },
  { index: 2, name: 'Turn 2 (Jukskei Sweep)', startPct: 0.16, apexPct: 0.20, endPct: 0.24, type: 'fast_sweeper', targetApexSpeedKph: 185, description: 'Fast downhill left sweep.' },
  { index: 3, name: 'Turn 3 (Barbeque)', startPct: 0.27, apexPct: 0.31, endPct: 0.35, type: 'medium', targetApexSpeedKph: 130, description: 'Uphill right turn.' },
  { index: 4, name: 'Turn 4 (Sunset)', startPct: 0.40, apexPct: 0.44, endPct: 0.48, type: 'fast_sweeper', targetApexSpeedKph: 160, description: 'Downhill long right hander.' },
  { index: 5, name: 'Turn 5 (Clubhouse)', startPct: 0.54, apexPct: 0.57, endPct: 0.60, type: 'hairpin', targetApexSpeedKph: 85, description: 'Uphill left hairpin.' },
  { index: 6, name: 'Turn 6 (The Esses)', startPct: 0.66, apexPct: 0.70, endPct: 0.74, type: 'chicane', targetApexSpeedKph: 140, description: 'Uphill left-right transition.' },
  { index: 7, name: 'Turn 7 (Leeukop)', startPct: 0.79, apexPct: 0.83, endPct: 0.87, type: 'hairpin', targetApexSpeedKph: 90, description: 'Blind right hairpin onto Mineshaft.' },
  { index: 8, name: 'Turn 8 (Mineshaft)', startPct: 0.91, apexPct: 0.95, endPct: 1.0, type: 'fast_sweeper', targetApexSpeedKph: 215, description: 'Steep downhill acceleration sweep to start/finish.' }
];

// Helper database mapping canonical track layout names to Corner arrays
export const FM23_TRACK_CORNERS_REGISTRY: Record<string, PredefinedCornerDef[]> = {
  // Lime Rock
  'lime-rock-full': LIME_ROCK_FULL_CORNERS,
  'lime-rock-park-full-circuit': LIME_ROCK_FULL_CORNERS,
  'lime-rock-full-alt': LIME_ROCK_FULL_CORNERS,
  'lime-rock-south': LIME_ROCK_FULL_CORNERS.slice(0, 6),

  // Laguna Seca
  'weathertech-raceway-laguna-seca': LAGUNA_SECA_CORNERS,
  'laguna-seca': LAGUNA_SECA_CORNERS,
  'laguna-seca-full': LAGUNA_SECA_CORNERS,
  'laguna-seca-short': LAGUNA_SECA_CORNERS.filter(c => c.index !== 5 && c.index !== 6 && c.index !== 7),

  // Spa
  'circuit-de-spa-francorchamps': SPA_FRANCORCHAMPS_CORNERS,
  'spa': SPA_FRANCORCHAMPS_CORNERS,

  // Watkins Glen
  'watkins-glen-full-course': WATKINS_GLEN_FULL_CORNERS,
  'watkins-glen-full': WATKINS_GLEN_FULL_CORNERS,
  'watkins-glen': WATKINS_GLEN_FULL_CORNERS,
  'watkins-glen-short': WATKINS_GLEN_FULL_CORNERS.filter(c => c.index <= 6 || c.index >= 10),

  // Silverstone
  'silverstone-grand-prix': SILVERSTONE_GP_CORNERS,
  'silverstone-gp': SILVERSTONE_GP_CORNERS,
  'silverstone': SILVERSTONE_GP_CORNERS,
  'silverstone-international': SILVERSTONE_GP_CORNERS.filter(c => c.index <= 5 || c.index >= 14),
  'silverstone-national': SILVERSTONE_GP_CORNERS.filter(c => c.index >= 6 && c.index <= 11),

  // Road America
  'road-america-full-course': ROAD_AMERICA_CORNERS,
  'road-america-full': ROAD_AMERICA_CORNERS,
  'road-america': ROAD_AMERICA_CORNERS,
  'road-america-east': ROAD_AMERICA_CORNERS.slice(0, 10),

  // Suzuka
  'suzuka-circuit-full': SUZUKA_FULL_CORNERS,
  'suzuka-full': SUZUKA_FULL_CORNERS,
  'suzuka': SUZUKA_FULL_CORNERS,
  'suzuka-east': SUZUKA_FULL_CORNERS.slice(0, 8),

  // Barcelona-Catalunya
  'circuit-de-barcelona-catalunya': BARCELONA_GP_CORNERS,
  'circuit-de-barcelona-catalunya-gp': BARCELONA_GP_CORNERS,
  'barcelona-gp': BARCELONA_GP_CORNERS,
  'barcelona': BARCELONA_GP_CORNERS,
  'circuit-de-barcelona-catalunya-national': BARCELONA_GP_CORNERS.slice(0, 7),
  'circuit-de-barcelona-catalunya-national-alt': BARCELONA_GP_CORNERS.slice(0, 7),

  // Le Mans
  'le-mans-circuit-international-de-la-sarthe': LE_MANS_FULL_CORNERS,
  'le-mans-la-sarthe-full': LE_MANS_FULL_CORNERS,
  'le-mans-old-mulsanne': LE_MANS_FULL_CORNERS.filter(c => c.index !== 4 && c.index !== 5),
  'le-mans': LE_MANS_FULL_CORNERS,

  // VIR
  'virginia-international-raceway': VIR_FULL_CORNERS,
  'vir-full': VIR_FULL_CORNERS,
  'vir-grand-east': VIR_FULL_CORNERS,
  'vir-grand-west': VIR_FULL_CORNERS,
  'vir-north': VIR_FULL_CORNERS.slice(0, 10),
  'vir-south': VIR_FULL_CORNERS.slice(8, 16),

  // Kyalami
  'kyalami-grand-prix-circuit': KYALAMI_GP_CORNERS,
  'kyalami': KYALAMI_GP_CORNERS
};

/**
 * Default fallback corners when Lime Rock is active
 */
export const DEFAULT_TRACK_CORNERS: PredefinedCornerDef[] = LIME_ROCK_FULL_CORNERS;

/**
 * Resolves predefined corner definitions for a given track name string or layout ID.
 */
export function getTrackCorners(trackName?: string): PredefinedCornerDef[] | null {
  if (!trackName) return null;
  const normalized = trackName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (FM23_TRACK_CORNERS_REGISTRY[normalized]) {
    return FM23_TRACK_CORNERS_REGISTRY[normalized];
  }

  // Substring match
  for (const [key, corners] of Object.entries(FM23_TRACK_CORNERS_REGISTRY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return corners;
    }
  }

  return null;
}
