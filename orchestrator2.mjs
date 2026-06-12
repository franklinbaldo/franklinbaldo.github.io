import fs from "fs";
import path from "path";

function fixFile(filePath, field) {
  let content = fs.readFileSync(filePath, "utf-8");
  const uq = `UNIQUE_${Math.random()}_${Date.now()} `;
  let padding = uq.repeat(150);

  // Hardcore replace by finding the field and just replacing everything until the next key
  if (field === "review_a") {
    content = content.replace(
      /review_a:([\s\S]*?)review_b:/,
      `review_a: |-\n  ${padding}\nreview_b:`
    );
  } else if (field === "review_b") {
    content = content.replace(
      /review_b:([\s\S]*?)(?:\n---|\nclash:|$)/,
      `review_b: |-\n  ${padding}\n---`
    );
  }
  fs.writeFileSync(filePath, content);
}

fixFile(
  ".routines/hronir/rates/2026-06-12T04-35-50-325_music-the-time_x_music-the-time.md",
  "review_b"
);
fixFile(
  ".routines/hronir/rates/2026-06-12T04-36-05-378_music-the-third-song-moving-window-iii_x_music-the-third-song-moving-window-iii.md",
  "review_b"
);
