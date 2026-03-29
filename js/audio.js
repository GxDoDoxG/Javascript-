export const Rosmontis_AttackSound = new Audio("./audio/Rosmontis_AttackSound.mp3");
export const enemyAttackSound = new Audio("./audio/enemyAttack.mp3");
export const wisadelShoot = new Audio("./audio/wisadelShoot.mp3");
export const buttonSound = new Audio("./audio/button.mp3");
export const transformSound = new Audio("./audio/transform.mp3");
export const winSound = new Audio("./audio/win.mp3");
export const loseSound = new Audio("./audio/lose.mp3");
export const wisadelBgm = new Audio("./audio/wisadelBgm.mp3");
export const rockBgm = new Audio("./audio/rockCrazy.m4a");
export const techBgm = new Audio("./audio/tech.m4a");
export let currentBgm = new Audio(techBgm.src);

// 等待使用者有互動才播放背景音樂（避免自動播放被瀏覽器阻擋）
document.addEventListener('DOMContentLoaded', () => {
    wisadelBgm.preload = "auto";

    currentBgm.loop = true; // 設定循環播放
    currentBgm.play();

    // 用任何事件觸發播放，例如點擊、鍵盤按鍵等
    const startMusic = () => {
        currentBgm.play().catch(err => {
            //console.log("無法播放背景音樂:", err);
        });

        // 只觸發一次就移除監聽
        document.removeEventListener('click', startMusic);
        document.removeEventListener('keydown', startMusic);
    };

    // 等玩家互動後再播放（避免瀏覽器封鎖）
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
});



export function playBgm(src) {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
  }

  currentBgm = new Audio(src);
  currentBgm.loop = true;
  currentBgm.play().catch(err => {
    //console.warn("背景音樂播放失敗:", err);
  });
}

export function stopBgm() {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = null;
  }
}



// 選取所有要有音效的按鈕
const buttons = document.querySelectorAll("button");

buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        buttonSound.currentTime = 0; // 每次播放從頭開始
        buttonSound.play();
    });
});