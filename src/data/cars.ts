export interface FM23Car {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  fullName: string;
  category?: string;
}

export const FM23_CARS: FM23Car[] = [
  // Mazda
  { id: 'mazda-formula-mazda-2015', manufacturer: 'Mazda', model: 'Formula Mazda', year: 2015, fullName: 'Mazda Formula Mazda 2015', category: 'Formula Open Wheel' },
  { id: 'mazda-mx5-miata-1990', manufacturer: 'Mazda', model: 'MX-5 Miata', year: 1990, fullName: 'Mazda MX-5 Miata 1990', category: 'Sport Compact' },
  { id: 'mazda-mx5-miata-1994', manufacturer: 'Mazda', model: 'MX-5 Miata', year: 1994, fullName: 'Mazda MX-5 Miata 1994', category: 'Sport Compact' },
  { id: 'mazda-mx5-2013', manufacturer: 'Mazda', model: 'MX-5', year: 2013, fullName: 'Mazda MX-5 2013', category: 'Sport Compact' },
  { id: 'mazda-mx5-2016', manufacturer: 'Mazda', model: 'MX-5', year: 2016, fullName: 'Mazda MX-5 2016', category: 'Sport Compact' },
  { id: 'mazda-rx7-1997', manufacturer: 'Mazda', model: 'RX-7', year: 1997, fullName: 'Mazda RX-7 1997', category: 'Sports GT' },
  { id: 'mazda-rx7-spirit-r-2002', manufacturer: 'Mazda', model: 'RX-7 Spirit R Type-A', year: 2002, fullName: 'Mazda RX-7 Spirit R Type-A 2002', category: 'Sports GT' },
  { id: 'mazda-787b-1991', manufacturer: 'Mazda', model: '787B #55', year: 1991, fullName: 'Mazda 787B #55 1991', category: 'Prototype Group C' },

  // Porsche
  { id: 'porsche-911-gt3-2021', manufacturer: 'Porsche', model: '911 GT3', year: 2021, fullName: 'Porsche 911 GT3 2021', category: 'Track GT' },
  { id: 'porsche-911-gt3-rs-2019', manufacturer: 'Porsche', model: '911 GT3 RS', year: 2019, fullName: 'Porsche 911 GT3 RS 2019', category: 'Track GT' },
  { id: 'porsche-911-gt3-r-2018', manufacturer: 'Porsche', model: '911 GT3 R #73 Park Place Motorsport', year: 2018, fullName: 'Porsche 911 GT3 R #73 Park Place Motorsport 2018 – RDCP', category: 'Forza GT' },
  { id: 'porsche-911-rsr-2017', manufacturer: 'Porsche', model: '911 RSR #92 Porsche GT Team', year: 2017, fullName: 'Porsche 911 RSR #92 Porsche GT Team 2017', category: 'Forza GT' },
  { id: 'porsche-718-cayman-gts-2018', manufacturer: 'Porsche', model: '718 Cayman GTS', year: 2018, fullName: 'Porsche 718 Cayman GTS 2018', category: 'Sports Coupe' },
  { id: 'porsche-911-gt2-rs-2018', manufacturer: 'Porsche', model: '911 GT2 RS', year: 2018, fullName: 'Porsche 911 GT2 RS 2018', category: 'Supercar' },
  { id: 'porsche-919-hybrid-2017', manufacturer: 'Porsche', model: '919 Hybrid #2 Porsche Team', year: 2017, fullName: 'Porsche 919 Hybrid #2 Porsche Team 2017', category: 'LMP1' },

  // Honda & Acura
  { id: 'honda-civic-type-r-1997', manufacturer: 'Honda', model: 'Civic Type R', year: 1997, fullName: 'Honda Civic Type R 1997', category: 'Hot Hatch' },
  { id: 'honda-civic-type-r-2018', manufacturer: 'Honda', model: 'Civic Type R', year: 2018, fullName: 'Honda Civic Type R 2018', category: 'Hot Hatch' },
  { id: 'honda-s2000-cr-2009', manufacturer: 'Honda', model: 'S2000 CR', year: 2009, fullName: 'Honda S2000 CR 2009', category: 'Sports Roadster' },
  { id: 'honda-nsx-r-1992', manufacturer: 'Honda', model: 'NSX-R', year: 1992, fullName: 'Honda NSX-R 1992', category: 'Supercar' },
  { id: 'acura-nsx-gt3-2018', manufacturer: 'Acura', model: 'NSX GT3 #36', year: 2018, fullName: 'Acura NSX GT3 #36 2018 – RDCP', category: 'Forza GT' },
  { id: 'acura-integra-type-r-2001', manufacturer: 'Acura', model: 'Integra Type R', year: 2001, fullName: 'Acura Integra Type R 2001', category: 'Sport Compact' },

  // BMW
  { id: 'bmw-m3-1997', manufacturer: 'BMW', model: 'M3', year: 1997, fullName: 'BMW M3 1997', category: 'Sport Coupe' },
  { id: 'bmw-m3-2005', manufacturer: 'BMW', model: 'M3', year: 2005, fullName: 'BMW M3 2005', category: 'Sport Coupe' },
  { id: 'bmw-m4-competition-2021', manufacturer: 'BMW', model: 'M4 Competition Coupe', year: 2021, fullName: 'BMW M4 Competition Coupe 2021', category: 'Sport Coupe' },
  { id: 'bmw-m8-gte-2018', manufacturer: 'BMW', model: 'M8 GTE #1 BMW M Motorsport', year: 2018, fullName: 'BMW M8 GTE #1 BMW M Motorsport 2018', category: 'Forza GT' },
  { id: 'bmw-m6-gtlm-2017', manufacturer: 'BMW', model: 'M6 GTLM #24 Team RLL', year: 2017, fullName: 'BMW M6 GTLM #24 Team RLL 2017', category: 'Forza GT' },

  // Chevrolet & Corvette
  { id: 'chevrolet-corvette-c8r-2020', manufacturer: 'Chevrolet', model: 'Corvette C8.R #3 Corvette Racing', year: 2020, fullName: 'Chevrolet Corvette C8.R #3 Corvette Racing 2020', category: 'Forza GT' },
  { id: 'chevrolet-corvette-c7r-2014', manufacturer: 'Chevrolet', model: 'Corvette C7.R #3 Corvette Racing', year: 2014, fullName: 'Chevrolet Corvette C7.R #3 Corvette Racing 2014', category: 'Forza GT' },
  { id: 'chevrolet-corvette-z06-2023', manufacturer: 'Chevrolet', model: 'Corvette Z06', year: 2023, fullName: 'Chevrolet Corvette Z06 2023', category: 'Supercar' },
  { id: 'chevrolet-camaro-zl1-1le-2018', manufacturer: 'Chevrolet', model: 'Camaro ZL1 1LE', year: 2018, fullName: 'Chevrolet Camaro ZL1 1LE 2018', category: 'Muscle' },

  // Ferrari
  { id: 'ferrari-488-challenge-2017', manufacturer: 'Ferrari', model: '488 Challenge #25 Corse Clienti', year: 2017, fullName: 'Ferrari 488 Challenge #25 Corse Clienti 2017', category: 'Forza GT' },
  { id: 'ferrari-458-italia-2009', manufacturer: 'Ferrari', model: '458 Italia', year: 2009, fullName: 'Ferrari 458 Italia 2009', category: 'Supercar' },
  { id: 'ferrari-f40-1987', manufacturer: 'Ferrari', model: 'F40', year: 1987, fullName: 'Ferrari F40 1987', category: 'Supercar' },
  { id: 'ferrari-330-p4-1967', manufacturer: 'Ferrari', model: '330 P4 #24 Ferrari Spa', year: 1967, fullName: 'Ferrari 330 P4 #24 Ferrari Spa 1967', category: 'Vintage Le Mans' },

  // Ford
  { id: 'ford-gt-le-mans-2016', manufacturer: 'Ford', model: 'GT Le Mans #66 Ford Racing', year: 2016, fullName: 'Ford GT Le Mans #66 Ford Racing 2016', category: 'Forza GT' },
  { id: 'ford-mustang-shelby-gt350r-2016', manufacturer: 'Ford', model: 'Mustang Shelby GT350R', year: 2016, fullName: 'Ford Mustang Shelby GT350R 2016', category: 'Track Muscle' },
  { id: 'ford-focus-rs-2017', manufacturer: 'Ford', model: 'Focus RS', year: 2017, fullName: 'Ford Focus RS 2017', category: 'Hot Hatch AWD' },
  { id: 'ford-gt40-mkii-1966', manufacturer: 'Ford', model: 'GT40 MkII Le Mans #2', year: 1966, fullName: 'Ford GT40 MkII Le Mans #2 1966', category: 'Vintage Le Mans' },

  // Audi
  { id: 'audi-r8-lms-gt3-2018', manufacturer: 'Audi', model: 'R8 LMS GT3 #44', year: 2018, fullName: 'Audi R8 LMS GT3 #44 2018 – RDCP', category: 'Forza GT' },
  { id: 'audi-rs3-lms-2018', manufacturer: 'Audi', model: 'RS3 LMS #1 Audi Sport', year: 2018, fullName: 'Audi RS3 LMS #1 Audi Sport 2018', category: 'Touring Car' },
  { id: 'audi-r18-etron-2014', manufacturer: 'Audi', model: 'R18 e-tron quattro Team Joest #2', year: 2014, fullName: 'Audi R18 e-tron quattro Team Joest #2 2014', category: 'LMP1' },

  // McLaren
  { id: 'mclaren-720s-coupe-2018', manufacturer: 'McLaren', model: '720S Coupe', year: 2018, fullName: 'McLaren 720S Coupe 2018', category: 'Supercar' },
  { id: 'mclaren-senna-2018', manufacturer: 'McLaren', model: 'Senna', year: 2018, fullName: 'McLaren Senna 2018', category: 'Hypercar' },
  { id: 'mclaren-m23-1976', manufacturer: 'McLaren', model: 'M23 #11 Team McLaren', year: 1976, fullName: 'McLaren M23 #11 Team McLaren 1976', category: 'Vintage Grand Prix' },

  // Nissan
  { id: 'nissan-gtr-nismo-2020', manufacturer: 'Nissan', model: 'GT-R NISMO (R35)', year: 2020, fullName: 'Nissan GT-R NISMO (R35) 2020', category: 'Supercar AWD' },
  { id: 'nissan-silvia-spec-r-2000', manufacturer: 'Nissan', model: 'Silvia Spec-R', year: 2000, fullName: 'Nissan Silvia Spec-R 2000', category: 'Drift / FR Coupe' },
  { id: 'nissan-370z-nismo-2019', manufacturer: 'Nissan', model: '370Z Nismo', year: 2019, fullName: 'Nissan 370Z Nismo 2019', category: 'Sports GT' },

  // Subaru & Toyota
  { id: 'subaru-brz-2013', manufacturer: 'Subaru', model: 'BRZ', year: 2013, fullName: 'Subaru BRZ 2013', category: 'Sport Coupe RWD' },
  { id: 'toyota-gr-supra-2020', manufacturer: 'Toyota', model: 'GR Supra', year: 2020, fullName: 'Toyota GR Supra 2020', category: 'Sports GT' },
  { id: 'toyota-gt-one-1999', manufacturer: 'Toyota', model: 'GT-ONE TS020 #3 Toyota Motorsports', year: 1999, fullName: 'Toyota GT-ONE TS020 #3 Toyota Motorsports 1999', category: 'Le Mans Prototype' },
  { id: 'toyota-sprinter-trueno-1985', manufacturer: 'Toyota', model: 'Sprinter Trueno GT Apex', year: 1985, fullName: 'Toyota Sprinter Trueno GT Apex 1985', category: 'FR Classic' },

  // Lotus & Radical & KTM
  { id: 'lotus-3-eleven-2016', manufacturer: 'Lotus', model: '3-Eleven', year: 2016, fullName: 'Lotus 3-Eleven 2016', category: 'Track Toy' },
  { id: 'lotus-emira-2023', manufacturer: 'Lotus', model: 'Emira', year: 2023, fullName: 'Lotus Emira 2023', category: 'Sports Coupe' },
  { id: 'radical-rxc-turbo-2015', manufacturer: 'Radical', model: 'RXC Turbo', year: 2015, fullName: 'Radical RXC Turbo 2015', category: 'Track Prototype' },
  { id: 'ktm-x-bow-gt4-2018', manufacturer: 'KTM', model: 'X-Bow GT4', year: 2018, fullName: 'KTM X-Bow GT4 2018', category: 'GT4' },
  { id: 'caterham-superlight-r500-2013', manufacturer: 'Caterham', model: 'Superlight R500', year: 2013, fullName: 'Caterham Superlight R500 2013', category: 'Lightweight Track' }
];

export function findCarByFullName(fullName: string): FM23Car | undefined {
  return FM23_CARS.find(c => c.fullName.toLowerCase() === fullName.toLowerCase() || fullName.toLowerCase().includes(c.model.toLowerCase()));
}
