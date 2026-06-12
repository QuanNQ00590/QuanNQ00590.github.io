// Pokermancer MVP - 18 Spectral Cards
window.SPECTRALS = [
  { id:'familiar', nm:'Familiar', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Destroy 1 random card in deck, add 3 enhanced Face cards',
    effect:'destroy_add', destroyCount:1, addCount:3, addType:'face' },
  { id:'grim', nm:'Grim', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Destroy 1 random card in deck, add 2 enhanced Aces',
    effect:'destroy_add', destroyCount:1, addCount:2, addType:'ace' },
  { id:'incantation', nm:'Incantation', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Destroy 1 random card in deck, add 4 enhanced Number cards',
    effect:'destroy_add', destroyCount:1, addCount:4, addType:'number' },
  { id:'talisman', nm:'Talisman', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Gold Seal to 1 selected card',
    effect:'add_seal', seal:'gold', count:1 },
  { id:'aura', nm:'Aura', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Foil/Holo/Polychrome to 1 selected card',
    effect:'add_edition', count:1 },
  { id:'wraith', nm:'Wraith', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Create a Rare Joker, set money to $0',
    effect:'wraith' },
  { id:'sigil', nm:'Sigil', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Convert all cards in hand (grid) to 1 random suit',
    effect:'sigil' },
  { id:'ouija', nm:'Ouija', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Convert all cards to 1 random rank, lose 1 hand size',
    effect:'ouija' },
  { id:'ectoplasm', nm:'Ectoplasm', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Negative to a random Joker, lose 1 hand size',
    effect:'ectoplasm' },
  { id:'imolate', nm:'Immolate', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Destroy 5 random cards, gain $20',
    effect:'imolate' },
  { id:'ankh', nm:'Ankh', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Copy a random Joker, destroy all other Jokers',
    effect:'ankh' },
  { id:'deja_vu', nm:'Deja Vu', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Red Seal to 1 selected card',
    effect:'add_seal', seal:'red', count:1 },
  { id:'hex', nm:'Hex', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Polychrome to a random Joker, destroy all other Jokers',
    effect:'hex' },
  { id:'trance', nm:'Trance', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Blue Seal to 1 selected card',
    effect:'add_seal', seal:'blue', count:1 },
  { id:'medium', nm:'Medium', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Add Purple Seal to 1 selected card',
    effect:'add_seal', seal:'purple', count:1 },
  { id:'cryptid', nm:'Cryptid', icon:'W', cost:4, type:'spectral', r:'r',
    ef:'Create 2 copies of 1 selected card',
    effect:'cryptid', count:2 },
  { id:'soul', nm:'The Soul', icon:'S', cost:8, type:'spectral', r:'l',
    ef:'Creates a Legendary Joker (must have room)',
    effect:'soul', chance:1 },
  { id:'black_hole', nm:'Black Hole', icon:'B', cost:8, type:'spectral', r:'l',
    ef:'Upgrade every poker hand by 1 level',
    effect:'black_hole' }
];

// Spectral sprite mapping (indices in tarots_hd/t_*.png, after tarots 11-32)
window.SPECTRAL_SPRITE_MAP = {
  familiar:33, grim:34, incantation:35, talisman:36, aura:37,
  wraith:38, sigil:39, ouija:40, ectoplasm:41, imolate:42,
  ankh:43, deja_vu:44, hex:45, trance:46, medium:47,
  cryptid:48, soul:49, black_hole:50
};

window.getSpectralSprite = function() {
  return null;
};
