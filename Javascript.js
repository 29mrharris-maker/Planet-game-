var points = 0, clickPower = 1, pointsPerSecond = 0, globalMultiplier = 1, totalClicks = 0, bossesDefeated = 0;
var shieldHealth = 100, turretCount = 0, titanMechCount = 0, totalAutoMiners = 0;
var currentPlanet = 'moon';
var unlockedPlanets = { 
  moon: true, mercury: false, venus: false, mars: false, 
  jupiter: false, saturn: false, uranus: false, neptune: false, station: false 
};
var isGodMode = false, isInfPoints = false, gameSpeedMultiplier = 1;
var isPaused = false;

var darkMatter = 0;
var critChanceLevel = 0;
var mechOverclockLevel = 0;
var shieldRegenLevel = 0;

var achievements = [
  { id: 'c100', name: 'Commander', desc: '100 Total Clicks', multBonus: 0.1, unlocked: false },
  { id: 'b1', name: 'Titan Slayer', desc: 'Defeat 1 Boss', multBonus: 0.25, unlocked: false },
  { id: 'm10', name: 'Mech Battalion', desc: 'Own 10 Titan Mechs', multBonus: 0.2, unlocked: false },
  { id: 'p1M', name: 'Tycoon', desc: 'Reach 1,000,000 Points', multBonus: 0.5, unlocked: false }
];

var particleFX = [];
var floatingTexts = [];
var spawnedVisualUnits = [];
var warpSpeedMultiplier = 1;

var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null;

function playSynthSound(freq, type, duration) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

var planetConfig = {
  moon: { mult: 1.0, base: '#b0b5bc', maria: '#2b2d33', beamColor: '#00e5ff' },
  mercury: { mult: 1.8, base: '#8c8c8c', maria: '#4a4a4a', beamColor: '#ffaa00' },
  venus: { mult: 2.2, base: '#e3bb76', maria: '#a37638', beamColor: '#ff6600' },
  mars: { mult: 3.0, base: '#c85232', maria: '#421206', beamColor: '#ff3300' },
  jupiter: { mult: 6.0, base: '#d8a36c', maria: '#6e431e', beamColor: '#ffaa00' },
  saturn: { mult: 10.0, base: '#e4d191', maria: '#a18e56', beamColor: '#ffe57f' },
  uranus: { mult: 18.0, base: '#7de3e6', maria: '#3ba2a6', beamColor: '#00ffff' },
  neptune: { mult: 30.0, base: '#4b70dd', maria: '#1a338b', beamColor: '#3366ff' },
  station: { mult: 50.0, base: '#0f172a', maria: '#00ffcc', beamColor: '#00ffcc' }
};

