// === 匯入其他 js ===
import { player, playerSpotUpdate, syncPlayerImagePosition, setPlayerAnimation, playerCurrentAnimation } from "./player.js";
import { boss, bossSpotUpdate, syncBossImagePosition, setBossAnimation, bossCurrentAnimation } from './boss.js';
import * as Phase2 from './boss_phase2.js';
import { bullets, enemyBullets, shootPlayerBullet, shootEnemyBullet, playerBulletsSpotUpdate, previewLines } from './bullet.js';
import { drawPlatforms } from './platform.js';
import { performMeleeAttack, drawAttackBox, isMelee } from './melee.js';
import { spawnFallingStrike, updateSkillObjects } from "./rangeAttack.js";
import { playBgm, stopBgm, rockBgm, winSound, loseSound } from "./audio.js";

// === 變數設定 ===
let shootLocked = false;
export function setShootLocked(value) {
    shootLocked = value;
}

window.readyGame = readyGame;
window.startGame = startGame;
window.showUpdate = showUpdate;
window.showWorkTeam = showWorkTeam;
window.troll = troll;
window.backToMenu = backToMenu;


// === 畫面控制 ===
function readyGame() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("tutorialMenu").style.display = "block";
}

function startGame() {
    document.getElementById("tutorialMenu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    initGame(); // <-- 啟動遊戲主邏輯
    playBgm(rockBgm.src);
}

function showUpdate() {
    alert("目前更新內容：\n Just A New 2D Boss Fighting Game!\n Hope you enjoy the game :)!");
}

function showWorkTeam() {
    alert("製作團隊: \n\t(只有) 陳馨宇 XD");
}

function troll() {
    alert("內容還未加入 \n敬請期待 XDDDDDD");
}

function backToMenu() {
    location.reload();
}

function win() {
    stopBgm();
    winSound.play();
    document.getElementById("winScreen").style.display = "block";
}

function lose() {
    stopBgm();
    loseSound.play();
    document.getElementById("gameOverScreen").style.display = "block";
}



// === 遊戲引擎 ===
function initGame() {
    // === 設定畫布 ===
    document.getElementById("playerContainer").style.display = "block";
    document.getElementById("bossContainer").style.display = "block";
    document.getElementById("playerSprite").style.display = "block";
    document.getElementById("bossSprite").style.display = "block";
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // === 變數設定 ===
    let holdTimer = null;
    let skillInterval = null;
    let holdTargetX = null;
    let holdTargetY = null;
    shootLocked = false;

    // 初始化冷卻時間
    let lastRangeAttackTime = 0;
    const holdDetect = 300;



    // === 鍵盤監控 ===
    const keys = {};

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
        }
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });


    // === 滑鼠監控 ===
    window.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            holdTimer = Date.now()

            holdTargetX = e.clientX;
            holdTargetY = e.clientY;

            // 防止重複啟動
            if (!skillInterval && !isMelee) {
                skillInterval = setInterval(() => {
                    const now = Date.now();
                    if (now - lastRangeAttackTime >= 2000) {
                        spawnFallingStrike(holdTargetX, holdTargetY, canvas);
                        setPlayerAnimation("Shoot");
                        shootLocked = true;

                        setTimeout(() => {
                            shootLocked = false;
                        }, 2000);

                        lastRangeAttackTime = now;
                    }
                }, 800);
            }
        }
    });

    window.addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            if (Date.now() - holdTimer <= holdDetect) {
                performMeleeAttack(canvas);
            }
            holdTimer = null;


            clearInterval(skillInterval);
            skillInterval = null;

            // 等待動畫播完再切回 Idle
            const trySetIdle = () => {
                if (!shootLocked && !isMelee) {
                    
                    if (playerCurrentAnimation === "Shoot" || playerCurrentAnimation === "Melee") {
                        setPlayerAnimation("Idle");
                    }
                } else {
                    setTimeout(trySetIdle, 100); // 每 100ms 檢查是否可切
                }
            };

            trySetIdle();
        }
    });

    window.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        if (mouseX < player.x + player.width / 2) {
            player.facing = "left";
        } else {
            player.facing = "right";
        }

        // 持續攻擊位置更新
        if (skillInterval !== null) {
            holdTargetX = e.clientX;
            holdTargetY = e.clientY;
        }
    });



    // === 繪製玩家體力條 ===
    function drawStaminaBar(ctx) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.font = "20px Arial";
        ctx.strokeText("Energy: ", 20, 110);
        ctx.fillText("Energy: ", 20, 110);



        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 120;

        const staminaRatio = player.stamina / player.maxStamina;

        ctx.fillStyle = "gray";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "lightYellow";
        ctx.fillRect(x, y, barWidth * staminaRatio, barHeight);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    function drawBossHealthBar(ctx) {
        const barWidth = 600;
        const barHeight = 25;
        const x = 400;
        const y = 140;

        const staminaRatio = boss.hp / boss.maxHp;

        ctx.fillStyle = "gray";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "red";
        ctx.fillRect(x, y, barWidth * staminaRatio, barHeight);

        ctx.strokeStyle = "black";
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 8;
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.strokeText("BOSS HP" , 610, 130);
        ctx.fillText("BOSS HP" , 610, 130);

        ctx.font = "20px Arial";
        ctx.lineWidth = 4;
        ctx.strokeText(`${boss.hp} / ${boss.maxHp}`, 670, 160);
        ctx.fillText(`${boss.hp} / ${boss.maxHp}`, 670, 160);
    }

    function drawPlayerHealthBar(ctx) {
        const barWidth = 350;
        const barHeight = 30;
        const x = 20;
        const y = 55;

        const staminaRatio = player.hp / player.maxhp;

        ctx.fillStyle = "gray";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "limeGreen";
        ctx.fillRect(x, y, barWidth * staminaRatio, barHeight);

        ctx.strokeStyle = "black";
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.strokeText("HP:" , 20, 40);
        ctx.fillText("HP:" , 20, 40);
        ctx.strokeText(`${player.hp} / ${player.maxhp}`, 160, 78);
        ctx.fillText(`${player.hp} / ${player.maxhp}`, 160, 78);
    }



    // === 畫面刷新 ===
    function render() {
        // 清除畫面
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 繪製平地
        drawPlatforms(ctx);

        // 畫出玩家
        //ctx.fillStyle = player.color;
        //ctx.fillRect(player.x, player.y, player.width, player.height);
        syncPlayerImagePosition();

        // 畫 BOSS
        //ctx.fillStyle = boss.color;
        //ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        syncBossImagePosition();

        // 畫玩家子彈
        updateSkillObjects(ctx, canvas);
        bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // 畫玩家攻擊框
        drawAttackBox(ctx);

        // 畫 Boss 子彈
        const now = Date.now();
        for (let i = previewLines.length - 1; i >= 0; i--) {
            const line = previewLines[i];
            if (now - line.timestamp > line.duration) {
                previewLines.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.moveTo(line.fromX, line.fromY);
            ctx.lineTo(line.toX, line.toY);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        enemyBullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });



        // 畫 bossPhase2 砲台
        Phase2.drawTurrets(ctx);


        // 畫體力條
        drawStaminaBar(ctx);

        // 確保不會顯示負血量
        if (player.hp <= 0) {
            player.hp = 0;
        }
        if (boss.hp < 0) {
            boss.hp = 0
        }

        // 畫血條
        drawPlayerHealthBar(ctx);
        drawBossHealthBar(ctx);

        // 結束畫面判斷
        if (player.hp === 0) {
            setPlayerAnimation("Die");
            setTimeout(() => {
                setPlayerAnimation("Dead");
            }, 900);
            lose();

            /*ctx.fillStyle = "red";
            ctx.font = "40px Arial";
            ctx.fillText("遊戲結束！", canvas.width / 2 - 100, canvas.height / 2); */
            return;
        } else if (boss.hp === 0 && boss.phase2 === true) {
            setBossAnimation("Die");
            setTimeout(() => {
                setBossAnimation("Dead");
            }, 900);
            win();

            /*ctx.fillStyle = "yellow";
            ctx.font = "40px Arial";
            ctx.fillText("Boss 被打敗！", canvas.width / 2 - 120, canvas.height / 2); */
            return;
        }

        // 循環執行
        requestAnimationFrame(gameLoop);
    }



    // === 遊戲主迴圈 ===
    function gameLoop() {

        // 玩家位置更新
        playerSpotUpdate(keys, canvas);

        // BOSS 位置更新
        bossSpotUpdate();

        // 玩家子彈位置更新
        playerBulletsSpotUpdate();

        // 重製畫面
        render();

    }

    // 啟動主迴圈
    gameLoop();
}

