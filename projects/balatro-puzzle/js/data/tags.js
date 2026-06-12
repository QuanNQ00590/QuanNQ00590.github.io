// Pokermancer MVP - Tags (Skip Rewards)
window.TAGS = [
  { id:'uncommon', nm:'Uncommon Tag', ef:'Next shop has a guaranteed Uncommon (★★) Joker', r:'u' },
  { id:'rare', nm:'Rare Tag', ef:'Next shop has a guaranteed Rare (★★★) Joker', r:'r' },
  { id:'negative', nm:'Negative Tag', ef:'One base Joker becomes Negative (+1 slot)', r:'r' },
  { id:'foil', nm:'Foil Tag', ef:'One random base Joker becomes Foil (+50 Chips)', r:'u' },
  { id:'holo', nm:'Holographic Tag', ef:'One random base Joker becomes Holographic (+10 Mult)', r:'u' },
  { id:'poly', nm:'Polychrome Tag', ef:'One random base Joker becomes Polychrome (x1.5 Mult)', r:'r' },
  { id:'voucher', nm:'Voucher Tag', ef:'Creates a Voucher in the next shop', r:'r' },
  { id:'coupon', nm:'Coupon Tag', ef:'All cards and packs are free in the next shop', r:'r' },
  { id:'d6', nm:'D6 Tag', ef:'Rerolls start at $0 in the next shop', r:'u' },
  { id:'investment', nm:'Investment Tag', ef:'Gives $15 after defeating the next Boss Blind', r:'r' },
  { id:'handy', nm:'Handy Tag', ef:'Gives $1 per hand played this run', r:'u' },
  { id:'garbage', nm:'Garbage Tag', ef:'Gives $1 per unused discard this run', r:'u' },
  { id:'speed', nm:'Speed Tag', ef:'Gives $5 per blind skipped this run', r:'u' },
  { id:'economy', nm:'Economy Tag', ef:'Doubles your money (max $40 bonus)', r:'r' },
  { id:'standard', nm:'Standard Tag', ef:'Gives a Mega Standard Pack (choose 2 of 5)', r:'u' },
  { id:'charm', nm:'Charm Tag', ef:'Gives a Mega Arcana Pack (choose 2 of 5)', r:'u' },
  { id:'meteor', nm:'Meteor Tag', ef:'Gives a Mega Celestial Pack (choose 2 of 5)', r:'u' },
  { id:'buffoon', nm:'Buffoon Tag', ef:'Gives a Mega Buffoon Pack (choose 2 of 4)', r:'r' },
  { id:'ethereal', nm:'Ethereal Tag', ef:'Gives a Spectral Pack (choose 1 of 2)', r:'r' },
  { id:'boss', nm:'Boss Tag', ef:'Rerolls the Boss Blind', r:'r' },
  { id:'double', nm:'Double Tag', ef:'The next tag you obtain gives 2 copies', r:'r' },
  { id:'juggle', nm:'Juggle Tag', ef:'+3 hand size for the next round', r:'u' },
  { id:'top_up', nm:'Top-up Tag', ef:'Creates up to 2 Common Jokers (must have slots)', r:'u' },
  { id:'orbital', nm:'Orbital Tag', ef:'Upgrades the shown poker hand by 3 levels', r:'r' }
];

window.getRandomTag = function() {
  return TAGS[Math.floor(Math.random() * TAGS.length)];
};

// Tag sprite mapping (indices in tarots_hd/t_*.png)
window.TAG_SPRITE_MAP = {
  uncommon:83, rare:84, negative:85, foil:86, holo:87, poly:88,
  voucher:89, coupon:90, d6:91, investment:92, handy:93, garbage:94,
  speed:95, economy:96, standard:97, charm:98, meteor:99, buffoon:100,
  ethereal:101, boss:102, double:103, juggle:104, top_up:105, orbital:106
};

window.getTagSprite = function() {
  return null;
};

// Tag effects — applied when skipping a blind
window.applyTagEffect = function(tag, state) {
  switch (tag.id) {
    case 'investment':
      state._pendingInvestment = 15;
      break;
    case 'handy':
      state.gold += (state._handsPlayedThisRun || 0);
      break;
    case 'garbage':
      state.gold += (state._totalDiscardsThisRun || 0);
      break;
    case 'speed':
      state.gold += 5 * (state._blindsSkipped || 1);
      break;
    case 'economy':
      const bonus = Math.min(state.gold, 40);
      state.gold += bonus;
      return bonus;
    case 'voucher':
      state._forceVoucher = true;
      break;
    case 'coupon':
      state._freeShop = true;
      break;
    case 'd6':
      state._freeRerolls = true;
      break;
    case 'uncommon':
      state._forceRarity = 'u';
      break;
    case 'rare':
      state._forceRarity = 'r';
      break;
    case 'negative':
    case 'foil':
    case 'holo':
    case 'poly':
      state._pendingTagEditions = state._pendingTagEditions || [];
      state._pendingTagEditions.push(tag.id);
      break;
    case 'standard':
    case 'charm':
    case 'meteor':
    case 'buffoon':
    case 'ethereal':
      state._pendingPack = tag.id;
      break;
    case 'orbital':
      // Would need the shown hand type — default to most played or first
      const target = state._mostPlayedHand || 'HIGH_CARD';
      for (let i = 0; i < 3; i++) PokerEvaluator.levelUpHand(state, target);
      break;
    case 'boss':
      state._rerollBoss = true;
      break;
    case 'juggle':
      state._juggleHandSize = 3;
      break;
    case 'top_up': {
      if (!state.jokers) state.jokers = [];
      const common = JOKERS.filter(j => j.r === 'c');
      const shuffled = [...common].sort(() => Math.random() - 0.5);
      let added = 0;
      for (const j of shuffled) {
        if (state.jokers.length >= state.maxJokers) break;
        if (added >= 2) break;
        state.jokers.push({ id: j.id });
        added++;
      }
      break;
    }
    case 'double':
      state._doubleTag = true;
      break;
  }
  return 0; // gold amount from tag
};
