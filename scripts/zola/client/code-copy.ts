function getLabels() {
    const pt = document.documentElement.lang.startsWith("pt");
    const el = {dataset: {copyLabel: pt ? "Copiar" : "Copy", copiedLabel: pt ? "Copiado!" : "Copied!", failedLabel: pt ? "Falhou" : "Failed", ariaCopyLabel: pt ? "Copiar código" : "Copy code"}};
    return {
      copy: el?.dataset.copyLabel || "Copy",
      copied: el?.dataset.copiedLabel || "Copied!",
      failed: el?.dataset.failedLabel || "Failed",
      ariaCopy: el?.dataset.ariaCopyLabel || "Copy code",
    };
  }

  function enhance() {
    const labels = getLabels();
    let count = 0;
    document.querySelectorAll<HTMLPreElement>("article pre").forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block")) return;
      count += 1;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      const lang = pre.getAttribute("data-language");
      if (lang) wrapper.setAttribute("data-language", lang);
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = labels.copy;
      const langSuffix = lang ? ` (${lang})` : "";
      button.setAttribute("aria-label", `${labels.ariaCopy} ${count}${langSuffix}`);

      const status = document.createElement("span");
      status.className = "code-copy-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");

      let resetTimer: number | undefined;
      let inFlight = false;

      const flash = (text: string) => {
        button.textContent = text;
        status.textContent = text;
        if (resetTimer !== undefined) window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = labels.copy;
          status.textContent = "";
          resetTimer = undefined;
        }, 1500);
      };

      button.addEventListener("click", async () => {
        if (inFlight) return;
        inFlight = true;
        try {
          const code = pre.querySelector("code")?.innerText ?? pre.innerText;
          await navigator.clipboard.writeText(code);
          flash(labels.copied);
        } catch {
          flash(labels.failed);
        } finally {
          inFlight = false;
        }
      });

      wrapper.appendChild(button);
      wrapper.appendChild(status);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
  // Re-run after Astro client-side navigation (view transitions).
  document.addEventListener("zola:page-load", enhance);
