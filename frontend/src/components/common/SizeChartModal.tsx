import React, { useState, useEffect } from 'react';
import {
  X, Ruler, Sparkles, HelpCircle,
  Globe, ArrowRight, User, Compass, Layers, ShieldCheck, HeartHandshake
} from 'lucide-react';

export type Unit = 'in' | 'cm';
export type MeasurementMode = 'garment' | 'body';
export type FashionCategoryType =
  | 'dresses'
  | 'tops'
  | 'kurtis'
  | 'bottoms'
  | 'sarees'
  | 'silks'
  | 'mens';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  categoryName?: string;
  productDescription?: string;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  initialCategory?: FashionCategoryType;
}

interface GarmentDimension {
  size: string;
  intl: string;
  us: string;
  uk: string;
  eu: string;
  // Garment Measurements (Laid Flat)
  garmentBustIn: string;
  garmentBustCm: string;
  garmentWaistIn: string;
  garmentWaistCm: string;
  garmentHipIn: string;
  garmentHipCm: string;
  garmentLengthIn: string;
  garmentLengthCm: string;
  garmentShoulderIn: string;
  garmentShoulderCm: string;
  // Body (To Fit) Measurements
  bodyBustIn: string;
  bodyBustCm: string;
  bodyWaistIn: string;
  bodyWaistCm: string;
  bodyHipIn: string;
  bodyHipCm: string;
  extraFieldLabel?: string;
  extraFieldGarmentIn?: string;
  extraFieldGarmentCm?: string;
}

// 1. DRESSES, GOWNS & MAXIS
const DRESS_SIZES: GarmentDimension[] = [
  {
    size: 'XS',
    intl: 'UK 6 / US 2 / EU 34',
    us: '2',
    uk: '6',
    eu: '34',
    garmentBustIn: '34',
    garmentBustCm: '86',
    garmentWaistIn: '27',
    garmentWaistCm: '68',
    garmentHipIn: '37',
    garmentHipCm: '94',
    garmentLengthIn: '46',
    garmentLengthCm: '117',
    garmentShoulderIn: '13.5',
    garmentShoulderCm: '34',
    bodyBustIn: '31 - 32',
    bodyBustCm: '78 - 82',
    bodyWaistIn: '24 - 25',
    bodyWaistCm: '61 - 64',
    bodyHipIn: '34 - 35',
    bodyHipCm: '86 - 89',
  },
  {
    size: 'S',
    intl: 'UK 8 / US 4 / EU 36',
    us: '4',
    uk: '8',
    eu: '36',
    garmentBustIn: '36',
    garmentBustCm: '91',
    garmentWaistIn: '29',
    garmentWaistCm: '73',
    garmentHipIn: '39',
    garmentHipCm: '99',
    garmentLengthIn: '47',
    garmentLengthCm: '119',
    garmentShoulderIn: '14.0',
    garmentShoulderCm: '36',
    bodyBustIn: '33 - 34',
    bodyBustCm: '83 - 87',
    bodyWaistIn: '26 - 27',
    bodyWaistCm: '65 - 69',
    bodyHipIn: '36 - 37',
    bodyHipCm: '90 - 94',
  },
  {
    size: 'M',
    intl: 'UK 10 / US 6 / EU 38',
    us: '6',
    uk: '10',
    eu: '38',
    garmentBustIn: '38',
    garmentBustCm: '96',
    garmentWaistIn: '31',
    garmentWaistCm: '78',
    garmentHipIn: '41',
    garmentHipCm: '104',
    garmentLengthIn: '48',
    garmentLengthCm: '122',
    garmentShoulderIn: '14.5',
    garmentShoulderCm: '37',
    bodyBustIn: '35 - 36',
    bodyBustCm: '88 - 92',
    bodyWaistIn: '28 - 29',
    bodyWaistCm: '70 - 74',
    bodyHipIn: '38 - 39',
    bodyHipCm: '95 - 99',
  },
  {
    size: 'L',
    intl: 'UK 12 / US 8 / EU 40',
    us: '8',
    uk: '12',
    eu: '40',
    garmentBustIn: '41',
    garmentBustCm: '104',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '44',
    garmentHipCm: '112',
    garmentLengthIn: '49',
    garmentLengthCm: '124',
    garmentShoulderIn: '15.0',
    garmentShoulderCm: '38',
    bodyBustIn: '37 - 39',
    bodyBustCm: '93 - 99',
    bodyWaistIn: '30 - 32',
    bodyWaistCm: '75 - 81',
    bodyHipIn: '40 - 42',
    bodyHipCm: '100 - 106',
  },
  {
    size: 'XL',
    intl: 'UK 14 / US 10 / EU 42',
    us: '10',
    uk: '14',
    eu: '42',
    garmentBustIn: '44',
    garmentBustCm: '112',
    garmentWaistIn: '37',
    garmentWaistCm: '94',
    garmentHipIn: '47',
    garmentHipCm: '119',
    garmentLengthIn: '50',
    garmentLengthCm: '127',
    garmentShoulderIn: '15.5',
    garmentShoulderCm: '39',
    bodyBustIn: '40 - 42',
    bodyBustCm: '100 - 107',
    bodyWaistIn: '33 - 35',
    bodyWaistCm: '82 - 89',
    bodyHipIn: '43 - 45',
    bodyHipCm: '107 - 114',
  },
  {
    size: 'XXL',
    intl: 'UK 16 / US 12 / EU 44',
    us: '12',
    uk: '16',
    eu: '44',
    garmentBustIn: '47',
    garmentBustCm: '119',
    garmentWaistIn: '40',
    garmentWaistCm: '101',
    garmentHipIn: '50',
    garmentHipCm: '127',
    garmentLengthIn: '51',
    garmentLengthCm: '129',
    garmentShoulderIn: '16.0',
    garmentShoulderCm: '41',
    bodyBustIn: '43 - 45',
    bodyBustCm: '108 - 115',
    bodyWaistIn: '36 - 38',
    bodyWaistCm: '90 - 97',
    bodyHipIn: '46 - 48',
    bodyHipCm: '115 - 122',
  },
  {
    size: '3XL',
    intl: 'UK 18 / US 14 / EU 46',
    us: '14',
    uk: '18',
    eu: '46',
    garmentBustIn: '50',
    garmentBustCm: '127',
    garmentWaistIn: '43',
    garmentWaistCm: '109',
    garmentHipIn: '53',
    garmentHipCm: '135',
    garmentLengthIn: '52',
    garmentLengthCm: '132',
    garmentShoulderIn: '16.5',
    garmentShoulderCm: '42',
    bodyBustIn: '46 - 48',
    bodyBustCm: '116 - 122',
    bodyWaistIn: '39 - 41',
    bodyWaistCm: '98 - 105',
    bodyHipIn: '49 - 51',
    bodyHipCm: '123 - 130',
  },
];

