// === 平台資料 ===
export const platforms = [
  { x: 0, y: 730, width: 1400, height: 20 },     // 地面
  { x: 60, y: 350, width: 480, height: 15 },
  { x: 1020, y: 350, width: 240, height: 15 },
  { x: 600, y: 475, width: 360, height: 15 },  // 中間一個小平台
  { x: 240, y: 600, width: 240, height: 15 },
  { x: 900, y: 600, width: 240, height: 15 }   // 高處平台
];



// 繪製平台
export function drawPlatforms(ctx) {
  ctx.fillStyle = "saddlebrown"; // 平台顏色
  platforms.forEach(platform => {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });
}
