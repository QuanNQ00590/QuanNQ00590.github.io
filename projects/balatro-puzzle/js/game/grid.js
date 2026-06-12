// Pokermancer MVP - Grid Manager
window.GridManager = {
  COLS: 4, ROWS: 4, MAX_HAND_SIZE: 5,

  generateGrid: function(state) {
    const grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));
    const deck = this._buildDeck(state);
    const shuffled = this.shuffle(deck);
    let idx = 0;
    for (let r = 0; r < this.ROWS; r++)
      for (let c = 0; c < this.COLS; c++)
        if (idx < shuffled.length) grid[r][c] = shuffled[idx++];

    if (state.boss && state.boss.id === 'frost') {
      state.frostCorners = [{row:0,col:0},{row:0,col:3},{row:3,col:0},{row:3,col:3}];
      state.frostCorners.forEach(pos => {
        if (grid[pos.row]?.[pos.col]) grid[pos.row][pos.col].frozen = true;
      });
    }
    if (state.bossAbility === 'amber' && state.amberFrozen) {
      state.amberFrozen.forEach(pos => {
        if (grid[pos.row]?.[pos.col]) grid[pos.row][pos.col].frozen = true;
      });
    }
    state.grid = grid;
    state.deck = shuffled.slice(16);
  },

  _buildDeck: function(state) {
    const deck = [];
    const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
    ranks.forEach(r => {
      SUIT_KEYS.forEach(suit => {
        deck.push(this._createCard(r, suit));
      });
    });
    return deck;
  },

  _createCard: function(rank, suit, opts) {
    opts = opts || {};
    const card = {
      suit, rank,
      dn: RANKS[rank].dn, bv: RANKS[rank].v,
      dfn: RANKS[rank].dn + (SUITS[suit] ? SUITS[suit].sym : ''),
      frozen: false,
      isWild: false, isJoker: false,
      boss_dampened: false, must_include: false,
      enhancement: null, edition: null, seal: null
    };
    // Random enhancement when generating deck (15% chance)
    if (!opts.noEnhance && Math.random() < 0.15) {
      const enhId = ENHANCEMENT_IDS[Math.floor(Math.random() * ENHANCEMENT_IDS.length)];
      card.enhancement = enhId;
      if (enhId === 'wild') card.isWild = true;
    }
    // Random edition (3% chance)
    if (!opts.noEnhance && Math.random() < 0.03) {
      const edId = EDITION_IDS[Math.floor(Math.random() * EDITION_IDS.length)];
      card.edition = edId;
    }
    // Random seal (2% chance)
    if (!opts.noEnhance && Math.random() < 0.02) {
      card.seal = SEAL_IDS[Math.floor(Math.random() * SEAL_IDS.length)];
    }
    return card;
  },

  // Create a card with specific enhancement for shop use
  createEnhancedCard: function(enhancementId, editionId, sealId) {
    const rank = 2 + Math.floor(Math.random() * 13);
    const suit = SUIT_KEYS[Math.floor(Math.random() * 4)];
    const card = this._createCard(rank, suit, { noEnhance: true });
    if (enhancementId) {
      card.enhancement = enhancementId;
      if (enhancementId === 'wild') card.isWild = true;
    }
    if (editionId) card.edition = editionId;
    if (sealId) card.seal = sealId;
    return card;
  },

  removeCards: function(state, positions) {
    positions.forEach(pos => {
      if (state.grid[pos.row]) state.grid[pos.row][pos.col] = null;
    });
    this.applyGravity(state);
  },

  applyGravity: function(state) {
    for (let c = 0; c < 4; c++) {
      const column = [];
      for (let r = 3; r >= 0; r--)
        if (state.grid[r][c]) column.push(state.grid[r][c]);
      for (let r = 3; r >= 0; r--)
        state.grid[r][c] = (3 - r) < column.length ? column[3 - r] : null;
    }
    this.refillGrid(state);
  },

  refillGrid: function(state) {
    if ((!state.deck || state.deck.length === 0) && state.discardPile && state.discardPile.length > 0) {
      state.deck = this.shuffle([...state.discardPile]);
      state.deck.forEach(c => { c.frozen = false; c.boss_dampened = false; c.must_include = false; });
      state.discardPile = [];
    }
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (!state.grid[r][c] && state.deck && state.deck.length > 0)
          state.grid[r][c] = state.deck.shift();
  },

  getCell: function(state, r, c) {
    return (r >= 0 && r < 4 && c >= 0 && c < 4) ? state.grid[r]?.[c] : null;
  },

  isValidPathStep: function(path, newRow, newCol, state) {
    const card = this.getCell(state, newRow, newCol);
    if (!card) return false;
    if (card.frozen) return false;
    if (path.length > 0) {
      const last = path[path.length - 1];
      const dr = Math.abs(last.row - newRow);
      const dc = Math.abs(last.col - newCol);
      if (dr === 0 && dc === 0) return false;
      if (dr > 1 || dc > 1) return false;
    }
    if (path.length >= this.MAX_HAND_SIZE) return false;
    return true;
  },

  validateCompletePath: function(path, state) {
    if (path.length < 2) return false;
    for (let i = 1; i < path.length; i++) {
      const p1 = path[i-1], p2 = path[i];
      const dr = Math.abs(p1.row - p2.row);
      const dc = Math.abs(p1.col - p2.col);
      if (dr === 0 && dc === 0 || dr > 1 || dc > 1) return false;
    }
    const cards = path.map(p => this.getCell(state, p.row, p.col)).filter(c => c);
    return cards.length >= 2;
  },

  reshuffleForNewBlind: function(state) {
    const allCards = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (state.grid[r]?.[c]) allCards.push(state.grid[r][c]);
    if (state.discardPile) {
      state.discardPile.forEach(c => allCards.push(c));
      state.discardPile = [];
    }
    if (state.deck) state.deck.forEach(c => allCards.push(c));
    state.deck = this.shuffle(allCards);
    state.deck.forEach(c => { c.frozen = false; c.boss_dampened = false; c.must_include = false; });
    this._fillGridFromDeck(state);
    if (state.boss && state.boss.id === 'frost') {
      state.frostCorners = [{row:0,col:0},{row:0,col:3},{row:3,col:0},{row:3,col:3}];
      state.frostCorners.forEach(pos => {
        if (state.grid[pos.row]?.[pos.col]) state.grid[pos.row][pos.col].frozen = true;
      });
    }
    if (state.bossAbility === 'amber' && state.amberFrozen) {
      state.amberFrozen.forEach(pos => {
        if (state.grid[pos.row]?.[pos.col]) state.grid[pos.row][pos.col].frozen = true;
      });
    }
  },

  _fillGridFromDeck: function(state) {
    const grid = Array(4).fill(null).map(() => Array(4).fill(null));
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (state.deck.length > 0) grid[r][c] = state.deck.shift();
    state.grid = grid;
  },

  shuffle: function(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};
