import { player, setPlayerAnimation, playerCurrentAnimation } from './player.js';
import { boss } from './boss.js';
import { turrets } from './boss_phase2.js';
import { Rosmontis_AttackSound } from './audio.js';

// === Combo 系統狀態 ===
let comboIndex = 0;               // 現在打到第幾招
let lastComboTime = 0;            // 上一次按攻擊的時間
const comboTimeout = 1800;         // 連擊時間間隔（ms）
let attackBoxTimer = 0;
let currentAttackBox = null;
let nextAllowedAttackTime = 0;
export let isMelee = false;

const normalCooldown = 900;
const finalCooldown = 1800;

// === Combo 動作設定（可以加入更多）===
const comboMoves = [
  { damage: 7, range: 90, color: 'transparent' }, // 第一招 (Bug 第一招的Cooldown是第三招的)
  { damage: 7, range: 90, color: 'transparent' }, // 第二招
  { damage: 15, range: 140, color: 'transparent' }, // 第三招
];

// === 呼叫這個開始攻擊 ===
export function performMeleeAttack(canvas) {
  const now = Date.now();
  const rect = canvas.getBoundingClientRect();
  const direction = player.facing === "right" ? 1 : -1;
  const centerX = rect.left + window.scrollX + player.x + player.width / 2 - 10 + 80 * direction;
  const centerY = rect.top + window.scrollY + player.y + 50;

  // 冷卻期間內不能攻擊
  if (now < nextAllowedAttackTime) {
    //console.log("攻擊冷卻中...");
    return;
  }

  // Combo 中斷就重置
  if (now - lastComboTime > comboTimeout) {
    comboIndex = 0;
  }

  // 取得這一招
  const move = comboMoves[comboIndex];
  if (!move) return;

  if (comboIndex < 2) {
    isMelee = true;

    setTimeout(() => {
      isMelee = false;
      if (playerCurrentAnimation === "Melee") {
        setPlayerAnimation("Idle");
      }
    }, normalCooldown);

    setPlayerAnimation("Melee");
    // 執行攻擊 (2025/ 06/ 15)太可怕了! 為什麼最後一段攻擊自己取消繪製了
    spawnSlashEffect(centerX, centerY, player.facing, comboIndex);
    Rosmontis_AttackSound.currentTime = 0;
    Rosmontis_AttackSound.play();
    attack();
  } else {
    isMelee = true;

    setTimeout(() => {
      isMelee = false;
      if (playerCurrentAnimation === "HeavyMelee") {
        setPlayerAnimation("Idle");
      }
    }, 960);

    setPlayerAnimation("HeavyMelee");
    attack();

    setTimeout(() => {
      spawnHeavyAttackEffect(centerX, centerY, player.facing);
      Rosmontis_AttackSound.currentTime = 0;
      Rosmontis_AttackSound.play();
    }, 500)
  }



  function attack() {
    lastComboTime = now;

    const attackBox = {
      x: player.x + (player.facing === 'left' ? -move.range : player.width),
      y: player.y,
      width: move.range,
      height: player.height,
      color: move.color
    };

    currentAttackBox = attackBox;
    attackBoxTimer = 10;

    const hitBoss =
      attackBox.x < boss.x + boss.width &&
      attackBox.x + attackBox.width > boss.x &&
      attackBox.y < boss.y + boss.height &&
      attackBox.y + attackBox.height > boss.y;

    if (hitBoss && boss.hp > 0 && !boss.invinsible) {
      boss.hp -= move.damage;
    }

    for (const turret of turrets) {
      const hitTurret =
        attackBox.x < turret.x + turret.width &&
        attackBox.x + attackBox.width > turret.x &&
        attackBox.y < turret.y + turret.height &&
        attackBox.y + attackBox.height > turret.y;

      if (hitTurret && turret.hp > 0) {
        turret.hp -= move.damage;
      }
    }


    comboIndex++;

    // 如果是最後一招，才設定長冷卻，並重置 combo
    if (comboIndex >= comboMoves.length) {
      nextAllowedAttackTime = now + finalCooldown;
      comboIndex = 0;
    } else {
      nextAllowedAttackTime = now + normalCooldown;
    }
  }
}

