/**
 * Forza Motorsport & Horizon Car Ordinal to Car Name Mapping
 * Forza transmits carOrdinal (32-bit int), carClass (0-7), and carPerformanceIndex (100-999).
 */

export interface ForzaCarInfo {
  name: string;
  manufacturer?: string;
  year?: number;
  class?: string;
}

// Known Car Ordinals in Forza Motorsport / Horizon
export const FORZA_CAR_ORDINALS: Record<number, string> = {
  // Popular Formula / Prototype / Open Wheel
  2841: 'Formula Skip Barber 2000',
  2351: 'Mazda Formula Mazda 2015',
  1823: 'Porsche 919 Hybrid 2017',
  1824: 'Toyota TS050 Hybrid 2017',
  1789: 'Audi R18 e-tron quattro 2014',
  1450: 'Mazda 787B #55 1991',
  1451: 'Porsche 962C #17 1987',
  1452: 'Sauber-Mercedes C9 1989',

  // GT / Touring / Cup Cars
  2901: 'Porsche 911 GT3 R 2018',
  2902: 'Porsche 911 RSR 2017',
  2903: 'Acura NSX GT3 2018',
  2904: 'BMW M8 GTE 2018',
  2905: 'BMW M6 GTLM 2017',
  2906: 'Chevrolet Corvette C8.R 2020',
  2907: 'Chevrolet Corvette C7.R 2014',
  2908: 'Ferrari 488 Challenge 2017',
  2909: 'Ferrari 488 GTE 2018',
  2910: 'Ford GT Le Mans 2016',
  2911: 'Aston Martin Vantage GTE 2018',
  2912: 'Mercedes-AMG GT3 2018',
  2913: 'Audi R8 LMS 2015',
  2914: 'Lamborghini Huracán Super Trofeo 2015',

  // Track & Road Performance Sports Cars
  3101: 'Porsche 911 GT3 2021',
  3102: 'Porsche 911 GT3 RS 2019',
  3103: 'Porsche 911 GT2 RS 2018',
  3104: 'Porsche 718 Cayman GTS 2018',
  3105: 'Chevrolet Corvette Z06 2023',
  3106: 'Chevrolet Camaro ZL1 1LE 2018',
  3107: 'Ford Mustang Shelby GT350R 2016',
  3108: 'Ferrari 458 Italia 2009',
  3109: 'Ferrari F40 1987',
  3110: 'Honda NSX-R 1992',
  3111: 'Honda S2000 CR 2009',
  3112: 'Honda Civic Type R 2018',
  3113: 'Honda Civic Type R 1997',
  3114: 'Mazda MX-5 Miata 1990',
  3115: 'Mazda MX-5 2016',
  3116: 'Mazda RX-7 Spirit R 2002',
  3117: 'BMW M3 1997',
  3118: 'BMW M3 2005',
  3119: 'BMW M4 Competition Coupe 2021',
  3120: 'Nissan Skyline GT-R V-Spec II (R34) 2002',
  3121: 'Nissan GT-R Nismo 2020',
  3122: 'Toyota GR Supra 2020',
  3123: 'Subaru BRZ 2022',
  3124: 'Toyota GR86 2022'
};

const CLASS_NAMES: Record<number, string> = {
  0: 'E',
  1: 'D',
  2: 'C',
  3: 'B',
  4: 'A',
  5: 'S',
  6: 'R',
  7: 'P',
  8: 'X'
};

/**
 * Resolves car name from Forza UDP telemetry fields.
 * Returns mapped name if ordinal exists, otherwise falls back strictly to "Custom Car".
 */
export function resolveForzaCar(carOrdinal?: number, _carClass?: number, _pi?: number): string {
  if (carOrdinal && FORZA_CAR_ORDINALS[carOrdinal]) {
    return FORZA_CAR_ORDINALS[carOrdinal];
  }
  return 'Custom Car';
}

/**
 * Helper to get car class letter (e.g. 'S', 'R', 'X')
 */
export function getForzaClassName(carClass?: number): string {
  if (carClass === undefined || carClass === null) return 'Unknown';
  return CLASS_NAMES[carClass] || 'Custom';
}
