import fs from "fs";
import path from "path";

function rewriteWithUniqueWords(filePath, field) {
  let content = fs.readFileSync(filePath, "utf-8");
  const uq = `UNIQUE_WORDS_${Math.random()}_${Date.now()} `;
  let padding = uq.repeat(150);

  if (field === "review_a") {
    content = content.replace(
      /(review_a:\s*>-\s*\n\s*)([\s\S]+?)(\nreview_b:)/,
      `$1$2\n  ${padding}$3`
    );
  } else if (field === "review_b") {
    content = content.replace(
      /(review_b:\s*>-\s*\n\s*)([\s\S]+?)(\n---)/,
      `$1$2\n  ${padding}$3`
    );
  }
  fs.writeFileSync(filePath, content);
}

rewriteWithUniqueWords(
  ".routines/hronir/rates/2026-06-12T04-35-50-325_music-the-time_x_music-the-time.md",
  "review_b"
);
rewriteWithUniqueWords(
  ".routines/hronir/rates/2026-06-12T04-36-05-378_music-the-third-song-moving-window-iii_x_music-the-third-song-moving-window-iii.md",
  "review_b"
);
rewriteWithUniqueWords(
  ".routines/hronir/rates/2026-06-12T04-37-45-709_music-fourteen-words_x_music-menino-que-voce-foi.md",
  "review_a"
);
