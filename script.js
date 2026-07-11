// --- GAME STATE ARCHITECTURE ---
let player = {
    name: "Explorer",
    classType: "Mage",
    coins: 0,
    xp: 0,
    currentClue: 0,
    equipped: { hair: 'Default', torso: 'Ragged Cloth', legs: 'Worn Trousers' },
    inventory: ['Default', 'Ragged Cloth', 'Worn Trousers']
};

// Cryptic Magical Riddles Database
const riddles = [
    { q: "I have a thousands tongues, yet can spin no script. I speak in shivers when the wood is ripped. What am I?", a: "fire", coins: 30, xp: 60, zone: "The Whispering Swamps" },
    { q: "Golden armor with no seams, holding fluid solar beams. Crack my shell to end my sleep. What am I?", a: "egg", coins: 45, xp: 90, zone: "Forgotten Temple" },
    { q: "I scale the mountain, bypass the door, yet never move across the floor. What am I?", a: "path", coins: 65, xp: 120, zone: "The Sunken Gates" },
    { q: "The trickster of light, born from the sun, fleeing the dark when day is done. What am I?", a: "shadow", coins: 90, xp: 200, zone: "The Golden Chamber Vault" }
];

// Enchanted Armory Inventory Matrix
const shopItems = [
    { id: 'neon-hair', category: 'hair', name: 'Alchemist Mohawk', cost: 25, color: '#00f5d4' },
    { id: 'royal-hair', category: 'hair', name: 'Crimson Hood', cost: 40, color: '#9b2226' },
    { id: 'jade-robe', category: 'torso', name: 'Jade Matrix Mantle', cost: 30, color: '#2d6a4f' },
    { id: 'gold-breastplate', category: 'torso', name: 'Sun-King Carapace', cost: 70, color: '#ffee32' },
    { id: 'shadow-pants', category: 'legs', name: 'Void Weave Cloak Trousers', cost: 35, color: '#240046' },
    { id: 'blaze-boots', category: 'legs', name: 'Inferno Greaves', cost: 60, color: '#f72585' }
];

// --- NAVIGATION & ENGINE CONTROLS ---
function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    document.getElementById('hud-shop-btn').style.display = (pageId === 'game') ? 'block' : 'none';
}

function updateGenderVoice() {
    const classVal = document.getElementById('player-gender').value;
    player.classType = classVal;
    document.getElementById('avatar-name-tag').innerText = `${player.name} [${classVal}]`;
    playSynthTone(300, 'triangle', 0.1);
}

document.getElementById('player-name').addEventListener('input', (e) => {
    player.name = e.target.value || "Explorer";
    document.getElementById('avatar-name-tag').innerText = `${player.name} [${player.classType}]`;
});

function startGame() {
    if(!document.getElementById('player-name').value.trim()) {
        triggerVisualShock();
        return;
    }
    player.coins = 0; player.xp = 0; player.currentClue = 0;
    updateHUD();
    loadRiddle();
    goToPage('game');
    playSynthTone(440, 'sine', 0.4);
}

// --- CLUE & LIVE MAP PROGRESSION ---
function loadRiddle() {
    if(player.currentClue >= riddles.length) {
        document.getElementById('cert-name').innerText = player.name;
        document.getElementById('cert-coins').innerText = player.coins;
        document.getElementById('cert-xp').innerText = player.xp;
        goToPage('win');
        playSynthTone(587, 'sine', 0.8);
        return;
    }

    const current = riddles[player.currentClue];
    document.getElementById('jungle-depth-title').innerText = current.zone;
    document.getElementById('riddle-box').innerText = current.q;
    document.getElementById('riddle-answer').value = "";
    document.getElementById('game-feedback').innerText = "";

    moveTokenToNode(player.currentClue);
}

function moveTokenToNode(nodeIndex) {
    const nodes = document.querySelectorAll('.node');
    nodes.forEach((n, i) => {
        if(i <= nodeIndex) n.classList.add('active');
        else n.classList.remove('active');
    });

    // Translate token smoothly coordinates over node layout positions
    const targetNode = document.getElementById(`node-${nodeIndex}`);
    const token = document.getElementById('player-token');
    if(targetNode && token) {
        setTimeout(() => {
            token.style.left = `${targetNode.offsetLeft + 5}px`;
        }, 100);
    }
}