var upgrades = [
  { id: 'c1', name: 'Lunar Rover', type: 'rover', baseCost: 15, power: 1, count: 0, desc: '+1 per click', label: 'ROVER' },
  { id: 'a1', name: 'Mining Bot', type: 'bot', baseCost: 50, power: 1, count: 0, desc: '+1 per sec', label: 'BOT' },
  { id: 'd1', name: 'Orbital Defender', type: 'defense', baseCost: 60, power: 1, count: 0, desc: 'Fires defense lasers', label: 'DEFENDER' },
  { id: 'c2', name: 'Plasma Drill', type: 'drill', baseCost: 100, power: 5, count: 0, desc: '+5 per click', label: 'DRILL' },
  { id: 'u_mercury', name: 'Unlock Mercury Sector', type: 'planet', planetKey: 'mercury', baseCost: 300, power: 0, count: 0, desc: 'Unlocks 3D Mercury (1.8x Yield)', label: 'SECTOR' },
  { id: 'a2', name: 'Solar Array', type: 'solar', baseCost: 500, power: 8, count: 0, desc: '+8 per sec', label: 'SOLAR' },
  { id: 'u_venus', name: 'Unlock Venus Sector', type: 'planet', planetKey: 'venus', baseCost: 800, power: 0, count: 0, desc: 'Unlocks 3D Venus (2.2x Yield)', label: 'SECTOR' },
  { id: 'u_mars', name: 'Unlock Mars Sector', type: 'planet', planetKey: 'mars', baseCost: 1500, power: 0, count: 0, desc: 'Unlocks 3D Mars (3.0x Yield)', label: 'SECTOR' },
  { id: 'd_mech', name: 'Titan Mech Squad', type: 'titan', baseCost: 2000, power: 8, count: 0, desc: 'Deploys battle mechs', label: 'MECH' },
  { id: 'u_jupiter', name: 'Unlock Jupiter Sector', type: 'planet', planetKey: 'jupiter', baseCost: 10000, power: 0, count: 0, desc: 'Unlocks 3D Jupiter (6.0x Yield)', label: 'SECTOR' },
  { id: 'u_saturn', name: 'Unlock Saturn Sector', type: 'planet', planetKey: 'saturn', baseCost: 25000, power: 0, count: 0, desc: 'Unlocks 3D Saturn (10x Yield)', label: 'SECTOR' },
  { id: 'm1', name: 'Graviton Multiplier', type: 'mult', baseCost: 35000, power: 2, count: 0, desc: 'Doubles output', label: 'GRAV' },
  { id: 'u_uranus', name: 'Unlock Uranus Sector', type: 'planet', planetKey: 'uranus', baseCost: 50000, power: 0, count: 0, desc: 'Unlocks 3D Uranus (18x Yield)', label: 'SECTOR' },
  { id: 'u_neptune', name: 'Unlock Neptune Sector', type: 'planet', planetKey: 'neptune', baseCost: 85000, power: 0, count: 0, desc: 'Unlocks 3D Neptune (30x Yield)', label: 'SECTOR' },
  { id: 'u_station', name: 'Unlock Station Sector', type: 'planet', planetKey: 'station', baseCost: 150000, power: 0, count: 0, desc: 'Unlocks 3D Station (50x Yield)', label: 'SECTOR' },
  { id: 'dm_crit', name: 'Hyper Crit Strike', type: 'dm_crit', dmCost: 1, count: 0, desc: '10% chance for 5x Click', label: 'DARK' },
  { id: 'dm_regen', name: 'Shield Matrix Regen', type: 'dm_regen', dmCost: 2, count: 0, desc: 'Passively restores shield', label: 'DARK' }
];

var canvas = document.getElementById('gameCanvas');
var ctx = canvas ? canvas.getContext('2d') : null;
var planetRotation = 0;
var stars = [], laserBeams = [];

function resizeCanvas() {
  if (!canvas) canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var parent = document.getElementById('clickArea');
  var w = (parent && parent.clientWidth > 0) ? parent.clientWidth : 600;
  var h = (parent && parent.clientHeight > 0) ? parent.clientHeight : 600;
  canvas.width = w;
  canvas.height = h;
}

for (var i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * 1200,
    y: Math.random() * 900,
    radius: Math.random() * 1.5,
    alpha: 0.2 + Math.random() * 0.8,
    speed: 0.2 + Math.random() * 0.5
  });
}

function checkAchievements() {
  for (var a = 0; a < achievements.length; a++) {
    var ach = achievements[a];
    if (!ach.unlocked) {
      var cond = false;
      if (ach.id === 'c100' && totalClicks >= 100) cond = true;
      if (ach.id === 'b1' && bossesDefeated >= 1) cond = true;
      if (ach.id === 'm10' && titanMechCount >= 10) cond = true;
      if (ach.id === 'p1M' && points >= 1000000) cond = true;

      if (cond) {
        ach.unlocked = true;
        globalMultiplier += ach.multBonus;
        playSynthSound(800, 'triangle', 0.5);
        var banner = document.getElementById('achievementNotice');
        if (banner) {
          banner.innerText = '🏆 UNLOCKED: ' + ach.name;
          banner.classList.remove('hidden');
          setTimeout(function() { banner.classList.add('hidden'); }, 4000);
        }
      }
    }
  }
}

function addFloatingText(text, x, y, color) {
  floatingTexts.push({ text: text, x: x, y: y, alpha: 1.0, color: color || '#00e5ff' });
}

