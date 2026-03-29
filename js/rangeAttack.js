import { platforms } from "./platform.js";
import { bullets } from "./bullet.js";
import { Rosmontis_AttackSound } from './audio.js';


const skillObject = [];
const strikeImg = new Image();
strikeImg.src = "./bullets/Rosmontis_weapon.png";

export const shockwaveImg = new Image();
shockwaveImg.src = "./bullets/Rosmontis_Bomb.gif";



// === 普通遠程攻擊 ===
export function spawnFallingStrike(mouseX, mouseY, canvas) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = (mouseX - rect.left) * (canvas.width / rect.width);
    const canvasY = (mouseY - rect.top) * (canvas.height / rect.height);

    // 尋找最上層平台
    let targetPlatform = null;
    for (const platform of platforms) {
        const withinX = canvasX >= platform.x && canvasX <= platform.x + platform.width;
        const belowMouseY = platform.y >= canvasY;
        if (withinX && belowMouseY) {
            if (!targetPlatform || platform.y < targetPlatform.y) {
                targetPlatform = platform;
            }
        }
    }

    if (targetPlatform) {
        const strikeX = canvasX - 10;
        const strikeY = -60;
        const landingY = targetPlatform.y - 60;

        const img = document.createElement("img");
        img.src = "./bullets/Rosmontis_weapon.png";
        img.style.position = "absolute";
        img.style.width = "120px";
        img.style.height = "110px";
        img.style.marginTop = "-30px";
        img.style.marginLeft = "-50px";
        img.style.pointerEvents = "none";
        document.body.appendChild(img);

        // 從畫面頂端生成
        const strike = {
            x: strikeX,
            y: strikeY,
            width: 20,
            height: 60,
            color: "transparent",
            speed: 8,
            landingY: landingY,
            landed: false,
            timer: 0,
            image: img
        };

        const canvasRect = canvas.getBoundingClientRect();
        img.style.left = canvasRect.left + window.scrollX + strike.x + "px";
        img.style.top = canvas.top + window.scrollY + strike.y + "px";



        skillObject.push(strike);
    }
}



export function updateSkillObjects(ctx, canvas) {
    const canvasRect = canvas.getBoundingClientRect();

    for (let i = skillObject.length - 1; i >= 0; i--) {
        const s = skillObject[i];

        if (!s.landed) {
            s.y += s.speed;
            if (s.y >= s.landingY) {
                s.y = s.landingY;
                s.landed = true;
                spawnShockwave(s.x + s.width / 2, s.y + s.height);
            }
        } else {
            s.timer++;
            if (s.timer > 30) {
                const img = s.image;
                let upwardY = s.y;
                let frame = 0;

                const flyUp = setInterval(() => {
                    upwardY -= 10;
                    img.style.top = canvasRect.top + window.scrollY + upwardY + "px";
                    frame++;
                    if (frame > 8) {
                        clearInterval(flyUp);
                        img.remove();
                    }
                }, 20); 

                skillObject.splice(i, 1);
                continue;
            }
        }

        // 劃出 strike
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.width, s.height);

        // 更新圖片位置
        s.image.style.left = canvasRect.left + window.scrollX + s.x + "px";
        s.image.style.top = canvasRect.top + window.scrollY + s.y + "px";
    }
}

function spawnShockwave(centerX, groundY) {
    const canvas = document.getElementById("gameCanvas");
    const rect = canvas.getBoundingClientRect();

    // 產生 GIF 圖片
    const img = document.createElement("img");
    img.src = "./bullets/Rosmontis_Bomb.gif";
    img.style.position = "absolute";
    img.style.width = "180px";
    img.style.height = "180px";
    img.style.pointerEvents = "none";
    img.style.left = `${rect.left + window.scrollX + centerX - 85}px`;
    img.style.top = `${rect.top + window.scrollY + groundY - 90}px`;
    document.body.appendChild(img);

    // 簡單生成一個左右展開地矩形波
    const shockwave = {
        x: centerX - 40,
        y: groundY - 65,
        width: 80,
        height: 80,
        color: "transparent",
        dx: 0,
        dy: 0,
        isShockwave: true
    };
    bullets.push(shockwave);

    Rosmontis_AttackSound.currentTime = 0;
    Rosmontis_AttackSound.play();

    // 播完動畫後移除 DOM 和 hitbox
    setTimeout(() => {
        img.remove();

        const index = bullets.indexOf(shockwave);
        if (index > -1) bullets.splice(index, 1);
    }, 540); 
}