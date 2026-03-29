const canvas = document.getElementById("gameCanvas")
import { platforms } from './platform.js';
import { player } from "./player.js";
import { boss, setBossAnimation, bossCurrentAnimation, syncBossImagePosition } from "./boss.js";
import { bullets, shootEnemyBullet } from "./bullet.js";



// === 變數設定 ===
const gravity = 0.05;
let onPlatform = false;
let jumping = false;

const evadeDistance = 600; // 多近算“靠近”
const hoverRange = 60;     // 小範圍移動最大距離

const chargeDistance = 80;      // 閃躲距離



// === hover 動作 ===
function hoverMovement() {
    // 左右小範圍移動 around homeX
    if (boss.x < boss.homeX - hoverRange) {
        boss.direction = 1;

    } else if (boss.x > boss.homeX + hoverRange) {
        boss.direction = -1;

    }
    boss.x += boss.speed * boss.direction;
}



// === 子彈是否接近 ===
function detectIncomingBullet() {
    for (const bullet of bullets) {
        // 判斷子彈是否在 Boss 水平範圍內附近 (可調整範圍)
        const horizontalDist = Math.abs(bullet.x - boss.x);
        const verticalDist = Math.abs(bullet.y - boss.y);

        // 設定偵測範圍，例如水平 100px，垂直 50px
        if (horizontalDist < 150 && verticalDist < 50) {
            // 再判斷子彈是往 Boss 方向飛的嗎？
            // 例如如果子彈在 Boss 左邊，速度要向右(正方向)
            if ((bullet.x < boss.x && bullet.dx > 0) ||
                (bullet.x > boss.x && bullet.dx < 0)) {
                return true;  // 發現威脅子彈
            }
        }
    }
    return false;
}



// === Boss 是否重疊玩家 ===
function isOverlappingPlayer() {
    return (
        boss.x < player.x + player.width &&
        boss.x + boss.width > player.x &&
        boss.y < player.y + player.height &&
        boss.y + boss.height > player.y
    );
}



// === Boss 普通攻擊 ===
export function bossNormalAttack() {
    if (!boss.attacking) {
        boss.attacking = true;
        boss.attackTimer = 270;
        shootEnemyBullet(boss);
    }
}



