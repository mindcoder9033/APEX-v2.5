export interface FM23Track {
  id: string;
  name: string;
  isFictional: boolean;
  country?: string;
  layouts: string[];
}

export const FM23_TRACKS: FM23Track[] = [
  {
    id: 'circuit-de-barcelona-catalunya',
    name: 'Circuit de Barcelona-Catalunya',
    isFictional: false,
    layouts: [
      'Circuit de Barcelona-Catalunya GP',
      'Circuit de Barcelona-Catalunya National',
      'Circuit de Barcelona-Catalunya National Alt',
    ]
  },
  {
    id: 'circuit-de-spa-francorchamps',
    name: 'Circuit de Spa-Francorchamps',
    isFictional: false,
    layouts: [
      'Circuit de Spa-Francorchamps',
    ]
  },
  {
    id: 'homestead-miami',
    name: 'Homestead-Miami',
    isFictional: false,
    layouts: [
      'Homestead Road',
      'Homestead Speedway',
    ]
  },
  {
    id: 'indianapolis-motor-speedway',
    name: 'Indianapolis Motor Speedway',
    isFictional: false,
    layouts: [
      'Indianapolis Brickyard Oval',
      'Indianapolis GP',
    ]
  },
  {
    id: 'kyalami-grand-prix-circuit',
    name: 'Kyalami Grand Prix Circuit',
    isFictional: false,
    layouts: [
      'Kyalami Grand Prix Circuit',
    ]
  },
  {
    id: 'le-mans-circuit-international-de-la-sarthe',
    name: 'Le Mans - Circuit International de la Sarthe',
    isFictional: false,
    layouts: [
      'Le Mans La Sarthe Full',
      'Le Mans Old Mulsanne',
    ]
  },
  {
    id: 'laguna-seca-raceway',
    name: 'Laguna Seca Raceway',
    isFictional: false,
    layouts: [
      'Laguna Seca',
      'Laguna Seca Short',
    ]
  },
  {
    id: 'lime-rock-park',
    name: 'Lime Rock Park',
    isFictional: false,
    layouts: [
      'Lime Rock Full',
      'Lime Rock Full Alt',
      'Lime Rock South',
    ]
  },
  {
    id: 'mid-ohio-sports-car-course',
    name: 'Mid-Ohio Sports Car Course',
    isFictional: false,
    layouts: [
      'Mid-Ohio',
      'Mid-Ohio Short',
    ]
  },
  {
    id: 'mugello-circuit',
    name: 'Mugello Circuit',
    isFictional: false,
    layouts: [
      'Mugello Club',
      'Mugello Full',
    ]
  },
  {
    id: 'nurburgring',
    name: 'Nurburgring',
    isFictional: false,
    layouts: [
      'Nurburgring GP',
      'Nurburgring Sprint',
    ]
  },
  {
    id: 'road-america',
    name: 'Road America',
    isFictional: false,
    layouts: [
      'Road America',
      'Road America East',
    ]
  },
  {
    id: 'silverstone-circuit',
    name: 'Silverstone Circuit',
    isFictional: false,
    layouts: [
      'Silverstone GP',
      'Silverstone International',
      'Silverstone National',
    ]
  },
  {
    id: 'suzuka-circuit',
    name: 'Suzuka Circuit',
    isFictional: false,
    layouts: [
      'Suzuka East',
      'Suzuka Full',
    ]
  },
  {
    id: 'virginia-international-raceway',
    name: 'Virginia International Raceway',
    isFictional: false,
    layouts: [
      'VIR Full',
      'VIR Grand East',
      'VIR Grand West',
      'VIR North',
      'VIR South',
    ]
  },
  {
    id: 'watkins-glen',
    name: 'Watkins Glen',
    isFictional: false,
    layouts: [
      'Watkins Glen Full',
      'Watkins Glen Short',
    ]
  },
  {
    id: 'eaglerock-speedway',
    name: 'Eaglerock Speedway',
    isFictional: true,
    layouts: [
      'Eaglerock Club',
      'Eaglerock Club Reverse',
      'Eaglerock Oval',
    ]
  },
  {
    id: 'grand-oak-raceway',
    name: 'Grand Oak Raceway',
    isFictional: true,
    layouts: [
      'Grand Oak Club',
      'Grand Oak National',
      'Grand Oak National Reverse',
    ]
  },
  {
    id: 'hakone',
    name: 'Hakone',
    isFictional: true,
    layouts: [
      'Hakone Club',
      'Hakone Club Reverse',
      'Hakone Grand Prix',
    ]
  },
  {
    id: 'maple-valley',
    name: 'Maple Valley',
    isFictional: true,
    layouts: [
      'Maple Valley',
      'Maple Valley Short',
      'Maple Valley Short Reverse',
    ]
  },
];

export const FM23_TRACKS_BY_VENUE: Record<string, string[]> = Object.fromEntries(
  FM23_TRACKS.map(t => [t.name, t.layouts])
);

export const FM23_TRACK_VENUES: string[] = FM23_TRACKS.map(t => t.name);

export const ALL_FM23_LAYOUTS: string[] = FM23_TRACKS.flatMap(track => track.layouts);

export function getTrackVenues(): string[] {
  return FM23_TRACK_VENUES;
}

export function getLayoutsByVenue(venueName: string): string[] {
  return FM23_TRACKS_BY_VENUE[venueName] || [];
}

export function findTrackByLayout(layoutName: string): FM23Track | undefined {
  if (!layoutName) return undefined;
  const lower = layoutName.toLowerCase().trim();
  return FM23_TRACKS.find(t => t.layouts.some(l => l.toLowerCase() === lower || lower.includes(l.toLowerCase())));
}

export function parseTrackName(rawTrackName?: string): { venue: string; layout: string } | null {
  if (!rawTrackName) return null;
  const clean = rawTrackName.replace(/\s*-\s*/g, ' ').toLowerCase().trim();
  for (const track of FM23_TRACKS) {
    for (const layout of track.layouts) {
      const cleanLayout = layout.replace(/\s*-\s*/g, ' ').toLowerCase().trim();
      if (cleanLayout === clean || clean.includes(cleanLayout) || cleanLayout.includes(clean)) {
        return { venue: track.name, layout: layout };
      }
    }
  }
  // Fallback match against track venue
  for (const track of FM23_TRACKS) {
    if (clean.includes(track.name.toLowerCase()) || track.name.toLowerCase().includes(clean)) {
      return { venue: track.name, layout: track.layouts[0] || track.name };
    }
  }
  return null;
}