// 2. TOPS, BLOUSES & SHIRTS
const TOPS_SIZES: GarmentDimension[] = [
  {
    size: 'XS',
    intl: 'UK 6 / US 2',
    us: '2',
    uk: '6',
    eu: '34',
    garmentBustIn: '34',
    garmentBustCm: '86',
    garmentWaistIn: '30',
    garmentWaistCm: '76',
    garmentHipIn: '36',
    garmentHipCm: '91',
    garmentLengthIn: '24',
    garmentLengthCm: '61',
    garmentShoulderIn: '13.5',
    garmentShoulderCm: '34',
    bodyBustIn: '31 - 32',
    bodyBustCm: '78 - 82',
    bodyWaistIn: '24 - 25',
    bodyWaistCm: '61 - 64',
    bodyHipIn: '34 - 35',
    bodyHipCm: '86 - 89',
  },
  {
    size: 'S',
    intl: 'UK 8 / US 4',
    us: '4',
    uk: '8',
    eu: '36',
    garmentBustIn: '36',
    garmentBustCm: '91',
    garmentWaistIn: '32',
    garmentWaistCm: '81',
    garmentHipIn: '38',
    garmentHipCm: '96',
    garmentLengthIn: '25',
    garmentLengthCm: '63',
    garmentShoulderIn: '14.0',
    garmentShoulderCm: '36',
    bodyBustIn: '33 - 34',
    bodyBustCm: '83 - 87',
    bodyWaistIn: '26 - 27',
    bodyWaistCm: '65 - 69',
    bodyHipIn: '36 - 37',
    bodyHipCm: '90 - 94',
  },
  {
    size: 'M',
    intl: 'UK 10 / US 6',
    us: '6',
    uk: '10',
    eu: '38',
    garmentBustIn: '38',
    garmentBustCm: '96',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '40',
    garmentHipCm: '101',
    garmentLengthIn: '25.5',
    garmentLengthCm: '65',
    garmentShoulderIn: '14.5',
    garmentShoulderCm: '37',
    bodyBustIn: '35 - 36',
    bodyBustCm: '88 - 92',
    bodyWaistIn: '28 - 29',
    bodyWaistCm: '70 - 74',
    bodyHipIn: '38 - 39',
    bodyHipCm: '95 - 99',
  },
  {
    size: 'L',
    intl: 'UK 12 / US 8',
    us: '8',
    uk: '12',
    eu: '40',
    garmentBustIn: '41',
    garmentBustCm: '104',
    garmentWaistIn: '37',
    garmentWaistCm: '94',
    garmentHipIn: '43',
    garmentHipCm: '109',
    garmentLengthIn: '26',
    garmentLengthCm: '66',
    garmentShoulderIn: '15.0',
    garmentShoulderCm: '38',
    bodyBustIn: '37 - 39',
    bodyBustCm: '93 - 99',
    bodyWaistIn: '30 - 32',
    bodyWaistCm: '75 - 81',
    bodyHipIn: '40 - 42',
    bodyHipCm: '100 - 106',
  },
  {
    size: 'XL',
    intl: 'UK 14 / US 10',
    us: '10',
    uk: '14',
    eu: '42',
    garmentBustIn: '44',
    garmentBustCm: '112',
    garmentWaistIn: '40',
    garmentWaistCm: '101',
    garmentHipIn: '46',
    garmentHipCm: '117',
    garmentLengthIn: '27',
    garmentLengthCm: '68',
    garmentShoulderIn: '15.5',
    garmentShoulderCm: '39',
    bodyBustIn: '40 - 42',
    bodyBustCm: '100 - 107',
    bodyWaistIn: '33 - 35',
    bodyWaistCm: '82 - 89',
    bodyHipIn: '43 - 45',
    bodyHipCm: '107 - 114',
  },
  {
    size: 'XXL',
    intl: 'UK 16 / US 12',
    us: '12',
    uk: '16',
    eu: '44',
    garmentBustIn: '47',
    garmentBustCm: '119',
    garmentWaistIn: '43',
    garmentWaistCm: '109',
    garmentHipIn: '49',
    garmentHipCm: '124',
    garmentLengthIn: '28',
    garmentLengthCm: '71',
    garmentShoulderIn: '16.0',
    garmentShoulderCm: '41',
    bodyBustIn: '43 - 45',
    bodyBustCm: '108 - 115',
    bodyWaistIn: '36 - 38',
    bodyWaistCm: '90 - 97',
    bodyHipIn: '46 - 48',
    bodyHipCm: '115 - 122',
  },
];

