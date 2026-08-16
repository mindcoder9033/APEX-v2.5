export interface FM23Track {
  id: string;
  name: string;
  isFictional: boolean;
  country: string;
  layouts: string[];
}

export const FM23_TRACKS: FM23Track[] = [
  // Real Tracks
  {
    id: 'barcelona',
    name: 'Circuit de Barcelona-Catalunya',
    isFictional: false,
    country: 'Spain',
    layouts: [
      'Circuit de Barcelona-Catalunya GP',
      'Circuit de Barcelona-Catalunya National',
      'Circuit de Barcelona-Catalunya National Alt'
    ]
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    isFictional: false,
    country: 'Belgium',
    layouts: ['Circuit de Spa-Francorchamps']
  },
  {
    id: 'homestead',
    name: 'Homestead-Miami',
    isFictional: false,
    country: 'United States',
    layouts: ['Homestead Road', 'Homestead Speedway']
  },
  {
    id: 'indianapolis',
    name: 'Indianapolis Motor Speedway',
    isFictional: false,
    country: 'United States',
    layouts: ['Indianapolis Brickyard Oval', 'Indianapolis GP']
  },
  {
    id: 'kyalami',
    name: 'Kyalami Grand Prix Circuit',
    isFictional: false,
    country: 'South Africa',
    layouts: ['Kyalami Grand Prix Circuit']
  },
  {
    id: 'lemans',
    name: 'Le Mans – Circuit International de la Sarthe',
    isFictional: false,
    country: 'France',
    layouts: ['Le Mans La Sarthe Full', 'Le Mans Old Mulsanne']
  },
  {
    id: 'laguna-seca',
    name: 'Laguna Seca Raceway',
    isFictional: false,
    country: 'United States',
    layouts: ['Laguna Seca', 'Laguna Seca Short']
  },
  {
    id: 'lime-rock',
    name: 'Lime Rock Park',
    isFictional: false,
    country: 'United States',
    layouts: ['Lime Rock Full', 'Lime Rock Full Alt', 'Lime Rock South']
  },
  {
    id: 'mid-ohio',
    name: 'Mid-Ohio Sports Car Course',
    isFictional: false,
    country: 'United States',
    layouts: ['Mid-Ohio', 'Mid-Ohio Short']
  },
  {
    id: 'mugello',
    name: 'Mugello Circuit',
    isFictional: false,
    country: 'Italy',
    layouts: ['Mugello Club', 'Mugello Full']
  },
  {
    id: 'nurburgring',
    name: 'Nurburgring',
    isFictional: false,
    country: 'Germany',
    layouts: ['Nurburgring GP', 'Nurburgring Sprint']
  },
  {
    id: 'road-america',
    name: 'Road America',
    isFictional: false,
    country: 'United States',
    layouts: ['Road America', 'Road America East']
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    isFictional: false,
    country: 'United Kingdom',
    layouts: ['Silverstone GP', 'Silverstone International', 'Silverstone National']
  },
  {
    id: 'suzuka',
    name: 'Suzuka Circuit',
    isFictional: false,
    country: 'Japan',
    layouts: ['Suzuka Full', 'Suzuka East']
  },
  {
    id: 'vir',
    name: 'Virginia International Raceway',
    isFictional: false,
    country: 'United States',
    layouts: ['VIR Full', 'VIR Grand East', 'VIR Grand West', 'VIR North', 'VIR South']
  },
  {
    id: 'watkins-glen',
    name: 'Watkins Glen',
    isFictional: false,
    country: 'United States',
    layouts: ['Watkins Glen Full', 'Watkins Glen Short']
  },

  // Fictional Tracks
  {
    id: 'eaglerock',
    name: 'Eaglerock Speedway',
    isFictional: true,
    country: 'United States',
    layouts: ['Eaglerock Club', 'Eaglerock Club Reverse', 'Eaglerock Oval']
  },
  {
    id: 'grand-oak',
    name: 'Grand Oak Raceway',
    isFictional: true,
    country: 'United States',
    layouts: ['Grand Oak Club', 'Grand Oak National', 'Grand Oak National Reverse']
  },
  {
    id: 'hakone',
    name: 'Hakone',
    isFictional: true,
    country: 'Japan',
    layouts: ['Hakone Grand Prix', 'Hakone Club', 'Hakone Club Reverse']
  },
  {
    id: 'maple-valley',
    name: 'Maple Valley',
    isFictional: true,
    country: 'United States',
    layouts: ['Maple Valley', 'Maple Valley Short', 'Maple Valley Short Reverse']
  }
];

export const ALL_FM23_LAYOUTS: string[] = FM23_TRACKS.flatMap(track => track.layouts);

export function findTrackByLayout(layoutName: string): FM23Track | undefined {
  return FM23_TRACKS.find(t => t.layouts.some(l => l.toLowerCase() === layoutName.toLowerCase()));
}
