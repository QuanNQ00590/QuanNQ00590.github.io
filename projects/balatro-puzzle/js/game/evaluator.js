// Pokermancer MVP - Hand Evaluator
window.PokerEvaluator = {
  OVERFLOW_SCORE: 9000000000000000000,


  evalHand: function(cards, state) {
    if (!cards.length) return { rank: HAND_RANKS.HIGH_CARD, chips: 0, mult: 1, finalScore: 0, cards: [] };
    return this._scoreCards(cards, state);
  },

  _getCardValue: function(card) {
    if (card.isWild || card.isJoker) return 0;
    // Balatro chip values: 2-9 = face value, 10/J/Q/K = 10, A = 11
    const r = card.rank;
    if (!r || r < 2) return 0;
    if (r >= 11 && r <= 13) return 10; // J, Q, K
    if (r === 14) return 11;           // A
    if (r === 10) return 10;
    return r;                           // 2-9
  },

  _scoreCards: function(cards, state) {
    // 1. Hand detection (on all selected cards)
    const hasSmear = state && state.jokers && state.jokers.some(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      return jd && jd.type === 'smear_suits';
    });
    state._smearedSuits = hasSmear;

    const hasFourFingers = state && state.jokers && state.jokers.some(j => {
      const jd = JOKERS.find(x => x.id === j.id);
      return jd && jd.type === 'four_fingers';
    });
    state._fourFingers = hasFourFingers;

    const fl = this._isFlush(cards, hasSmear, hasFourFingers);
    const st = this._isStraight(cards, hasFourFingers);
    const g = this._groups(cards);
    const gv = Object.values(g);
    const wildCount = cards.filter(c => c.isWild || c.isJoker || c.rank === 1 || c.enhancement === 'wild').length;
    const maxGroup = gv.length > 0 ? Math.max(...gv) : 0;

    // Hand flags — account for wild cards boosting group counts
    const f5 = maxGroup + wildCount >= 5;
    const f4 = maxGroup + wildCount >= 4;
    const f3 = maxGroup + wildCount >= 3;
    const f2 = maxGroup + wildCount >= 2;

    // Full House: need 3 of one rank + 2 of another (wilds can fill gaps)
    let fh = false;
    if (gv.includes(3) && gv.includes(2)) fh = true;
    else if (wildCount > 0) {
      // With wilds, check if we can form 3+2
      const sorted = [...gv].sort((a,b) => b - a);
      if (sorted.length === 0 && wildCount >= 5) fh = true;
      else if (sorted.length === 1 && sorted[0] + wildCount >= 5) fh = true;
      else if (sorted.length >= 2 && sorted[0] + sorted[1] + wildCount >= 5 && sorted[0] >= 2) fh = true;
      else if (sorted.length === 1 && sorted[0] >= 2 && sorted[0] + wildCount >= 5) fh = true;
    }

    // Two Pair: need two groups of 2+ (wilds can help)
    const f2p = gv.filter(v => v >= 2).length >= 2 ||
      (gv.filter(v => v >= 2).length === 1 && wildCount >= 1 && cards.length >= 4) ||
      (wildCount >= 2 && cards.length >= 4);

    let rank = HAND_RANKS.HIGH_CARD;
    let rankKey = 'HIGH_CARD';
    // balatro-calc hand priority:
    // FlushFive > FlushHouse > FiveOfAKind > StraightFlush > FourOfAKind > FullHouse > Flush > Straight > ThreeOfAKind > TwoPair > OnePair > HighCard
    const minFlush = hasFourFingers ? 4 : 5;
    if (f5 && fl) {
      rank = HAND_RANKS.FLUSH_FIVE; rankKey = 'FLUSH_FIVE';
    } else if (fh && fl) {
      rank = HAND_RANKS.FLUSH_HOUSE; rankKey = 'FLUSH_HOUSE';
    } else if (f5) {
      rank = HAND_RANKS.FIVE_OF_A_KIND; rankKey = 'FIVE_OF_A_KIND';
    } else if (fl && st && cards.length === 5) {
      rank = HAND_RANKS.STRAIGHT_FLUSH; rankKey = 'STRAIGHT_FLUSH';
    } else if (f4) {
      rank = HAND_RANKS.FOUR_OF_A_KIND; rankKey = 'FOUR_OF_A_KIND';
    } else if (fh) {
      rank = HAND_RANKS.FULL_HOUSE; rankKey = 'FULL_HOUSE';
    } else if (fl) {
      rank = HAND_RANKS.FLUSH; rankKey = 'FLUSH';
    } else if (st) {
      rank = HAND_RANKS.STRAIGHT; rankKey = 'STRAIGHT';
    } else if (f3) {
      rank = HAND_RANKS.THREE_OF_A_KIND; rankKey = 'THREE_OF_A_KIND';
    } else if (f2p) {
      rank = HAND_RANKS.TWO_PAIR; rankKey = 'TWO_PAIR';
    } else if (f2) {
      rank = HAND_RANKS.PAIR; rankKey = 'PAIR';
    }

    // 2. Score ALL selected cards: base value + enhancements + editions + seals
    let cardChips = 0;
    let enhChips = 0;
    let extraMult = 0;
    let extraXmult = 1;
    let glassBroken = [];

    // balatro-calc sequence: chips first, then mult, then xmult
    // 1. Chip bonuses
    cards.forEach(c => {
      cardChips += this._getCardValue(c);

      // Bonus enhancement: +30 chips
      if (c.enhancement === 'bonus') enhChips += 30;

      // Foil edition: +50 chips
      if (c.edition === 'foil') enhChips += 50;

      // Red Seal: retrigger (same chip value again)
      if (c.seal === 'red') enhChips += this._getCardValue(c);

      // Gold Seal: +$3 when played
      if (c.seal === 'gold') {
        state._goldFromSeals = (state._goldFromSeals || 0) + 3;
      }
    });

    // 2. Mult bonuses (additive)
    cards.forEach(c => {
      // Mult enhancement: +4 mult
      if (c.enhancement === 'mult') extraMult += 4;

      // Lucky card: 1/5 chance +20 mult, 1/15 chance +$20
      if (c.enhancement === 'lucky') {
        if (Math.random() < 0.2) {
          extraMult += 20;
          state._luckyTriggered = (state._luckyTriggered || 0) + 1;
        }
        if (Math.random() < 1/15) {
          state._luckyGold = (state._luckyGold || 0) + 20;
        }
      }

      // Holographic edition: +10 mult
      if (c.edition === 'holographic') extraMult += 10;
    });

    // 3. xMult (multiplicative — applied AFTER all additive mults)
    cards.forEach(c => {
      // Glass enhancement: x2 mult, 1/4 chance to break
      if (c.enhancement === 'glass') {
        extraXmult *= 2;
        if (ENHANCEMENTS.glass.breakChance && Math.random() < ENHANCEMENTS.glass.breakChance) {
          glassBroken.push(c);
        }
      }
      // Polychrome edition: x1.5 mult
      if (c.edition === 'polychrome') extraXmult *= 1.5;
    });

    // 4. Steel enhancement: x1.5 mult for each Steel card in HELD cards (not played)
    const allHeldCards = (state._heldCards || state.deck || []).filter(c => !c.played && !c.discarded);
    const steelCount = allHeldCards.filter(c => c.enhancement === 'steel').length;
    for (let i = 0; i < steelCount; i++) {
      extraXmult *= 1.5;
    }

    if (glassBroken.length > 0) {
      state._glassBroken = (state._glassBroken || []).concat(glassBroken);
    }

    // 4. Base hand chips/mult + hand level bonuses
    let baseChips = rank.chips;
    let baseMult = rank.mult;
    if (state && state.handLevels && state.handLevels[rankKey]) {
      const lvl = state.handLevels[rankKey];
      const pData = PLANETS[PLANET_BY_HAND[rankKey]];
      baseChips += (pData ? pData.chipBonus : 10) * (lvl - 1);
      baseMult  += (pData ? pData.multBonus  : 1)  * (lvl - 1);
    }

    // 5. Apply joker effects (using cards as scoring cards)
    let totalChips = baseChips + cardChips + enhChips;
    let totalMult = baseMult + extraMult;
    const jokerData = (state && state.jokers) ? this._applyJokers(totalChips, totalMult, cards, state, rankKey) : null;
    if (jokerData) {
      totalChips = jokerData.chips;
      totalMult = jokerData.mult;
      extraXmult *= jokerData.xmult;
    }

    // 6. Final score
    let finalScore = Math.floor(totalChips) * Math.floor(totalMult);
    finalScore = Math.floor(finalScore * extraXmult);
    finalScore = Math.min(finalScore, this.OVERFLOW_SCORE);

    if (state) this._triggerAfterHand(state);

    return {
      rank: rank,
      rankKey: rankKey,
      chips: totalChips,
      mult: totalMult,
      xmult: extraXmult,
      finalScore: finalScore,
      cards: cards
    };
  },

  _applyJokers: function(chips, mult, cards, state, rankKey) {
    let result = { chips, mult, xmult: 1 };
    let usedTriggers = [];

    // Pre-scan joker states
    const jokers = state.jokers || [];
    const faceCards = cards.filter(c => c.rank >= 11 && c.rank <= 13);
    const primeCards = cards.filter(c => [2,3,5,7,11,13].includes(c.rank));
    const evenCards = cards.filter(c => c.rank % 2 === 0 && c.rank > 0);
    const oddCards = cards.filter(c => c.rank % 2 === 1 && c.rank > 0);
    const cardsByRank = {};
    cards.forEach(c => { if (c.rank) { cardsByRank[c.rank] = (cardsByRank[c.rank] || 0) + 1; }});
    const uniqueRanks = Object.keys(cardsByRank).length;

    // Check played hand type triggers
    const isPair = cards.length === 2 && uniqueRanks === 1;
    const isTwoPair = uniqueRanks === 2 && Object.values(cardsByRank).filter(v => v === 2).length === 2;
    const isThreeKind = cards.length === 3 && uniqueRanks === 1;
    const isFourKind = cards.length === 4 && uniqueRanks === 1;
    const isFullHouse = uniqueRanks === 2 && Object.values(cardsByRank).includes(3) && Object.values(cardsByRank).includes(2);

    const scoringCount = cards.length;

    // Steel cards in hand (not scoring — cards still held in hand)
    const allHeldCards = (state._heldCards || state.deck || []).filter(c => !c.played && !c.discarded);
    const steelCount = allHeldCards.filter(c => c.enhancement === 'steel').length;

    // Grid cards (all cards on the board, not just scoring)
    const gridCards = (state._heldCards || []).filter(c => !c.played && !c.discarded);
    const gridFaceCards = gridCards.filter(c => c.rank >= 11 && c.rank <= 13);

    for (const j of jokers) {
      const jd = JOKERS.find(x => x.id === j.id);
      if (!jd) continue;

      if (jd.chips) {
        if (typeof jd.chips === 'function') {
          result.chips += jd.chips(state, j, this);
        } else if (typeof jd.chips === 'number') {
          if (j.edition === 'foil' && EDITIONS.foil && EDITIONS.foil.chips) {
          } else {
            result.chips += jd.chips;
          }
        }
      }

      if (jd.type === 'mult') {
        result.mult += jd.val || 0;
      }

      if (jd.type === 'grid_suit_mult') {
        const matched = gridCards.filter(c => PokerEvaluator._suitMatches(c.suit, jd.suit, state)).length;
        result.mult += (jd.val || 0) * matched;
      }

      if (jd.type === 'hand_mult') {
        if (rankKey === jd.hand) result.mult += jd.val || 0;
      }

      if (jd.type === 'hand_chips') {
        if (rankKey === jd.hand) result.chips += jd.val || 0;
      }

      if (jd.type === 'size_mult') {
        if (cards.length <= (jd.max || 99)) result.mult += jd.val || 0;
      }

      if (jd.type === 'raised_fist') {
        const nonWild = cards.filter(c => c.rank > 0 && !c.isWild && !c.isJoker);
        if (nonWild.length > 0) {
          const lowest = Math.min(...nonWild.map(c => c.rank));
          result.mult += lowest * 2;
        }
      }

      if (jd.type === 'discard_chips') {
        result.chips += (jd.val || 0) * (state.discards || 0);
      }

      if (jd.type === 'no_discard_mult') {
        if ((state.discards || 0) === 0) result.mult += jd.val;
      }

      if (jd.type === 'grid_rank_bonus') {
        const matched = gridCards.filter(c => c.rank === jd.rank).length;
        if (matched) {
          result.chips += (jd.chips || 0) * matched;
          result.mult += (jd.mult || 0) * matched;
        }
      }

      if (jd.type === 'grid_face_chips') {
        result.chips += (jd.val || 0) * gridFaceCards.length;
      }

      if (jd.type === 'xmult') {
        if (!jd.hand || rankKey === jd.hand) {
          result.xmult *= (jd.val || 1);
        }
      }

      if (jd.type === 'face_chips') {
        result.chips += (jd.val || 0) * faceCards.length;
      }

      if (jd.type === 'joker_mult') {
        result.mult += (jd.val || 0) * state.jokers.length;
      }

      if (jd.type === 'misprint') {
        result.mult += Math.floor(Math.random() * 24);
      }

      if (jd.type === 'red_card') {
        result.mult += (jd.val || 0) * (state._discardsUsedThisRound || 0);
      }

      if (jd.type === 'grid_count_chips') {
        const matched = gridCards.filter(c => c.rank === jd.rank).length;
        result.chips += (jd.chips || 0) * matched;
      }

      if (jd.type === 'per_card_chips') {
        result.chips += (jd.val || 0) * scoringCount;
      }

      if (jd.type === 'retrigger_face') {
        result.mult += faceCards.length * 10;
      }

      if (jd.type === 'green_joker') {
        result.mult += (state._handsPlayedThisRound || 0) * (jd.val || 1);
        result.mult -= (state._discardsUsedThisRound || 0);
      }

      if (jd.type === 'xmult_condition') {
        if (jd.condition === 'black_suit') {
          const realGrid = gridCards.filter(c => c.rank > 0);
          if (realGrid.length > 0 && realGrid.every(c => c.suit === 'SPADES' || c.suit === 'CLUBS')) {
            result.xmult *= (jd.mult || 3);
          }
        }
      }

      if (jd.type === 'grid_all_suits') {
        const suits = new Set(gridCards.filter(c => c.suit).map(c => c.suit));
        if (suits.size >= 4) result.mult += jd.val || 0;
      }

      if (jd.type === 'grid_chips_mult') {
        const ranks = jd.ranks || [];
        const matched = gridCards.filter(c => ranks.includes(c.rank)).length;
        result.chips += (jd.val || 0) * matched;
        result.mult += (jd.val || 0) * matched;
      }

      if (jd.type === 'grid_face_mult') {
        result.mult += (jd.val || 0) * gridFaceCards.length;
      }

      if (jd.type === 'splash') {
      }

      if (jd.type === 'fib_mult') {
        const fibRanks = [2, 3, 5, 8, 14];
        const matched = cards.filter(c => fibRanks.includes(c.rank)).length;
        result.mult += (jd.val || 0) * matched;
      }

      if (jd.type === 'first_hand_xmult') {
        if ((state._handsPlayedThisRound || 0) === 0) result.xmult *= (jd.val || 3);
      }

      if (jd.type === 'fortune_teller') {
        result.mult += (state._planetsUsed || 0);
      }

      if (jd.type === 'smear_suits') {
      }

      if (jd.type === 'retrigger_suit_chance') {
        const matched = cards.filter(c => PokerEvaluator._suitMatches(c.suit, jd.suit, state)).length;
        for (let i = 0; i < matched; i++) {
          if (Math.random() < (1 / (jd.chance || 3))) {
            result.mult *= (jd.mult || 3);
          }
        }
      }

      if (jd.type === 'grid_suit_chips') {
        const matched = gridCards.filter(c => PokerEvaluator._suitMatches(c.suit, jd.suit, state)).length;
        result.chips += (jd.val || 0) * matched;
      }

      if (jd.type === 'bull_chips') {
        result.chips += 20 * (state.gold || 0);
      }

      if (jd.type === 'grid_rank_xmult') {
        const matched = gridCards.filter(c => c.rank === jd.rank).length;
        result.xmult *= Math.pow(jd.mult || 1.5, matched);
      }

      if (jd.type === 'grid_rank_mult') {
        const matched = gridCards.filter(c => c.rank === jd.rank).length;
        result.mult += (jd.val || 0) * matched;
      }

      if (jd.type === 'retrigger_rank') {
        const ranks = jd.ranks || [];
        const matched = cards.filter(c => ranks.includes(c.rank)).length;
        result.chips += matched * 10;
      }

      if (jd.type === 'gold_per_hand') {
        state._goldFromJokers = (state._goldFromJokers || 0) + (jd.val || 0);
      }

      if (jd.type === 'constellation') {
        const planetsUsed = state._planetsUsedThisRun || 0;
        result.mult += planetsUsed * (jd.val || 0.1);
      }

      if (jd.type === 'ogre') {
        result.mult += (state._bossesDefeated || 0) * 0.5;
      }

      if (jd.type === 'ice_cream') {
        if (j._iceChips === undefined) j._iceChips = 100;
        result.chips += j._iceChips;
        j._iceChips -= 5;
      }

      if (jd.type === 'trousers') {
        result.mult += 2 * (state._handsPlayedThisRun || 0);
      }

      if (jd.type === 'ramen') {
        if (j._ramenMult === undefined) j._ramenMult = 2;
        result.xmult *= j._ramenMult;
        // Loses x0.01 per discard (tracked separately)
      }

      if (jd.type === 'selzer') {
        if ((state._handsPlayedThisRound || 0) < (jd.hands || 5)) result.mult += jd.val || 0;
      }

      if (jd.type === 'popcorn') {
        if (j._popcornMult === undefined) j._popcornMult = 20;
        result.mult += j._popcornMult;
        j._popcornMult -= 4;
      }

      if (jd.type === 'gift_card') {
        state._giftCardEndOfRound = true;
      }

      if (jd.type === 'cartomancer') {
        state._cartomancerEndOfRound = true;
      }

      if (jd.type === 'stone_joker') {
        const stoneCards = gridCards.filter(c => c.enhancement === 'stone').length;
        result.chips += 25 * stoneCards;
      }

      if (jd.type === 'marble') {
      }

      if (jd.type === 'luchador') {
      }

      if (jd.type === 'toilet_paper') {
        result.chips += 100;
      }

      if (jd.type === 'egg') {
        state._eggValue = (state._eggValue || 0) + (jd.val || 3);
      }

      if (jd.type === 'triboulet') {
        const kq = cards.filter(c => c.rank === 12 || c.rank === 13).length;
        result.xmult *= Math.pow(2, kq);
      }

      if (jd.type === 'cavendish') {
        result.xmult *= (jd.val || 3);
      }

      if (jd.type === 'acrobat') {
        // x3 mult on final hand of round — in grid gameplay, we treat single-card paths as "final"
        if (cards.length === 1) {
          result.xmult *= jd.val || 3;
        }
      }

      if (jd.type === 'card_sharp') {
        // x3 mult if this hand type was played before this round
        if (state._handTypeCounts && state._handTypeCounts[rankKey] > 1) {
          result.xmult *= jd.val || 3;
        }
      }

      if (jd.type === 'vampire') {
        // Gains x0.1 mult per scoring enhanced card
        const enhancedCount = cards.filter(c => c.enhancement && c.enhancement !== '').length;
        if (enhancedCount > 0) {
          result.xmult *= (1 + enhancedCount * (jd.val || 0.1));
        }
      }

      if (jd.type === 'baseball') {
        // x1.5 mult per uncommon joker
        const uncommonJokers = state.jokers.filter(jk => {
          const d = JOKERS.find(x => x.id === jk.id);
          return d && d.r === 'u';
        }).length;
        if (uncommonJokers > 0) {
          result.xmult *= Math.pow(jd.val || 1.5, uncommonJokers);
        }
      }

      if (jd.type === 'ancient') {
        const ancientSuit = jd.suit || 'SPADES';
        const matched = cards.filter(c => PokerEvaluator._suitMatches(c.suit, ancientSuit, state)).length;
        if (matched > 0) {
          result.xmult *= Math.pow(jd.val || 1.5, matched);
        }
      }

      if (jd.type === 'wee_joker') {
        const twos = cards.filter(c => c.rank === 2).length;
        if (twos > 0) {
          result.chips += twos * (jd.val || 8);
        }
      }

      if (jd.type === 'lucky_cat') {
        const luckyTriggers = state._luckyCatMult || 0;
        if (luckyTriggers > 0) {
          result.xmult *= (1 + luckyTriggers * (jd.val || 0.25));
        }
      }

      if (jd.type === 'flash_card') {
        const rerolls = state._rerollsThisRound || 0;
        if (rerolls > 0) {
          result.mult += rerolls * (jd.val || 2);
        }
      }

      if (jd.type === 'spare_trousers') {
        if (rankKey === 'TWO_PAIR') {
          result.mult += (jd.val || 2) * (state._handsPlayedThisRun || 0);
        }
      }

      if (jd.type === 'erosion') {
        const deckSize = (state.deck || []).length;
        const starting = state._startingDeckSize || 52;
        const missing = starting - deckSize;
        if (missing > 0) result.mult += (jd.val || 4) * missing;
      }

      if (jd.type === 'hit_the_road') {
        const jacksDiscarded = state._jacksDiscardedThisRound || 0;
        if (jacksDiscarded > 0) {
          result.xmult *= (1 + jacksDiscarded * (jd.val || 0.5));
        }
      }

      if (jd.type === 'throwback') {
        const blindsSkipped = state._blindsSkipped || 0;
        if (blindsSkipped > 0) {
          result.xmult *= (1 + blindsSkipped * (jd.val || 0.25));
        }
      }

      if (jd.type === 'hologram') {
        const cardsAdded = state._cardsAddedToDeck || 0;
        if (cardsAdded > 0) {
          result.xmult *= (1 + cardsAdded * (jd.val || 0.25));
        }
      }

      if (jd.type === 'stencil') {
        const maxJokers = state.maxJokers || 5;
        const emptySlots = maxJokers - state.jokers.length;
        if (emptySlots > 0) {
          result.xmult *= emptySlots * (jd.val || 1);
        }
      }

      if (jd.type === 'loyalty') {
        const handsPlayed = state._handsPlayedThisRun || 0;
        if (handsPlayed > 0 && handsPlayed % (jd.every || 6) === 0) {
          result.xmult *= (jd.val || 4);
        }
      }

      if (jd.type === 'dusk') {
        // Retrigger all played cards on final hand of round
        if (state.hands === 0) {
          // Each card scores twice (already counted once)
          cards.forEach(c => {
            const baseVal = c.rank >= 11 && c.rank <= 13 ? 10 : (c.rank === 14 ? 11 : (c.rank >= 2 ? c.rank : 0));
            result.chips += baseVal;
          });
        }
      }

      if (jd.type === 'hack') {
        const hackRanks = [2, 3, 4, 5];
        const matched = cards.filter(c => hackRanks.includes(c.rank)).length;
        if (matched > 0) {
          // Retrigger: score each matched card again
          matched.forEach(() => {
            result.chips += 5;
          });
        }
      }

      if (jd.type === 'seltzer') {
        if (state._seltzerHandsLeft > 0) {
          state._seltzerHandsLeft--;
        }
      }

      if (jd.type === 'hanging_chad') {
        // Retrigger first scored card additional times
        if (cards.length > 0) {
          const firstCard = cards[0];
          const baseVal = firstCard.rank >= 11 && firstCard.rank <= 13 ? 10 : (firstCard.rank === 14 ? 11 : (firstCard.rank >= 2 ? firstCard.rank : 0));
          result.chips += baseVal * (jd.val || 2);
        }
      }

      if (jd.type === 'mime') {
        // Retrigger all held card abilities (Steel card effect)
        const heldSteel = allHeldCards.filter(c => c.enhancement === 'steel');
        heldSteel.forEach(() => {
          result.xmult *= 1.5;
        });
      }

      if (jd.type === 'golden_ticket') {
        const goldCards = cards.filter(c => c.enhancement === 'gold');
        if (goldCards.length > 0) {
          state._goldFromSeals = (state._goldFromSeals || 0) + goldCards.length * (jd.val || 4);
        }
      }

      if (jd.type === 'idol') {
        const idolRank = jd.idolRank || 14;
        const idolSuit = jd.idolSuit || 'HEARTS';
        const matched = cards.filter(c => c.rank === idolRank && PokerEvaluator._suitMatches(c.suit, idolSuit, state)).length;
        if (matched > 0) {
          result.xmult *= Math.pow(jd.val || 2, matched);
        }
      }

      if (jd.type === 'seeing_double') {
        const suitsInHand = new Set(cards.filter(c => c.suit).map(c => c.suit));
        if (suitsInHand.has('CLUBS') && suitsInHand.size >= 2) {
          result.xmult *= (jd.val || 2);
        }
      }

      if (jd.type === 'midas') {
        // All played face cards become Gold (tracked for future reference)
      }

      if (jd.type === 'midas_mask') {
        // Same as midas
      }

      if (jd.type === 'chicot') {
      }

      if (jd.type === 'invisible_joker') {
      }

      if (jd.type === 'duo') {
        if (isPair || uniqueRanks <= cards.length - 1 && Object.values(cardsByRank).some(v => v >= 2)) {
          result.xmult *= jd.val || 2;
        }
      }

      if (jd.type === 'trio') {
        if (isThreeKind || Object.values(cardsByRank).some(v => v >= 3)) {
          result.xmult *= jd.val || 3;
        }
      }

      if (jd.type === 'family') {
        if (isFourKind || Object.values(cardsByRank).some(v => v >= 4)) {
          result.xmult *= jd.val || 4;
        }
      }

      if (jd.type === 'order') {
        if (rankKey === 'STRAIGHT' || rankKey === 'STRAIGHT_FLUSH') {
          result.xmult *= jd.val || 3;
        }
      }

      if (jd.type === 'tribe') {
        if (rankKey === 'FLUSH' || rankKey === 'FLUSH_FIVE') {
          result.xmult *= jd.val || 2;
        }
      }

      if (jd.type === 'flower_pot') {
        const suits = new Set(cards.map(c => c.suit));
        if (suits.size >= 4) result.xmult *= jd.val || 3;
      }

      if (jd.type === 'rocket') {
        result.mult += (state._bossesDefeated || 0) * jd.val;
      }

      if (jd.type === 'canio') {
        result.xmult *= Math.pow(3, (state._faceCardsDestroyed || 0));
      }

      if (jd.type === 'prime_mult') {
        result.mult += 5 * primeCards.length;
      }

      if (jd.type === 'suit_mult') {
        const targetSuit = jd.suit;
        if (targetSuit) {
          const matched = cards.filter(c => PokerEvaluator._suitMatches(c.suit, targetSuit, state)).length;
          result.mult += (jd.val || 0) * matched;
        }
      }

      if (jd.type === 'pair_mult') {
        if (rankKey === 'PAIR' || isPair) result.mult += jd.val || 0;
      }

      if (jd.type === 'two_pair_mult') {
        if (rankKey === 'TWO_PAIR' || isTwoPair) result.mult += jd.val || 0;
      }

      if (jd.type === 'three_kind_mult') {
        if (rankKey === 'THREE_OF_A_KIND' || isThreeKind) result.mult += jd.val || 0;
      }

      if (jd.type === 'four_kind_mult') {
        if (rankKey === 'FOUR_OF_A_KIND' || isFourKind) result.mult += jd.val || 0;
      }

      if (jd.type === 'straight_mult') {
        if (rankKey === 'STRAIGHT' || rankKey === 'STRAIGHT_FLUSH') result.mult += jd.val || 0;
      }

      if (jd.type === 'full_house_mult') {
        if (rankKey === 'FULL_HOUSE' || isFullHouse) result.mult += jd.val || 0;
      }

      if (jd.type === 'flush_mult') {
        if (rankKey === 'FLUSH') result.mult += jd.val || 0;
      }

      if (jd.type === 'card_count_mult') {
        const targetCards = cards.filter(c => {
          if (jd.faceOnly) return c.rank >= 11 && c.rank <= 13;
          if (jd.numberOnly) return c.rank >= 2 && c.rank <= 10;
          return true;
        });
        result.mult += targetCards.length * (jd.val || 0);
      }

      if (jd.type === 'empty_mult') {
        const emptySlots = Math.max(0, (state.maxJokers || 5) - state.jokers.length);
        result.xmult *= (1 + emptySlots * jd.val);
      }

      if (jd.type === 'card_count_xmult') {
        const count = jd.countFn ? jd.countFn(state, j, this) : 0;
        result.xmult *= (1 + count * jd.val);
      }

      if (jd.type === 'scoring_xmult') {
        result.xmult *= (1 + scoringCount * jd.val);
      }

      if (jd.type === 'scoring_face_xmult') {
        const fCount = faceCards.length;
        result.xmult *= (1 + fCount * jd.val);
      }

      if (jd.type === 'scoring_number_xmult') {
        const nCount = cards.filter(c => c.rank >= 2 && c.rank <= 9).length;
        result.xmult *= (1 + nCount * jd.val);
      }

      if (jd.type === 'played_hand_xmult') {
        result.xmult *= (1 + (state._handsPlayedThisRound || 0) * jd.val);
      }

      if (jd.type === 'cards_in_deck_xmult') {
        const deckSize = (state.deck || []).length;
        result.xmult *= (1 + deckSize * jd.val);
      }

      if (jd.type === 'joker_count_xmult') {
        result.xmult *= (1 + state.jokers.length * jd.val);
      }

      if (jd.type === 'consumable_count_xmult') {
        const cons = state.consumables ? state.consumables.length : 0;
        result.xmult *= (1 + cons * jd.val);
      }

      if (jd.type === 'gold_xmult') {
        const g = state.gold || 0;
        result.xmult *= (1 + g * jd.val);
      }

      if (jd.type === 'hand_type_xmult') {
        if (jd.handTypes && jd.handTypes.includes(rankKey)) {
          result.xmult *= jd.val;
        }
      }

      if (jd.type === 'photograph') {
        if (faceCards.length > 0) result.xmult *= 2;
      }

      if (jd.type === 'delayed_grat') {
        result.mult += (jd.val || 2) * (state.discards || 0);
      }

      if (jd.type === 'grid_even_mult') {
        const evenGrid = gridCards.filter(c => c.rank > 0 && c.rank % 2 === 0).length;
        result.mult += (jd.val || 4) * evenGrid;
      }

      if (jd.type === 'grid_odd_chips') {
        const oddGrid = gridCards.filter(c => c.rank > 0 && c.rank % 2 === 1).length;
        result.chips += (jd.val || 31) * oddGrid;
      }

      if (jd.type === 'steel_mult') {
        const deckSteel = (state.deck || []).filter(c => c.enhancement === 'steel').length;
        result.xmult *= (1 + deckSteel * jd.val);
      }

      if (jd.type === 'campfire') {
        // Gains x0.25 Mult per card sold (tracked via _cardsSoldThisRun)
        const cardsSold = state._cardsSoldThisRun || 0;
        if (cardsSold > 0) {
          result.xmult *= (1 + cardsSold * (jd.val || 0.25));
        }
      }

      if (jd.type === 'obelisk') {
        const mostPlayed = state._mostPlayedHand;
        if (mostPlayed && rankKey !== mostPlayed) {
          const currentXmult = j._obeliskMult || 1.0;
          j._obeliskMult = currentXmult + (jd.val || 0.25);
          result.xmult *= j._obeliskMult;
        } else if (mostPlayed && rankKey === mostPlayed) {
          j._obeliskMult = 1.0;
        }
      }

      if (jd.type === 'yorick') {
        result.xmult *= (1 + (state._discardsUsedThisRound || 0) * (jd.val || 1));
      }

      if (jd.type === 'gros_michel') {
        result.mult += (jd.val || 15);
      }

      if (jd.type === 'supernova') {
        const timesPlayed = (state._handTypeCounts && state._handTypeCounts[rankKey]) || 0;
        result.mult += timesPlayed;
      }

      if (jd.type === 'ride_bus') {
        const streak = j._rideBusStreak || 0;
        result.mult += streak;
      }

      if (jd.type === 'blue_joker') {
        const deckSize = (state.deck || []).length;
        result.chips += deckSize * (jd.val || 2);
      }

      if (jd.type === 'runner') {
        if (rankKey === 'STRAIGHT' || rankKey === 'STRAIGHT_FLUSH') {
          result.chips += (j._runnerChips || 0);
        }
      }

      if (jd.type === 'swashbuckler') {
        let totalSell = 0;
        state.jokers.forEach(jk => {
          if (jk.id !== j.id) {
            const jd2 = JOKERS.find(x => x.id === jk.id);
            totalSell += Math.max(1, Math.floor((jd2 ? jd2.cost : 2) / 2));
          }
        });
        result.mult += totalSell;
      }

      if (jd.type === 'sock_buskin') {
        const faceCount = cards.filter(c => c.rank >= 11 && c.rank <= 13).length;
        result.chips += faceCount * 10;
      }

      if (jd.type === 'rough_gem') {
        const diamondCount = cards.filter(c => c.suit === 'DIAMONDS').length;
        if (diamondCount > 0) state._goldFromRoughGem = (state._goldFromRoughGem || 0) + diamondCount * (jd.val || 1);
      }

      if (jd.type === 'bloodstone') {
        const heartCount = cards.filter(c => c.suit === 'HEARTS').length;
        for (let i = 0; i < heartCount; i++) {
          if (Math.random() < (1 / (jd.chance || 3))) {
            result.xmult *= (jd.mult || 2);
          }
        }
      }

      if (jd.type === 'castle') {
        const discardedSuit = state._castleTargetSuit || 'HEARTS';
        const count = (state._discardedSuitCounts && state._discardedSuitCounts[discardedSuit]) || 0;
        result.chips += count * (jd.val || 3);
      }

      if (jd.type === 'glass_joker') {
        const glassDestroyed = state._glassDestroyedThisRun || 0;
        if (glassDestroyed > 0) {
          result.xmult *= (1 + glassDestroyed * (jd.val || 0.75));
        }
      }

      if (jd.type === 'ceremonial') {
        result.mult += (j._ceremonialMult || 0);
      }

      if (j.edition) {
        const eData = EDITIONS[j.edition];
        if (eData) {
          if (eData.chips) result.chips += eData.chips;
          if (eData.mult) result.mult += eData.mult;
          if (eData.xmult && eData.xmult > 1) result.xmult *= eData.xmult;
        }
      }
    }

    // Brainstorm: copy leftmost joker
    if (jokers.some(j => { const d = JOKERS.find(x => x.id === j.id); return d && d.type === 'brainstorm'; })) {
      const leftmost = jokers.find(j => {
        const d = JOKERS.find(x => x.id === j.id);
        return d && d.type !== 'brainstorm';
      });
      if (leftmost) {
        const lmData = JOKERS.find(x => x.id === leftmost.id);
        if (lmData) {
          const oldJokers = state.jokers;
          state.jokers = [leftmost];
          const brainstormResult = this._applyJokers(result.chips, result.mult, cards, state, rankKey);
          state.jokers = oldJokers;
          if (brainstormResult) {
            result.chips = Math.max(result.chips, brainstormResult.chips);
            result.mult = Math.max(result.mult, brainstormResult.mult);
            result.xmult *= brainstormResult.xmult;
          }
        }
      }
    }

    // Baron: each King in hand gives x1.5
    if (jokers.some(j => { const d = JOKERS.find(x => x.id === j.id); return d && d.type === 'baron'; })) {
      const kingsInHand = allHeldCards.filter(c => c.rank === 13).length;
      result.xmult *= Math.pow(1.5, kingsInHand);
    }

    // Shoot the Moon: each Queen in hand gives +13 mult
    if (jokers.some(j => { const d = JOKERS.find(x => x.id === j.id); return d && d.type === 'shoot_moon'; })) {
      const queensInHand = allHeldCards.filter(c => c.rank === 12).length;
      result.mult += 13 * queensInHand;
    }

    return result;
  },

  _triggerAfterHand: function(state) {
    Array.from(document.querySelectorAll('.jslot')).forEach(el => {
      el.classList.add('just-scored');
      setTimeout(() => el.classList.remove('just-scored'), 600);
    });
  },

  _isFlush: function(cards, smearedSuits, fourFingers) {
    const minFlush = fourFingers ? 4 : 5;
    if (cards.length < minFlush) return false;
    const wilds = cards.filter(c => c.isWild || c.isJoker || c.rank === 1 || c.enhancement === 'wild');
    const realCards = cards.filter(c => !c.isWild && !c.isJoker && c.rank !== 1 && c.suit != null);
    if (realCards.length === 0) return true; // all wilds
    // Check if all non-wild cards share the same suit (or suit group with smear)
    if (smearedSuits) {
      const group = s => s === 'HEARTS' || s === 'DIAMONDS' ? 'red' : 'black';
      if (!realCards.every(c => group(c.suit) === group(realCards[0].suit))) return false;
    } else {
      if (!realCards.every(c => c.suit === realCards[0].suit)) return false;
    }
    // Total matching cards (real + wilds) must be >= minFlush
    return realCards.length + wilds.length >= minFlush;
  },

  _isStraight: function(cards, fourFingers) {
    const minStraight = fourFingers ? 4 : 5;
    if (cards.length < minStraight) return false;
    const wilds = cards.filter(c => c.isWild || c.isJoker || c.rank === 1 || c.enhancement === 'wild');
    const nonWild = cards.filter(c => !c.isWild && !c.isJoker && c.rank !== 1 && c.enhancement !== 'wild');
    const unique = [...new Set(nonWild.map(c => c.rank).sort((a,b)=>a-b))];

    // Check normal straight (no wilds needed)
    if (unique.length >= minStraight) {
      if (this._hasConsecutive(unique, minStraight)) return true;
      // Low ace (A-2-3-4-5 or A-2-3-4)
      const low = unique.map(r => r === 14 ? 1 : r).sort((a,b)=>a-b);
      if (low.length >= minStraight && this._hasConsecutive(low, minStraight)) return true;
    }

    // Check straight with wilds filling gaps
    if (wilds.length > 0 && unique.length > 0) {
      const allRanks = unique.slice();
      if (unique.includes(14)) allRanks.push(1); // Ace can be low
      allRanks.sort((a,b)=>a-b);

      // Try all possible minStraight-card windows, allowing wilds to fill gaps
      for (let start = 2; start <= 14 - minStraight + 1; start++) {
        const needed = [];
        for (let i = 0; i < minStraight; i++) needed.push(start + i);
        const have = needed.filter(r => allRanks.includes(r)).length;
        if (have + wilds.length >= minStraight && have >= 1) return true;
      }
    }

    // All wilds = straight
    if (wilds.length >= minStraight) return true;

    return false;
  },

  _hasConsecutive5: function(ranks) {
    return this._hasConsecutive(ranks, 5);
  },

  _hasConsecutive: function(ranks, minLen) {
    for (let i = 0; i <= ranks.length - minLen; i++) {
      let consecutive = true;
      for (let j = 1; j < minLen; j++) {
        if (ranks[i+j] - ranks[i+j-1] !== 1) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return true;
    }
    return false;
  },


  _groups: function(cards) {
    const g = {};
    cards.forEach(c => {
      if (c.isWild || c.isJoker || c.rank === 1) return;
      g[c.rank] = (g[c.rank] || 0) + 1;
    });
    return g;
  },

  _suitMatches: function(cardSuit, targetSuit, state) {
    if (cardSuit === targetSuit) return true;
    if (state && state._smearedSuits) {
      const groups = [['HEARTS','DIAMONDS'],['SPADES','CLUBS']];
      for (const g of groups)
        if (g.includes(cardSuit) && g.includes(targetSuit)) return true;
    }
    return false;
  },

  levelUpHand: function(state, handId) {
    if (!state.handLevels) state.handLevels = {};
    state.handLevels[handId] = (state.handLevels[handId] || 1) + 1;
    return state.handLevels[handId];
  }
};