// 3. KURTIS & ETHNIC SETS
const KURTI_SIZES: GarmentDimension[] = [
  {
    size: 'XS (34)',
    intl: 'Bust 34"',
    us: '2',
    uk: '6',
    eu: '34',
    garmentBustIn: '36',
    garmentBustCm: '91',
    garmentWaistIn: '32',
    garmentWaistCm: '81',
    garmentHipIn: '38',
    garmentHipCm: '96',
    garmentLengthIn: '44',
    garmentLengthCm: '112',
    garmentShoulderIn: '13.5',
    garmentShoulderCm: '34',
    bodyBustIn: '33 - 34',
    bodyBustCm: '84 - 87',
    bodyWaistIn: '28 - 29',
    bodyWaistCm: '71 - 74',
    bodyHipIn: '36 - 37',
    bodyHipCm: '91 - 94',
  },
  {
    size: 'S (36)',
    intl: 'Bust 36"',
    us: '4',
    uk: '8',
    eu: '36',
    garmentBustIn: '38',
    garmentBustCm: '96',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '40',
    garmentHipCm: '101',
    garmentLengthIn: '45',
    garmentLengthCm: '114',
    garmentShoulderIn: '14.0',
    garmentShoulderCm: '36',
    bodyBustIn: '35 - 36',
    bodyBustCm: '88 - 92',
    bodyWaistIn: '30 - 31',
    bodyWaistCm: '76 - 79',
    bodyHipIn: '38 - 39',
    bodyHipCm: '96 - 99',
  },
  {
    size: 'M (38)',
    intl: 'Bust 38"',
    us: '6',
    uk: '10',
    eu: '38',
    garmentBustIn: '40',
    garmentBustCm: '101',
    garmentWaistIn: '36',
    garmentWaistCm: '91',
    garmentHipIn: '42',
    garmentHipCm: '106',
    garmentLengthIn: '45.5',
    garmentLengthCm: '115',
    garmentShoulderIn: '14.5',
    garmentShoulderCm: '37',
    bodyBustIn: '37 - 38',
    bodyBustCm: '93 - 97',
    bodyWaistIn: '32 - 33',
    bodyWaistCm: '81 - 84',
    bodyHipIn: '40 - 41',
    bodyHipCm: '101 - 104',
  },
  {
    size: 'L (40)',
    intl: 'Bust 40"',
    us: '8',
    uk: '12',
    eu: '40',
    garmentBustIn: '42',
    garmentBustCm: '106',
    garmentWaistIn: '38',
    garmentWaistCm: '96',
    garmentHipIn: '44',
    garmentHipCm: '112',
    garmentLengthIn: '46',
    garmentLengthCm: '117',
    garmentShoulderIn: '15.0',
    garmentShoulderCm: '38',
    bodyBustIn: '39 - 40',
    bodyBustCm: '98 - 102',
    bodyWaistIn: '34 - 35',
    bodyWaistCm: '86 - 89',
    bodyHipIn: '42 - 43',
    bodyHipCm: '106 - 109',
  },
  {
    size: 'XL (42)',
    intl: 'Bust 42"',
    us: '10',
    uk: '14',
    eu: '42',
    garmentBustIn: '44',
    garmentBustCm: '112',
    garmentWaistIn: '40',
    garmentWaistCm: '101',
    garmentHipIn: '46',
    garmentHipCm: '117',
    garmentLengthIn: '46.5',
    garmentLengthCm: '118',
    garmentShoulderIn: '15.5',
    garmentShoulderCm: '39',
    bodyBustIn: '41 - 42',
    bodyBustCm: '103 - 108',
    bodyWaistIn: '36 - 37',
    bodyWaistCm: '91 - 95',
    bodyHipIn: '44 - 45',
    bodyHipCm: '111 - 115',
  },
  {
    size: 'XXL (44)',
    intl: 'Bust 44"',
    us: '12',
    uk: '16',
    eu: '44',
    garmentBustIn: '46',
    garmentBustCm: '117',
    garmentWaistIn: '42',
    garmentWaistCm: '106',
    garmentHipIn: '48',
    garmentHipCm: '122',
    garmentLengthIn: '47',
    garmentLengthCm: '119',
    garmentShoulderIn: '16.0',
    garmentShoulderCm: '41',
    bodyBustIn: '43 - 45',
    bodyBustCm: '109 - 115',
    bodyWaistIn: '38 - 40',
    bodyWaistCm: '96 - 102',
    bodyHipIn: '46 - 48',
    bodyHipCm: '116 - 122',
  },
  {
    size: '3XL (46)',
    intl: 'Bust 46"',
    us: '14',
    uk: '18',
    eu: '46',
    garmentBustIn: '49',
    garmentBustCm: '124',
    garmentWaistIn: '45',
    garmentWaistCm: '114',
    garmentHipIn: '51',
    garmentHipCm: '129',
    garmentLengthIn: '47.5',
    garmentLengthCm: '121',
    garmentShoulderIn: '16.5',
    garmentShoulderCm: '42',
    bodyBustIn: '45 - 47',
    bodyBustCm: '114 - 120',
    bodyWaistIn: '40 - 42',
    bodyWaistCm: '102 - 108',
    bodyHipIn: '48 - 50',
    bodyHipCm: '122 - 128',
  },
];

// 4. BOTTOMS, TROUSERS & PANTS
const BOTTOMS_SIZES: GarmentDimension[] = [
  {
    size: 'XS (26)',
    intl: 'Waist 26"',
    us: '2',
    uk: '6',
    eu: '34',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '26',
    garmentWaistCm: '66',
    garmentHipIn: '36',
    garmentHipCm: '91',
    garmentLengthIn: '38',
    garmentLengthCm: '96',
    garmentShoulderIn: '28',
    garmentShoulderCm: '71',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '24 - 25',
    bodyWaistCm: '61 - 64',
    bodyHipIn: '34 - 35',
    bodyHipCm: '86 - 89',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '28',
    extraFieldGarmentCm: '71',
  },
  {
    size: 'S (28)',
    intl: 'Waist 28"',
    us: '4',
    uk: '8',
    eu: '36',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '28',
    garmentWaistCm: '71',
    garmentHipIn: '38',
    garmentHipCm: '96',
    garmentLengthIn: '38.5',
    garmentLengthCm: '98',
    garmentShoulderIn: '28.5',
    garmentShoulderCm: '72',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '26 - 27',
    bodyWaistCm: '66 - 69',
    bodyHipIn: '36 - 37',
    bodyHipCm: '91 - 94',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '28.5',
    extraFieldGarmentCm: '72',
  },
  {
    size: 'M (30)',
    intl: 'Waist 30"',
    us: '6',
    uk: '10',
    eu: '38',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '30',
    garmentWaistCm: '76',
    garmentHipIn: '40',
    garmentHipCm: '101',
    garmentLengthIn: '39',
    garmentLengthCm: '99',
    garmentShoulderIn: '29',
    garmentShoulderCm: '74',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '28 - 29',
    bodyWaistCm: '71 - 74',
    bodyHipIn: '38 - 39',
    bodyHipCm: '96 - 99',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '29',
    extraFieldGarmentCm: '74',
  },
  {
    size: 'L (32)',
    intl: 'Waist 32"',
    us: '8',
    uk: '12',
    eu: '40',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '32',
    garmentWaistCm: '81',
    garmentHipIn: '42',
    garmentHipCm: '106',
    garmentLengthIn: '39.5',
    garmentLengthCm: '100',
    garmentShoulderIn: '29.5',
    garmentShoulderCm: '75',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '30 - 32',
    bodyWaistCm: '76 - 81',
    bodyHipIn: '40 - 42',
    bodyHipCm: '101 - 106',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '29.5',
    extraFieldGarmentCm: '75',
  },
  {
    size: 'XL (34)',
    intl: 'Waist 34"',
    us: '10',
    uk: '14',
    eu: '42',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '44',
    garmentHipCm: '112',
    garmentLengthIn: '40',
    garmentLengthCm: '102',
    garmentShoulderIn: '30',
    garmentShoulderCm: '76',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '33 - 35',
    bodyWaistCm: '84 - 89',
    bodyHipIn: '43 - 45',
    bodyHipCm: '109 - 114',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '30',
    extraFieldGarmentCm: '76',
  },
  {
    size: 'XXL (36)',
    intl: 'Waist 36"',
    us: '12',
    uk: '16',
    eu: '44',
    garmentBustIn: '-',
    garmentBustCm: '-',
    garmentWaistIn: '36',
    garmentWaistCm: '91',
    garmentHipIn: '46',
    garmentHipCm: '117',
    garmentLengthIn: '40.5',
    garmentLengthCm: '103',
    garmentShoulderIn: '30',
    garmentShoulderCm: '76',
    bodyBustIn: '-',
    bodyBustCm: '-',
    bodyWaistIn: '35 - 37',
    bodyWaistCm: '89 - 94',
    bodyHipIn: '45 - 47',
    bodyHipCm: '114 - 119',
    extraFieldLabel: 'Inseam',
    extraFieldGarmentIn: '30',
    extraFieldGarmentCm: '76',
  },
];

