// Ability System - Balatro Puzzle grid manipulation abilities
window.AbilityManager = {
  // Ability definitions (from Godot decompiled scripts)
  ABILITIES: {
    swap: {
      id: 'swap',
      name: 'Swap',
      icon: '🔄',
      desc: 'Swap positions of 2 cards',
      energyCost: 1,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 2
    },
    delete: {
      id: 'delete',
      name: 'Delete',
      icon: '🗑️',
      desc: 'Remove 1 card from the grid',
      energyCost: 1,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 1
    },
    repair: {
      id: 'repair',
      name: 'Repair',
      icon: '🔧',
      desc: 'Remove hazard from 1 card',
      energyCost: 1,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 1
    },
    exchange: {
      id: 'exchange',
      name: 'Exchange',
      icon: '♻️',
      desc: 'Replace 1 card with a random card',
      energyCost: 2,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 1
    },
    slide: {
      id: 'slide',
      name: 'Slide',
      icon: '➡️',
      desc: 'Shift a row/column left or right',
      energyCost: 2,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 0
    },
    rummage: {
      id: 'rummage',
      name: 'Rummage',
      icon: '🔍',
      desc: 'Reveal all face-down cards',
      energyCost: 2,
      goldCost: 5,
      cooldown: 0,
      requiresSelection: 0
    },
    rotate: {
      id: 'rotate',
      name: 'Rotate Grid',
      icon: '🔃',
      desc: 'Rotate the entire grid 90 degrees',
      energyCost: 3,
      goldCost: 10,
      cooldown: 1,
      requiresSelection: 0
    },
    flip: {
      id: 'flip',
      name: 'Flip Grid',
      icon: '🔁',
      desc: 'Flip the grid horizontally',
      energyCost: 2,
      goldCost: 5,
      cooldown: 0,
      requiresSelection: 0
    },
    shuffle: {
      id: 'shuffle',
      name: 'Shuffle',
      icon: '🎲',
      desc: 'Shuffle all cards in the grid',
      energyCost: 3,
      goldCost: 15,
      cooldown: 2,
      requiresSelection: 0
    },
    peek: {
      id: 'peek',
      name: 'Peek',
      icon: '👁️',
      desc: 'View the next 3 cards in the deck',
      energyCost: 1,
      goldCost: 0,
      cooldown: 0,
      requiresSelection: 0
    }
  },

  // Execute ability
  execute: function(abilityId, state, selectedCells) {
    const ability = this.ABILITIES[abilityId];
    if (!ability) return { success: false, message: 'Ability not found' };

    // Check energy cost
    if (state.energy < ability.energyCost) {
      return { success: false, message: 'Not enough energy!' };
    }

    // Check gold cost
    if (state.gold < ability.goldCost) {
      return { success: false, message: 'Not enough gold!' };
    }

    // Check cooldown
    if (ability.cooldown > 0 && state.abilityCooldowns && state.abilityCooldowns[abilityId] > 0) {
      return { success: false, message: 'Ability on cooldown!' };
    }

    // Check selection requirement
    if (ability.requiresSelection > 0) {
      if (!selectedCells || selectedCells.length < ability.requiresSelection) {
        return { success: false, message: 'Select ' + ability.requiresSelection + ' card(s)!' };
      }
    }

    // Deduct costs
    state.energy -= ability.energyCost;
    state.gold -= ability.goldCost;

    // Set cooldown
    if (ability.cooldown > 0) {
      if (!state.abilityCooldowns) state.abilityCooldowns = {};
      state.abilityCooldowns[abilityId] = ability.cooldown + 1;
    }

    let result;
    switch (abilityId) {
      case 'swap': result = this._swap(state, selectedCells); break;
      case 'delete': result = this._delete(state, selectedCells); break;
      case 'repair': result = this._repair(state, selectedCells); break;
      case 'exchange': result = this._exchange(state, selectedCells); break;
      case 'slide': result = this._slide(state); break;
      case 'rummage': result = this._rummage(state); break;
      case 'rotate': result = this._rotate(state); break;
      case 'flip': result = this._flip(state); break;
      case 'shuffle': result = this._shuffle(state); break;
      case 'peek': result = this._peek(state); break;
      default:
        result = { success: false, message: 'Ability not yet implemented' };
    }

    return result;
  },

  // ===== ABILITY IMPLEMENTATIONS =====

  _swap: function(state, cells) {
    if (cells.length < 2) return { success: false, message: 'Select 2 cards to swap' };
    const c1 = cells[0], c2 = cells[1];
    const card1 = state.grid[c1.row][c1.col];
    const card2 = state.grid[c2.row][c2.col];
    state.grid[c1.row][c1.col] = card2;
    state.grid[c2.row][c2.col] = card1;
    return { success: true, message: 'Swapped 2 cards!' };
  },

  _delete: function(state, cells) {
    if (cells.length < 1) return { success: false, message: 'Select 1 card to delete' };
    const c = cells[0];
    state.grid[c.row][c.col] = null;
    return { success: true, message: 'Card deleted!' };
  },

  _repair: function(state, cells) {
    if (cells.length < 1) return { success: false, message: 'Select 1 card to repair' };
    const c = cells[0];
    const card = state.grid[c.row][c.col];
    if (!card) return { success: false, message: 'No card here!' };
    if (card.hz === HZ.NONE && !card.frozen) return { success: false, message: 'No hazard to repair!' };
    card.hz = HZ.NONE; card.frozen = false;
    return { success: true, message: 'Hazard removed!' };
  },

  _exchange: function(state, cells) {
    if (cells.length < 1) return { success: false, message: 'Select 1 card to exchange' };
    const c = cells[0];
    state.grid[c.row][c.col] = this._generateRandomCard(state);
    return { success: true, message: 'Card exchanged!' };
  },

  _slide: function(state) {
    // Slide the bottom row to the left
    const row = 3;
    const cards = state.grid[row].filter(c => c);
    for (let c = 0; c < 4; c++) {
      state.grid[row][c] = c < cards.length ? cards[c] : null;
    }
    return { success: true, message: 'Row slid!' };
  },

  _rummage: function(state) {
    let count = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const card = state.grid[r][c];
        if (card && card.hz === HZ.FACEDOWN) {
          card.hz = HZ.NONE;
          count++;
        }
      }
    }
    return { success: true, message: 'Revealed ' + count + ' card(s)!' };
  },

  _rotate: function(state) {
    GridManager.rotateGrid(state);
    return { success: true, message: 'Grid rotated 90 degrees!' };
  },

  _flip: function(state) {
    for (let r = 0; r < 4; r++) {
      state.grid[r].reverse();
    }
    return { success: true, message: 'Grid flipped!' };
  },

  _shuffle: function(state) {
    const allCards = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (state.grid[r][c]) allCards.push(state.grid[r][c]);
      }
    }
    const shuffled = GridManager.shuffle(allCards);
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        state.grid[r][c] = idx < shuffled.length ? shuffled[idx++] : null;
      }
    }
    return { success: true, message: 'Grid shuffled!' };
  },

  _peek: function(state) {
    if (!state.deck || state.deck.length === 0) {
      return { success: false, message: 'Deck is empty!' };
    }
    const next3 = state.deck.slice(0, 3).map(c => c.dfn).join(', ');
    return { success: true, message: 'Next 3 cards: ' + next3 };
  },

  _generateRandomCard: function(state) {
    const suits = SUIT_KEYS;
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return {
      suit, rank, dn: RANKS[rank].dn, bv: RANKS[rank].v,
      hz: HZ.NONE, dfn: RANKS[rank].dn + SUITS[suit].sym,
      frozen: false, edition: null, seal: null, enhancement: null,
      isWild: false, isJoker: false,
      has_blue_ribbon: false, has_gold_ribbon: false,
      decal_id: '', bonus_score: 0, card_material: 'normal',
      boss_dampened: false, must_include: false
    };
  },

  // Reduce cooldowns
  tickCooldowns: function(state) {
    if (!state.abilityCooldowns) return;
    for (const abilityId in state.abilityCooldowns) {
      state.abilityCooldowns[abilityId]--;
      if (state.abilityCooldowns[abilityId] <= 0) {
        delete state.abilityCooldowns[abilityId];
      }
    }
  }
};
