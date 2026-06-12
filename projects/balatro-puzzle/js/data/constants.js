// Pokermancer MVP - Constants
window.SUITS = {
  HEARTS:   { sym: 'H', nm: 'Hearts',   c: '#e62946ff' },
  DIAMONDS: { sym: 'D', nm: 'Diamonds', c: '#f47e1b' },
  CLUBS:    { sym: 'C', nm: 'Clubs',    c: '#3978a8' },
  SPADES:   { sym: 'S', nm: 'Spades',   c: '#615951ff' }
};
window.SUIT_KEYS = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];

window.RANKS = {
  1:  { v: 1,  dn: '*' },
  2:  { v: 2,  dn: '2' },  3:  { v: 3,  dn: '3' },  4:  { v: 4,  dn: '4' },
  5:  { v: 5,  dn: '5' },  6:  { v: 6,  dn: '6' },  7:  { v: 7,  dn: '7' },
  8:  { v: 8,  dn: '8' },  9:  { v: 9,  dn: '9' },  10: { v: 10, dn: '10' },
  11: { v: 10, dn: 'J' },  12: { v: 10, dn: 'Q' },  13: { v: 10, dn: 'K' },
  14: { v: 11, dn: 'A' }
};

window.HAND_RANKS = {
  HIGH_CARD:       { id: 'HIGH_CARD',      lb: 'High Card',       chips: 5,   mult: 1  },
  PAIR:            { id: 'PAIR',           lb: 'One Pair',        chips: 10,  mult: 2  },
  TWO_PAIR:        { id: 'TWO_PAIR',       lb: 'Two Pair',        chips: 20,  mult: 2  },
  THREE_OF_A_KIND: { id: 'THREE_OF_A_KIND',lb: 'Three of a Kind', chips: 30,  mult: 3  },
  STRAIGHT:        { id: 'STRAIGHT',       lb: 'Straight',        chips: 30,  mult: 4  },
  FLUSH:           { id: 'FLUSH',          lb: 'Flush',           chips: 35,  mult: 4  },
  FULL_HOUSE:      { id: 'FULL_HOUSE',     lb: 'Full House',      chips: 40,  mult: 4  },
  FOUR_OF_A_KIND:  { id: 'FOUR_OF_A_KIND', lb: 'Four of a Kind',  chips: 60,  mult: 7  },
  STRAIGHT_FLUSH:  { id: 'STRAIGHT_FLUSH', lb: 'Straight Flush',  chips: 100, mult: 8  },
  FIVE_OF_A_KIND:  { id: 'FIVE_OF_A_KIND', lb: 'Five of a Kind',  chips: 120, mult: 12 },
  FLUSH_HOUSE:     { id: 'FLUSH_HOUSE',    lb: 'Flush House',     chips: 140, mult: 14 },
  FLUSH_FIVE:      { id: 'FLUSH_FIVE',     lb: 'Flush Five',      chips: 160, mult: 16 }
};

window.HAND_PRIORITY = {
  HIGH_CARD: 1, PAIR: 2, TWO_PAIR: 3, THREE_OF_A_KIND: 4,
  STRAIGHT: 5, FLUSH: 6, FULL_HOUSE: 7, FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9, FIVE_OF_A_KIND: 10, FLUSH_HOUSE: 11, FLUSH_FIVE: 12
};

window.BLIND_TYPES = {
  SMALL: { id: 'small', nm: 'Small Blind', mult: 1, gold: 3 },
  BIG:   { id: 'big',   nm: 'Big Blind',   mult: 1.5, gold: 4 },
  BOSS:  { id: 'boss',  nm: 'Boss Blind',  mult: 2, gold: 5 }
};

window.BOSSES = {
  amber:   { id: 'amber',   t: 'The Amber',   d: '2 random cards start Frozen.', tier: 1 },
  frost:   { id: 'frost',   t: 'The Frost',   d: 'Corner cards are Frozen.',     tier: 1 },
  wall:    { id: 'wall',    t: 'The Wall',    d: 'Target score is doubled.',     tier: 1 },
  hook:    { id: 'hook',    t: 'The Hook',    d: 'Discards 2 random cards.',     tier: 2 },
  eye:     { id: 'eye',     t: 'The Eye',     d: 'No repeat hand types.',        tier: 2 },
  mouth:   { id: 'mouth',   t: 'The Mouth',   d: 'Play only 1 hand type.',       tier: 2 },
  fish:    { id: 'fish',    t: 'The Fish',    d: 'Cards drawn face down.',       tier: 2 },
  plant:   { id: 'plant',   t: 'The Plant',   d: 'All face cards debuffed.',     tier: 3 },
  serpent: { id: 'serpent', t: 'The Serpent', d: 'After play, lose 3 cards.',    tier: 3 },
  pillar:  { id: 'pillar',  t: 'The Pillar',  d: 'Cards played before debuff.',  tier: 3 },
  psych:   { id: 'psych',   t: 'The Psychic', d: 'Must play 5 cards.',           tier: 3 },
  ox:      { id: 'ox',      t: 'The Ox',      d: 'Playing hand set to 1.',       tier: 4 },
  window:  { id: 'window',  t: 'The Window',  d: 'All Diamonds debuffed.',       tier: 4 },
  club:    { id: 'club',    t: 'The Club',    d: 'All Clubs debuffed.',          tier: 4 },
  goad:    { id: 'goad',    t: 'The Goad',    d: 'All Spades debuffed.',         tier: 4 },
  water:   { id: 'water',   t: 'The Water',   d: 'Start with 0 discards.',       tier: 4 },
  manacle: { id: 'manacle', t: 'The Manacle', d: 'All Hearts debuffed.',         tier: 4 }
};