export function drawAttackBox(ctx) {
  if (currentAttackBox && attackBoxTimer > 0) {
    ctx.fillStyle = currentAttackBox.color;
    ctx.fillRect(
      currentAttackBox.x,
      currentAttackBox.y,
      currentAttackBox.width,
      currentAttackBox.height
    );
    attackBoxTimer--;
    if (attackBoxTimer === 0) {
      currentAttackBox = null;
    }
  }
}



export function spawnSlashEffect(originX, originY, facing = "right", comboIndex) {
  const img = document.createElement("img");
  img.src = "./bullets/Rosmontis_melee_weapon.png";
  img.style.position = "absolute";
  img.style.width = "100px"; // 武器照片
  img.style.height = "30px";
  img.style.pointerEvents = "none";
  img.style.transformOrigin = "center center";
  img.style.opacity = "1";

  document.body.appendChild(img);

  let reverse = 1;

  if (comboIndex === 1) {
    reverse = -1;
  }

  let angle = -200; // 從上往下掃
  let maxAngle = -20;
  let drop = -30;
  let addDrop = 1 * reverse;
  let addAngle = 3.75 * reverse;
  const radius = 1; // 半徑
  const centerX = originX;
  const centerY = originY;
  const rotateDirection = facing === "right" ? 1 : -1;

  if (comboIndex === 1) {
    drop = 6;
    maxAngle = 20;
    angle = 200;
  }

  function animateSlash() {
    if (comboIndex === 0) {
      if (angle > maxAngle) {
        img.remove();
        return;
      }
    } else {
      if (angle < maxAngle) {
        img.remove();
        return;
      }
    }
    const rad = angle * (Math.PI / 180);

    // === 弧線上的點 ===
    const x = centerX + radius * Math.cos(rad) * rotateDirection;
    const y = centerY + radius * Math.sin(rad);

    // === 放置圖片（中心貼位置） ===
    img.style.left = `${x - 40}px`; // 讓圖片中心對齊弧線位置
    img.style.top = `${y + drop}px`;

    // 旋轉圖片讓「上方朝圓心」
    const rotation = angle + 90; // 讓圖片朝圓心（0 度朝右，+90 是向上）
    img.style.transform = `rotate(${rotation * rotateDirection}deg) scale(${rotateDirection * reverse}, 1)`;

    angle += addAngle;
    drop += addDrop;
    requestAnimationFrame(animateSlash);
  }

  animateSlash();
}


function spawnHeavyAttackEffect(originX, originY, facing = "right") {
  const direction = facing === "right" ? 1 : -1;

  // 建立兩張劍圖
  const img1 = document.createElement("img");
  const img2 = document.createElement("img");
  img1.src = "./bullets/Rosmontis_melee_weapon.png";
  img2.src = "./bullets/Rosmontis_melee_weapon.png";

  [img1, img2].forEach(img => {
    img.style.position = "absolute";
    img.style.width = "100px";
    img.style.height = "30px";
    img.style.pointerEvents = "none";
    img.style.transformOrigin = "center center";
    img.style.opacity = "1";
    document.body.appendChild(img);
  });

  let frame = 0;
  const maxFrames = 40;
  const offsetX = 0 * direction - 35;
  const offsetY = 20;

  function animateHeavyAttack() {
    if (frame > maxFrames) {
      img1.remove();
      img2.remove();
      return;
    }

    // 突刺距離：讓劍向前刺進
    const progress = frame / maxFrames;
    const forward = 40 * progress;

    // 一把劍稍微偏上，一把偏下
    const yOffset1 = -offsetY - 20;
    const yOffset2 = +offsetY - 20;

    img1.style.left = `${originX + offsetX + forward * direction}px`;
    img1.style.top = `${originY + yOffset1}px`;
    img1.style.transform = `scaleX(${direction}) rotate(0deg)`;

    img2.style.left = `${originX + offsetX + forward * direction}px`;
    img2.style.top = `${originY + yOffset2}px`;
    img2.style.transform = `scaleX(${direction}) rotate(0deg)`;

    frame++;
    requestAnimationFrame(animateHeavyAttack);
  }
  animateHeavyAttack();
}