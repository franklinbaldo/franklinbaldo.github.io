let initializedTheme: string | undefined;

  async function render() {
    // Astro's default Shiki pipeline emits mermaid blocks as
    // <pre data-language="mermaid"><code>…</code></pre> — the language tag
    // lives on the <pre>, not on the <code>. Earlier selector targeted
    // .language-mermaid on <code> and matched nothing.
    const preBlocks = document.querySelectorAll<HTMLElement>(
      "article pre[data-language='mermaid'], article pre:has(code.language-mermaid)",
    );
    if (preBlocks.length === 0) return;

    const targets: HTMLElement[] = [];
    preBlocks.forEach((pre) => {
      if (pre.dataset.mermaidProcessed === "true") return;
      const source = pre.textContent ?? "";
      const container = document.createElement("div");
      container.className = "mermaid";
      container.textContent = source.trim();
      pre.replaceWith(container);
      targets.push(container);
    });

    if (targets.length === 0) return;

    const { default: mermaid } = await import("mermaid");
    const dark = document.documentElement.dataset.theme === "dark";
    const theme = dark ? "dark" : "neutral";
    if (initializedTheme !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: "strict",
      });
      initializedTheme = theme;
    }
    try {
      await mermaid.run({ nodes: targets });
    } catch (err) {
      console.warn("[mermaid] render error:", err);
    }
  }

  render();
  document.addEventListener("zola:page-load", render);