window.BOSS_TIERS = {
  1: ['amber', 'frost', 'wall'],
  2: ['amber', 'frost', 'wall', 'hook', 'eye', 'mouth', 'fish'],
  3: ['hook', 'eye', 'mouth', 'fish', 'plant', 'serpent', 'pillar', 'psych'],
  4: ['plant', 'serpent', 'pillar', 'psych', 'ox', 'window', 'club', 'goad', 'water', 'manacle']
};

window.ANTE_CONFIG = { maxAnte: 8 };
window.HZ = { NONE: 0 };

// ===== ENHANCEMENTS =====
window.ENHANCEMENTS = {
  bonus:   { id: 'bonus',   nm: 'Bonus Card',  sym: '+', c: '#44ff88', chips: 30, mult: 0, desc: '+30 Chips' },
  mult:    { id: 'mult',    nm: 'Mult Card',   sym: 'x', c: '#ff4466', chips: 0,  mult: 4, desc: '+4 Mult' },
  wild:    { id: 'wild',    nm: 'Wild Card',   sym: '*', c: '#cc88ff', chips: 0,  mult: 0, desc: 'All Suits' },
  glass:   { id: 'glass',   nm: 'Glass Card',  sym: 'D', c: '#88ccff', chips: 0,  mult: 0, desc: 'x2 Mult, 1/4 break', xmult: 2, breakChance: 0.25 },
  steel:   { id: 'steel',   nm: 'Steel Card',  sym: 'S', c: '#aaaaaa', chips: 0,  mult: 0, desc: 'x1.5 Mult in deck', xmult: 1.5 },
  stone:   { id: 'stone',   nm: 'Stone Card',  sym: '#', c: '#888888', chips: 50, mult: 0, desc: '+50 Chips' },
  gold:    { id: 'gold',    nm: 'Gold Card',   sym: '$', c: '#ffd700', chips: 0,  mult: 0, desc: '$3 end of round', gold: 3 },
  lucky:   { id: 'lucky',   nm: 'Lucky Card',  sym: '?', c: '#44dd44', chips: 0,  mult: 0, desc: '1/5 x2 Mult, 1/15 +$20',
             luckMultChance: 0.2, luckGoldChance: 0.0667, luckMult: 2, luckGold: 20 }
};

// ===== EDITIONS =====
window.EDITIONS = {
  foil:         { id: 'foil',        nm: 'Foil',        sym: 'F', c: '#ffd700', chips: 50,  mult: 0,  xmult: 1,   desc: '+50 Chips' },
  holographic:  { id: 'holographic', nm: 'Holographic', sym: 'H', c: '#88ddff', chips: 0,   mult: 10, xmult: 1,   desc: '+10 Mult' },
  polychrome:   { id: 'polychrome',  nm: 'Polychrome',  sym: 'P', c: '#ff88ff', chips: 0,   mult: 0,  xmult: 1.5, desc: 'x1.5 Mult' }
};
window.ENHANCEMENT_IDS = Object.keys(ENHANCEMENTS);
window.EDITION_IDS = Object.keys(EDITIONS);

// ===== SEALS =====
window.SEALS = {
  red:   { id: 'red',   nm: 'Red Seal',   sym: 'R', c: '#ff4444', desc: 'Retrigger card once' },
  blue:  { id: 'blue',  nm: 'Blue Seal',  sym: 'B', c: '#4488ff', desc: 'Creates Planet at round end' },
  gold:  { id: 'gold',  nm: 'Gold Seal',  sym: 'G', c: '#ffd700', desc: '+$3 when played' },
  purple:{ id: 'purple',nm: 'Purple Seal',sym: 'P', c: '#cc44ff', desc: 'Create Tarot when discarded' }
};
window.SEAL_IDS = ['red','blue','gold','purple'];

