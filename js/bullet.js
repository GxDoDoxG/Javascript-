import { player } from "./player.js";
import { boss } from "./boss.js";
import { turrets } from "./boss_phase2.js";

const canvas = document.getElementById("gameCanvas")

// === 子彈設定 ===
export const bullets = []; // 玩家子彈
export const enemyBullets = []; // Boss 子彈
export const previewLines = []; // Boss 射擊預覽線

const bulletSpeed = 7;
const bulletWidth = 8;
const bulletHeight = 10;
const enemyBulletSpeed = 6;



// === 發射子彈函數 ===
export function shootPlayerBullet(mouseX, mouseY) {
    // 子彈起點在玩家頭頂中間
    const bulletX = player.x + player.width / 2 - bulletWidth / 2;
    const bulletY = player.y + player.height / 2 - bulletWidth / 2;

    // 計算方向向量（從玩家指向滑鼠）
    const dx = mouseX - bulletX;
    const dy = mouseY - bulletY;
    const length = Math.sqrt(dx * dx + dy * dy);

    const directionX = dx / length;
    const directionY = dy / length;

    bullets.push({
        x: bulletX,
        y: bulletY,
        width: bulletWidth,
        height: bulletHeight,
        color: "yellow",
        dx: directionX,
        dy: directionY
    });
}



// == 子彈位置更新 ==
export function playerBulletsSpotUpdate() {
    // 玩家打 Boss
    for (let i = bullets.length - 1; i >= 0; i--) {
        let hitTurret = false;

        bullets[i].x += bullets[i].dx * bulletSpeed;
        bullets[i].y += bullets[i].dy * bulletSpeed;


        // 子彈和 Boss 碰撞
        if (isColliding(bullets[i], boss) && !boss.invinsible) {
            bullets.splice(i, 1); // 子彈消失
            boss.hp -= 10;           // Boss 扣血

            // 防止血量變負
            if (boss.hp < 0) boss.hp = 0;
            continue; // 跳過下面移除判斷，已刪除此子彈
        }

        // 子彈和 turret 碰撞
        for (const turret of turrets) {
            if (isColliding(bullets[i], turret)) {
                bullets.splice(i, 1);
                turret.hp -= 10;

                if (turret.hp < 0) turret.hp = 0;
                hitTurret = true;
                break;
            }
        }

        if (hitTurret) {
            continue;
        }

        // 移除離開畫面的子彈
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }

    // Boss 打玩家
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let enemyBullet = enemyBullets[i];

        enemyBullet.x += enemyBullet.dx * enemyBulletSpeed;
        enemyBullet.y += enemyBullet.dy * enemyBulletSpeed;

        if (isColliding(enemyBullet, player)) {
            enemyBullets.splice(i, 1);
            player.hp--;
            if (player.hp < 0) player.hp = 0;
            break;
        }

        // 超出畫面刪除（改成檢查 x 或 y 超出）
        if (
            enemyBullet.x < 0 || enemyBullet.x > canvas.width ||
            enemyBullet.y < 0 || enemyBullet.y > canvas.height
        ) {
            enemyBullets.splice(i, 1);
        }
    }

}



// === Boss 發射子彈 ===
export function shootEnemyBullet(shooter) {
    const bulletX = shooter.x + shooter.width / 2 - bulletWidth / 2;
    const bulletY = shooter.y + shooter.height / 2 - bulletHeight / 2;

    const dx = (player.x + player.width / 2) - bulletX;
    const dy = (player.y + player.height / 2) - bulletY;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 單位方向向量
    const dirX = dx / length;
    const dirY = dy / length;

    // 延伸線段的長度（越大越長）
    const lineLength = 2000;

    const targetX = bulletX + dirX * lineLength;
    const targetY = bulletY + dirY * lineLength;


    // 軌跡線資訊
    previewLines.push({
        fromX: bulletX,
        fromY: bulletY,
        toX: targetX,
        toY: targetY,
        duration: 800,
        timestamp: Date.now()
    });


    // 延遲射擊
    setTimeout(() => {
        const dx = targetX - bulletX;
        const dy = targetY - bulletY;
        const length = Math.sqrt(dx * dx + dy * dy);

        const directionX = dx / length;
        const directionY = dy / length;

        // 加入子彈（加上方向 dx, dy）
        enemyBullets.push({
            x: bulletX,
            y: bulletY,
            width: bulletWidth,
            height: bulletHeight,
            color: "red",
            dx: directionX,
            dy: directionY
        });
    }, 800);
}



// === 碰撞偵測函數（矩形碰撞），看子彈是否打到 BOSS===
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}