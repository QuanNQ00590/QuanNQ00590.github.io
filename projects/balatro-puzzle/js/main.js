// Pokermancer MVP - Game Controller
const G = {
  S: {
    ante: 1, blindType: 'small', blindIdx: 0,
    score: 0, target: 300,
    gold: 5, hands: 4, maxHands: 4, discards: 3, maxDiscards: 3,
    boss: null, bossAbility: null,
    jokers: [], maxJokers: 5,
    grid: [], path: [], deck: [], discardPile: [],
    handLevels: {},
    deckType: 'red', saved: false,
    frostCorners: [], amberFrozen: [],
    targetMultiplier: 1,
    scoringAnimation: false,
    _handsPlayedThisRound: 0, _discardsUsedThisRound: 0,
    _handsPlayedThisRun: 0, _cardsPlayedThisRun: 0,
    _discardsUsedThisRun: 0, _planetsUsedThisRun: 0,
    _blindsDefeated: 0, _totalDiscardsThisRun: 0,
    _invisibleRounds: 0, _jokerBuffs: {},
    _handTypeCounts: {}, _mostPlayedHand: null,
    brokenCards: [], _glassBroken: []
  },

  init: function() {
    const saved = localStorage.getItem('pokermancer_save');
    if (saved) {
      try {
        this.S = JSON.parse(saved);
        UI.showScreen('mainMenu');
        document.getElementById('resumeBtn').style.display = '';
        return;
      } catch(e) {}
    }
    UI.showScreen('mainMenu');
  },

  saveGame: function() {
    try {
      localStorage.setItem('pokermancer_save', JSON.stringify(this.S));
    } catch(e) {}
  },

  resumeGame: function() {
    const saved = localStorage.getItem('pokermancer_save');
    if (saved) {
      try {
        this.S = JSON.parse(saved);
        UI.showScreen('battle');
        UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
        UI.updateHUD(this.S);
        UI.updateEval(null);
      } catch(e) { this.startNewRun(); }
    } else {
      this.startNewRun();
    }
  },

  clearSave: function() {
    localStorage.removeItem('pokermancer_save');
    document.getElementById('resumeBtn').style.display = 'none';
  },

  startNewRun: function(showDeckSelect) {
    this.clearSave();
    this.S = {
      ante: 1, blindType: 'small', blindIdx: 0,
      score: 0, target: 300,
      gold: 5, hands: 4, maxHands: 4, discards: 3, maxDiscards: 3,
      boss: null, bossAbility: null,
      jokers: [], maxJokers: 5,
      grid: [], path: [], deck: [], discardPile: [],
      handLevels: {},
      deckType: 'red', saved: false,
      frostCorners: [], amberFrozen: [],
      targetMultiplier: 1,
      scoringAnimation: false,
      _handsPlayedThisRound: 0, _discardsUsedThisRound: 0,
      _handsPlayedThisRun: 0, _cardsPlayedThisRun: 0,
      _discardsUsedThisRun: 0, _planetsUsedThisRun: 0,
      _blindsDefeated: 0, _totalDiscardsThisRun: 0,
      _invisibleRounds: 0, _jokerBuffs: {},
      _handTypeCounts: {}, _mostPlayedHand: null,
      brokenCards: [], _glassBroken: [],
      consumables: [], maxConsumables: 2,
      vouchers: [],
      _interestCap: 5, _pendingInvestment: 0, _pendingTagEditions: [],
      _lastConsumableId: null, _skipTag: null,
      _freeShop: false, _freeRerolls: false, _forceVoucher: false,
      _forceRarity: null, _rerollBoss: false, _juggleHandSize: 0,
      _doubleTag: false, _pendingPack: null, _blindsSkipped: 0, blind_on_deck: 'Small', blind_states: {Small: 'Select', Big: 'Select', Boss: 'Hidden'}, _currentBossBlind: null, _bossJustDefeated: false
    };
    this._applyMarbleBonus();
    this._resetBlindStates();
    this._generateTags();
    this._updateConsumableBar();
    if (showDeckSelect) {
      this.showSetupScreen();
    } else {
      // Show blind select first (like Balatro), player chooses to play or skip
      this.showBlindSelect();
    }
  },

  _applyMarbleBonus: function() {
    if (this.S.jokers) {
      this.S.jokers.forEach(j => {
        const jd = JOKERS.find(x => x.id === j.id);
        if (jd && jd.type === 'marble') this.S.maxJokers = 5 + (jd.val || 1);
      });
    }
  },

  startBlind: function() {
    this.S.score = 0;
    this.S.path = [];
    // Apply Juggle Tag: +3 hand size for one round
    const juggleBonus = this.S._juggleHandSize || 0;
    this.S._juggleHandSize = 0;
    this.S.hands = this.S.maxHands + juggleBonus;
    this.S.discards = this.S.maxDiscards;
    this.S.discardPile = [];
    this.S._handsPlayedThisRound = 0;
    this.S._discardsUsedThisRound = 0;
    this.S.brokenCards = [];
    this.S._glassBroken = [];

    if (this.S.blindType === 'boss') {
      const hasNegate = this.S.jokers && this.S.jokers.some(j => {
        const jd = JOKERS.find(x => x.id === j.id);
        return jd && (jd.type === 'chicot' || jd.type === 'luchador');
      });
      if (!hasNegate) this.assignBoss();
      else this._assignBossNoAbility();
    } else {
      this.S.boss = null;
      this.S.bossAbility = null;
      this.S.targetMultiplier = 1;
    }

    this.S.target = this.calcTarget();
    GridManager.generateGrid(this.S);

    UI.showScreen('battle');
    UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
    UI.updateHUD(this.S);
    UI.updateEval(null);
  },

  _assignBossNoAbility: function() {
    const tier = Math.min(Math.ceil(this.S.ante / 2), 4);
    const pool = BOSS_TIERS[tier] || BOSS_TIERS[1];
    const bossKey = pool[Math.floor(Math.random() * pool.length)];
    const boss = BOSSES[bossKey];
    this.S.boss = boss;
    this.S.bossAbility = null;
    this.S.targetMultiplier = 1;
    this.S.amberFrozen = [];
  },

  calcTarget: function() {
    const baseTargets = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
    const ante = this.S.ante;
    let baseAmount;
    if (ante < 1) baseAmount = 100;
    else if (ante <= 8) baseAmount = baseTargets[ante - 1];
    else {
      const k = 0.75, a = 50000, b = 1.6, c = ante - 8, d = 1 + 0.2 * (ante - 8);
      baseAmount = Math.floor(a * Math.pow(b + Math.pow(k * c, d), c));
      baseAmount = baseAmount - baseAmount % Math.pow(10, Math.floor(Math.log10(baseAmount) - 1));
    }
    const blindData = BLIND_TYPES[this.S.blindType.toUpperCase()];
    const blindMult = blindData ? blindData.mult : 1;
    return Math.floor(baseAmount * blindMult * (this.S.targetMultiplier || 1));
  },

  calcTargetFor: function(blindType) {
    const baseTargets = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
    const ante = this.S.ante;
    let baseAmount;
    if (ante < 1) baseAmount = 100;
    else if (ante <= 8) baseAmount = baseTargets[ante - 1];
    else {
      const k = 0.75, a = 50000, b = 1.6, c2 = ante - 8, d = 1 + 0.2 * (ante - 8);
      baseAmount = Math.floor(a * Math.pow(b + Math.pow(k * c2, d), c2));
      baseAmount -= baseAmount % Math.pow(10, Math.floor(Math.log10(baseAmount) - 1));
    }
    const blindMult = blindType === 'small' ? 1 : blindType === 'big' ? 1.5 : blindType === 'boss' ? 2 : 1;
    return Math.floor(baseAmount * blindMult * (blindType === 'boss' ? (this.S.targetMultiplier || 1) : 1));
  },

  assignBoss: function() {
    const tier = Math.min(Math.ceil(this.S.ante / 2), 4);
    const pool = BOSS_TIERS[tier] || BOSS_TIERS[1];
    const bossKey = pool[Math.floor(Math.random() * pool.length)];
    const boss = BOSSES[bossKey];
    this.S.boss = boss;
    this.S.bossAbility = boss.id;
    this.S.targetMultiplier = boss.id === 'wall' ? 4 : 1;

    if (boss.id === 'amber') {
      this.S.amberFrozen = [
        { row: Math.floor(Math.random()*4), col: Math.floor(Math.random()*4) },
        { row: Math.floor(Math.random()*4), col: Math.floor(Math.random()*4) }
      ];
    } else {
      this.S.amberFrozen = [];
    }
  },

  selectCard: function(row, col) {
    if (this.S.scoringAnimation) return;
    const card = GridManager.getCell(this.S, row, col);
    if (!card || card.frozen) return;

    const idx = this.S.path.findIndex(p => p.row === row && p.col === col);
    if (idx !== -1) {
      this.S.path.splice(idx, 1);
    } else {
      if (this.S.path.length >= 5) {
        UI.snack('Maximum 5 cards!');
        return;
      }
      if (this.S.path.length > 0 && !GridManager.isValidPathStep(this.S.path, row, col, this.S)) {
        UI.snack('Cards must be adjacent!');
        return;
      }
      this.S.path.push({ row, col });
    }

    UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
    const pathCards = this.S.path.map(p => GridManager.getCell(this.S, p.row, p.col)).filter(c => c);
    if (pathCards.length >= 1) {
      const ev = PokerEvaluator.evalHand(pathCards, this.S);
      UI.updateEval(ev);
    } else {
      UI.updateEval(null);
    }
  },

  clearSel: function() {
    if (this.S.scoringAnimation) return;
    this.S.path = [];
    UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
    UI.updateEval(null);
  },

  discardSel: function() {
    if (this.S.scoringAnimation) return;
    if (this.S.path.length === 0) { UI.snack('Select cards to discard!'); return; }
    if (this.S.discards <= 0) { UI.snack('No discards left!'); return; }

    const pathCards = this.S.path.map(p => GridManager.getCell(this.S, p.row, p.col)).filter(c => c);
    let tarotCreated = 0;
    pathCards.forEach(c => {
      if (c.seal === 'purple') tarotCreated++;
      if (this.S.discardPile) this.S.discardPile.push(c);
    });

    const discardPositions = [...this.S.path];
    this.S.path = [];
    this.S.scoringAnimation = true;

    // Animate discard: shake → fly → remove + cascade + refill
    UI.animateDiscardCells(discardPositions, () => {
      GridManager.removeCards(this.S, discardPositions);

      // Purple Seal Tarot creation
      if (tarotCreated > 0 && this.S.consumables) {
        for (let i = 0; i < tarotCreated; i++) {
          const randomTarot = TAROTS[Math.floor(Math.random() * TAROTS.length)];
          if (this.S.consumables.length < (this.S.maxConsumables || 2)) {
            this.S.consumables.push({ ...randomTarot });
            UI.snack('Purple Seal created: ' + randomTarot.nm);
          }
        }
      }

      this.S.discards--;
      this.S._discardsUsedThisRound++;
      this.S._discardsUsedThisRun++;
      this.S._totalDiscardsThisRun++;
      this.saveGame();

      this.S.jokers.forEach(j => {
        const jd = JOKERS.find(x => x.id === j.id);
        if (jd && jd.type === 'burnt_joker') {
          const ev = PokerEvaluator.evalHand(pathCards, this.S);
          if (ev && ev.rankKey) PokerEvaluator.levelUpHand(this.S, ev.rankKey);
        }
      });

      // Render with cascade animation
      const animData = { sliding: [], newCards: [] };
      UI.renderGridWithCascade(this.S, animData, (r, c) => this.selectCard(r, c));

      this.S.scoringAnimation = false;
      UI.updateHUD(this.S);
      UI.updateEval(null);
      UI.snack('Discarded ' + pathCards.length + ' card(s)');
    });
  },

  placeHand: function() {
    if (this.S.scoringAnimation) return;
    if (this.S.hands <= 0) { UI.snack('No hands left!'); return; }
    if (this.S.path.length < 1) { UI.snack('Select at least 1 card!'); return; }

    this.S.scoringAnimation = true;
    this.S.hands--;
    this.S._handsPlayedThisRound++;
    this.S._handsPlayedThisRun++;

    let pathCards = this.S.path.map(p => GridManager.getCell(this.S, p.row, p.col)).filter(c => c);

    // Splash Joker: all grid cards count
    const hasSplash = this.S.jokers && this.S.jokers.some(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      return jd && jd.type === 'splash';
    });
    if (hasSplash) {
      const allGrid = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (this.S.grid[r] && this.S.grid[r][c]) allGrid.push(this.S.grid[r][c]);
      const pathIds = new Set(pathCards.map(c => c.dn + c.suit));
      allGrid.forEach(c => {
        if (!pathIds.has(c.dn + c.suit)) {
          pathCards.push(c);
          pathIds.add(c.dn + c.suit);
        }
      });
    }

    this.S._cardsPlayedThisRun += pathCards.length;
    this.S._glassBroken = [];
    this.S._luckyTriggered = 0;

    const ev = PokerEvaluator.evalHand(pathCards, this.S);
    this.S._lastHandKey = ev.rankKey;
    this.S.score += ev.finalScore;
    this.saveGame();

    // On-card scoring feedback
    UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
    const gridEl = UI.$('grid');
    if (gridEl) {
      const cards = gridEl.querySelectorAll('.cell');
      let delay = 0;
      pathCards.forEach((pos) => {
        const idx = pos.row * 4 + pos.col;
        const cell = cards[idx];
        if (!cell) return;
        setTimeout(() => {
          cell.classList.add('card-scoring');
          const floatEl = document.createElement('div');
          floatEl.className = 'card-score-float';
          floatEl.textContent = '+' + ev.finalScore.toLocaleString();
          cell.appendChild(floatEl);
        }, delay);
        delay += 60;
      });
    }

    // Track hand type for Obelisk joker
    this.S._handTypeCounts[ev.rankKey] = (this.S._handTypeCounts[ev.rankKey] || 0) + 1;
    this.S._mostPlayedHand = Object.keys(this.S._handTypeCounts).reduce((a, b) =>
      this.S._handTypeCounts[a] > this.S._handTypeCounts[b] ? a : b
    );

    // Handle broken glass cards
    const brokenSet = new Set(this.S._glassBroken.map(c => c.dn + c.suit + c.rank));

    const removePath = this.S.path.map(p => ({ row: p.row, col: p.col }));
    this.S.path = [];

    if (hasSplash) {
      const allPos = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (this.S.grid[r] && this.S.grid[r][c]) allPos.push({ row: r, col: c });
      allPos.forEach(pos => {
        const card = this.S.grid[pos.row] && this.S.grid[pos.row][pos.col];
        if (card) {
          if (brokenSet.has(card.dn + card.suit + card.rank)) {
            this.S.brokenCards.push(card);
            UI.snack('Glass card shattered!');
          } else if (this.S.discardPile) {
            this.S.discardPile.push(card);
          }
          this.S.grid[pos.row][pos.col] = null;
        }
      });
      GridManager.applyGravity(this.S);
      UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
    } else {
      pathCards.forEach(c => {
        if (brokenSet.has(c.dn + c.suit + c.rank)) {
          this.S.brokenCards.push(c);
          UI.snack('Glass card shattered!');
        } else if (this.S.discardPile) {
          this.S.discardPile.push(c);
        }
      });
      // Animate play fly-off then cascade
      const gridEl2 = UI.$('grid');
      if (gridEl2) {
        setTimeout(() => {
          removePath.forEach(pos => {
            const cell = gridEl2.children[pos.row * 4 + pos.col];
            if (cell) {
              cell.classList.remove('card-scoring');
              cell.classList.add('card-play-fly');
            }
          });
          setTimeout(() => {
            GridManager.removeCards(this.S, removePath);
            UI.renderGridWithCascade(this.S, { sliding: [], newCards: [] }, (r, c) => this.selectCard(r, c));
          }, 350);
        }, pathCards.length * 60 + 300);
      } else {
        GridManager.removeCards(this.S, removePath);
        UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
      }
    }
    UI.updateHUD(this.S);
    UI.updateEval(null);

    // Gold Seal: +$3 per played card with Gold Seal
    if (this.S._goldFromSeals > 0) {
      this.S.gold += this.S._goldFromSeals;
      this.S._goldFromSeals = 0;
    }

    // Gold per hand joker
    this.S.jokers.forEach(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      if (jd && jd.type === 'gold_per_hand') this.S.gold += jd.val;
      if (jd && jd.type === 'rocket') this.S.gold += jd.val;
    });

    // Lucky card rewards
    if (this.S._luckyTriggered > 0) {
      UI.snack('Lucky card triggered x' + this.S._luckyTriggered + '!');
      this.S._luckyTriggered = 0;
    }
    if (this.S._luckyGold > 0) {
      this.S.gold += this.S._luckyGold;
      UI.snack('Lucky card: +$' + this.S._luckyGold + '!');
      this.S._luckyGold = 0;
    }

    // Space Joker: 1 in 4 level up hand
    this.S.jokers.forEach(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      if (jd && jd.type === 'space_joker' && Math.random() < 0.25) {
        PokerEvaluator.levelUpHand(this.S, ev.rankKey);
        UI.snack('Space Joker leveled up ' + ev.rank.lb + '!');
      }
    });

    UI.showScoreOverlay(ev, () => {
      this.S.scoringAnimation = false;
      if (this.S.score >= this.S.target) {
        this.onBlindComplete();
      } else if (this.S.hands <= 0) {
        this.gameOver();
      } else {
        UI.snack('Score: ' + ev.finalScore.toLocaleString());
      }
    });
  },

  onBlindComplete: function() {
    const deckKey = this.S.blind_on_deck || {small:'Small', big:'Big', boss:'Boss'}[this.S.blindType];

    // Mark current blind as Defeated
    if (this.S.blind_states && deckKey) {
      this.S.blind_states[deckKey] = 'Defeated';
    }

    // Interest system
    this._applyInterest();

    // Tag rewards from skips
    this._applyTagRewards();

    this._applyEndRoundJokers();

    if (deckKey === 'Boss') {
      // Boss defeated -> go to shop, then new ante
      this.S.gold += 5; // Boss reward
      this.S._blindsDefeated++;
      UI.snack('Boss defeated!');
      setTimeout(() => {
        this.S.ante++;
        this._checkInvisibleJoker();
        this._resetBlindStates();
        this.S._bossJustDefeated = true;
        this._goToShop();
      }, 500);
    } else {
      // Small/Big defeated -> reward + go to shop (Balatro: shop after EVERY blind)
      const reward = this.S.blindType === 'small' ? 3 : 4;
      this.S.gold += reward + this.S.hands;
      this.S._blindsDefeated++;

      // Advance to next blind state (for after-shop navigation)
      const nextDeck = this._getNextBlindDeck(deckKey);
      this.S.blind_on_deck = nextDeck;
      this.S.blindIdx = {Small:0, Big:1, Boss:2}[nextDeck] || 0;
      this.S.blindType = this._getBlindTypeForDeck(nextDeck);

      if (nextDeck && this.S.blind_states) {
        this.S.blind_states[nextDeck] = 'Select';
      }

      UI.snack((deckKey === 'Small' ? 'Small' : 'Big') + ' Blind cleared!');
      this._generateTags();
      setTimeout(() => {
        this._goToShop();
      }, 500);
    }
  },

  _applyEndRoundJokers: function() {
    if (!this.S.jokers) return;
    this.S.jokers.forEach(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      if (!jd) return;
      if (jd.type === 'egg') this.S.gold += (jd.val || 3);
      if (jd.type === 'gift_card') {
        this.S.jokers.forEach(j2 => {
          this.S._jokerBuffs[j2.id] = (this.S._jokerBuffs[j2.id] || 0) + 1;
        });
      }
      if (jd.type === 'cartomancer') {
        const planetId = PLANET_IDS[Math.floor(Math.random() * PLANET_IDS.length)];
        const planet = PLANETS[planetId];
        if (planet) PokerEvaluator.levelUpHand(this.S, planet.hand);
      }
    });

    // End-of-round: Gold cards and seals in grid/deck
    const allCards = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (this.S.grid[r] && this.S.grid[r][c]) allCards.push(this.S.grid[r][c]);
    if (this.S.deck) this.S.deck.forEach(c => allCards.push(c));

    allCards.forEach(c => {
      if (c.enhancement === 'gold') this.S.gold += 3;
      // Gold Seal triggers when played (in evaluator), not at end of round
      if (c.seal === 'blue') {
        const planetId = PLANET_IDS[Math.floor(Math.random() * PLANET_IDS.length)];
        const planet = PLANETS[planetId];
        if (planet) PokerEvaluator.levelUpHand(this.S, planet.hand);
      }
    });
  },

  _checkInvisibleJoker: function() {
    this.S.jokers.forEach(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      if (jd && jd.type === 'invisible_joker') {
        this.S._invisibleRounds++;
        if (this.S._invisibleRounds >= (jd.rounds || 2)) {
          this.S._invisibleRounds = 0;
          const others = this.S.jokers.filter(j2 => j2.id !== 'invisible');
          if (others.length > 0) {
            const copy = others[Math.floor(Math.random() * others.length)];
            this.S.jokers.push({ id: copy.id });
            UI.snack('Invisible Joker created a copy!');
          }
        }
      }
    });
  },

  _goToShop: function() {
    this.S._rerollsThisShop = 0;
    ShopManager.generate(this.S);
    UI.showScreen('shop');
    UI.renderShop(this.S);
    UI.updateHUD(this.S);

    // Open pending pack from skip blind tag
    if (this.S._pendingPack) {
      const packTag = this.S._pendingPack;
      this.S._pendingPack = null;
      setTimeout(() => {
        const tagToPack = { standard:'standard', charm:'arcana', meteor:'celestial', buffoon:'buffoon', ethereal:'spectral' };
        const packType = tagToPack[packTag] || packTag;
        const isEthereal = packTag === 'ethereal';
        this.openPack({
          id: packTag,
          packType: packType,
          size: isEthereal ? 'normal' : 'mega'
        });
      }, 300);
    }
  },

  nextRound: function() {
    // Coming from shop after boss defeat — start a new ante with blind select
    this._resetBlindStates();

    this.S.score = 0;
    this.S.path = [];
    this.S.hands = this.S.maxHands;
    this.S.discards = this.S.maxDiscards;
    this.S.discardPile = [];
    this.S._handsPlayedThisRound = 0;
    this.S._discardsUsedThisRound = 0;
    this.S.brokenCards = [];
    this.S._glassBroken = [];
    this.S.boss = null;
    this.S.bossAbility = null;
    this.S.targetMultiplier = 1;

    // Show blind select so player can choose play/skip for the first blind of the new ante
    this.showBlindSelect();
  },

  gameOver: function() {
    this.clearSave();
    UI.showScreen('gameOver');
    const el = id => document.getElementById(id);
    if (el('goScore')) el('goScore').textContent = this.S.score.toLocaleString();
    if (el('goFloor')) el('goFloor').textContent = 'Ante ' + this.S.ante;
    if (el('goMsg')) el('goMsg').textContent = 'You reached Ante ' + this.S.ante + ' with ' + this.S.score.toLocaleString() + ' points!';
  },

  showSetupScreen: function() {
    const cont = document.getElementById('setupContent');
    if (!cont) return;
    cont.innerHTML = '';
    DECK_TYPES.forEach(d => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.innerHTML = '<div class="deck-icon">' + d.icon + '</div><div class="deck-name">' + d.nm + '</div><div class="deck-desc">' + d.desc + '</div>';
      card.onclick = function() { G.selectDeck(d); };
      cont.appendChild(card);
    });
    UI.showScreen('setup');
  },

  selectDeck: function(deck) {
    this.S.deckType = deck.id;
    this.S.maxHands = 4 + (deck.bonus.hands || 0);
    this.S.hands = this.S.maxHands;
    this.S.maxDiscards = 3 + (deck.bonus.discards || 0);
    this.S.discards = this.S.maxDiscards;
    this.S.gold = 5 + (deck.bonus.gold || 0);
    this.S.blindIdx = 0;
    this.S.blindType = 'small';
    this.startBlind();
  },

  selectBlind: function(blindType) {
    this.S.blindType = blindType;
    this.startBlind();
  },

  buyItem: function(id) {
    const item = this.S.shopItems && this.S.shopItems.find(x => x.id === id);
    const isPlanet = item && item.type === 'planet';
    const isEnhCard = item && item.type === 'enhanced_card';
    const isPack = item && item.type === 'pack';
    const ok = ShopManager.buyItem(this.S, id);
    if (ok) {
      if (isPlanet) this.S._planetsUsedThisRun++;
      if (isEnhCard) this._addEnhancedCardToDeck(id);
      if (!isPack) {
        this.saveGame();
        UI.renderShop(this.S);
        UI.updateHUD(this.S);
      } else {
        this.saveGame();
        UI.updateHUD(this.S);
      }
    }
    return ok;
  },

  _addEnhancedCardToDeck: function(shopId) {
    const item = this.S.shopItems.find(x => x.id === shopId);
    if (!item) return;
    const card = GridManager.createEnhancedCard(item.enhancement, item.edition, item.seal);
    if (this.S.deck) this.S.deck.push(card);
    else this.S.deck = [card];
    UI.snack('Added ' + card.dfn + ' to deck!');
  },

  sellJokerAction: function(id) {
    const price = ShopManager.sellJoker(this.S, id);
    if (price > 0) { UI.snack('Sold for $' + price); UI.updateHUD(this.S); }
  },

  _currentJokerInfoId: null,

  showJokerInfo: function(id) {
    const j = this.S.jokers.find(x => x.id === id);
    const jd = JOKERS.find(x => x.id === id);
    if (!j || !jd) return;

    const overlay = document.getElementById('jokerInfoOverlay');
    if (!overlay) return;

    this._currentJokerInfoId = id;

    const rarityStars = jd.r === 'l' ? '★★★★' : jd.r === 'r' ? '★★★' : jd.r === 'u' ? '★★' : '★';
    const rarityNm = jd.r === 'l' ? 'Legendary' : jd.r === 'r' ? 'Rare' : jd.r === 'u' ? 'Uncommon' : 'Common';
    const rarityColors = { l:'#ff4444', r:'#ff8800', u:'#4488ff', c:'#888' };
    const rarityColor = rarityColors[jd.r] || '#888';

    document.getElementById('jokerInfoName').textContent = jd.nm;
    document.getElementById('jokerInfoDesc').textContent = jd.ef;
    document.getElementById('jokerInfoRarity').innerHTML = '<span style="color:' + rarityColor + '">' + rarityStars + ' ' + rarityNm + '</span>';

    // Price
    const sellPrice = Math.floor(jd.cost / 2);
    document.getElementById('jokerSellBtn').textContent = 'Sell ($' + sellPrice + ')';

    // Icon/Sprite
    const iconDiv = document.getElementById('jokerInfoIcon');
    iconDiv.innerHTML = '<div style="font-size:48px;text-align:center">🃏</div>';

    // Edition badge
    const cardEl = document.getElementById('jokerInfoCard');
    if (j.edition) {
      const eData = EDITIONS[j.edition];
      if (eData) {
        cardEl.style.border = '2px solid ' + eData.c;
        cardEl.style.boxShadow = '0 0 12px ' + eData.c + '66';
      }
    } else {
      cardEl.style.border = '2px solid ' + rarityColor;
      cardEl.style.boxShadow = '0 0 8px ' + rarityColor + '44';
    }

    cardEl.style.background = jd.r === 'l' ? 'linear-gradient(180deg,#3a1a2a,#1a0a1a)'
      : jd.r === 'r' ? 'linear-gradient(180deg,#3a2a1a,#1a1a0a)'
      : jd.r === 'u' ? 'linear-gradient(180deg,#1a2a3a,#0a1a2a)'
      : 'linear-gradient(180deg,#2a2a2a,#1a1a1a)';
    cardEl.style.color = rarityColor;

    overlay.style.display = 'flex';
  },

  hideJokerInfo: function() {
    const overlay = document.getElementById('jokerInfoOverlay');
    if (overlay) overlay.style.display = 'none';
    this._currentJokerInfoId = null;
  },

  sellJokerFromInfo: function() {
    const id = this._currentJokerInfoId;
    if (!id) return;
    this.sellJokerAction(id);
    this.hideJokerInfo();
  },

  rerollShopAction: function() {
    if (ShopManager.rerollShop(this.S)) {
      UI.renderShop(this.S);
      UI.updateHUD(this.S);
      UI.snack('Shop rerolled!');
    } else {
      UI.snack('Not enough gold!');
    }
  },

  endShop: function() {
    if (this.S._bossJustDefeated) {
      this.S._bossJustDefeated = false;
      this.nextRound();
    } else {
      // Mid-ante: go to next blind select (already advanced in onBlindComplete)
      this.showBlindSelect();
    }
  },

  // ---- INTEREST SYSTEM ----
  _applyInterest: function() {
    const interest = Math.min(Math.floor(this.S.gold / 5), this.S._interestCap || 5);
    this.S.gold += interest;
    if (interest > 0) UI.snack('Interest earned: $' + interest);
    return interest;
  },

  // ---- CONSUMABLE SYSTEM ----
  useConsumable: function(idx) {
    if (this.S.scoringAnimation) return;
    const c = this.S.consumables[idx];
    if (!c) return;

    // Find tarot data
    const tarot = TAROTS.find(t => t.id === c.id);
    const spectral = SPECTRALS.find(s => s.id === c.id);
    const planet = PLANETS[c.id];

    if (planet) {
      // Use planet: level up the hand it maps to
      const target = planet.hand || c.hand;
      if (target) {
        PokerEvaluator.levelUpHand(this.S, target);
        this.S._lastConsumableId = c.id;
        this.S.consumables.splice(idx, 1);
        UI.snack('Used ' + planet.nm + '!');
        this._updateConsumableBar();
        this.saveGame();
      }
      return;
    }

    if (tarot) {
      this.S._lastConsumableId = tarot.id;
      switch (tarot.effect) {
        case 'enhance':
          this._startCardSelect('enhance', tarot, tarot.count);
          return;
        case 'suit_change':
          this._startCardSelect('suit_change', tarot, tarot.count);
          return;
        case 'destroy':
          this._startCardSelect('destroy', tarot, tarot.count);
          return;
        case 'strength':
          this._startCardSelect('strength', tarot, tarot.count);
          return;
        case 'hanged_man':
          this._startCardSelect('destroy', tarot, tarot.count);
          return;
        case 'death':
          this._startCardSelect('death', tarot, 2);
          return;
        case 'double_money': {
          const bonus = Math.min(this.S.gold, tarot.max || 20);
          this.S.gold += bonus;
          this.S.consumables.splice(idx, 1);
          UI.snack('+' + bonus + ' gold!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'wheel':
          if (this.S.jokers && this.S.jokers.length > 0 && Math.random() < 0.25) {
            const editions = ['foil', 'holographic', 'polychrome'];
            const ed = editions[Math.floor(Math.random() * editions.length)];
            const rj = this.S.jokers[Math.floor(Math.random() * this.S.jokers.length)];
            if (rj) rj.edition = ed;
            UI.snack('Wheel of Fortune: ' + ed + '!');
          }
          this.S.consumables.splice(idx, 1);
          this._updateConsumableBar();
          this.saveGame();
          break;
        case 'temperance': {
          let totalSell = 0;
          this.S.jokers.forEach(j => {
            const jd = JOKERS.find(x => x.id === j.id);
            if (jd) totalSell += Math.floor(jd.cost / 2);
          });
          const bonus = Math.min(totalSell, tarot.max || 50);
          this.S.gold += bonus;
          this.S.consumables.splice(idx, 1);
          UI.snack('+' + bonus + ' gold!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'create_joker': {
          if (this.S.jokers.length < this.S.maxJokers) {
            const pool = JOKERS.filter(j => j.r !== 'l');
            const picked = pool[Math.floor(Math.random() * pool.length)];
            this.S.jokers.push({ id: picked.id });
            this.S.consumables.splice(idx, 1);
            UI.snack('Created ' + picked.nm + '!');
            this._updateConsumableBar();
            this._updateJokerBar();
            this.saveGame();
          } else UI.snack('No Joker slots!');
          break;
        }
        case 'create_tarots':
        case 'create_planets': {
          const target = tarot.effect === 'create_planets' ? PLANET_IDS : [];
          let created = 0;
          for (let i = 0; i < tarot.count; i++) {
            if (tarot.effect === 'create_tarots') {
              if (this.S.consumables.length < this.S.maxConsumables) {
                const t = TAROTS[Math.floor(Math.random() * TAROTS.length)];
                this.S.consumables.push({ id: t.id, type: 'tarot' });
                created++;
              }
            } else {
              if (this.S.consumables.length < this.S.maxConsumables) {
                const pid = PLANET_IDS[Math.floor(Math.random() * PLANET_IDS.length)];
                this.S.consumables.push({ id: pid, type: 'planet' });
                created++;
              }
            }
          }
          this.S.consumables.splice(idx, 1);
          UI.snack('Created ' + created + ' card(s)!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'last_consumable': {
          const last = this.S._lastConsumableUsed;
          if (last) {
            if (this.S.consumables.length < this.S.maxConsumables) {
              this.S.consumables.push({ id: last });
              UI.snack('Created ' + last + '!');
              this._updateConsumableBar();
              this.saveGame();
            } else UI.snack('Consumable slots full!');
          }
          break;
        }
      }
    }

    if (spectral) {
      this.S._lastConsumableUsed = spectral.id;
      switch (spectral.effect) {
        case 'destroy_add':
          this._startCardSelect('spectral_' + spectral.id, spectral);
          return;
        case 'add_seal':
          this._startCardSelect('add_seal', spectral, spectral.count);
          return;
        case 'add_edition':
          this._startCardSelect('add_edition', spectral);
          return;
        case 'cryptid':
          this._startCardSelect('cryptid', spectral, spectral.count);
          return;
        case 'wraith': {
          if (this.S.jokers.length < this.S.maxJokers) {
            const rare = JOKERS.filter(j => j.r === 'r');
            const picked = rare[Math.floor(Math.random() * rare.length)];
            this.S.jokers.push({ id: picked.id });
            this._updateJokerBar();
          }
          this.S.gold = 0;
          this.S.consumables.splice(idx, 1);
          UI.snack('Wraith created a rare Joker!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'sigil': {
          const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
          const suit = suits[Math.floor(Math.random() * suits.length)];
          this._forEachGridCard(c => { c.suit = suit; });
          this.S.consumables.splice(idx, 1);
          UI.snack('All cards converted to ' + suit + '!');
          this._updateConsumableBar();
          this.renderGrid();
          this.saveGame();
          break;
        }
        case 'ouija': {
          const ranks = [2,3,4,5,6,7,8,9,10,11,12,13];
          const rank = ranks[Math.floor(Math.random() * ranks.length)];
          this._forEachGridCard(c => { c.rank = rank; });
          this.S.maxHands = Math.max(1, (this.S.maxHands || 4) - 1);
          this.S.consumables.splice(idx, 1);
          UI.snack('All cards set to rank ' + rank + '! -1 hand size');
          this._updateConsumableBar();
          this.renderGrid();
          this.saveGame();
          break;
        }
        case 'ectoplasm': {
          this.S.maxHands = Math.max(1, (this.S.maxHands || 4) - 1);
          if (this.S.jokers.length > 0) {
            const rj = this.S.jokers[Math.floor(Math.random() * this.S.jokers.length)];
            rj.edition = 'negative';
          }
          this.S.consumables.splice(idx, 1);
          UI.snack('Negative edition applied!');
          this._updateConsumableBar();
          this._updateJokerBar();
          this.saveGame();
          break;
        }
        case 'imolate': {
          let destroyed = 0;
          for (let r = 0; r < 4 && destroyed < 5; r++) {
            for (let c = 0; c < 4 && destroyed < 5; c++) {
              if (this.S.grid[r] && this.S.grid[r][c]) {
                if (this.S.discardPile) this.S.discardPile.push(this.S.grid[r][c]);
                this.S.grid[r][c] = null;
                destroyed++;
              }
            }
          }
          GridManager.applyGravity(this.S);
          this.S.gold += 20;
          this.S.consumables.splice(idx, 1);
          UI.snack('Destroyed ' + destroyed + ' cards, +$20!');
          this._updateConsumableBar();
          this.renderGrid();
          this.saveGame();
          break;
        }
        case 'ankh': {
          if (this.S.jokers.length > 0) {
            const pick = this.S.jokers[Math.floor(Math.random() * this.S.jokers.length)];
            const copy = { ...pick };
            this.S.jokers = [copy];
            this._updateJokerBar();
          }
          this.S.consumables.splice(idx, 1);
          UI.snack('Copied one Joker, destroyed rest!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'hex': {
          const editions = ['foil', 'holographic', 'polychrome'];
          const ed = editions[Math.floor(Math.random() * editions.length)];
          if (this.S.jokers.length > 0) {
            const rj = this.S.jokers[Math.floor(Math.random() * this.S.jokers.length)];
            rj.edition = ed;
          }
          this.S.consumables.splice(idx, 1);
          UI.snack(ed + ' applied to random Joker!');
          this._updateConsumableBar();
          this._updateJokerBar();
          this.saveGame();
          break;
        }
        case 'soul': {
          if (this.S.jokers.length < this.S.maxJokers) {
            const leg = JOKERS.filter(j => j.r === 'l');
            if (leg.length > 0) {
              const picked = leg[Math.floor(Math.random() * leg.length)];
              this.S.jokers.push({ id: picked.id });
              UI.snack('The Soul created ' + picked.nm + '!');
              this._updateJokerBar();
            }
          }
          this.S.consumables.splice(idx, 1);
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
        case 'black_hole': {
          Object.keys(HAND_RANKS).forEach(h => {
            PokerEvaluator.levelUpHand(this.S, h);
          });
          this.S.consumables.splice(idx, 1);
          UI.snack('All hands leveled up!');
          this._updateConsumableBar();
          this.saveGame();
          break;
        }
      }
      return;
    }

    // Remove from consumables after use (if not already removed)
    const ci = this.S.consumables.findIndex(x => x.id === c.id);
    if (ci >= 0) {
      this.S.consumables.splice(ci, 1);
      this._updateConsumableBar();
      this.saveGame();
    }
  },

  _startCardSelect: function(mode, cardData, maxCount) {
    this._cardSelectMode = mode;
    this._cardSelectData = cardData;
    this._cardSelectMax = maxCount || 1;
    this._cardSelectTargets = [];
    UI.showCardSelectOverlay(mode, maxCount);
  },

  selectCardForConsumable: function(row, col) {
    if (this.S.scoringAnimation) return;
    const card = GridManager.getCell(this.S, row, col);
    if (!card) return;

    const idx = this._cardSelectTargets.findIndex(p => p.row === row && p.col === col);
    if (idx !== -1) {
      this._cardSelectTargets.splice(idx, 1);
    } else {
      if (this._cardSelectTargets.length >= this._cardSelectMax) {
        UI.snack('Max ' + this._cardSelectMax + ' cards!');
        return;
      }
      this._cardSelectTargets.push({ row, col });
    }
    UI.updateCardSelectCount(this._cardSelectTargets.length, this._cardSelectMax);
    UI.renderGridForSelect(this.S, (r, c) => this.selectCardForConsumable(r, c), this._cardSelectTargets);
  },

  confirmCardSelect: function() {
    const mode = this._cardSelectMode;
    const data = this._cardSelectData;
    const targets = this._cardSelectTargets;

    if (targets.length === 0) { UI.snack('Select cards first!'); return; }

    const targetCards = targets.map(p => GridManager.getCell(this.S, p.row, p.col)).filter(Boolean);

    switch (mode) {
      case 'enhance':
        targetCards.forEach(c => { c.enhancement = data.enh; });
        break;
      case 'suit_change':
        targetCards.forEach(c => { c.suit = data.suit; });
        break;
      case 'destroy':
      case 'hanged_man':
        targetCards.forEach(c => {
          GridManager.removeCards(this.S, targets.map(p => p));
          if (this.S.discardPile) this.S.discardPile.push(c);
        });
        break;
      case 'strength':
        targetCards.forEach(c => { c.rank = Math.min(c.rank + 1, 14); });
        break;
      case 'death':
        if (targetCards.length >= 2) {
          const src = targetCards[0];
          const tgt = targetCards[1];
          tgt.rank = src.rank;
          tgt.suit = src.suit;
          if (src.enhancement) tgt.enhancement = src.enhancement;
        }
        break;
      case 'add_seal':
        targetCards.forEach(c => { c.seal = data.seal; });
        break;
      case 'add_edition': {
        const editions = ['foil', 'holographic', 'polychrome'];
        if (targetCards[0]) targetCards[0].edition = editions[Math.floor(Math.random() * editions.length)];
        break;
      }
      case 'cryptid': {
        const srcCard = targetCards[0];
        for (let i = 0; i < (data.count || 2); i++) {
          const copy = { ...srcCard };
          if (this.S.deck) this.S.deck.push(copy);
        }
        break;
      }
      case 'spectral_familiar':
      case 'spectral_grim':
      case 'spectral_incantation': {
        // destroy 1, add enhanced cards
        GridManager.removeCards(this.S, targets.slice(0, 1).map(p => p));
        const addType = data.addType;
        for (let i = 0; i < data.addCount; i++) {
          let rank;
          if (addType === 'face') rank = [11,12,13][Math.floor(Math.random()*3)];
          else if (addType === 'ace') rank = 14;
          else rank = 2 + Math.floor(Math.random()*9); // 2-10
          const suits = ['HEARTS','DIAMONDS','CLUBS','SPADES'];
          const card = GridManager._createCard(rank, suits[Math.floor(Math.random()*4)], {enhancement:'bonus'});
          if (this.S.deck) this.S.deck.push(card);
        }
        break;
      }
    }

    // Remove consumable
    const ci = this.S.consumables.findIndex(c => c.id === data.id);
    if (ci >= 0) this.S.consumables.splice(ci, 1);

    GridManager.applyGravity(this.S);
    UI.hideCardSelectOverlay();
    this._cardSelectMode = null;
    this._cardSelectData = null;
    this._cardSelectTargets = [];
    this._updateConsumableBar();
    this.renderGrid();
    this.saveGame();
    UI.snack('Card effect applied!');
  },

  cancelCardSelect: function() {
    UI.hideCardSelectOverlay();
    this._cardSelectMode = null;
    this._cardSelectData = null;
    this._cardSelectTargets = [];
  },

  _forEachGridCard: function(fn) {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (this.S.grid[r] && this.S.grid[r][c]) fn(this.S.grid[r][c]);
  },

  renderGrid: function() {
    UI.renderGrid(this.S, (r, c) => this.selectCard(r, c));
  },

  _updateConsumableBar: function() {
    UI.renderConsumableBar(this.S);
  },

  _updateJokerBar: function() {
    UI.updateHUD(this.S);
  },

  // ---- SKIP BLIND / TAGS ----
  showBlindSelect: function() {
    this._generateTags();
    UI.showScreen('blindSelect');
    UI.renderBlindSelect(this.S);
    UI.updateHUD(this.S);
  },

  _getBlindTypeForDeck: function(deckKey) {
    return {Small: 'small', Big: 'big', Boss: 'boss'}[deckKey] || 'small';
  },

  _getNextBlindDeck: function(currentDeck) {
    return {Small: 'Big', Big: 'Boss', Boss: null}[currentDeck];
  },


  _resetBlindStates: function() {
    this.S.blind_on_deck = 'Small';
    this.S.blindIdx = 0;
    this.S.blindType = 'small';
    this.S.blind_states = {Small: 'Select', Big: 'Select', Boss: 'Select'};
  },

  _generateTags: function() {
    this.S.blindTags = [];
    for (let i = 0; i < 3; i++) this.S.blindTags.push(window.getRandomTag());
  },

  playBlind: function(type) {
    const deckKey = {small:'Small', big:'Big', boss:'Boss'}[type];
    this.S.blindType = type;
    this.S.blind_on_deck = deckKey || 'Small';
    if (this.S.blind_states && deckKey) {
      this.S.blind_states[deckKey] = 'Current';
    }
    this.startBlind();
  },

  skipBlind: function(type) {
    const deckKey = {small:'Small', big:'Big', boss:'Boss'}[type];
    const idx = {Small:0, Big:1, Boss:2}[deckKey] || 0;
    const tag = this.S.blindTags && this.S.blindTags[idx];

    // Handle Double Tag
    if (this.S._doubleTag) {
      this.S._doubleTag = false;
      if (tag) { applyTagEffect(tag, this.S); applyTagEffect(tag, this.S); }
    } else {
      if (tag) applyTagEffect(tag, this.S);
    }

    this.S._blindsSkipped++;

    // Mark current as Skipped
    if (this.S.blind_states && deckKey) this.S.blind_states[deckKey] = 'Skipped';
    if (this.S.blindTags) this.S.blindTags[idx] = null;

    // Advance blind_on_deck
    const nextDeck = this._getNextBlindDeck(deckKey);
    if (!nextDeck) {
      // Boss skipped → increment ante, go to shop, then new round
      this.S.ante++;
      this.S._bossJustDefeated = true;
      UI.snack('Boss skipped! Tag: ' + (tag ? tag.nm : 'none'));
      this._goToShop();
      return;
    }

    this.S.blind_on_deck = nextDeck;
    if (this.S.blind_states) this.S.blind_states[nextDeck] = 'Select';
    this.S.blindIdx = {Small:0, Big:1, Boss:2}[nextDeck] || 0;
    this.S.blindType = this._getBlindTypeForDeck(nextDeck);

    // Regenerate tags for next blind, then go to shop
    this._generateTags();
    this.saveGame();
    UI.snack('Skipped ' + type + '! Tag: ' + (tag ? tag.nm : 'none'));
    this._goToShop();
  },

  // ---- BOOSTER PACKS ----
  openPack: function(packItem) {
    this.S._currentPack = packItem;
    this.S._packChoices = this._generatePackChoices(packItem);
    this.S._packSelected = [];
    UI.showPackOverlay(this.S._currentPack, this.S._packChoices);
  },

  _generatePackChoices: function(pack) {
    const isSpectral = pack.packType === 'spectral';
    const isBuffoon = pack.packType === 'buffoon';

    // Balatro pack sizes: normal(3), jumbo(5), mega(5)
    // pick: normal(1), mega(2)
    let count, pick;
    if (pack.size === 'mega') {
      count = isSpectral ? 2 : (isBuffoon ? 4 : 5);
      pick = 2;
    } else if (pack.size === 'jumbo') {
      count = isSpectral ? 2 : (isBuffoon ? 3 : 5);
      pick = 1;
    } else {
      count = isSpectral ? 2 : (isBuffoon ? 2 : 3);
      pick = 1;
    }

    const choices = [];
    for (let i = 0; i < count; i++) {
      switch (pack.packType) {
        case 'arcana': {
          const t = TAROTS[Math.floor(Math.random() * TAROTS.length)];
          choices.push({ id: t.id, type: 'tarot', nm: t.nm, icon: t.icon, ef: t.ef });
          break;
        }
        case 'celestial': {
          const pid = PLANET_IDS[Math.floor(Math.random() * PLANET_IDS.length)];
          const p = PLANETS[pid];
          choices.push({ id: pid, type: 'planet', nm: p.nm, icon: p.icon, hand: p.hand, ef: 'Level up ' + (HAND_RANKS[p.hand] ? HAND_RANKS[p.hand].lb : p.hand) });
          break;
        }
        case 'buffoon': {
          const j = JOKERS[Math.floor(Math.random() * JOKERS.length)];
          choices.push({ id: j.id, type: 'joker', nm: j.nm, ef: j.ef, r: j.r, cost: j.cost });
          break;
        }
        case 'spectral': {
          const s = SPECTRALS[Math.floor(Math.random() * SPECTRALS.length)];
          choices.push({ id: s.id, type: 'spectral', nm: s.nm, icon: s.icon, ef: s.ef });
          break;
        }
        case 'standard': {
          const rank = 2 + Math.floor(Math.random() * 13);
          const suits = ['HEARTS','DIAMONDS','CLUBS','SPADES'];
          const suitKey = suits[Math.floor(Math.random()*4)];
          const card = GridManager._createCard(rank, suitKey);
          const rankDn = RANKS[rank] ? RANKS[rank].dn : rank;
          const suitSym = SUITS[suitKey] ? SUITS[suitKey].sym : suitKey;
          choices.push({ card, type: 'card', nm: rankDn + suitSym });
          break;
        }
      }
    }
    return { count, pick, choices };
  },

  selectPackCard: function(idx) {
    // Deprecated - now handled inline in showPackOverlay onclick
  },

  confirmPack: function() {
    const selected = this.S._packSelected || [];
    const choices = this.S._packChoices ? this.S._packChoices.choices : [];
    const pack = this.S._currentPack;
    const picked = [];

    selected.forEach(idx => {
      const item = choices[idx];
      if (!item) return;
      picked.push(item);

      if (item.type === 'joker') {
        if (this.S.jokers.length < this.S.maxJokers) {
          this.S.jokers.push({ id: item.id });
          this._updateJokerBar();
        }
      } else if (item.type === 'tarot' || item.type === 'planet' || item.type === 'spectral') {
        if (this.S.consumables.length < this.S.maxConsumables) {
          this.S.consumables.push({ id: item.id, type: item.type });
          this._updateConsumableBar();
        }
      } else if (item.type === 'card' && item.card) {
        if (!this.S.deck) this.S.deck = [];
        this.S.deck.push(item.card);
      }
    });

    // Hide overlay, return to shop
    UI.hidePackOverlay();
    this.S._currentPack = null;
    this.S._packChoices = null;
    this.S._packSelected = [];

    // Re-render shop to reflect changes
    UI.renderShop(this.S);
    UI.updateHUD(this.S);
    this._updateConsumableBar();
    this._updateJokerBar();

    const pickedNames = picked.map(p => p.nm).join(', ');
    UI.snack('Got: ' + pickedNames);
    this.saveGame();
  },

  // ---- SHOP VOUCHER ----
  buyVoucher: function(voucherId) {
    const voucher = VOUCHERS.find(v => v.id === voucherId);
    if (!voucher || this.S.gold < voucher.cost) { UI.snack('Not enough gold!'); return false; }
    if (this.S.vouchers.includes(voucherId)) { UI.snack('Already owned!'); return false; }

    this.S.gold -= voucher.cost;
    this.S.vouchers.push(voucherId);
    this._applyVoucher(voucher);

    // Remove from shop
    if (this.S.shopItems) {
      const idx = this.S.shopItems.findIndex(x => x.id === voucherId);
      if (idx >= 0) this.S.shopItems.splice(idx, 1);
    }

    // Check for upgraded version available next
    if (voucher.upgrade) {
      this.S._nextVoucher = voucher.upgrade;
    }

    this._updateConsumableBar();
    UI.updateHUD(this.S);
    this.saveGame();
    return true;
  },

  _applyVoucher: function(voucher) {
    switch (voucher.effect_type) {
      case 'shop_slot':
        ShopManager.MAX_SLOTS += voucher.val;
        break;
      case 'consumable_slot':
        this.S.maxConsumables += voucher.val;
        break;
      case 'max_hands':
        this.S.maxHands += voucher.val;
        this.S.hands += voucher.val;
        break;
      case 'max_discards':
        this.S.maxDiscards += voucher.val;
        this.S.discards += voucher.val;
        break;
      case 'interest_cap':
        this.S._interestCap = voucher.val;
        break;
      case 'hand_size':
        this.S.maxHands += voucher.val;
        this.S.hands += voucher.val;
        break;
      case 'joker_slot':
        this.S.maxJokers += voucher.val;
        break;
      // Other vouchers apply at specific times (shop generation, etc.)
    }
  },

  _applyTagRewards: function() {
    // Apply pending gold rewards (e.g. Investment Tag)
    if (this.S._pendingInvestment > 0) {
      this.S.gold += this.S._pendingInvestment;
      this.S._pendingInvestment = 0;
    }
    // _pendingPack is now handled in _goToShop()
    // _pendingTagEditions is consumed in ShopManager.buyItem
  },

  showDeckView: function() {
    const deck = this.S.deck || [];
    const list = UI.$('deckList');
    if (!list) return;

    const count = UI.$('deckCount');
    if (count) count.textContent = deck.length + ' cards remaining';

    list.innerHTML = '';

    if (deck.length === 0) {
      list.innerHTML = '<div style="color:var(--gray);text-align:center;padding:20px">Deck is empty</div>';
      UI.showScreen('deckScreen');
      return;
    }

    // Sort by suit then rank (hide draw order)
    const suitOrder = { HEARTS: 0, DIAMONDS: 1, CLUBS: 2, SPADES: 3 };
    const sorted = [...deck].sort((a, b) => {
      const sDiff = (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
      return sDiff !== 0 ? sDiff : a.rank - b.rank;
    });

    sorted.forEach(card => {
      const div = document.createElement('div');
      div.className = 'deck-mini suit-' + card.suit;
      const sym = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' }[card.suit] || '';
      const dn = card.dn || String(card.rank);
      div.innerHTML = '<div class="dm-rank">' + dn + '</div><div class="dm-suit">' + sym + '</div>';
      list.appendChild(div);
    });

    UI.showScreen('deckScreen');
  },

  closeDeckView: function() {
    UI.showScreen('battle');
  }
};

window.G = G;

window.startNewRun = () => { G.startNewRun(false); };
window.showSetup = () => { G.startNewRun(true); };
window.placeHand = () => G.placeHand();
window.discardSel = () => G.discardSel();
window.clearSel = () => G.clearSel();
window.nextRound = () => G.nextRound();
window.endShop = () => G.endShop();
window.showDeckView = () => G.showDeckView();
window.closeDeckView = () => G.closeDeckView();
window.selectDeck = (id) => G.selectDeck(DECK_TYPES.find(d => d.id === id));

document.addEventListener('DOMContentLoaded', () => G.init());