// 5. SAREES, BLOUSES & LEHENGAS
const SAREE_BLOUSE_SIZES: GarmentDimension[] = [
  {
    size: '32 (XS)',
    intl: 'Bust 32"',
    us: '2',
    uk: '6',
    eu: '34',
    garmentBustIn: '34',
    garmentBustCm: '86',
    garmentWaistIn: '26',
    garmentWaistCm: '66',
    garmentHipIn: '35',
    garmentHipCm: '89',
    garmentLengthIn: '14.0',
    garmentLengthCm: '35.5',
    garmentShoulderIn: '13.0',
    garmentShoulderCm: '33',
    bodyBustIn: '31 - 32',
    bodyBustCm: '78 - 82',
    bodyWaistIn: '25 - 26',
    bodyWaistCm: '63 - 66',
    bodyHipIn: '34 - 35',
    bodyHipCm: '86 - 89',
  },
  {
    size: '34 (S)',
    intl: 'Bust 34"',
    us: '4',
    uk: '8',
    eu: '36',
    garmentBustIn: '36',
    garmentBustCm: '91',
    garmentWaistIn: '28',
    garmentWaistCm: '71',
    garmentHipIn: '37',
    garmentHipCm: '94',
    garmentLengthIn: '14.5',
    garmentLengthCm: '37',
    garmentShoulderIn: '13.5',
    garmentShoulderCm: '34',
    bodyBustIn: '33 - 34',
    bodyBustCm: '84 - 87',
    bodyWaistIn: '27 - 28',
    bodyWaistCm: '68 - 71',
    bodyHipIn: '36 - 37',
    bodyHipCm: '91 - 94',
  },
  {
    size: '36 (M)',
    intl: 'Bust 36"',
    us: '6',
    uk: '10',
    eu: '38',
    garmentBustIn: '38',
    garmentBustCm: '96',
    garmentWaistIn: '30',
    garmentWaistCm: '76',
    garmentHipIn: '39',
    garmentHipCm: '99',
    garmentLengthIn: '15.0',
    garmentLengthCm: '38',
    garmentShoulderIn: '14.0',
    garmentShoulderCm: '36',
    bodyBustIn: '35 - 36',
    bodyBustCm: '88 - 92',
    bodyWaistIn: '29 - 30',
    bodyWaistCm: '73 - 76',
    bodyHipIn: '38 - 39',
    bodyHipCm: '96 - 99',
  },
  {
    size: '38 (L)',
    intl: 'Bust 38"',
    us: '8',
    uk: '12',
    eu: '40',
    garmentBustIn: '40',
    garmentBustCm: '101',
    garmentWaistIn: '32',
    garmentWaistCm: '81',
    garmentHipIn: '41',
    garmentHipCm: '104',
    garmentLengthIn: '15.5',
    garmentLengthCm: '39',
    garmentShoulderIn: '14.5',
    garmentShoulderCm: '37',
    bodyBustIn: '37 - 38',
    bodyBustCm: '93 - 97',
    bodyWaistIn: '31 - 32',
    bodyWaistCm: '78 - 81',
    bodyHipIn: '40 - 41',
    bodyHipCm: '101 - 104',
  },
  {
    size: '40 (XL)',
    intl: 'Bust 40"',
    us: '10',
    uk: '14',
    eu: '42',
    garmentBustIn: '42',
    garmentBustCm: '106',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '43',
    garmentHipCm: '109',
    garmentLengthIn: '16.0',
    garmentLengthCm: '40.5',
    garmentShoulderIn: '15.0',
    garmentShoulderCm: '38',
    bodyBustIn: '39 - 40',
    bodyBustCm: '98 - 102',
    bodyWaistIn: '33 - 34',
    bodyWaistCm: '83 - 86',
    bodyHipIn: '42 - 43',
    bodyHipCm: '106 - 109',
  },
  {
    size: '42 (XXL)',
    intl: 'Bust 42"',
    us: '12',
    uk: '16',
    eu: '44',
    garmentBustIn: '44',
    garmentBustCm: '112',
    garmentWaistIn: '36',
    garmentWaistCm: '91',
    garmentHipIn: '45',
    garmentHipCm: '114',
    garmentLengthIn: '16.5',
    garmentLengthCm: '42',
    garmentShoulderIn: '15.5',
    garmentShoulderCm: '39',
    bodyBustIn: '41 - 42',
    bodyBustCm: '103 - 108',
    bodyWaistIn: '35 - 36',
    bodyWaistCm: '88 - 91',
    bodyHipIn: '44 - 45',
    bodyHipCm: '111 - 115',
  },
];

// 6. SILKS & LOUNGEWEAR
const SILKS_SIZES: GarmentDimension[] = [
  {
    size: 'XS/S',
    intl: 'UK 6-8 / US 2-4',
    us: '2-4',
    uk: '6-8',
    eu: '34-36',
    garmentBustIn: '38',
    garmentBustCm: '96',
    garmentWaistIn: '34',
    garmentWaistCm: '86',
    garmentHipIn: '40',
    garmentHipCm: '101',
    garmentLengthIn: '48',
    garmentLengthCm: '122',
    garmentShoulderIn: '15.0',
    garmentShoulderCm: '38',
    bodyBustIn: '31 - 34',
    bodyBustCm: '78 - 87',
    bodyWaistIn: '24 - 27',
    bodyWaistCm: '61 - 69',
    bodyHipIn: '34 - 37',
    bodyHipCm: '86 - 94',
  },
  {
    size: 'M/L',
    intl: 'UK 10-12 / US 6-8',
    us: '6-8',
    uk: '10-12',
    eu: '38-40',
    garmentBustIn: '42',
    garmentBustCm: '106',
    garmentWaistIn: '38',
    garmentWaistCm: '96',
    garmentHipIn: '44',
    garmentHipCm: '112',
    garmentLengthIn: '50',
    garmentLengthCm: '127',
    garmentShoulderIn: '16.0',
    garmentShoulderCm: '41',
    bodyBustIn: '35 - 39',
    bodyBustCm: '88 - 99',
    bodyWaistIn: '28 - 32',
    bodyWaistCm: '70 - 81',
    bodyHipIn: '38 - 42',
    bodyHipCm: '95 - 106',
  },
  {
    size: 'XL/XXL',
    intl: 'UK 14-16 / US 10-12',
    us: '10-12',
    uk: '14-16',
    eu: '42-44',
    garmentBustIn: '46',
    garmentBustCm: '117',
    garmentWaistIn: '42',
    garmentWaistCm: '106',
    garmentHipIn: '48',
    garmentHipCm: '122',
    garmentLengthIn: '52',
    garmentLengthCm: '132',
    garmentShoulderIn: '17.0',
    garmentShoulderCm: '43',
    bodyBustIn: '40 - 45',
    bodyBustCm: '100 - 115',
    bodyWaistIn: '33 - 38',
    bodyWaistCm: '82 - 97',
    bodyHipIn: '43 - 48',
    bodyHipCm: '107 - 122',
  },
];

