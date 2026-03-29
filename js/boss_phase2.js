// boss_phase2.js
import { boss, setBossAnimation, startEnemyAttack, startBossNormalAttack, stopBossNormalAttack, stopEnemyAttack, bossCurrentAnimation } from './boss.js';
import { platforms } from './platform.js';
import { player } from './player.js';
import { wisadelShoot } from "./audio.js";

const canvas = document.getElementById("gameCanvas");
const rect = canvas.getBoundingClientRect();

let jumped = false;
let landed = false;
let summoned = false;
export let turrets = [];
let state = "idle"; // idle | summoning | active | jumping
let jumpCooldown = 0;
let platformPool = [...platforms];
let jumpTimes = 5;
let aimShootIntervalId = null; // 用來記住 interval
let attack = 0;

export let aimMarkers = []; // 儲存所有瞄準標記

export function bossPhase2Update() {
  switch (state) {
    case "idle":
      moveToRightCorner();
      break;
    case "summoning":
      if (!summoned) {
        summonTurrets();
        summoned = true;
      } else {
        summoned = false;
        shootPlayer();
        state = "active";
      };
      break;
    case "active":
      if (turrets.length === 0) {
        stopShootPlayer();
        setBossAnimation("StopShoot");

        setTimeout(() => {
          setBossAnimation("Idle");
        }, 500)

        setTimeout(() => {
          state = "jumping";
        }, 750);
      }
      break;
    case "jumping":
      if (jumpCooldown > 0) {
        if (boss.attacking) {
          boss.attackTimer--;

          if (boss.attackTimer <= 0) {
            boss.attacking = false;
          }
        } else {
          jumpCooldown--;
        }
      } else {
        teleportToRandomPlatform();
        attack = Math.random();

        if (attack < 0.5 && jumpTimes > 1) {
          setTimeout(() => {
            startBossNormalAttack(250);
            startEnemyAttack(boss, 50);
            setTimeout(() => {
              stopEnemyAttack(boss);
              stopBossNormalAttack();
            }, 250)
          }, 100)
        }

        jumpCooldown = 300;

        if (jumpTimes > 1) {
          jumpTimes--;
        } else {
          jumpTimes = 5;
          state = "idle";
          jumpCooldown = 0;
        }
      }
      break;
  }
}

function moveToRightCorner() {
  const targetX = boss.width * 2.5 + 1100;
  const targetY = boss.height;

  boss.invinsible = true;

  if (!landed) {
    if (!jumped && boss.y > rect.top) {
      setTimeout(() => {
        boss.y -= 20;
      }, 500)
    } else {
      jumped = true;
      boss.x = targetX
      if (boss.y < targetY) {
        boss.y += 10;
      } else {
        boss.y = targetY;
        setBossAnimation("StartShoot");
        setTimeout(() => {
          setBossAnimation("Aiming");
        }, 799)
        state = "summoning";
        landed = false;
        jumped = false;
      }
    }
  }
}

function summonTurrets() {
  turrets = [];
  let available = platforms.filter(p => {
    const playerOverlap =
      player.x + player.width > p.x && player.x < p.x + p.width;
    return !playerOverlap;
  });
  while (turrets.length < 3 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const plat = available.splice(index, 1)[0];
    turrets.push({
      x: plat.x + plat.width / 2 - 20,
      y: plat.y - 40,
      width: 40,
      height: 40,
      hp: 50,
      maxHp: 50,
      normalAttack: null
    });
  }
}

