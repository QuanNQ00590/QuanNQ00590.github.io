// Pokermancer MVP - Vouchers (16 base + 16 upgraded)
window.VOUCHERS = [
  // Base vouchers ($10 each)
  { id:'overstock', nm:'Overstock', cost:10, type:'voucher', r:'r',
    ef:'+1 shop slot', effect_type:'shop_slot', val:1, upgrade:'overstock_plus' },
  { id:'clearance', nm:'Clearance Sale', cost:10, type:'voucher', r:'r',
    ef:'25% off shop items', effect_type:'shop_discount', val:0.25, upgrade:'liquidation' },
  { id:'hone', nm:'Hone', cost:10, type:'voucher', r:'r',
    ef:'Foil/Holo/Polychrome 2x more frequent', effect_type:'edition_rate', val:2, upgrade:'glow_up' },
  { id:'reroll', nm:'Reroll Surplus', cost:10, type:'voucher', r:'r',
    ef:'Reroll costs $2 less', effect_type:'reroll_discount', val:2, upgrade:'reroll_glut' },
  { id:'crystal', nm:'Crystal Ball', cost:10, type:'voucher', r:'r',
    ef:'+1 consumable slot', effect_type:'consumable_slot', val:1, upgrade:'omen_globe' },
  { id:'telescope', nm:'Telescope', cost:10, type:'voucher', r:'r',
    ef:'Celestial packs contain most played Planet card', effect_type:'telescope', val:1, upgrade:'observatory' },
  { id:'grabber', nm:'Grabber', cost:10, type:'voucher', r:'r',
    ef:'Permanent +1 hand per round', effect_type:'max_hands', val:1, upgrade:'nacho_tong' },
  { id:'wasteful', nm:'Wasteful', cost:10, type:'voucher', r:'r',
    ef:'Permanent +1 discard per round', effect_type:'max_discards', val:1, upgrade:'recyclomancy' },
  { id:'tarot_merchant', nm:'Tarot Merchant', cost:10, type:'voucher', r:'r',
    ef:'Tarot cards appear 2x more in shop', effect_type:'tarot_rate', val:2, upgrade:'tarot_tycoon' },
  { id:'planet_merchant', nm:'Planet Merchant', cost:10, type:'voucher', r:'r',
    ef:'Planet cards appear 2x more in shop', effect_type:'planet_rate', val:2, upgrade:'planet_tycoon' },
  { id:'seed_money', nm:'Seed Money', cost:10, type:'voucher', r:'r',
    ef:'Interest cap raised to $10', effect_type:'interest_cap', val:10, upgrade:'money_tree' },
  { id:'blank', nm:'Blank', cost:10, type:'voucher', r:'r',
    ef:'Does nothing?', effect_type:'blank', val:0, upgrade:'antimatter' },
  { id:'magic_trick', nm:'Magic Trick', cost:10, type:'voucher', r:'r',
    ef:'Playing cards can be bought in shop', effect_type:'cards_in_shop', val:1, upgrade:'illusion' },
  { id:'hieroglyph', nm:'Hieroglyph', cost:10, type:'voucher', r:'r',
    ef:'-1 Ante, -1 hand per round', effect_type:'hieroglyph', val:-1, upgrade:'petroglyph' },
  { id:'directors_cut', nm:`Director's Cut`, cost:10, type:'voucher', r:'r',
    ef:'Reroll Boss Blind 1x per ante ($10)', effect_type:'boss_reroll', val:1, upgrade:'retcon' },
  { id:'paint_brush', nm:'Paint Brush', cost:10, type:'voucher', r:'r',
    ef:'+1 hand size', effect_type:'hand_size', val:1, upgrade:'palette' },

  // Upgraded vouchers ($10 each)
  { id:'overstock_plus', nm:'Overstock Plus', cost:10, type:'voucher', r:'r',
    ef:'+1 more shop slot', effect_type:'shop_slot', val:2, base:'overstock' },
  { id:'liquidation', nm:'Liquidation', cost:10, type:'voucher', r:'r',
    ef:'50% off shop items', effect_type:'shop_discount', val:0.5, base:'clearance' },
  { id:'glow_up', nm:'Glow Up', cost:10, type:'voucher', r:'r',
    ef:'Editions 4x more frequent', effect_type:'edition_rate', val:4, base:'hone' },
  { id:'reroll_glut', nm:'Reroll Glut', cost:10, type:'voucher', r:'r',
    ef:'Reroll costs $4 less', effect_type:'reroll_discount', val:4, base:'reroll' },
  { id:'omen_globe', nm:'Omen Globe', cost:10, type:'voucher', r:'r',
    ef:'+1 consumable slot; Spectral may appear in Arcana packs', effect_type:'omen_globe', val:1, base:'crystal' },
  { id:'observatory', nm:'Observatory', cost:10, type:'voucher', r:'r',
    ef:'Planet cards in consumable slots give x1.5 Mult for their hand', effect_type:'observatory', val:1.5, base:'telescope' },
  { id:'nacho_tong', nm:'Nacho Tong', cost:10, type:'voucher', r:'r',
    ef:'Permanent +1 more hand per round', effect_type:'max_hands', val:2, base:'grabber' },
  { id:'recyclomancy', nm:'Recyclomancy', cost:10, type:'voucher', r:'r',
    ef:'Permanent +1 more discard per round', effect_type:'max_discards', val:2, base:'wasteful' },
  { id:'tarot_tycoon', nm:'Tarot Tycoon', cost:10, type:'voucher', r:'r',
    ef:'Tarot cards appear 4x more in shop', effect_type:'tarot_rate', val:4, base:'tarot_merchant' },
  { id:'planet_tycoon', nm:'Planet Tycoon', cost:10, type:'voucher', r:'r',
    ef:'Planet cards appear 4x more in shop', effect_type:'planet_rate', val:4, base:'planet_merchant' },
  { id:'money_tree', nm:'Money Tree', cost:10, type:'voucher', r:'r',
    ef:'Interest cap raised to $20', effect_type:'interest_cap', val:20, base:'seed_money' },
  { id:'antimatter', nm:'Antimatter', cost:10, type:'voucher', r:'r',
    ef:'+1 Joker slot', effect_type:'joker_slot', val:1, base:'blank' },
  { id:'illusion', nm:'Illusion', cost:10, type:'voucher', r:'r',
    ef:'Shop cards have Enhancement/Seal', effect_type:'illusion', val:1, base:'magic_trick' },
  { id:'petroglyph', nm:'Petroglyph', cost:10, type:'voucher', r:'r',
    ef:'-1 more ante, -1 discard per round', effect_type:'petroglyph', val:-1, base:'hieroglyph' },
  { id:'retcon', nm:'Retcon', cost:10, type:'voucher', r:'r',
    ef:'Unlimited Boss Blind rerolls ($10)', effect_type:'boss_reroll', val:999, base:'directors_cut' },
  { id:'palette', nm:'Palette', cost:10, type:'voucher', r:'r',
    ef:'+1 more hand size', effect_type:'hand_size', val:2, base:'paint_brush' }
];

// Voucher sprite mapping (indices in tarots_hd/t_*.png)
window.VOUCHER_SPRITE_MAP = {
  overstock:51, clearance:52, hone:53, reroll:54, crystal:55,
  telescope:56, grabber:57, wasteful:58, tarot_merchant:59, planet_merchant:60,
  seed_money:61, blank:62, magic_trick:63, hieroglyph:64, directors_cut:65, paint_brush:66,
  overstock_plus:67, liquidation:68, glow_up:69, reroll_glut:70, omen_globe:71,
  observatory:72, nacho_tong:73, recyclomancy:74, tarot_tycoon:75, planet_tycoon:76,
  money_tree:77, antimatter:78, illusion:79, petroglyph:80, retcon:81, palette:82
};

window.getVoucherSprite = function() {
  return null;
};
