// Pokermancer MVP - 22 Tarot Cards
window.TAROTS = [
  { id:'fool', nm:'The Fool', icon:'0', cost:3, type:'tarot', ef:'Creates the last used Tarot or Planet card', r:'u',
    effect:'last_consumable' },
  { id:'magician', nm:'The Magician', icon:'I', cost:3, type:'tarot', ef:'Enhances 2 selected cards to Lucky', r:'u',
    effect:'enhance', enh:'lucky', count:2 },
  { id:'high_priestess', nm:'The High Priestess', icon:'II', cost:3, type:'tarot', ef:'Creates up to 2 random Planet cards', r:'u',
    effect:'create_planets', count:2 },
  { id:'empress', nm:'The Empress', icon:'III', cost:3, type:'tarot', ef:'Enhances 2 selected cards to Mult (+4)', r:'u',
    effect:'enhance', enh:'mult', count:2 },
  { id:'emperor', nm:'The Emperor', icon:'IV', cost:3, type:'tarot', ef:'Creates up to 2 random Tarot cards', r:'u',
    effect:'create_tarots', count:2 },
  { id:'hierophant', nm:'The Hierophant', icon:'V', cost:3, type:'tarot', ef:'Enhances 2 selected cards to Bonus (+30)', r:'u',
    effect:'enhance', enh:'bonus', count:2 },
  { id:'lovers', nm:'The Lovers', icon:'VI', cost:3, type:'tarot', ef:'Enhances 1 selected card to Wild', r:'u',
    effect:'enhance', enh:'wild', count:1 },
  { id:'chariot', nm:'The Chariot', icon:'VII', cost:3, type:'tarot', ef:'Enhances 1 selected card to Steel', r:'u',
    effect:'enhance', enh:'steel', count:1 },
  { id:'justice', nm:'Justice', icon:'VIII', cost:3, type:'tarot', ef:'Enhances 1 selected card to Glass', r:'u',
    effect:'enhance', enh:'glass', count:1 },
  { id:'hermit', nm:'The Hermit', icon:'IX', cost:3, type:'tarot', ef:'Doubles your money (max $20)', r:'u',
    effect:'double_money', max:20 },
  { id:'wheel', nm:'Wheel of Fortune', icon:'X', cost:3, type:'tarot', ef:'1 in 4 chance to add Foil/Holo/Polychrome to a random Joker', r:'u',
    effect:'wheel', chance:0.25 },
  { id:'strength', nm:'Strength', icon:'XI', cost:3, type:'tarot', ef:'Increases rank of up to 2 selected cards by 1', r:'u',
    effect:'strength', count:2 },
  { id:'hanged_man', nm:'The Hanged Man', icon:'XII', cost:3, type:'tarot', ef:'Destroys up to 2 selected cards', r:'u',
    effect:'destroy', count:2 },
  { id:'death', nm:'Death', icon:'XIII', cost:3, type:'tarot', ef:'Select 2 cards — convert the left card into the right card', r:'u',
    effect:'death' },
  { id:'temperance', nm:'Temperance', icon:'XIV', cost:3, type:'tarot', ef:'Gives total sell value of all Jokers (max $50)', r:'u',
    effect:'temperance', max:50 },
  { id:'devil', nm:'The Devil', icon:'XV', cost:3, type:'tarot', ef:'Enhances 1 selected card to Gold', r:'u',
    effect:'enhance', enh:'gold', count:1 },
  { id:'tower', nm:'The Tower', icon:'XVI', cost:3, type:'tarot', ef:'Enhances 1 selected card to Stone', r:'u',
    effect:'enhance', enh:'stone', count:1 },
  { id:'star', nm:'The Star', icon:'XVII', cost:3, type:'tarot', ef:'Converts up to 3 selected cards to Diamonds', r:'u',
    effect:'suit_change', suit:'DIAMONDS', count:3 },
  { id:'moon', nm:'The Moon', icon:'XVIII', cost:3, type:'tarot', ef:'Converts up to 3 selected cards to Clubs', r:'u',
    effect:'suit_change', suit:'CLUBS', count:3 },
  { id:'sun', nm:'The Sun', icon:'XIX', cost:3, type:'tarot', ef:'Converts up to 3 selected cards to Hearts', r:'u',
    effect:'suit_change', suit:'HEARTS', count:3 },
  { id:'judgement', nm:'Judgement', icon:'XX', cost:3, type:'tarot', ef:'Creates a random Joker (must have room)', r:'u',
    effect:'create_joker' },
  { id:'world', nm:'The World', icon:'XXI', cost:3, type:'tarot', ef:'Converts up to 3 selected cards to Spades', r:'u',
    effect:'suit_change', suit:'SPADES', count:3 }
];

// Tarot sprite index mapping (matches Balatro Tarots.png sprite sheet order)
// Planets occupy t_0.png through t_10.png, Tarots start at t_11.png
window.TAROT_SPRITE_MAP = {
  fool:11, magician:12, high_priestess:13, empress:14, emperor:15,
  hierophant:16, lovers:17, chariot:18, justice:19, hermit:20,
  wheel:21, strength:22, hanged_man:23, death:24, temperance:25,
  devil:26, tower:27, star:28, moon:29, sun:30, judgement:31, world:32
};

window.getTarotSprite = function() {
  return null;
};