function addVisualUnitOnScreen(type) {
  var orbitDist = 90;
  var rotSpeed = 0.01;

  if (type === 'rover') { orbitDist = 65; rotSpeed = 0.008; }
  else if (type === 'bot') { orbitDist = 78; rotSpeed = 0.012; }
  else if (type === 'drill') { orbitDist = 45; rotSpeed = 0.004; }
  else if (type === 'solar') { orbitDist = 120; rotSpeed = -0.006; }
  else if (type === 'defense') { orbitDist = 140; rotSpeed = 0.009; }
  else if (type === 'titan') { orbitDist = 155; rotSpeed = -0.007; }

  spawnedVisualUnits.push({
    type: type,
    angle: Math.random() * Math.PI * 2,
    radius: orbitDist,
    speed: rotSpeed
  });
}

function fireLaser(x1, y1, x2, y2, color) {
  laserBeams.push({ x1: x1, y1: y1, x2: x2, y2: y2, color: color || '#00e5ff', life: 1.0 });
}

function drawVisualUnits(cx, cy) {
  for (var u = 0; u < spawnedVisualUnits.length; u++) {
    var unit = spawnedVisualUnits[u];
    if (!isPaused) unit.angle += unit.speed * gameSpeedMultiplier;

    var ux = cx + Math.cos(unit.angle) * unit.radius;
    var uy = cy + Math.sin(unit.angle) * unit.radius;

    ctx.save();
    ctx.translate(ux, uy);
    ctx.rotate(unit.angle + Math.PI / 2);

    if (unit.type === 'rover') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -4, 10, 8);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-2, -6, 4, 2);
    } else if (unit.type === 'bot') {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-4, -3, 8, 6);
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(-2, -5, 4, 2);
    } else if (unit.type === 'drill') {
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (unit.type === 'solar') {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-10, -2, 20, 4);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-8, -2, 6, 4);
      ctx.fillRect(2, -2, 6, 4);
    } else if (unit.type === 'defense') {
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.fillRect(-12, -3, 6, 6);
      ctx.fillRect(6, -3, 6, 6);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-4, -4, 8, 8);
    } else if (unit.type === 'titan') {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-8, -6, 16, 12);
      ctx.strokeRect(-8, -6, 16, 12);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-4, -2, 8, 3);
    }

    ctx.restore();
  }
}

