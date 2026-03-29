import * as Phase1 from './boss_phase1.js'; // 包裝進 Phase1
import * as Phase2 from './boss_phase2.js';

import { player } from "./player.js";
import { shootEnemyBullet } from "./bullet.js";
import { playBgm, stopBgm, transformSound, wisadelBgm, enemyAttackSound } from "./audio.js";

export let normalAttack = null;
export let BossNormalAttacking = null;
let soundEffect = false;
let transformCooldown = 800;
let transformed = false;



// === 判斷 Boss 的階段 ===
export function bossSpotUpdate() {
    if (boss.transforming) {
        if (transformCooldown >= 0) {
            stopBgm();
            transformCooldown--;
            return;
        }

        if (!soundEffect) {
            soundEffect = true;
            transformSound.currentTime = 0;
            transformSound.play();
        }

        stopBossNormalAttack();
        boss.phase1 = false;
        boss.invinsible = true;
        boss.maxHp = boss.hpPhase2
        if (boss.hp < boss.hpPhase2) {
            boss.hp += 0.5;

            if (boss.hp >= boss.hpPhase2) {
                boss.hp = boss.hpPhase2;
            }
        } else {
            if (transformed) {
                return;
            }
            
            setTimeout(() => {
                transformSound.pause();
                playBgm(wisadelBgm.src);
                setBossAnimation("Idle");
                boss.phase2 = true;
                boss.invinsible = false;
                boss.transforming = false;
            }, 2000)
            transformed = true;
        }

        return;
    }



    if (boss.phase1 === true) {
        if (boss.hp <= 0) {
            setBossAnimation("Stun")
            setTimeout(() => {
                if (bossCurrentAnimation = "Stun") {
                    setBossAnimation("Stunned");
                }
            }, 1000)
            boss.phase1 = false;
            boss.transforming = true;
            return;
        }
        startBossNormalAttack(4500)
        Phase1.bossPhase1Update();
    } else if (boss.phase2 === true) {
        Phase2.bossPhase2Update();
    }
}



// === BOSS 角色設定 ===
export const boss = {
    x: 1000,
    y: 460,
    width: 80,
    height: 80,
    color: "red",
    speed: 0.5,
    jumpPower: -4,
    jumpCooldown: 0,
    direction: 1, // 走路方向 1:往右, -1:往左
    hp: 100,
    maxHp: 100,
    hpPhase2: 200,
    phase1: true,
    phase2: false,
    velocityY: 0, // 垂直移動的速度
    onGround: false,
    homeX: 500,      // 盤旋中心點
    mode: "hover",    // hover: 小範圍盤旋、evade: 遠離玩家
    lastMode: "hover",
    subMode: "run", // run | hover
    wallSide: null, // 'left' 或 'right'
    chargeTimer: 0,        // 用來計時衝刺行為
    chargeDuration: 40,    // charge 狀態持續多久（可調整）
    attacking: false,
    attackTimer: 0,
    invinsible: false,
    normalAttack: null,
    transforming: false
};



// === Boss 動畫切換 ===
const sprite = document.getElementById("bossSprite");
export let bossCurrentAnimation = "Idle";

export function setBossAnimation(state) {
    if (!sprite) return;

    if (state === bossCurrentAnimation) {
        //console.log("Animation already set to:", state);
        return;
    } // 防止重複切換
    bossCurrentAnimation = state;

    switch (state) {
        case "Idle":
            sprite.src = "./wisadel_animations/Wisadel_Idle.gif";
            break;
        case "Run":
            sprite.src = "./wisadel_animations/Wisadel_Run.gif";
            break;
        case "Jump":
            sprite.src = "./wisadel_animations/Wisadel_Jump.gif";
            break;
        case "Attack":
            sprite.src = "./wisadel_animations/Wisadel_Attack.gif";
            break;
        case "Die":
            sprite.src = "./wisadel_animations/Wisadel_Die.gif";
            break;
        case "Dead":
            sprite.src = "./wisadel_animations/Wisadel_Died.gif";
            break;
        case "StartShoot":
            sprite.src = "./wisadel_animations/Wisadel_Skill_Begin.gif";
            break;
        case "Aiming":
            sprite.src = "./wisadel_animations/Wisadel_Skill_Idle.gif";
            break;
        case "Shoot":
            sprite.src = "./wisadel_animations/Wisadel_Skill_Trigger.gif";
            break;
        case "StopShoot":
            sprite.src = "./wisadel_animations/Wisadel_Skill_End.gif";
            break;
        case "Stun":
            sprite.src = "./wisadel_animations/Wisadel_Stun.gif";
            break;
        case "Stunned":
            sprite.src = "./wisadel_animations/Wisadel_Stunned.gif";
            break;
    }
}


// === 同步 Boss 圖片 ===
export function syncBossImagePosition() {
    const bossImg = document.getElementById("bossContainer");
    const canvas = document.getElementById("gameCanvas");
    if (!bossImg || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    // 計算玩家圖片的實際位置


    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    // 假設 boss.x 和 boss.y 是以 canvas 為單位的位置
    const offsetX = -3; // 微調偏移（可調整）
    const offsetY = -15.5; // 微調偏移（可調整）

    bossImg.style.left = rect.left + window.scrollX + (boss.x + offsetX) * scaleX + "px";
    bossImg.style.top = rect.top + window.scrollY + (boss.y + offsetY) * scaleY + "px";
    bossImg.style.transform = `scale(${scaleX * (player.x - boss.x > 0 ? 1 : -1)}, ${scaleY})`;
}



// === Boss 攻擊 ===
export function startBossNormalAttack(cooldown) {
    if (BossNormalAttacking !== null) return;

    BossNormalAttacking = setInterval(() => {
        if (boss.hp > 0) {
            enemyAttackSound.play();
            setBossAnimation("Attack");
            Phase1.bossNormalAttack();
            setTimeout(() => {
                if (bossCurrentAnimation != "Dead" && bossCurrentAnimation != "Die" && bossCurrentAnimation != "Stunned" && bossCurrentAnimation != "Stun") {
                    setBossAnimation("Idle");
                }
            }, 2000);
        }
    }, cooldown);
}

export function stopBossNormalAttack() {
    if (BossNormalAttacking !== null) {
        clearInterval(BossNormalAttacking);
        BossNormalAttacking = null;
    }
}



// === Turret 攻擊 ===
export function startEnemyAttack(turret, cooldown) {
    if (turret.normalAttack !== null) return;

    turret.normalAttack = setInterval(() => {
        if (turret.hp > 0) {
            enemyAttackSound.play();
            shootEnemyBullet(turret);
        }
    }, cooldown);
}

export function stopEnemyAttack(turret) {
    if (turret.normalAttack !== null) {
        clearInterval(turret.normalAttack);
        turret.normalAttack = null;
    }
}