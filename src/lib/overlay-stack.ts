// Coordinates Escape-key handling between independently-registered overlay
// listeners (Header dropdowns, music player queue drawer) so a single
// Escape press closes only the most-recently-opened overlay instead of
// every open overlay at once. Each overlay pushes its id when it opens and
// removes it when it closes; an Escape handler should act only if its id is
// on top of the stack.
declare global {
  interface Window {
    __overlayStack?: string[];
  }
}

function stack(): string[] {
  if (!window.__overlayStack) window.__overlayStack = [];
  return window.__overlayStack;
}

export function pushOverlay(id: string): void {
  const s = stack();
  const i = s.indexOf(id);
  if (i !== -1) s.splice(i, 1);
  s.push(id);
}

export function removeOverlay(id: string): void {
  const s = stack();
  const i = s.indexOf(id);
  if (i !== -1) s.splice(i, 1);
}

export function isTopOverlay(id: string): boolean {
  const s = stack();
  return s.length > 0 && s[s.length - 1] === id;
}
