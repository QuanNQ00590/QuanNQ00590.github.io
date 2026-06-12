// Pokermancer MVP - Shop (Jokers, Planets, Enhanced Cards, Packs)
window.ShopManager = {
  MAX_SLOTS: 4,

  generate: function(state) {
    state.shopItems = [];
    const allJokers = GridManager.shuffle([...JOKERS]);
    const allPlanets = GridManager.shuffle([...PLANET_IDS]);
    const allTarots = GridManager.shuffle([...TAROTS]);

    const isBossRound = state.blindType === 'boss';
    const planetChance = isBossRound ? 0.35 : 0.25;

    // Tarot rate multiplier (from vouchers)
    const vouchers = state.vouchers || [];
    let tarotRate = 0.1;
    if (vouchers.includes('tarot_merchant')) tarotRate *= 2;
    if (vouchers.includes('tarot_tycoon')) tarotRate *= 2;
    let planetRate = planetChance;
    if (vouchers.includes('planet_merchant')) planetRate *= 2;
    if (vouchers.includes('planet_tycoon')) planetRate *= 2;

    // Edition rate multiplier (from vouchers)
    let editionMult = 1;
    if (vouchers.includes('hone')) editionMult *= 2;
    if (vouchers.includes('glow_up')) editionMult *= 2;

    // Shop discount (from vouchers)
    let discount = 0;
    if (vouchers.includes('clearance')) discount = 0.25;
    if (vouchers.includes('liquidation')) discount = 0.5;
    if (state._freeShop) discount = 1;

    // Reroll discount
    state._rerollDiscount = 0;
    if (vouchers.includes('reroll')) state._rerollDiscount = 2;
    if (vouchers.includes('reroll_glut')) state._rerollDiscount = 4;
    if (state._freeRerolls) state._rerollDiscount = 999;

    // Calc reroll cost: base 5 + cumulative rerolls this shop - discount
    if (state._rerollsThisShop === undefined) state._rerollsThisShop = 0;
    state.shopRerollCost = Math.max(0, 5 + state._rerollsThisShop - state._rerollDiscount);

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const roll = Math.random();
      if (roll < tarotRate && allTarots.length > 0) {
        // Tarot card
        const t = allTarots.shift();
        const item = {
          id: 'tarot_' + t.id,
          type: 'tarot',
          nm: t.nm,
          icon: t.icon,
          cost: t.cost || 3,
          r: 'u',
          ef: t.ef,
          tarotId: t.id
        };
        if (discount > 0) item.cost = Math.floor(item.cost * (1 - discount));
        state.shopItems.push(item);
      } else if (roll < tarotRate + planetChance && allPlanets.length > 0) {
        // Planet card (consumable)
        const pid = allPlanets.shift();
        const p = PLANETS[pid];
        if (p) {
          const item = {
            id: 'planet_' + p.id,
            type: 'planet',
            nm: p.nm,
            hand: p.hand,
            icon: p.icon,
            cost: p.cost || 3,
            r: 'c',
            ef: 'Level up ' + (HAND_RANKS[p.hand] ? HAND_RANKS[p.hand].lb : p.hand)
          };
          if (discount > 0) item.cost = Math.floor(item.cost * (1 - discount));
          state.shopItems.push(item);
        }
      } else if (allJokers.length > 0) {
        // Joker
        const j = allJokers.shift();
        const item = { ...j, type: 'joker' };
        if (state._forceRarity) {
          // Force specific rarity from tag
          if (state._forceRarity === 'u') {
            const uncommons = JOKERS.filter(x => x.r === 'u');
            if (uncommons.length > 0) Object.assign(item, uncommons[Math.floor(Math.random() * uncommons.length)]);
          } else if (state._forceRarity === 'r') {
            const rares = JOKERS.filter(x => x.r === 'r');
            if (rares.length > 0) Object.assign(item, rares[Math.floor(Math.random() * rares.length)]);
          }
        }
        if (discount > 0) item.cost = Math.floor(item.cost * (1 - discount));
        state.shopItems.push(item);
      }
    }

    // Voucher slot (always 1 per shop)
    this._addVoucherToShop(state);

    // Clear one-time flags
    state._forceRarity = null;
    state._freeShop = false;
    state._freeRerolls = false;
    state._forceVoucher = false;
    state.shopRerollCost = Math.max(0, state.shopRerollCost);
  },

  _addVoucherToShop: function(state) {
    const vouchers = state.vouchers || [];
    let availableVoucher = null;

    if (state._nextVoucher) {
      // Upgraded version available (from buying base in a PRIOR shop)
      availableVoucher = VOUCHERS.find(v => v.id === state._nextVoucher);
      state._nextVoucher = null; // offered once — clear so it doesn't block forever
    } else if (state._forceVoucher) {
      // From voucher tag: show a random unpurchased BASE voucher (not upgrade)
      const unpurchased = VOUCHERS.filter(v => !vouchers.includes(v.id) && !v.base && !v.upgrade);
      if (unpurchased.length > 0) {
        availableVoucher = unpurchased[Math.floor(Math.random() * unpurchased.length)];
      }
    } else {
      // Random unpurchased BASE voucher (vouchers with `upgrade`, not `base`)
      const unpurchased = VOUCHERS.filter(v => !vouchers.includes(v.id) && v.upgrade);
      if (unpurchased.length > 0) {
        availableVoucher = unpurchased[Math.floor(Math.random() * unpurchased.length)];
      }
    }

    if (availableVoucher) {
      state.shopItems.push({
        id: availableVoucher.id,
        type: 'voucher',
        nm: availableVoucher.nm,
        cost: Math.floor(availableVoucher.cost),
        r: 'r',
        ef: availableVoucher.ef,
        voucherId: availableVoucher.id
      });
    }
  },

  buyItem: function(state, id) {
    const idx = state.shopItems.findIndex(x => x.id === id);
    if (idx === -1) return false;
    const item = state.shopItems[idx];
    if (state.gold < item.cost) return false;

    if (item.type === 'joker') {
      if (state.jokers.length >= state.maxJokers) return false;
      state.gold -= item.cost;
      let edition = item.edition || null;
      // Apply pending tag editions (foil/holo/poly/negative tags)
      if (state._pendingTagEditions && state._pendingTagEditions.length > 0) {
        const tagId = state._pendingTagEditions.shift();
        if (tagId === 'negative') edition = 'negative';
        else if (tagId === 'foil') edition = 'foil';
        else if (tagId === 'holo') edition = 'holographic';
        else if (tagId === 'poly') edition = 'polychrome';
      }
      state.jokers.push({ id: item.id, edition: edition });
      state.shopItems.splice(idx, 1);
      return true;
    } else if (item.type === 'planet') {
      if (state.consumables.length >= state.maxConsumables) { UI.snack('Consumable slots full!'); return false; }
      state.gold -= item.cost;
      state.consumables.push({ id: item.id.replace('planet_',''), type: 'planet' });
      state.shopItems.splice(idx, 1);
      return true;
    } else if (item.type === 'tarot') {
      if (state.consumables.length >= state.maxConsumables) { UI.snack('Consumable slots full!'); return false; }
      state.gold -= item.cost;
      state.consumables.push({ id: item.tarotId, type: 'tarot' });
      state.shopItems.splice(idx, 1);
      return true;
    } else if (item.type === 'voucher') {
      return G.buyVoucher(item.voucherId);
    } else if (item.type === 'enhanced_card') {
      // Add enhanced card to deck
      state.gold -= item.cost;
      const card = item.cardData || GridManager.createEnhancedCard(item.enhancement, item.edition, item.seal);
      if (!state.deck) state.deck = [];
      state.deck.push(card);
      state.shopItems.splice(idx, 1);
      return true;
    }
    return false;
  },

  sellJoker: function(state, id) {
    const idx = state.jokers.findIndex(x => x.id === id);
    if (idx === -1) return 0;
    const jd = JOKERS.find(x => x.id === id);
    const price = jd ? Math.floor(jd.cost / 2) : 1;
    state.jokers.splice(idx, 1);
    state.gold += price;
    return price;
  },

  rerollShop: function(state) {
    if (state.gold < state.shopRerollCost) return false;
    state.gold -= state.shopRerollCost;
    state._rerollsThisShop = (state._rerollsThisShop || 0) + 1;
    this.generate(state);
    return true;
  }
};