function checkAnswer() {
    const submission = document.getElementById('riddle-answer').value.trim().toLowerCase();
    const current = riddles[player.currentClue];

    if(submission === current.a) {
        player.coins += current.coins;
        player.xp += current.xp;
        player.currentClue++;
        
        updateHUD();
        document.getElementById('game-feedback').style.color = "var(--emerald-glow)";
        document.getElementById('game-feedback').innerText = `✨ The Runes Align! +${current.coins} Gold Pieces added.`;
        playSynthTone(523, 'sine', 0.2);
        
        setTimeout(loadRiddle, 1500);
    } else {
        triggerVisualShock();
        document.getElementById('game-feedback').style.color = "var(--blood-ruby)";
        document.getElementById('game-feedback').innerText = "❌ The jungle roars in rejection! The cipher remains unbroken.";
        playSynthTone(150, 'sawtooth', 0.3);
    }
}

// --- DYNAMIC LIVE SHOP OVERLAY ---
function toggleShop() {
    const shop = document.getElementById('shop-overlay');
    if(shop.style.display === 'flex') {
        shop.style.display = 'none';
    } else {
        renderShop();
        shop.style.display = 'flex';
    }
}

function renderShop() {
    const container = document.getElementById('shop-items-container');
    container.innerHTML = "";

    shopItems.forEach(item => {
        const isOwned = player.inventory.includes(item.name);
        const isEquipped = player.equipped[item.category] === item.name;
        
        let actionHtml = '';
        if(isEquipped) {
            actionHtml = `<span style="color:var(--emerald-glow); font-size:13px;">✦ Active ✦</span>`;
        } else if(isOwned) {
            actionHtml = `<button class="btn" style="padding:5px 12px; font-size:11px;" onclick="equipItem('${item.category}', '${item.name}')">Weave On</button>`;
        } else {
            actionHtml = `<button class="btn btn-shop" style="padding:5px 12px; font-size:11px;" onclick="buyItem('${item.id}')">Buy [${item.cost}g]</button>`;
        }

        container.innerHTML += `
            <div class="shop-item ${isOwned ? 'owned' : ''}">
                <div class="item-color-preview" style="background:${item.color}"></div>
                <strong style="font-size:13px; text-align:center;">${item.name}</strong>
                <span style="font-size:10px; opacity:0.6">${item.category.toUpperCase()}</span>
                ${actionHtml}
            </div>
        `;
    });
}

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if(player.coins >= item.cost) {
        player.coins -= item.cost;
        player.inventory.push(item.name);
        player.equipped[item.category] = item.name;
        updateHUD();
        updateAvatarLayers();
        playSynthTone(600, 'triangle', 0.15);
    } else {
        alert("Your gold reserves are too shallow for this relic!");
    }
}

function equipItem(category, itemName) {
    player.equipped[category] = itemName;
    updateHUD();
    updateAvatarLayers();
}

// --- LIVE AVATAR LAYER SYNCHRONIZER ---
function updateAvatarLayers() {
    const hair = document.getElementById('av-hair');
    const torso = document.getElementById('av-torso');
    const legs = document.getElementById('av-legs');

    hair.style.backgroundColor = getRelicColor('hair', player.equipped.hair);
    torso.style.backgroundColor = getRelicColor('torso', player.equipped.torso);
    legs.style.backgroundColor = getRelicColor('legs', player.equipped.legs);
}

function getRelicColor(category, name) {
    if(name === 'Default' || name === 'Ragged Cloth' || name === 'Worn Trousers') {
        if(category === 'hair') return '#4a3728';
        if(category === 'torso') return '#7f5539';
        return '#4e525a';
    }
    return shopItems.find(i => i.name === name).color;
}

function updateHUD() {
    document.getElementById('hud-coins').innerText = player.coins;
    document.getElementById('hud-xp').innerText = player.xp;
    renderShop();
}

// --- JUICE: SCREEN FEEDBACK EFFECTS ---
function triggerVisualShock() {
    const container = document.getElementById('game-container');
    container.classList.add('shake');
    setTimeout(() => container.classList.remove('shake'), 400);
}

// Browser Web Audio API generator to mimic magical sounds without using file tracks
function playSynthTone(freq, type, duration) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch(e) {}
}

function restartGame() {
    player.inventory = ['Default', 'Ragged Cloth', 'Worn Trousers'];
    player.equipped = { hair: 'Default', torso: 'Ragged Cloth', legs: 'Worn Trousers' };
    document.getElementById('player-name').value = "";
    updateAvatarLayers();
    goToPage('home');
}
