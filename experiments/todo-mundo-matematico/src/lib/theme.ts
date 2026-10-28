import { continueRender, delayRender } from "remotion";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/900.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";

// Fontes empacotadas localmente (@fontsource): a renderização não depende de rede.
export const display = "'Baloo 2', sans-serif";
export const body = "'Nunito', sans-serif";
export const mono = "'JetBrains Mono', monospace";

if (typeof document !== "undefined") {
  const handle = delayRender("Carregando fontes locais");
  Promise.all(
    ["600 40px 'Baloo 2'", "800 40px 'Baloo 2'", "700 40px Nunito", "900 40px Nunito", "500 40px 'JetBrains Mono'", "700 40px 'JetBrains Mono'"].map((f) =>
      document.fonts.load(f, "ÁéçãõÊ∀∃⊢✔"),
    ),
  )
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}
export const C = {
  night: "#071330",
  navy: "#0b1e3f",
  deep: "#10295a",
  panel: "#13306b",
  cyan: "#3de0ff",
  cyanSoft: "#8ff0ff",
  yellow: "#ffd23f",
  white: "#f6f8ff",
  coral: "#ff6b6b",
  green: "#4ade80",
  red: "#ff4d5e",
  purple: "#a78bfa",
  orange: "#ff9f43",
  ink: "#0a1630",
  skin1: "#f2c7a5",
  skin2: "#d39b72",
  skin3: "#a8714a",
  skin4: "#7a4b2f",
};
