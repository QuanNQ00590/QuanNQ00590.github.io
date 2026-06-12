// Pokermancer MVP - UI Renderer (Balatro image-based)
window.UI = {
  $: function(id) { return document.getElementById(id); },

  showScreen: function(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.$(id)?.classList.add('active');
  },

  snack: function(msg, dur) {
    dur = dur || 2000;
    const s = this.$('snack');
    if (!s) return;
    s.textContent = msg;
    s.className = 'snack-show';
    setTimeout(() => { s.className = ''; }, dur);
  },

  clamp: function(v, min, max) { return Math.min(Math.max(v, min), max); },

  updateHUD: function(S) {
    const el = id => this.$(id);
    if (el('hScore')) el('hScore').textContent = S.score.toLocaleString();
    if (el('hTarget')) el('hTarget').textContent = S.target.toLocaleString();
    if (el('hGold')) el('hGold').textContent = S.gold;
    if (el('hHands')) el('hHands').textContent = S.hands;
    if (el('hDisc')) el('hDisc').textContent = S.discards;
    if (el('hAnte')) el('hAnte').textContent = S.ante;
    if (el('pFill')) el('pFill').style.width = this.clamp((S.score / S.target) * 100, 0, 100) + '%';

    if (el('roundInfo')) {
      const label = S.blindType === 'small' ? 'Small Blind' : S.blindType === 'big' ? 'Big Blind' : 'Boss Blind';
      el('roundInfo').innerHTML = '<span>' + label + '</span> — Ante ' + S.ante + '/' + ANTE_CONFIG.maxAnte
        + ' <span class="ante-dots">' + this.renderAnteDots(S) + '</span>';
    }

    if (el('bossBan')) {
      if (S.boss) {
        el('bossBan').style.display = 'block';
        if (el('bossT')) el('bossT').textContent = S.boss.t;
        if (el('bossD')) el('bossD').textContent = S.boss.d;
      } else {
        el('bossBan').style.display = 'none';
      }
    }

    // Joker bar with Balatro HD sprites
    let jb = el('jBar');
    if (!jb) {
      jb = document.createElement('div'); jb.id = 'jBar'; jb.className = 'jbar';
      const hud = el('hud');
      if (hud && hud.parentNode) hud.parentNode.insertBefore(jb, hud.nextSibling);
    }
    if (jb) {
      const count = S.jokers.length;
      const max = S.maxJokers || 5;
      jb.innerHTML = '<div class="jbar-label">JOKERS ' + count + '/' + max + '</div><div class="jbar-row">';
      const row = jb.querySelector('.jbar-row');
      S.jokers.forEach(j => {
        const jd = JOKERS.find(x => x.id === j.id);
        if (!jd) return;
        const rarity = jd.r === 'r' ? 'sc-r' : jd.r === 'u' ? 'sc-u' : jd.r === 'l' ? 'sc-l' : 'sc-c';
        const c = document.createElement('div');
        c.className = 'jcard ' + rarity;
        c.innerHTML = '<div class="jcard-fallback"><div class="jcard-name">' + jd.nm + '</div><div class="jcard-ef">' + jd.ef + '</div></div>';
        c.onclick = function() { G.showJokerInfo(j.id); };
        row.appendChild(c);
      });
    }
  },

  renderAnteDots: function(S) {
    let html = '';
    for (let i = 0; i < 3; i++) {
      if (i < S.blindIdx) html += '<span class="adot done">&#9679;</span>';
      else if (i === S.blindIdx) html += '<span class="adot current">&#9679;</span>';
      else html += '<span class="adot next">&#9679;</span>';
    }
    return html;
  },

  updateEval: function(ev) {
    const hn = this.$('hName'), hs = this.$('hSc'), hb = this.$('hBrk');
    if (!ev || !ev.cards || !ev.cards.length) {
      if (hn) hn.textContent = 'Select cards to begin';
      if (hs) hs.textContent = '';
      if (hb) hb.textContent = '';
      return;
    }
    if (hn) hn.textContent = ev.rank.lb;
    const chips = ev.chips || 0;
    const mult = ev.mult || 1;
    const xmult = ev.xmult || 1;
    let formula = Math.floor(chips) + ' x ' + Math.floor(mult);
    if (xmult > 1) formula += ' x ' + xmult.toFixed(1);
    formula += ' = ' + (ev.finalScore || 0).toLocaleString();
    if (hs) hs.textContent = formula;
    if (hb) hb.textContent = 'Selected: ' + ev.cards.map(c => c.dfn).join(', ');
  },

  renderGrid: function(S, onCellClick) {
    const g = this.$('grid');
    if (!g) return;
    g.innerHTML = '';
    if (!S.grid || !S.grid.length) {
      g.textContent = 'Grid not initialized';
      return;
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const card = S.grid[r] && S.grid[r][c];
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (!card) {
          cell.className = 'cell ec';
        } else if (card.frozen === true) {
          cell.className = 'cell cc frz';
          cell.style.cursor = 'not-allowed';
          this._renderCardFront(cell, card, true);
        } else {
          let cls = 'cell cc';
          if (S.path.some(p => p.row === r && p.col === c)) cls += ' sel';
          cell.className = cls;
          this._renderCardFront(cell, card, false);
          cell.onclick = function() { if (onCellClick) onCellClick(r, c); };
        }
        g.appendChild(cell);
      }
    }
  },

  _getSuitLetter: function(suit) {
    return {HEARTS:'H', CLUBS:'C', DIAMONDS:'D', SPADES:'S'}[suit];
  },

  _getRankName: function(rank) {
    return {2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A'}[rank];
  },

  _getSuitSymbol: function(suit) {
    return {HEARTS:'♥', DIAMONDS:'♦', CLUBS:'♣', SPADES:'♠'}[suit] || '';
  },

  _getSuitColor: function(suit) {
    return {HEARTS:'#e62946', DIAMONDS:'#f47e1b', CLUBS:'#3978a8', SPADES:'#615951'}[suit] || '#333';
  },

  _renderCardFront: function(cell, card, frozen) {
    if (frozen) {
      cell.style.background = 'linear-gradient(180deg,#0a2a3e,#0a1a2e)';
      cell.style.border = '2px solid #00ccff';
      cell.style.boxShadow = '0 0 6px #00ccff44';
      cell.innerHTML = '<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,transparent 40%,rgba(0,200,255,.15) 50%,transparent 60%);border-radius:6px;animation:frostShimmer 2s ease-in-out;pointer-events:none"></div>';
      return;
    }

    const suit = card.suit;
    const rank = card.rank;
    const s = this._getSuitLetter(suit);
    const r = this._getRankName(rank);
    const sym = this._getSuitSymbol(suit);

    // Edition border effect
    let borderStyle = '';
    let glowStyle = '';
    if (card.edition === 'foil') {
      borderStyle = '2px solid #ffd700';
      glowStyle = 'box-shadow:0 0 8px rgba(255,215,0,0.5)';
    } else if (card.edition === 'holographic') {
      borderStyle = '2px solid #88ddff';
      glowStyle = 'box-shadow:0 0 8px rgba(136,221,255,0.5)';
    } else if (card.edition === 'polychrome') {
      borderStyle = '2px solid #ff88ff';
      glowStyle = 'box-shadow:0 0 8px rgba(255,136,255,0.5)';
    }

    if (s && r) {
      // Text-based card rendering (no assets needed)
      const color = this._getSuitColor(suit);
      cell.style.background = 'linear-gradient(180deg, #fafafa, #e8e8e8)';
      cell.style.color = color;
      cell.style.position = 'relative';
      if (borderStyle) cell.style.border = borderStyle;
      if (glowStyle) cell.style.boxShadow = glowStyle.replace('box-shadow:', '');

      let enhHtml = '';
      if (card.enhancement) {
        const eData = ENHANCEMENTS[card.enhancement];
        if (eData) {
          const sym2 = eData.sym || '';
          const color2 = eData.c || '#fff';
          enhHtml = '<div class="enh-badge" style="position:absolute;bottom:2px;left:2px;width:20px;height:20px;border-radius:50%;background:' + color2 + ';color:#000;font-weight:bold;font-size:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.3);z-index:2">' + sym2 + '</div>';
        }
      }

      let sealHtml = '';
      if (card.seal) {
        const sData = SEALS[card.seal];
        if (sData) {
          const sym2 = sData.sym || '';
          const color2 = sData.c || '#fff';
          sealHtml = '<div class="seal-badge" style="position:absolute;top:2px;right:2px;width:16px;height:16px;border-radius:50%;background:' + color2 + ';color:#000;font-weight:bold;font-size:9px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.3);z-index:2">' + sym2 + '</div>';
        }
      }

      cell.innerHTML = enhHtml + sealHtml +
        '<div style="position:absolute;top:4px;left:4px;font-size:clamp(11px,3vw,14px);font-weight:bold;line-height:1">' + r + '<br>' + sym + '</div>' +
        '<div style="position:absolute;bottom:4px;right:4px;font-size:clamp(11px,3vw,14px);font-weight:bold;line-height:1;transform:rotate(180deg)">' + r + '<br>' + sym + '</div>' +
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(20px,5vw,28px);font-weight:900">' + sym + '</div>';
    }
  },

  renderShop: function(S) {
    const cont = this.$('shopContent');
    if (!cont) return;
    cont.innerHTML = '';

    const sg = this.$('shopGold');
    if (sg) sg.textContent = '$' + S.gold;

    if (!S.shopItems || !S.shopItems.length) {
      cont.innerHTML = '<div class="shop-empty">Nothing to buy</div>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    S.shopItems.forEach(item => {
      const card = document.createElement('div');

      if (item.type === 'joker') {
        const rStars = item.r === 'r' ? '★★★' : item.r === 'u' ? '★★' : '★';
        card.className = 'shop-card sc-' + (item.r || 'c');
        const iconHtml = '<div class="sc-icon" style="font-size:28px">🤡</div>';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-rarity">' + rStars + '</span><span class="sc-price">$' + item.cost + '</span></div>' +
          iconHtml +
          '<div class="sc-name">' + item.nm + '</div>' +
          '<div class="sc-ef">' + item.ef + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Bought ' + item.nm + '!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else if (S.gold < item.cost) { UI.snack('Not enough gold!'); }
          else { UI.snack('Joker slots full!'); }
        };
      } else if (item.type === 'planet') {
        const hd = HAND_RANKS[item.hand];
        const handLb = hd ? hd.lb : item.hand;
        card.className = 'shop-card sc-planet';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-icon-sm">' + (item.icon || 'J') + '</span><span class="sc-price">$' + item.cost + '</span></div>' +
          '<div class="sc-icon" style="font-size:32px">🪐</div>' +
          '<div class="sc-name">' + item.nm + '</div>' +
          '<div class="sc-ef">Level up ' + handLb + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Bought ' + item.nm + '!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else { UI.snack('Not enough gold!'); }
        };
      } else if (item.type === 'enhanced_card') {
        const enhColor = item.enhancement && ENHANCEMENTS[item.enhancement] ? ENHANCEMENTS[item.enhancement].c : '#888';
        card.className = 'shop-card sc-enhanced';
        card.style.borderColor = enhColor;
        let badges = '';
        if (item.enhancement) badges += '<span class="shop-badge" style="background:' + enhColor + '">' + ENHANCEMENTS[item.enhancement].sym + '</span>';
        if (item.edition) badges += '<span class="shop-badge" style="background:' + EDITIONS[item.edition].c + '">' + EDITIONS[item.edition].sym + '</span>';
        if (item.seal) badges += '<span class="shop-badge" style="background:' + SEALS[item.seal].c + '">' + SEALS[item.seal].sym + '</span>';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-rarity">PACK</span><span class="sc-price">$' + item.cost + '</span></div>' +
          '<div class="sc-icon" style="color:' + enhColor + '">' + item.icon + '</div>' +
          '<div class="sc-name">' + item.nm + '</div>' +
          '<div class="sc-ef">' + item.ef + '</div>' +
          '<div class="sc-suits">' + badges + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Bought ' + item.nm + ' pack!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else { UI.snack('Not enough gold!'); }
        };
      } else if (item.type === 'tarot') {
        card.className = 'shop-card sc-u';
        const iconHtml = '<div class="sc-icon" style="font-size:28px">✨</div>';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-rarity">TAROT</span><span class="sc-price">$' + item.cost + '</span></div>' +
          iconHtml +
          '<div class="sc-name">' + item.nm + '</div>' +
          '<div class="sc-ef">' + item.ef + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Bought ' + item.nm + '!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else if (S.gold < item.cost) { UI.snack('Not enough gold!'); }
          else { UI.snack('Consumable slots full!'); }
        };
      } else if (item.type === 'pack') {
        card.className = 'shop-card sc-enhanced';
        const packEmojis = { arcana:'🔮', celestial:'⭐', standard:'🃏', buffoon:'🤡', spectral:'👻' };
        const pIcon = packEmojis[item.packType] || '📦';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-rarity">' + (item.size || 'normal').toUpperCase() + ' PACK</span><span class="sc-price">$' + item.cost + '</span></div>' +
          '<div class="sc-icon" style="font-size:32px">' + pIcon + '</div>' +
          '<div class="sc-name">' + item.nm + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Opening ' + item.nm + '!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else if (S.gold < item.cost) { UI.snack('Not enough gold!'); }
        };
      } else if (item.type === 'voucher') {
        card.className = 'shop-card sc-r';
        const iconHtml = '<div class="sc-icon" style="font-size:28px">🏷️</div>';
        card.innerHTML =
          '<div class="sc-head"><span class="sc-rarity">VOUCHER</span><span class="sc-price">$' + item.cost + '</span></div>' +
          iconHtml +
          '<div class="sc-name">' + item.nm + '</div>' +
          '<div class="sc-ef">' + item.ef + '</div>';
        card.onclick = function() {
          if (G.buyItem(item.id)) { UI.snack('Bought ' + item.nm + '!'); UI.renderShop(G.S); UI.updateHUD(G.S); }
          else if (S.gold < item.cost) { UI.snack('Not enough gold!'); }
          else { UI.snack('Voucher already owned!'); }
        };
      }

      grid.appendChild(card);
    });

    cont.appendChild(grid);

    const rl = document.createElement('div');
    rl.className = 'shop-reroll';
    rl.innerHTML = '<button class="btn bo bsm" onclick="G.rerollShopAction()">&#128260; REROLL ($' + S.shopRerollCost + ')</button>';
    cont.appendChild(rl);
  },

  renderBlindSelect: function(S) {
    const cont = this.$('blindContent');
    if (!cont) return;
    cont.innerHTML = '';

    const blinds = [
      { key: 'Small', type: 'small', nm: 'Small Blind', gold: 3 },
      { key: 'Big',   type: 'big',   nm: 'Big Blind',   gold: 4 },
      { key: 'Boss',  type: 'boss',  nm: 'Boss Blind',  gold: 5 }
    ];

    const states = S.blind_states || {};
    const currentDeck = S.blind_on_deck || 'Small';

    blinds.forEach(function(b, idx) {
      const state = states[b.key] || 'Select';
      const isCurrent = currentDeck === b.key;
      const card = document.createElement('div');
      card.className = 'blind-card';

      if (state === 'Defeated' || state === 'Skipped') {
        var checkMark = state === 'Defeated' ? '✔' : '⚡';
        var label = state === 'Defeated' ? 'DEFEATED' : 'SKIPPED';
        card.innerHTML = '<div style="text-align:center;opacity:0.5">' +
          '<div class="blind-title">' + b.nm + '</div>' +
          '<div class="blind-status">' + checkMark + ' ' + label + '</div>' +
          '</div>';
        card.style.opacity = '0.4';
        card.style.pointerEvents = 'none';
        cont.appendChild(card);
        return;
      }

      if (!isCurrent && state !== 'Select') {
        return;
      }

      var tagHtml = '';
      if (S.blindTags && S.blindTags[idx]) {
        var tag = S.blindTags[idx];
        tagHtml = '<div class="blind-tag">' + (tag.icon || '🏷️') + ' ' + tag.nm + ': ' + tag.ef + '</div>';
      }

      var html = tagHtml;
      var isBoss = b.type === 'boss';
      var target = G.calcTargetFor(b.type);

      if (isBoss && S.boss) {
        html += '<div class="blind-title">' + b.nm + '</div>' +
          '<div class="blind-target">Target: ' + target.toLocaleString() + '</div>' +
          '<div class="blind-gold">$' + b.gold + '</div>' +
          '<div class="blind-boss-name">' + S.boss.t + '</div>' +
          '<div class="blind-boss-desc">' + S.boss.d + '</div>';
        card.className += ' blind-boss';
      } else {
        html += '<div class="blind-title">' + b.nm + '</div>' +
          '<div class="blind-target">Target: ' + target.toLocaleString() + '</div>' +
          '<div class="blind-gold">$' + b.gold + '</div>';
      }

      if (isCurrent) {
        html += '<div style="display:flex;gap:4px;margin-top:8px;justify-content:center">' +
          '<button class="btn bp" style="font-size:10px;padding:6px 12px" onclick="G.playBlind(\'' + b.type + '\')">&#9654; PLAY</button>' +
          '<button class="btn bs" style="font-size:10px;padding:6px 12px" onclick="G.skipBlind(\'' + b.type + '\')">&#9889; SKIP</button>' +
          '</div>';
      } else {
        html += '<div style="text-align:center;margin-top:8px;color:#555;font-size:11px">&#128274; Locked</div>';
      }

      card.innerHTML = html;
      cont.appendChild(card);
    });
  },

  showScoreOverlay: function(ev, callback) {
    const overlay = this.$('scoreOverlay');
    if (!overlay) return;
    const content = overlay.querySelector('.score-content');
    if (!content) return;
    overlay.className = 'screen active';
    const chips = ev.chips || 0;
    const mult = ev.mult || 1;
    const xmult = ev.xmult || 1;
    let formulaStr = Math.floor(chips) + ' x ' + Math.floor(mult);
    if (xmult > 1) formulaStr += ' x ' + xmult.toFixed(1);
    content.innerHTML = '<div class="score-flash">' + ev.rank.lb + '</div>'
      + '<div class="score-formula">' + formulaStr + '</div>'
      + '<div class="score-total">' + (ev.finalScore || 0).toLocaleString() + '</div>';
    setTimeout(function() {
      overlay.className = 'screen';
      if (callback) callback();
    }, 1200);
  },

  // ---- CONSUMABLE BAR ----
  renderConsumableBar: function(S) {
    let cb = this.$('cBar');
    if (!cb) return;

    const max = S.maxConsumables || 2;
    let html = '<div class="cbar-label">CONSUMABLES ' + S.consumables.length + '/' + max + '</div><div class="cbar-row">';

    for (let i = 0; i < max; i++) {
      const c = S.consumables[i];
      if (c) {
        const tarot = TAROTS && TAROTS.find(t => t.id === c.id);
        const spectral = SPECTRALS && SPECTRALS.find(s => s.id === c.id);
        const planet = PLANETS && PLANETS[c.id];

        let nm = c.id;
        let icon = '?';
        let ef = '';

        if (tarot) {
          nm = tarot.nm; icon = tarot.icon || '✨'; ef = tarot.ef;
        } else if (spectral) {
          nm = spectral.nm; icon = spectral.icon || '👻'; ef = spectral.ef;
        } else if (planet) {
          nm = planet.nm; icon = planet.icon || '🪐'; ef = 'Level up ' + (HAND_RANKS[planet.hand] ? HAND_RANKS[planet.hand].lb : planet.hand);
        }

        html += '<div class="ccard" title="' + nm + ': ' + ef + '" onclick="G.useConsumable(' + i + ')">';
        html += '<div style="font-size:22px;text-align:center">' + icon + '</div>';
        html += '<div class="ccard-name" style="font-size:9px;color:var(--gold);text-align:center;line-height:1.2">' + nm + '</div>';
        html += '</div>';
      } else {
        html += '<div class="ccard ccard-empty"></div>';
      }
    }

    html += '</div>';
    cb.innerHTML = html;
  },

  // ---- CARD SELECT OVERLAY ----
  showCardSelectOverlay: function(mode, maxCount) {
    const overlay = this.$('cardSelectOverlay');
    const title = this.$('cselTitle');
    const count = this.$('cselCount');
    if (!overlay || !title || !count) return;

    const labels = {
      'enhance': 'Select cards to enhance',
      'suit_change': 'Select cards to change suit',
      'destroy': 'Select cards to destroy',
      'strength': 'Select cards to increase rank',
      'death': 'Select 2 cards (1 converts to 2)',
      'add_seal': 'Select card for seal',
      'add_edition': 'Select card for edition',
      'cryptid': 'Select card to copy',
      'spectral_familiar': 'Select card to destroy',
      'spectral_grim': 'Select card to destroy',
      'spectral_incantation': 'Select card to destroy'
    };

    overlay.className = 'active';
    title.textContent = labels[mode] || 'Select cards';
    count.textContent = 'Pick ' + maxCount + ' card(s)';
  },

  updateCardSelectCount: function(selected, max) {
    const count = this.$('cselCount');
    if (count) count.textContent = 'Selected ' + selected + '/' + max;
  },

  hideCardSelectOverlay: function() {
    const overlay = this.$('cardSelectOverlay');
    if (overlay) overlay.className = '';
    if (G && G.S) this.renderGrid(G.S, (r, c) => G.selectCard(r, c));
  },

  // ---- PACK OVERLAY ----
  // ---- PACK OVERLAY (Balatro-style: reveal then select) ----
  showPackOverlay: function(pack, packChoices) {
    const overlay = this.$('packOverlay');
    const title = this.$('packTitle');
    const sub = this.$('packSub');
    const grid = this.$('packGrid');
    const btn = this.$('packBtn');
    if (!overlay || !title || !sub || !grid || !btn) {
      console.error('Pack overlay elements not found!');
      return;
    }

    overlay.style.display = 'flex';
    title.textContent = pack.nm || 'Booster Pack';
    sub.textContent = 'Click cards to reveal, then choose ' + packChoices.pick + '.';
    grid.innerHTML = '';

    const pick = packChoices.pick;
    const count = packChoices.count;

    // Pack card back colors by type
    const packColors = {
      arcana:      { back: '#1a0a3e', border: '#8844ff', icon: '✨' },
      celestial:   { back: '#0a1e3e', border: '#4488ff', icon: '⭐' },
      standard:    { back: '#1e0a2e', border: '#ff4466', icon: '🃏' },
      buffoon:     { back: '#2e0a0a', border: '#ff8844', icon: '🤡' },
      spectral:    { back: '#0a2e1e', border: '#44ff88', icon: '👻' },
    };
    const colors = packColors[pack.packType] || packColors.standard;

    packChoices.choices.forEach(function(c, i) {
      const card = document.createElement('div');
      card.className = 'pack-card';
      card.style.background = colors.back;
      card.style.border = '2px solid ' + colors.border;
      card.dataset.idx = i;
      card.dataset.state = 'face-down';

      // Card back pattern
      card.innerHTML =
        '<div style="font-size:28px;opacity:0.7;margin-bottom:4px">' + colors.icon + '</div>' +
        '<div style="font-size:10px;color:' + colors.border + ';font-weight:bold;letter-spacing:1px">PACK</div>' +
        '<div style="font-size:9px;color:#666;margin-top:2px">' + (i + 1) + '/' + count + '</div>';

      card.onclick = function(e) {
        e.stopPropagation();
        const state = card.dataset.state;
        if (state === 'face-down') {
          // Reveal this card
          card.dataset.state = 'revealed';
          card.style.background = '#2a1f3d';
          card.style.borderColor = '#ffd700';
          card.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';

          // Render card content
          let html = '';
          if (c.type === 'joker') {
            html += '<div style="font-size:32px">🤡</div>';
            html += '<div style="font-size:9px;color:var(--gold);margin-top:4px;font-weight:bold">' + c.nm + '</div>';
            html += '<div style="font-size:8px;color:#aaa;margin-top:2px">' + c.ef + '</div>';
          } else if (c.type === 'tarot') {
            html += '<div style="font-size:32px">✨</div>';
            html += '<div style="font-size:9px;color:#cc88ff;margin-top:4px;font-weight:bold">' + c.nm + '</div>';
            html += '<div style="font-size:8px;color:#aaa;margin-top:2px">' + c.ef + '</div>';
          } else if (c.type === 'planet') {
            const pIdx = {mercury:0,venus:1,earth:2,mars:3,jupiter:4,saturn:5,uranus:6,neptune:7,pluto:8,ceres:9,eris:10,planet_x:11,black_hole:17}[c.id] || 0;
            html += '<div style="font-size:32px">🪐</div>';
            html += '<div style="font-size:9px;color:#4488ff;margin-top:4px;font-weight:bold">' + c.nm + '</div>';
            html += '<div style="font-size:8px;color:#aaa;margin-top:2px">' + c.ef + '</div>';
          } else if (c.type === 'spectral') {
            html += '<div style="font-size:32px">👻</div>';
            html += '<div style="font-size:9px;color:#44ff88;margin-top:4px;font-weight:bold">' + c.nm + '</div>';
            html += '<div style="font-size:8px;color:#aaa;margin-top:2px">' + c.ef + '</div>';
          } else if (c.type === 'card') {
            html += '<div style="font-size:28px;font-weight:bold;color:#fff">' + c.nm + '</div>';
            html += '<div style="font-size:9px;color:#aaa;margin-top:4px">Standard Card</div>';
          }
          card.innerHTML = html;
        } else if (state === 'revealed') {
          // Select this card
          if (G.S._packSelected.length < pick) {
            card.dataset.state = 'selected';
            card.style.borderColor = '#44ff88';
            card.style.boxShadow = '0 0 15px rgba(68,255,136,0.5)';
            card.style.transform = 'translateY(-6px)';
            G.S._packSelected.push(i);
          } else {
            UI.snack('Can only pick ' + pick + '!');
            return;
          }
        } else if (state === 'selected') {
          // Deselect
          card.dataset.state = 'revealed';
          card.style.borderColor = '#ffd700';
          card.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
          card.style.transform = 'none';
          const sIdx = G.S._packSelected.indexOf(i);
          if (sIdx !== -1) G.S._packSelected.splice(sIdx, 1);
        }

        UI.updatePackSelection();
      };

      grid.appendChild(card);
    });

    btn.textContent = 'CONFIRM (0/' + pick + ')';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  },

  updatePackSelection: function() {
    const btn = this.$('packBtn');
    if (!btn) return;
    const pick = G.S._packChoices ? G.S._packChoices.pick : 1;
    const selected = G.S._packSelected || [];
    const count = selected.length;

    btn.textContent = 'CONFIRM (' + count + '/' + pick + ')';
    btn.disabled = count !== pick;
    btn.style.opacity = count === pick ? '1' : '0.5';
  },

  hidePackOverlay: function() {
    const overlay = this.$('packOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  // ---- GRID FOR CONSUMABLE CARD TARGETING ----
  renderGridForSelect: function(S, onCellClick, targets) {
    const g = this.$('grid');
    if (!g) return;
    g.innerHTML = '';
    if (!S.grid || !S.grid.length) {
      g.textContent = 'Grid not initialized';
      return;
    }
    const targetSet = new Set((targets || []).map(t => t.row + ',' + t.col));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const card = S.grid[r] && S.grid[r][c];
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (!card) {
          cell.className = 'cell ec';
        } else {
          let cls = 'cell cc';
          if (targetSet.has(r + ',' + c)) cls += ' sel';
          cell.className = cls;
          this._renderCardFront(cell, card, false);
          cell.onclick = function() { if (onCellClick) onCellClick(r, c); };
        }
        g.appendChild(cell);
      }
    }
  },

  // ===== ANIMATION: Discard with shake + fly-away =====
  animateDiscardCells: function(positions, callback) {
    const grid = this.$('grid');
    if (!grid || !positions.length) { if (callback) callback(); return; }

    // Phase 1: Shake animation on selected cells
    positions.forEach((pos, i) => {
      const cell = grid.children[pos.row * 4 + pos.col];
      if (cell) {
        setTimeout(() => {
          cell.classList.add('is-discarding');
        }, i * 80);
      }
    });

    // Phase 2: Fly away animation
    setTimeout(() => {
      positions.forEach((pos, i) => {
        const cell = grid.children[pos.row * 4 + pos.col];
        if (cell) {
          setTimeout(() => {
            cell.classList.remove('is-discarding');
            cell.classList.add('is-discarding-fly');
          }, i * 60);
        }
      });

      // Phase 3: Callback to remove and cascade
      setTimeout(() => {
        if (callback) callback();
      }, 400);
    }, 500);
  },

  // ===== ANIMATION: Render grid with cascade gravity =====
  renderGridWithCascade: function(S, animData, onCellClick) {
    this.renderGrid(S, onCellClick);

    // Apply animation classes after render
    const grid = this.$('grid');
    if (!grid) return;

    // Animate sliding cards
    if (animData.sliding && animData.sliding.length > 0) {
      animData.sliding.forEach((item, i) => {
        const cell = grid.children[item.row * 4 + item.col];
        if (cell) {
          cell.style.setProperty('--slide-from', -item.distance + 'px');
          cell.style.setProperty('--slide-duration', (0.25 + item.distance / 400) + 's');
          setTimeout(() => {
            cell.classList.add('is-sliding');
          }, i * 50);
        }
      });
    }

    // Animate new cards falling in
    if (animData.newCards && animData.newCards.length > 0) {
      animData.newCards.forEach((item, i) => {
        const cell = grid.children[item.row * 4 + item.col];
        if (cell) {
          const dropDist = (4 - item.row) * 100;
          cell.style.setProperty('--drop-distance', -dropDist + 'px');
          setTimeout(() => {
            cell.classList.add('is-new-card');
          }, 200 + i * 70);
        }
      });
    }
  },

  // ===== ANIMATION: Floating text popup =====
  showFloatingText: function(text, color, parentEl) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color || '#ffd700';
    el.style.left = '50%';
    el.style.top = '40%';
    el.style.transform = 'translateX(-50%)';

    if (parentEl) {
      parentEl.style.position = 'relative';
      parentEl.appendChild(el);
    }

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);

    return el;
  }
};