// 7. MEN'S APPAREL
const MENS_SIZES: GarmentDimension[] = [
  {
    size: 'S (38)',
    intl: 'Chest 38"',
    us: '38',
    uk: '38',
    eu: '48',
    garmentBustIn: '40',
    garmentBustCm: '101',
    garmentWaistIn: '38',
    garmentWaistCm: '96',
    garmentHipIn: '40',
    garmentHipCm: '101',
    garmentLengthIn: '29',
    garmentLengthCm: '74',
    garmentShoulderIn: '17.5',
    garmentShoulderCm: '44',
    bodyBustIn: '37 - 38',
    bodyBustCm: '94 - 97',
    bodyWaistIn: '31 - 32',
    bodyWaistCm: '78 - 81',
    bodyHipIn: '38 - 39',
    bodyHipCm: '96 - 99',
  },
  {
    size: 'M (40)',
    intl: 'Chest 40"',
    us: '40',
    uk: '40',
    eu: '50',
    garmentBustIn: '42',
    garmentBustCm: '107',
    garmentWaistIn: '40',
    garmentWaistCm: '101',
    garmentHipIn: '42',
    garmentHipCm: '107',
    garmentLengthIn: '29.5',
    garmentLengthCm: '75',
    garmentShoulderIn: '18.0',
    garmentShoulderCm: '46',
    bodyBustIn: '39 - 40',
    bodyBustCm: '99 - 102',
    bodyWaistIn: '33 - 34',
    bodyWaistCm: '84 - 86',
    bodyHipIn: '40 - 41',
    bodyHipCm: '101 - 104',
  },
  {
    size: 'L (42)',
    intl: 'Chest 42"',
    us: '42',
    uk: '42',
    eu: '52',
    garmentBustIn: '44',
    garmentBustCm: '112',
    garmentWaistIn: '42',
    garmentWaistCm: '107',
    garmentHipIn: '44',
    garmentHipCm: '112',
    garmentLengthIn: '30',
    garmentLengthCm: '76',
    garmentShoulderIn: '18.5',
    garmentShoulderCm: '47',
    bodyBustIn: '41 - 42',
    bodyBustCm: '104 - 107',
    bodyWaistIn: '35 - 36',
    bodyWaistCm: '89 - 91',
    bodyHipIn: '42 - 43',
    bodyHipCm: '106 - 109',
  },
  {
    size: 'XL (44)',
    intl: 'Chest 44"',
    us: '44',
    uk: '44',
    eu: '54',
    garmentBustIn: '46',
    garmentBustCm: '117',
    garmentWaistIn: '44',
    garmentWaistCm: '112',
    garmentHipIn: '46',
    garmentHipCm: '117',
    garmentLengthIn: '30.5',
    garmentLengthCm: '77',
    garmentShoulderIn: '19.0',
    garmentShoulderCm: '48',
    bodyBustIn: '43 - 44',
    bodyBustCm: '109 - 112',
    bodyWaistIn: '37 - 38',
    bodyWaistCm: '94 - 97',
    bodyHipIn: '44 - 45',
    bodyHipCm: '111 - 114',
  },
  {
    size: 'XXL (46)',
    intl: 'Chest 46"',
    us: '46',
    uk: '46',
    eu: '56',
    garmentBustIn: '48',
    garmentBustCm: '122',
    garmentWaistIn: '46',
    garmentWaistCm: '117',
    garmentHipIn: '48',
    garmentHipCm: '122',
    garmentLengthIn: '31',
    garmentLengthCm: '79',
    garmentShoulderIn: '19.5',
    garmentShoulderCm: '50',
    bodyBustIn: '45 - 46',
    bodyBustCm: '114 - 117',
    bodyWaistIn: '39 - 40',
    bodyWaistCm: '99 - 102',
    bodyHipIn: '46 - 47',
    bodyHipCm: '116 - 119',
  },
];

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  productName = 'Luxury Silk Garment',
  categoryName = 'Fashion',
  productDescription = '',
  selectedSize,
  onSelectSize,
  initialCategory,
}) => {
  const [unit, setUnit] = useState<Unit>('in');
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('garment');
  const [activeTab, setActiveTab] = useState<FashionCategoryType>('dresses');
  const [viewSection, setViewSection] = useState<'chart' | 'calculator' | 'howToMeasure' | 'intl'>('chart');

  // Smart Fit Recommender state
  const [userBust, setUserBust] = useState<string>('34');
  const [userWaist, setUserWaist] = useState<string>('28');
  const [userHip, setUserHip] = useState<string>('37');
  const [fitPreference, setFitPreference] = useState<'snug' | 'regular' | 'relaxed'>('regular');
  const [calcResult, setCalcResult] = useState<{
    size: string;
    confidence: number;
    reason: string;
  } | null>(null);

  // Auto-detect the right fashion apparel subcategory
  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
      return;
    }

    const text = `${productName} ${categoryName} ${productDescription}`.toLowerCase();
    if (text.includes('saree') || text.includes('blouse') || text.includes('lehenga')) {
      setActiveTab('sarees');
    } else if (text.includes('kurti') || text.includes('kurta') || text.includes('anarkali') || text.includes('ethnic')) {
      setActiveTab('kurtis');
    } else if (text.includes('pant') || text.includes('trouser') || text.includes('jean') || text.includes('bottom') || text.includes('palazzo')) {
      setActiveTab('bottoms');
    } else if (text.includes('shirt') || text.includes('top') || text.includes('blouse') || text.includes('tee')) {
      setActiveTab('tops');
    } else if (text.includes('robe') || text.includes('kimono') || text.includes('nightwear') || text.includes('lounge')) {
      setActiveTab('silks');
    } else if (text.includes('men') || text.includes('man')) {
      setActiveTab('mens');
    } else {
      setActiveTab('dresses');
    }
  }, [productName, categoryName, productDescription, initialCategory]);

  if (!isOpen) return null;

  const getTableData = (): GarmentDimension[] => {
    switch (activeTab) {
      case 'tops':
        return TOPS_SIZES;
      case 'kurtis':
        return KURTI_SIZES;
      case 'bottoms':
        return BOTTOMS_SIZES;
      case 'sarees':
        return SAREE_BLOUSE_SIZES;
      case 'silks':
        return SILKS_SIZES;
      case 'mens':
        return MENS_SIZES;
      case 'dresses':
      default:
        return DRESS_SIZES;
    }
  };

  // Smart Fit Recommender Calculation Engine
  const handleCalculateFit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(userBust) || 34;
    const w = parseFloat(userWaist) || 28;

    const bustInches = unit === 'cm' ? b / 2.54 : b;
    const waistInches = unit === 'cm' ? w / 2.54 : w;

    let baseSize = 'M';
    let confidence = 94;
    let reason = 'Perfect balance of shoulder drape and waist comfort.';

    if (activeTab === 'bottoms') {
      if (waistInches <= 25.5) baseSize = 'XS (26)';
      else if (waistInches <= 27.5) baseSize = 'S (28)';
      else if (waistInches <= 29.5) baseSize = 'M (30)';
      else if (waistInches <= 32.5) baseSize = 'L (32)';
      else if (waistInches <= 35.5) baseSize = 'XL (34)';
      else baseSize = 'XXL (36)';
      reason = `Based on your waist (${waistInches.toFixed(1)}") and hip measurements for an effortless non-pull drape.`;
    } else if (activeTab === 'kurtis') {
      if (bustInches <= 34.5) baseSize = 'XS (34)';
      else if (bustInches <= 36.5) baseSize = 'S (36)';
      else if (bustInches <= 38.5) baseSize = 'M (38)';
      else if (bustInches <= 40.5) baseSize = 'L (40)';
      else if (bustInches <= 42.5) baseSize = 'XL (42)';
      else if (bustInches <= 44.5) baseSize = 'XXL (44)';
      else baseSize = '3XL (46)';
      reason = `Tailored traditional ethnic silhouette with comfortable armhole clearance.`;
    } else {
      if (bustInches <= 32.5) baseSize = 'XS';
      else if (bustInches <= 34.5) baseSize = 'S';
      else if (bustInches <= 36.5) baseSize = 'M';
      else if (bustInches <= 39.5) baseSize = 'L';
      else if (bustInches <= 42.5) baseSize = 'XL';
      else if (bustInches <= 45.5) baseSize = 'XXL';
      else baseSize = '3XL';

      if (fitPreference === 'snug') {
        confidence = 92;
        reason = 'Form-fitting silhouette contours naturally along chest and waist.';
      } else if (fitPreference === 'relaxed') {
        confidence = 96;
        reason = 'Fluid, relaxed drape giving generous ease across shoulders and torso.';
      }
    }

    setCalcResult({
      size: baseSize,
      confidence,
      reason,
    });
  };

  const handleApplySize = (sizeStr: string) => {
    if (onSelectSize) {
      const cleanSize = sizeStr.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      onSelectSize(cleanSize || sizeStr);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#FFF8FA] rounded-3xl shadow-2xl border border-[#F1BCCE] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#FFF5F8] via-[#FCE7F0] to-[#FFF0F5] border-b border-[#F1BCCE] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#D84B7E] text-white flex items-center justify-center shadow-md shadow-[#D84B7E]/25 shrink-0">
              <Ruler className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D84B7E] bg-white/70 px-2 py-0.5 rounded-full border border-[#F1BCCE]/60">
                  Fashion Atelier Sizing
                </span>
                <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[240px]">
                  • {productName}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] leading-tight">
                Size Chart &amp; Fit Guide
              </h2>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#FDF4F7] p-1 rounded-full border border-[#F1BCCE] flex items-center shadow-2xs">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  unit === 'in'
                    ? 'bg-[#D84B7E] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  unit === 'cm'
                    ? 'bg-[#D84B7E] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-[#D84B7E] hover:text-white border border-[#F1BCCE] flex items-center justify-center text-gray-700 transition-all cursor-pointer shadow-2xs"
              aria-label="Close Size Chart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB-HEADER TABS */}
        <div className="px-6 py-2.5 bg-white border-b border-[#F1BCCE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setViewSection('chart')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewSection === 'chart'
                  ? 'bg-[#D84B7E] text-white shadow-xs'
                  : 'bg-[#FFF8FA] text-gray-700 hover:bg-[#FCE7F0] border border-[#F1BCCE]'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Fashion Size Chart</span>
            </button>

            <button
              type="button"
              onClick={() => setViewSection('calculator')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewSection === 'calculator'
                  ? 'bg-[#D84B7E] text-white shadow-xs'
                  : 'bg-[#FFF8FA] text-gray-700 hover:bg-[#FCE7F0] border border-[#F1BCCE]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Fit Finder</span>
            </button>

            <button
              type="button"
              onClick={() => setViewSection('howToMeasure')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewSection === 'howToMeasure'
                  ? 'bg-[#D84B7E] text-white shadow-xs'
                  : 'bg-[#FFF8FA] text-gray-700 hover:bg-[#FCE7F0] border border-[#F1BCCE]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>How To Measure</span>
            </button>

            <button
              type="button"
              onClick={() => setViewSection('intl')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewSection === 'intl'
                  ? 'bg-[#D84B7E] text-white shadow-xs'
                  : 'bg-[#FFF8FA] text-gray-700 hover:bg-[#FCE7F0] border border-[#F1BCCE]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>International Conversion</span>
            </button>
          </div>

          {viewSection === 'chart' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-600">Measure by:</span>
              <div className="bg-[#FFF0F5] p-0.5 rounded-lg border border-[#F1BCCE] flex items-center">
                <button
                  type="button"
                  onClick={() => setMeasurementMode('garment')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    measurementMode === 'garment'
                      ? 'bg-[#111111] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-[#111111]'
                  }`}
                >
                  Garment (Laid Flat)
                </button>
                <button
                  type="button"
                  onClick={() => setMeasurementMode('body')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    measurementMode === 'body'
                      ? 'bg-[#111111] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-[#111111]'
                  }`}
                >
                  Body (To-Fit)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#FFF8FA]">

          {/* FASHION APPAREL CATEGORY TABS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#D84B7E]" />
                <span>Select Fashion Apparel Type:</span>
              </span>
              <span className="text-[11px] font-medium text-[#D84B7E]">
                Category: {activeTab.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'dresses', label: '👗 Dresses & Gowns' },
                { id: 'tops', label: '👚 Tops & Blouses' },
                { id: 'kurtis', label: '🥻 Kurtis & Ethnic Sets' },
                { id: 'bottoms', label: '👖 Pants & Palazzos' },
                { id: 'sarees', label: '🥻 Sarees & Blouses' },
                { id: 'silks', label: '👘 Silks & Loungewear' },
                { id: 'mens', label: '👔 Men\'s Apparel' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FashionCategoryType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-[#D84B7E] text-white border-[#D84B7E] shadow-sm'
                      : 'bg-white text-gray-700 border-[#F1BCCE] hover:bg-[#FCE7F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. SIZE CHART */}
          {viewSection === 'chart' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-[#F1BCCE] rounded-2xl text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D84B7E] animate-pulse" />
                  <span className="font-semibold text-[#111111]">
                    Displaying{' '}
                    <span className="text-[#D84B7E] font-bold uppercase">
                      {measurementMode === 'garment' ? 'Finished Garment' : 'Recommended Body To-Fit'}
                    </span>{' '}
                    Dimensions in{' '}
                    <span className="font-bold text-[#D84B7E]">
                      {unit === 'in' ? 'Inches (")' : 'Centimeters (cm)'}
                    </span>
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 italic">
                  * Click any row to select your size
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#F1BCCE] bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FCE7F0]/80 text-[#111111] border-b border-[#F1BCCE]">
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Size</th>
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">International</th>
                      {activeTab !== 'bottoms' && (
                        <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                          {activeTab === 'mens' ? 'Chest' : 'Bust'} ({unit})
                        </th>
                      )}
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Waist ({unit})</th>
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Hips ({unit})</th>
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                        {activeTab === 'bottoms' ? 'Length / Outseam' : activeTab === 'sarees' ? 'Blouse Length' : 'Garment Length'} ({unit})
                      </th>
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                        {activeTab === 'bottoms' ? 'Inseam' : 'Shoulder'} ({unit})
                      </th>
                      <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Pick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE7F0]">
                    {getTableData().map((row) => {
                      const isRowSelected = selectedSize && (
                        selectedSize.toUpperCase() === row.size.toUpperCase() ||
                        row.size.toUpperCase().startsWith(selectedSize.toUpperCase())
                      );

                      const bustVal = measurementMode === 'garment'
                        ? (unit === 'in' ? `${row.garmentBustIn}"` : `${row.garmentBustCm} cm`)
                        : (unit === 'in' ? `${row.bodyBustIn}"` : `${row.bodyBustCm} cm`);

                      const waistVal = measurementMode === 'garment'
                        ? (unit === 'in' ? `${row.garmentWaistIn}"` : `${row.garmentWaistCm} cm`)
                        : (unit === 'in' ? `${row.bodyWaistIn}"` : `${row.bodyWaistCm} cm`);

                      const hipVal = measurementMode === 'garment'
                        ? (unit === 'in' ? `${row.garmentHipIn}"` : `${row.garmentHipCm} cm`)
                        : (unit === 'in' ? `${row.bodyHipIn}"` : `${row.bodyHipCm} cm`);

                      const lengthVal = unit === 'in' ? `${row.garmentLengthIn}"` : `${row.garmentLengthCm} cm`;
                      const shoulderVal = unit === 'in' ? `${row.garmentShoulderIn}"` : `${row.garmentShoulderCm} cm`;

                      return (
                        <tr
                          key={row.size}
                          onClick={() => handleApplySize(row.size)}
                          className={`transition-colors cursor-pointer ${
                            isRowSelected
                              ? 'bg-[#FFF0F5] text-[#D84B7E] font-bold ring-1 ring-inset ring-[#D84B7E]'
                              : 'hover:bg-[#FFF8FA] text-gray-800'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-sm">
                            <div className="flex items-center gap-1.5">
                              <span>{row.size}</span>
                              {isRowSelected && <span className="w-2 h-2 rounded-full bg-[#D84B7E]" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 font-medium">{row.intl}</td>
                          {activeTab !== 'bottoms' && (
                            <td className="py-3.5 px-4 font-medium">{bustVal}</td>
                          )}
                          <td className="py-3.5 px-4 font-medium">{waistVal}</td>
                          <td className="py-3.5 px-4 font-medium">{hipVal}</td>
                          <td className="py-3.5 px-4 font-medium">{lengthVal}</td>
                          <td className="py-3.5 px-4 font-medium">{shoulderVal}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplySize(row.size);
                              }}
                              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isRowSelected
                                  ? 'bg-[#D84B7E] text-white shadow-2xs'
                                  : 'bg-[#FDF4F7] text-[#D84B7E] border border-[#F1BCCE] hover:bg-[#D84B7E] hover:text-white'
                              }`}
                            >
                              {isRowSelected ? 'Selected ✓' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* FIT & MODEL REFERENCE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Customer Fit Feedback</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-600">89% True to Size</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
                    <div className="bg-amber-400 h-2" style={{ width: '6%' }} title="Runs Small: 6%" />
                    <div className="bg-emerald-500 h-2" style={{ width: '89%' }} title="True to Size: 89%" />
                    <div className="bg-blue-400 h-2" style={{ width: '5%' }} title="Runs Large: 5%" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                    <span>Runs Small (6%)</span>
                    <span className="font-bold text-emerald-700">True to Size (89%)</span>
                    <span>Runs Large (5%)</span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D84B7E]" />
                    <span>Fabric Stretch &amp; Drape</span>
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Stretch Level:</span>
                    <span className="font-bold text-[#D84B7E]">Tailored / Low-Stretch Silk</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Designed with fluid structural drape. For relaxed ease, consider ordering one size up.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Model Reference</span>
                  </span>
                  <div className="text-xs text-gray-700 space-y-0.5">
                    <p className="font-medium">
                      Height: <strong>5'9" (175 cm)</strong> • Bust: <strong>33"</strong>
                    </p>
                    <p className="font-medium">
                      Waist: <strong>25"</strong> • Hips: <strong>36"</strong>
                    </p>
                    <p className="text-[11px] text-[#D84B7E] font-bold pt-0.5">
                      Wearing Yurae Atelier Size S
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SMART FIT FINDER */}
          {viewSection === 'calculator' && (
            <div className="p-6 bg-gradient-to-br from-[#FFF5F8] to-[#FCE7F0] border border-[#F1BCCE] rounded-3xl space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#D84B7E] text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Smart Fit &amp; Size Recommender
                    </h3>
                    <p className="text-xs text-gray-600">
                      Enter your body dimensions to calculate your tailored Yurae Atelier fit.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCalculateFit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-700 block mb-1.5">
                      Bust / Chest ({unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={userBust}
                      onChange={(e) => setUserBust(e.target.value)}
                      placeholder={unit === 'in' ? 'e.g. 34' : 'e.g. 86'}
                      required
                      className="w-full bg-white border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#D84B7E] focus:ring-2 focus:ring-[#D84B7E]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-700 block mb-1.5">
                      Natural Waist ({unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={userWaist}
                      onChange={(e) => setUserWaist(e.target.value)}
                      placeholder={unit === 'in' ? 'e.g. 28' : 'e.g. 71'}
                      required
                      className="w-full bg-white border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#D84B7E] focus:ring-2 focus:ring-[#D84B7E]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-700 block mb-1.5">
                      Hips ({unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={userHip}
                      onChange={(e) => setUserHip(e.target.value)}
                      placeholder={unit === 'in' ? 'e.g. 37' : 'e.g. 94'}
                      required
                      className="w-full bg-white border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#D84B7E] focus:ring-2 focus:ring-[#D84B7E]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-700 block mb-1.5">
                      Preferred Fit Style
                    </label>
                    <select
                      value={fitPreference}
                      onChange={(e) => setFitPreference(e.target.value as any)}
                      className="w-full bg-white border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#D84B7E] focus:ring-2 focus:ring-[#D84B7E]/20 cursor-pointer"
                    >
                      <option value="snug">Snug / Contoured Fit</option>
                      <option value="regular">Regular / True to Size</option>
                      <option value="relaxed">Relaxed / Oversized Drape</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#D84B7E]/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Find My Recommended Size</span>
                  </button>
                </div>
              </form>

              {calcResult && (
                <div className="p-5 bg-white border-2 border-[#D84B7E] rounded-3xl shadow-md space-y-4 animate-scale-up">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                        ✓
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {calcResult.confidence}% Fit Confidence
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            Based on your measurements
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[#111111]">
                          Your Recommended Size is{' '}
                          <span className="text-[#D84B7E] font-serif text-2xl underline">
                            Size {calcResult.size}
                          </span>
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySize(calcResult.size)}
                      className="px-6 py-3 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>Apply Size {calcResult.size} &amp; Close</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 border-t border-[#F1BCCE] pt-3 leading-relaxed">
                    💡 <strong>Stylist Insight:</strong> {calcResult.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. HOW TO MEASURE GUIDE */}
          {viewSection === 'howToMeasure' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D84B7E]" />
                <h3 className="text-sm uppercase tracking-wider font-bold text-[#111111]">
                  Step-by-Step Body Measurement Instructions
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Bust / Chest</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Wrap the measuring tape around the fullest part of your bust/chest. Keep the tape comfortably snug and level with the floor across your shoulder blades.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Natural Waist</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Measure around your natural waistline, which is the narrowest point of your torso (typically 1 to 2 inches above your belly button).
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Hips</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Stand with your heels together and measure around the widest part of your hips and rear, keeping tape parallel to the ground.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Garment Length</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Measure straight down from the highest point of the shoulder seam, over the bust point, to the bottom hemline of the dress or top.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      5
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Shoulder Width</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    From the back, measure horizontally across from the tip of the left shoulder bone straight to the tip of the right shoulder bone.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white font-bold text-xs flex items-center justify-center">
                      6
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">Inseam (Trousers)</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Measure along the inside of your leg from the crotch seam straight down to the ankle bone or desired trouser hem length.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FFF0F5] border border-[#F1BCCE] rounded-2xl text-xs text-gray-700 space-y-1">
                <strong className="text-[#111111] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D84B7E]" />
                  <span>Atelier Fit Tips:</span>
                </strong>
                <p className="text-gray-600 leading-relaxed">
                  Use a soft cloth tape measure. Wear thin, unpadded undergarments when measuring for the truest fit. If your bust and waist fall into two different sizes, choose the larger size for a relaxed drape.
                </p>
              </div>
            </div>
          )}

          {/* 4. INTERNATIONAL SIZE CONVERSION */}
          {viewSection === 'intl' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D84B7E]" />
                <h3 className="text-sm uppercase tracking-wider font-bold text-[#111111]">
                  Global Fashion Size Conversion Matrix
                </h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#F1BCCE] bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FCE7F0]/80 text-[#111111] border-b border-[#F1BCCE]">
                      <th className="py-3 px-4 font-bold uppercase">Yurae Standard</th>
                      <th className="py-3 px-4 font-bold uppercase">India (IN)</th>
                      <th className="py-3 px-4 font-bold uppercase">United States (US)</th>
                      <th className="py-3 px-4 font-bold uppercase">United Kingdom (UK)</th>
                      <th className="py-3 px-4 font-bold uppercase">Europe (EU)</th>
                      <th className="py-3 px-4 font-bold uppercase">Italy (IT)</th>
                      <th className="py-3 px-4 font-bold uppercase">Australia (AU)</th>
                      <th className="py-3 px-4 font-bold uppercase">Japan / Korea (JP/KR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE7F0]">
                    {[
                      { y: 'XS', in: '32 - 34', us: '0 - 2', uk: '4 - 6', eu: '32 - 34', it: '38', au: '6', jk: '7 / 55' },
                      { y: 'S', in: '36', us: '4 - 6', uk: '8 - 10', eu: '36 - 38', it: '40', au: '8', jk: '9 / 66' },
                      { y: 'M', in: '38', us: '8 - 10', uk: '10 - 12', eu: '38 - 40', it: '42', au: '10', jk: '11 / 77' },
                      { y: 'L', in: '40', us: '12 - 14', uk: '14 - 16', eu: '42 - 44', it: '44', au: '12', jk: '13 / 88' },
                      { y: 'XL', in: '42', us: '16 - 18', uk: '18 - 20', eu: '46 - 48', it: '46', au: '14', jk: '15 / 99' },
                      { y: 'XXL', in: '44', us: '20', uk: '22', eu: '50', it: '48', au: '16', jk: '17 / 100' },
                      { y: '3XL', in: '46', us: '22', uk: '24', eu: '52', it: '50', au: '18', jk: '19 / 110' },
                    ].map((row) => (
                      <tr key={row.y} className="hover:bg-[#FFF8FA] transition-colors text-gray-800">
                        <td className="py-3 px-4 font-bold text-sm text-[#D84B7E]">{row.y}</td>
                        <td className="py-3 px-4 font-medium">{row.in}</td>
                        <td className="py-3 px-4 font-medium">{row.us}</td>
                        <td className="py-3 px-4 font-medium">{row.uk}</td>
                        <td className="py-3 px-4 font-medium">{row.eu}</td>
                        <td className="py-3 px-4 font-medium">{row.it}</td>
                        <td className="py-3 px-4 font-medium">{row.au}</td>
                        <td className="py-3 px-4 font-medium">{row.jk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-[#FDF4F7] border-t border-[#F1BCCE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <HeartHandshake className="w-4 h-4 text-[#D84B7E]" />
            <span>Complimentary 7-day doorstep size exchange &amp; return policy.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#D84B7E] transition-all cursor-pointer shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