// === BOSS 移動 ===
export function bossPhase1Update() {
    const distanceToPlayer = Math.sqrt((player.x - boss.x) ** 2 + (player.y - boss.y) ** 2);

    // === 攻擊準備 ===
    if (boss.attacking) {
        boss.attackTimer--;
        if (boss.attackTimer <= 0) {
            boss.attacking = false;
        }
        return;
    }

    // === 模式切換 ===
    if (distanceToPlayer < evadeDistance) {
        // 玩家太近，切換成逃跑模式
        if (boss.mode !== "evade") {
            // 只在切進 evade 的那一瞬間處理
            const bossDodge = Math.random();
            if (bossDodge >= 0.8) {
                // 20% 機率不逃跑，改成 hover
                boss.mode = "hover";

                // 如果真的切進 hover，更新 homeX
                if (boss.lastMode === "evade") {
                    if (boss.x <= hoverRange) {
                        boss.homeX = hoverRange;
                    } else if (boss.x >= canvas.width - hoverRange - boss.width) {
                        boss.homeX = canvas.width - hoverRange - boss.width;
                    } else {
                        boss.homeX = boss.x;
                    }
                }
            } else {
                boss.mode = "evade";
            }
        }
    } else {
        // 玩家遠離，回復 hover
        if (boss.mode !== "hover") {
            boss.mode = "hover";

            // 只有當從 evade 回 hover 才設定 homeX
            if (boss.lastMode === "evade") {
                if (boss.x <= hoverRange) {
                    boss.homeX = hoverRange;
                } else if (boss.x >= canvas.width - hoverRange - boss.width) {
                    boss.homeX = canvas.width - hoverRange - boss.width;
                } else {
                    boss.homeX = boss.x;
                }
            }
        }
    }

    // === 避免貼牆 ===
    if (boss.x <= hoverRange) {
        boss.homeX = hoverRange * 2;
    } else if (boss.x >= canvas.width - hoverRange - boss.width) {
        boss.homeX = canvas.width - hoverRange * 2 - boss.width;
    }

    // === 移動模式 ===
    if (boss.mode === "hover") {
        hoverMovement();

    } else if (boss.mode === "evade") {

        // === 如果是 run 模式 ===
        if (boss.subMode === "run") {
            // 若太靠近，觸發 charge（只穿越一次）
            if ((distanceToPlayer < chargeDistance || isOverlappingPlayer()) && boss.chargeTimer <= 0) {
                boss.subMode = "charge";
                boss.chargeTimer = boss.chargeDuration;
                boss.direction = player.x > boss.x ? 1 : -1; // 朝玩家方向
            } else {
                // 正常逃跑（遠離玩家）
                boss.direction = player.x < boss.x ? 1 : -1;
                boss.x += boss.speed * boss.direction;
            }

            // 接牆盤旋
            if (boss.x <= hoverRange) {
                boss.subMode = "hover";
                boss.wallSide = "left";
                boss.homeX = hoverRange;
            } else if (boss.x + boss.width >= canvas.width - hoverRange) {
                boss.subMode = "hover";
                boss.wallSide = "right";
                boss.homeX = canvas.width - hoverRange - boss.width;
            }

            // === charge 狀態：穿越玩家 ===
        } else if (boss.subMode === "charge") {
            boss.x += boss.speed * 8 * boss.direction;
            boss.chargeTimer--;

            if (boss.chargeTimer <= 0) {
                boss.subMode = "run"; // 衝刺結束恢復 run
            }

            // === hover 模式 ===
        } else if (boss.subMode === "hover") {
            // 照 homeX 盤旋
            if (boss.x < boss.homeX - hoverRange) {
                boss.direction = 1;
            } else if (boss.x > boss.homeX + hoverRange) {
                boss.direction = -1;
            }
            boss.x += boss.speed * boss.direction;

            // 如果玩家靠近，準備逃跑
            if (distanceToPlayer < chargeDistance) {
                boss.subMode = "run";
                boss.wallSide = null;
            }
        }
    }

    // === 地圖邊界限制 ===
    if (boss.x < 0) boss.x = 0;
    if (boss.x + boss.width > canvas.width) {
        boss.x = canvas.width - boss.width;
    }

    // === 跳躍邏輯 ===
    if (boss.onGround && boss.jumpCooldown <= 0) {
        let bulletThreat = detectIncomingBullet();
        if (bulletThreat) {
            jumping = true;
            boss.velocityY = boss.jumpPower;
            boss.onGround = false;
            boss.jumpCooldown = 120;  // 冷卻時間可調

        } else {
            const tooCloseJump = Math.random();
            // 你原本的跳躍條件，例如靠近玩家時跳
            if ((Math.abs(player.x - boss.x) < 100) && tooCloseJump <= 0.2) {
                jumping = true;
                boss.velocityY = boss.jumpPower;
                boss.onGround = false;
                boss.jumpCooldown = 300;
            }
        }
    }

    // === 平台判斷 ===
    onPlatform = false;
    for (const platform of platforms) {
        // 是否在平台上
        const isHorizontallyAligned =
            boss.x + boss.width > platform.x &&
            boss.x < platform.x + platform.width;

        const isFeetTouchingPlatform =
            boss.y + boss.height >= platform.y &&
            boss.y + boss.height <= platform.y + platform.height;

        if (
            (boss.velocityY >= 0) && // 僅限下落時才檢查平台碰撞( 終於找到了! 2025/6/7 12:33 ) , 包含下落與靜止狀態 <-- 沒有，問題只是下落速度太快來不及停住而已 :/
            isHorizontallyAligned &&
            isFeetTouchingPlatform
        ) {
            // 玩家腳在平台上，修正位置並重設速度
            boss.y = platform.y - boss.height;
            boss.velocityY = 0;
            onPlatform = true;
            break;
        }
    }

    boss.onGround = onPlatform;

    // 沒站在平台上，繼續下墜
    if (!boss.onGround) {
        boss.velocityY += gravity;
    }
    boss.y += boss.velocityY;

    if (boss.onGround && (jumping == true)) {
        setBossAnimation("Jump");
        jumping = false;
        setTimeout(() => {
            if (bossCurrentAnimation === "Jump" && boss.hp > 0) {
                setBossAnimation("Idle");
            }
        }, 700);
    }

    // 冷卻時間減少
    if (boss.jumpCooldown > 0) {
        boss.jumpCooldown--;
    }

    // 更新現在模式
    boss.lastMode = boss.mode;
}