window.PLANETS = {
  mercury: { id: 'mercury', nm: 'Mercury',  hand: 'HIGH_CARD',      icon: 'M', cost: 3, chipBonus: 10,  multBonus: 1 },
  venus:   { id: 'venus',   nm: 'Venus',    hand: 'PAIR',           icon: 'V', cost: 3, chipBonus: 10,  multBonus: 1 },
  earth:   { id: 'earth',   nm: 'Earth',    hand: 'TWO_PAIR',       icon: 'E', cost: 3, chipBonus: 20,  multBonus: 1 },
  mars:    { id: 'mars',    nm: 'Mars',     hand: 'THREE_OF_A_KIND',icon: 'M', cost: 3, chipBonus: 20,  multBonus: 2 },
  jupiter: { id: 'jupiter', nm: 'Jupiter',  hand: 'STRAIGHT',       icon: 'J', cost: 3, chipBonus: 30,  multBonus: 2 },
  saturn:  { id: 'saturn',  nm: 'Saturn',   hand: 'FLUSH',          icon: 'S', cost: 3, chipBonus: 15,  multBonus: 2 },
  uranus:  { id: 'uranus',  nm: 'Uranus',   hand: 'FULL_HOUSE',     icon: 'U', cost: 3, chipBonus: 25,  multBonus: 2 },
  neptune: { id: 'neptune', nm: 'Neptune',  hand: 'FOUR_OF_A_KIND', icon: 'N', cost: 3, chipBonus: 30,  multBonus: 3 },
  pluto:   { id: 'pluto',   nm: 'Pluto',    hand: 'STRAIGHT_FLUSH', icon: 'P', cost: 3, chipBonus: 40,  multBonus: 3 },
  ceres:   { id: 'ceres',   nm: 'Ceres',    hand: 'FIVE_OF_A_KIND', icon: 'C', cost: 3, chipBonus: 35,  multBonus: 3 },
  // Hand-specific planets for FLUSH_HOUSE and FLUSH_FIVE (not standard planets, but needed for level scaling)
  eris:    { id: 'eris',    nm: 'Eris',     hand: 'FLUSH_HOUSE',    icon: 'E', cost: 3, chipBonus: 40,  multBonus: 3 },
  // Additional planet for Flush Five (not in base game planets, but needed for scaling)
  planet_x:{ id: 'planet_x',nm: 'Planet X', hand: 'FLUSH_FIVE',     icon: 'X', cost: 3, chipBonus: 40,  multBonus: 3 }
};
window.PLANET_IDS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto','ceres','eris','planet_x'];
window.PLANET_BY_HAND = {
  'HIGH_CARD':'mercury','PAIR':'venus','TWO_PAIR':'earth','THREE_OF_A_KIND':'mars',
  'STRAIGHT':'jupiter','FLUSH':'saturn','FULL_HOUSE':'uranus','FOUR_OF_A_KIND':'neptune',
  'STRAIGHT_FLUSH':'pluto','FIVE_OF_A_KIND':'ceres',
  'FLUSH_HOUSE':'eris','FLUSH_FIVE':'planet_x'
};

window.DECK_TYPES = [
  { id: 'red',    nm: 'Red Deck',    icon: 'R', desc: '+1 discard per round',     bonus: { discards: 1 } },
  { id: 'blue',   nm: 'Blue Deck',   icon: 'B', desc: '+1 hand per round',        bonus: { hands: 1 } },
  { id: 'yellow', nm: 'Yellow Deck', icon: 'Y', desc: 'Start with +$10',          bonus: { gold: 10 } }
];


// ===== STAKES =====
window.STAKES = [
  { id: "white",  nm: "White Stake",  icon: "W", desc: "Base difficulty", multiplier: 1.0 },
  { id: "red",    nm: "Red Stake",    icon: "R", desc: "Small Blind gives no gold", multiplier: 1.1, penalty: { small_blind_no_gold: true } },
  { id: "green",  nm: "Green Stake",  icon: "G", desc: "Interest threshold raised to 0", multiplier: 1.2, penalty: { interest_threshold: 10 } },
  { id: "black",  nm: "Black Stake",  icon: "B", desc: "Shop may have Eternal Jokers", multiplier: 1.3, penalty: { eternal_jokers: true } },
  { id: "blue",   nm: "Blue Stake",   icon: "B", desc: "-1 Discard", multiplier: 1.4, penalty: { discards: -1 } },
  { id: "purple", nm: "Purple Stake", icon: "P", desc: "Interest threshold raised to 5", multiplier: 1.5, penalty: { interest_threshold: 15 } },
  { id: "orange", nm: "Orange Stake", icon: "O", desc: "Shop may have Perishable Jokers", multiplier: 1.6, penalty: { perishable_jokers: true } },
  { id: "gold",   nm: "Gold Stake",   icon: "G", desc: "Shop may have Rental Jokers (/round)", multiplier: 1.8, penalty: { rental_jokers: true } }
];