export function drawTurrets(ctx) {
  turrets.forEach(t => {
    // 畫砲台本體
    const turretImg = new Image();
    turretImg.src = "./bullets/turret.gif";

    const isFacingRight = player.x - t.x < 0;
    const scaleX = isFacingRight ? 1 : -1;
    const drawX = isFacingRight ? t.x - 100 : -(t.x + t.width + 100);
    const drawY = t.y - 155;
    const drawWidth = t.width + 200;
    const drawHeight = t.height + 200;

    // 朝向玩家
    ctx.save();
    ctx.scale(scaleX, 1); // 水平翻轉
    ctx.drawImage(turretImg, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    //ctx.fillStyle = "purple";
    //ctx.fillRect(t.x, t.y, t.width, t.height);

    // 血條位置（在砲台上方）
    const barWidth = t.width;
    const barHeight = 6;
    const barX = t.x;
    const barY = t.y - 10;

    // 背景條
    ctx.fillStyle = "gray";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 避免低於 0
    destroyTurret();

    // 血量比例
    const healthRatio = t.hp / t.maxHp;

    // 紅色血量條
    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

    // 黑邊框（可選）
    ctx.strokeStyle = "black";
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 砲台攻擊
    let rd = Math.random() * 4000;
    startEnemyAttack(t, rd + 4000);
  });
}

function destroyTurret() {
  let i = 0;

  for (const turret of turrets) {
    if (turret.hp <= 0) {
      stopEnemyAttack(turret);
      turrets.splice(i, 1);
    }

    i++;
  }
}

// 呼叫這個啟動定時鎖定攻擊
function shootPlayer() {

  if (aimShootIntervalId !== null) return;

  aimShootIntervalId = setInterval(() => {
    const setOffX = -5;
    const setOffY = -120;

    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;

    // === 創建瞄準圖像 (targeting.gif) ===
    const targetImg = document.createElement("img");
    targetImg.src = "./bullets/targeting.gif";
    targetImg.style.position = "absolute";
    targetImg.style.transform = "scale(9)";
    targetImg.style.width = "50px";
    targetImg.style.height = "50px";
    targetImg.style.left = `${targetX + 100}px`;
    targetImg.style.top = `${targetY - 25}px`;
    targetImg.style.pointerEvents = "none";
    document.body.appendChild(targetImg);

    const marker = {
      x: targetX - 25 + setOffX,
      y: targetY - 25 + setOffY,
      width: 300,
      height: 300,
      img: targetImg,
      exploded: false
    };
    aimMarkers.push(marker);

    if (turrets.length != 0) {
      setBossAnimation("Aiming")
    }

    setTimeout(() => {
      if (bossCurrentAnimation === "Aiming") {
        setBossAnimation("Shoot");
        wisadelShoot.play();
        setTimeout(() => {
          if (bossCurrentAnimation === "Shoot") {
            setBossAnimation("Aiming");
          }
        }, 5000)
      }
    }, 1500)

    // === 兩秒後爆炸 ===
    setTimeout(() => {
      /* === 顯示實際炸到範圍（方便調試）===
      const debugExplosionBox = document.createElement("div");
      debugExplosionBox.style.position = "absolute";
      debugExplosionBox.style.border = "2px solid transparent";
      debugExplosionBox.style.width = `${marker.width}px`;
      debugExplosionBox.style.height = `${marker.height}px`;
      debugExplosionBox.style.left = `${marker.x}px`;
      debugExplosionBox.style.top = `${marker.y}px`;
      debugExplosionBox.style.pointerEvents = "none";
      document.body.appendChild(debugExplosionBox);

      // 幾秒後自動移除紅框
      setTimeout(() => {
        debugExplosionBox.remove();
      }, 1000); */

      marker.exploded = true;

      // 移除 targeting.gif
      marker.img.remove();

      // 加入 explosion.gif
      const explosionImg = document.createElement("img");
      explosionImg.src = "./bullets/explosion.gif";
      explosionImg.style.position = "absolute";
      explosionImg.style.transform = "scale(6)";
      explosionImg.style.width = "100px";
      explosionImg.style.height = "100px";
      explosionImg.style.left = `${marker.x + 100 - setOffX}px`;
      explosionImg.style.top = `${marker.y - 25 - setOffY}px`;
      explosionImg.style.pointerEvents = "none";
      document.body.appendChild(explosionImg);

      marker.img = explosionImg;

      // === 檢查是否炸到玩家 ===
      const inExplosion =
        player.x + player.width > marker.x &&
        player.x < marker.x + marker.width &&
        player.y + player.height > marker.y &&
        player.y < marker.y + marker.height;

      if (inExplosion) {
        player.hp -= 3;
        if (player.hp < 0) player.hp = 0;
        //console.log("玩家被炸中！");
      }

      // === 再過 1 秒清除 explosion.gif ===
      setTimeout(() => {
        explosionImg.remove();
        aimMarkers = aimMarkers.filter(m => m !== marker);
      }, 4800);

    }, 2000);

  }, 8000);
}

export function stopShootPlayer() {
  boss.invinsible = false;

  if (aimShootIntervalId !== null) {
    clearInterval(aimShootIntervalId);
    aimShootIntervalId = null;
  }
}



function teleportToRandomPlatform() {
  const choices = platforms.filter(p => p.width > boss.width);
  const choice = choices[Math.floor(Math.random() * choices.length)];
  boss.x = choice.x + (choice.width - boss.width) / 2;
  boss.y = choice.y - boss.height;
}