function draw3DPlanetSector(cx, cy, radius) {
  if (!isPaused) planetRotation += 0.0035 * gameSpeedMultiplier;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  var cfg = planetConfig[currentPlanet];

  if (currentPlanet === 'moon') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    var moonCraters = [-0.4, 0.1, 0.5];
    for (var mc = 0; mc < moonCraters.length; mc++) {
      var mX = cx + Math.sin(planetRotation + moonCraters[mc] * 3) * (radius * 0.6);
      var mY = cy + moonCraters[mc] * (radius * 0.5);
      ctx.beginPath();
      ctx.arc(mX, mY, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (currentPlanet === 'mercury') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    var mercCrater = cx + Math.sin(planetRotation * 1.5) * (radius * 0.5);
    ctx.beginPath();
    ctx.arc(mercCrater, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentPlanet === 'venus') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    ctx.fillRect(cx - radius, cy - 20, radius * 2, 12);
    ctx.fillRect(cx - radius, cy + 10, radius * 2, 18);
  } else if (currentPlanet === 'mars') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    var marsCraters = [-0.3, 0.25];
    for (var mc = 0; mc < marsCraters.length; mc++) {
      var mX = cx + Math.sin(planetRotation + marsCraters[mc] * 4) * (radius * 0.7);
      var mY = cy + marsCraters[mc] * (radius * 0.4);
      ctx.beginPath();
      ctx.arc(mX, mY, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius + 8, radius * 0.45, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentPlanet === 'jupiter') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    ctx.fillRect(cx - radius, cy - 35, radius * 2, 16);
    ctx.fillRect(cx - radius, cy + 15, radius * 2, 22);
    var spotX = cx + Math.sin(planetRotation) * (radius * 0.6);
    ctx.fillStyle = '#cc3311';
    ctx.beginPath();
    ctx.ellipse(spotX, cy + 25, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentPlanet === 'saturn') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    ctx.fillRect(cx - radius, cy - 15, radius * 2, 8);
    ctx.fillRect(cx - radius, cy + 5, radius * 2, 12);
  } else if (currentPlanet === 'uranus') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    ctx.fillRect(cx - radius, cy - 10, radius * 2, 20);
  } else if (currentPlanet === 'neptune') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = cfg.maria;
    var nepSpot = cx + Math.sin(planetRotation * 0.8) * (radius * 0.5);
    ctx.beginPath();
    ctx.ellipse(nepSpot, cy - 10, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentPlanet === 'station') {
    ctx.fillStyle = cfg.base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  var sunlight = ctx.createRadialGradient(
    cx - radius * 0.4, cy - radius * 0.4, radius * 0.05,
    cx, cy, radius
  );
  sunlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  sunlight.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
  sunlight.addColorStop(0.85, 'rgba(0, 0, 0, 0.85)');
  sunlight.addColorStop(1, 'rgba(0, 0, 0, 0.98)');

  ctx.fillStyle = sunlight;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (currentPlanet === 'saturn') {
    ctx.save();
    ctx.strokeStyle = '#d4c383';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.5, radius * 0.4, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (currentPlanet === 'uranus') {
    ctx.save();
    ctx.strokeStyle = '#9be3e5';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 0.4, radius * 1.4, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderEngine() {
  resizeCanvas();
  if (!ctx && canvas) ctx = canvas.getContext('2d');
  if (!ctx) {
    requestAnimationFrame(renderEngine);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    s.y += s.speed * warpSpeedMultiplier;
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x % canvas.width, s.y % canvas.height, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;

  draw3DPlanetSector(centerX, centerY, 90);
  drawVisualUnits(centerX, centerY);

  for (var k = laserBeams.length - 1; k >= 0; k--) {
    var b = laserBeams[k];
    b.life -= 0.1;
    if (b.life <= 0) { laserBeams.splice(k, 1); continue; }
    ctx.save();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = b.life;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.restore();
  }

  for (var t = floatingTexts.length - 1; t >= 0; t--) {
    var ft = floatingTexts[t];
    ft.y -= 0.8;
    ft.alpha -= 0.02;
    if (ft.alpha <= 0) { floatingTexts.splice(t, 1); continue; }
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  requestAnimationFrame(renderEngine);
}

renderEngine();

function getCost(upgrade) {
  if (upgrade.type.startsWith('dm_')) return upgrade.dmCost;
  return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
}

function buyUpgrade(index) {
  if (isPaused) return;
  var up = upgrades[index];
  
  if (up.type === 'planet') {
    if (!unlockedPlanets[up.planetKey]) {
      var pCost = getCost(up);
      if (points >= pCost || isInfPoints) {
        if (!isInfPoints) points -= pCost;
        unlockedPlanets[up.planetKey] = true;
        currentPlanet = up.planetKey;
        
        var tabId = 'tab' + up.planetKey.charAt(0).toUpperCase() + up.planetKey.slice(1);
        var tab = document.getElementById(tabId);
        if (tab) tab.classList.remove('locked');

        var planetBtns = document.querySelectorAll('.planet-btn');
        for (var pb = 0; pb < planetBtns.length; pb++) {
          if (planetBtns[pb].dataset.planet) {
            planetBtns[pb].classList.toggle('active', planetBtns[pb].dataset.planet === currentPlanet);
          }
        }
      }
    }
    checkAchievements();
    renderUpgrades();
    updateDisplay();
    return;
  }

  if (up.type === 'dm_crit') {
    if (darkMatter >= up.dmCost) { darkMatter -= up.dmCost; critChanceLevel++; up.count++; }
  } else if (up.type === 'dm_regen') {
    if (darkMatter >= up.dmCost) { darkMatter -= up.dmCost; shieldRegenLevel++; up.count++; }
  } else {
    var cost = getCost(up);
    if (points >= cost || isInfPoints) {
      if (!isInfPoints) points -= cost;
      up.count++;
      if (up.type === 'rover' || up.type === 'drill') clickPower += up.power;
      else if (up.type === 'bot' || up.type === 'solar') { pointsPerSecond += up.power; totalAutoMiners++; }
      else if (up.type === 'mult') globalMultiplier *= up.power;
      else if (up.type === 'defense') { turretCount += up.power; }
      else if (up.type === 'titan') { titanMechCount += up.power; }

      addVisualUnitOnScreen(up.type);
    }
  }

  checkAchievements();
  renderUpgrades();
  updateDisplay();
}

function renderUpgrades() {
  var upgradesList = document.getElementById('upgradesList');
  if (!upgradesList) return;
  upgradesList.innerHTML = '';

  for (var i = 0; i < upgrades.length; i++) {
    var up = upgrades[i];
    var isUnlockedSector = up.type === 'planet' && unlockedPlanets[up.planetKey];
    var isDM = up.type.startsWith('dm_');
    var cost = getCost(up);
    var canAfford = isDM ? (darkMatter >= cost) : ((points >= cost || isInfPoints) && !isUnlockedSector);

    var card = document.createElement('div');
    card.className = 'upgrade-card ' + (canAfford ? '' : 'disabled ') + (isDM ? 'darkmatter-type ' : '');
    card.dataset.index = i;

    var rightHTML = isUnlockedSector 
      ? '<div class="card-cost" style="color:#00ffaa;">UNLOCKED</div>' 
      : '<div class="card-cost">' + cost.toLocaleString() + (isDM ? ' DM' : '') + '</div>';

    card.innerHTML = '<div class="card-info"><h4>[' + up.label + '] ' + up.name + '</h4><p>' + up.desc + '</p></div><div class="card-cost-group">' + rightHTML + '</div>';
    upgradesList.appendChild(card);
  }
}

function updateDisplay() {
  var pMult = planetConfig[currentPlanet].mult;
  var pd = document.getElementById('pointsDisplay');
  var cps = document.getElementById('cpsDisplay');
  var cp = document.getElementById('clickPowerDisplay');
  var tc = document.getElementById('turretCountDisplay');
  var mc = document.getElementById('mechCountDisplay');
  var mult = document.getElementById('multDisplay');
  var dm = document.getElementById('darkMatterDisplay');

  if (pd) pd.innerText = Math.floor(points).toLocaleString();
  if (cps) cps.innerText = Math.floor(pointsPerSecond * globalMultiplier * pMult).toLocaleString() + ' per second';
  if (cp) cp.innerText = Math.floor(clickPower * globalMultiplier * pMult).toLocaleString();
  if (tc) tc.innerText = turretCount;
  if (mc) mc.innerText = titanMechCount;
  if (mult) mult.innerText = globalMultiplier.toFixed(1);
  if (dm) dm.innerText = darkMatter;
}

renderUpgrades();
updateDisplay();

function initDevMenu() {
  var devPanel = document.getElementById('devPanel');
  var toggleBtn = document.getElementById('devToggleBtn');
  var closeBtn = document.getElementById('closeDevBtn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (devPanel) devPanel.classList.toggle('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (devPanel) devPanel.classList.add('hidden');
    });
  }

  var devAdd10k = document.getElementById('devAdd10k');
  if (devAdd10k) {
    devAdd10k.addEventListener('click', function(e) {
      e.stopPropagation();
      points += 10000;
      updateDisplay();
      renderUpgrades();
    });
  }

  var devAdd1M = document.getElementById('devAdd1M');
  if (devAdd1M) {
    devAdd1M.addEventListener('click', function(e) {
      e.stopPropagation();
      points += 1000000;
      updateDisplay();
      renderUpgrades();
    });
  }

  var devMaxLaser = document.getElementById('devMaxLaser');
  if (devMaxLaser) {
    devMaxLaser.addEventListener('click', function(e) {
      e.stopPropagation();
      clickPower += 1000;
      updateDisplay();
    });
  }

  var devUnlockSectors = document.getElementById('devUnlockSectors');
  if (devUnlockSectors) {
    devUnlockSectors.addEventListener('click', function(e) {
      e.stopPropagation();
      unlockedPlanets = { 
        moon: true, mercury: true, venus: true, mars: true, 
        jupiter: true, saturn: true, uranus: true, neptune: true, station: true 
      };
      var tabs = document.querySelectorAll('.planet-btn');
      for (var t = 0; t < tabs.length; t++) tabs[t].classList.remove('locked');
      updateDisplay();
      renderUpgrades();
    });
  }

  var devGodMode = document.getElementById('devGodMode');
  if (devGodMode) {
    devGodMode.addEventListener('click', function(e) {
      e.stopPropagation();
      isGodMode = !isGodMode;
      shieldHealth = 100;
      updateDisplay();
    });
  }

  var devAddMechs = document.getElementById('devAddMechs');
  if (devAddMechs) {
    devAddMechs.addEventListener('click', function(e) {
      e.stopPropagation();
      titanMechCount += 10;
      for (var m = 0; m < 10; m++) addVisualUnitOnScreen('titan');
      updateDisplay();
    });
  }

  var devSpeedToggle = document.getElementById('devSpeedToggle');
  if (devSpeedToggle) {
    devSpeedToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      gameSpeedMultiplier = gameSpeedMultiplier === 1 ? 2 : 1;
      devSpeedToggle.innerText = 'Speed: ' + gameSpeedMultiplier + 'x';
    });
  }

  var devInfPoints = document.getElementById('devInfPoints');
  if (devInfPoints) {
    devInfPoints.addEventListener('click', function(e) {
      e.stopPropagation();
      isInfPoints = !isInfPoints;
      devInfPoints.innerText = 'Inf Points: ' + (isInfPoints ? 'ON' : 'OFF');
      if (isInfPoints) points = 999999999;
      updateDisplay();
      renderUpgrades();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDevMenu);
} else {
  initDevMenu();
}

document.addEventListener('click', function(e) {
  var target = e.target;

  if (target.closest('#devPanel') || target.closest('#devToggleBtn')) {
    return;
  }

  var planetTab = target.closest('.planet-btn');
  if (planetTab && planetTab.dataset.planet) {
    var pKey = planetTab.dataset.planet;
    if (unlockedPlanets[pKey]) {
      currentPlanet = pKey;
      var pBtns = document.querySelectorAll('.planet-btn');
      for (var b = 0; b < pBtns.length; b++) {
        if (pBtns[b].dataset.planet) {
          pBtns[b].classList.toggle('active', pBtns[b].dataset.planet === currentPlanet);
        }
      }
      updateDisplay();
    }
    return;
  }

  if (target.closest('#pauseGameBtn')) {
    isPaused = !isPaused;
    target.innerText = isPaused ? '▶️ Resume' : '⏸️ Pause';
    return;
  }

  var card = target.closest('.upgrade-card');
  if (card && card.dataset.index !== undefined) {
    buyUpgrade(parseInt(card.dataset.index, 10));
    return;
  }

  if (target.closest('#clickArea') && !target.closest('.bottom-hud') && !target.closest('.planet-bar')) {
    totalClicks++;
    playSynthSound(440, 'sine', 0.08);

    var rect = canvas.getBoundingClientRect();
    var clickX = e.clientX - rect.left;
    var clickY = e.clientY - rect.top;

    var pMult = planetConfig[currentPlanet].mult;
    var added = Math.floor(clickPower * globalMultiplier * pMult);
    points += added;

    addFloatingText('+' + added.toLocaleString(), clickX, clickY, planetConfig[currentPlanet].beamColor);
    fireLaser(clickX, clickY, canvas.width / 2, canvas.height / 2, planetConfig[currentPlanet].beamColor);

    checkAchievements();
    updateDisplay();
    renderUpgrades();
  }
});

setInterval(function() {
  if (!isPaused) {
    if (pointsPerSecond > 0) {
      var pMult = planetConfig[currentPlanet].mult;
      points += (pointsPerSecond * globalMultiplier * pMult) / 10;
    }
    updateDisplay();
    renderUpgrades();
  }
}, 100);