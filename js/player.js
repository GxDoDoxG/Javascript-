import { platforms } from './platform.js';
import { performMeleeAttack } from './melee.js';
import { setShootLocked } from './main.js';

// === 玩家角色設定 ===
export const player = {
    x: 100,
    y: 500,
    width: 60,
    height: 80,
    color: "skyblue",
    speed: 0.5,
    sprint: 1.5,
    // 負的才會往上
    jumpPower: -4,
    hp: 10,
    maxhp: 10,
    velocityY: 0,
    onGround: false,
    facing: "right",
    stamina: 100,
    maxStamina: 100,
    staminaRegen: 0.1,
    isSprinting: false
};



export function syncPlayerImagePosition() {
    const playerImg = document.getElementById("playerContainer");
    const canvas = document.getElementById("gameCanvas");
    if (!playerImg || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    // 計算玩家圖片的實際位置


    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    // 假設 player.x 和 player.y 是以 canvas 為單位的位置
    const offsetX = -11; // 微調偏移（可調整）
    const offsetY = -15.5; // 微調偏移（可調整）

    playerImg.style.left = rect.left + window.scrollX + (player.x + offsetX) * scaleX + "px";
    playerImg.style.top = rect.top + window.scrollY + (player.y + offsetY) * scaleY + "px";
    playerImg.style.transform = `scale(${scaleX * (player.facing === "left" ? -1 : 1)}, ${scaleY})`;
}



const sprite = document.getElementById("playerSprite");
export let playerCurrentAnimation = "Idle";

export function setPlayerAnimation(state) {
    if (!sprite) return;

    if (state === playerCurrentAnimation) {
        //console.log("Animation already set to:", state);
        return;
    } // 防止重複切換
    playerCurrentAnimation = state;

    switch (state) {
        case "Idle":
            sprite.style.transform = "scale(2.5)";
            sprite.style.marginLeft = "17px";
            sprite.style.marginTop = "-6px";
            sprite.src = "./rosmontis_animations/Rosmontis_Idle.gif";
            break;
        case "Run":
            sprite.src = "./rosmontis_animations/Rosmontis_Run.gif";
            break;
        case "Jump":
            sprite.style.transform = "scale(3)";
            sprite.style.marginLeft = "35px";
            sprite.style.marginTop = "-28px";
            sprite.src = "./rosmontis_animations/Rosmontis_Jump.gif";
            break;
        case "Melee":
            sprite.style.transform = "scale(2.5)";
            sprite.style.marginLeft = "17px";
            sprite.style.marginTop = "-6px";
            sprite.src = "./rosmontis_animations/Rosmontis_Melee.gif";
            break;
        case "HeavyMelee":
            sprite.style.transform = "scale(2.5)";
            sprite.style.marginLeft = "17px";
            sprite.style.marginTop = "-6px";
            sprite.src = "./rosmontis_animations/Rosmontis_HeavyMelee.gif";
            break;
        case "Shoot":
            sprite.style.transform = "scale(3.1)";
            sprite.style.marginLeft = "36px";
            sprite.style.marginTop = "-30.5px";
            sprite.src = "./rosmontis_animations/Rosmontis_RangeAttack.gif";
            break;
        case "Hurt":
            sprite.src = "./rosmontis_animations/Rosmontis_Hurt.gif";
            break;
        case "Die":
            sprite.style.transform = "scale(3.25)";
            sprite.style.marginLeft = "30px";
            sprite.style.marginTop = "-33px";
            sprite.src = "./rosmontis_animations/Rosmontis_Die.gif";
            break;
        case "Dead":
            sprite.src = "./rosmontis_animations/Rosmontis_Died.jpg";
            break;
        case "Jumping":
            sprite.style.transform = "scale(3)";
            sprite.style.marginLeft = "60px";
            sprite.style.marginTop = "-6px";
            sprite.src = "./rosmontis_animations/Rosmontis_Jumping.gif";
            break;
    }
}




// === 變數設定 ===
const gravity = 0.05;
let onPlatform = false;
// test
/* 
let tempV = player.velocityY;
let tempOG = player.onGround;
let gg = true;
*/



// === 玩家移動 ===
export function playerSpotUpdate(keys, canvas) {
    let isMoving = false;

    // 邏輯處理：左右移動
    if (keys["a"]) {
        player.x -= player.speed;
        isMoving = true;
    }
    if (keys["d"]) {
        player.x += player.speed;
        isMoving = true;
    }

    // 如果按住 Shift 鍵，則加速移動
    if (keys["shift"]) {

        if (player.stamina > 0) {
            player.isSprinting = true;
            const direction = (keys["a"] ? -1 : 0) + (keys["d"] ? 1 : 0);
            player.x += player.sprint * direction;
            player.stamina -= 0.3;
            player.isSprinting = false;
        } else if (player.stamina < 0) {
            player.stamina = 0;
        } else {
            player.isSprinting = false;
        }
    }

    // 跳躍（暫時只用 Space）
    if (keys[" "] && player.onGround && player.stamina >= 10) {
        if (player.stamina > 0) {
            player.velocityY = player.jumpPower;
            player.onGround = false;
            player.stamina -= 10;
            setShootLocked(true); // 改變值
            setPlayerAnimation("Jumping");
        } else if (player.stamina < 0) {
            player.stamina = 0;
        }

    }

    // 體力回復 (only 站地上 and 沒衝刺時)
    if (player.onGround && !player.isSprinting && player.stamina < player.maxStamina) {
        if (player.stamina < 0) {
            player.stamina = 0;
        }

        player.stamina += player.staminaRegen;
        if (player.stamina > player.maxStamina) {
            player.stamina = player.maxStamina;
        }
    }

    // 近身攻擊 (暫時用 f 鍵)
    if (keys["f"]) {
        performMeleeAttack();
    }

    // 邊界限制
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // 站平台判斷
    onPlatform = false;
    for (const platform of platforms) {
        // 是否在平台上
        const isHorizontallyAligned =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width;

        const isFeetTouchingPlatform =
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height;

        if (
            (player.velocityY >= 0) && // 僅限下落時才檢查平台碰撞( 終於找到了! 2025/6/7 12:33 ) , 包含下落與靜止狀態
            isHorizontallyAligned &&
            isFeetTouchingPlatform
        ) {
            // 玩家腳在平台上，修正位置並重設速度
            player.y = platform.y - player.height;
            player.velocityY = 0;
            onPlatform = true;
            if (!player.onGround) {
                setShootLocked(false); // 忘了改回來找超久笑死!
            }
            break;
        }
    }

    player.onGround = onPlatform;

    // 沒站在平台上，繼續下墜
    if (!player.onGround) {
        player.velocityY += gravity;
    }
    player.y += player.velocityY;

    if (player.onGround && (playerCurrentAnimation === "Jumping")) {
        setPlayerAnimation("Jump");

        setTimeout(() => {
            if (playerCurrentAnimation === "Jump") {
                setPlayerAnimation("Idle");
            }
        }, 1000);
    }

    //測試
    /*
    if ((player.velocityY != tempV || player.onGround != tempOG) && gg) {
        if (player.y > 600) {
            console.log("GG!");
            gg = false;
        }
        console.log("VelocityY:", player.velocityY);
        console.log("onGround:", player.onGround);
        console.log("player.y:", player.y);
    }
    tempV = player.velocityY;
    tempOG = player.onGround;
    */
}