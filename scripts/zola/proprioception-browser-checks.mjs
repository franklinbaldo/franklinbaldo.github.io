import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export async function checkProprioception(page, base, out, width) {
  const path = "/fly-proprioception/";
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await page.waitForFunction(
    () => document.querySelectorAll("meter").length === 5
  );
  assert.equal(await page.locator(".badge").textContent(), "NOT_CONNECTED");
  for (const name of ["Posição central", "Amplitude solicitada", "Frequência"])
    assert.equal(
      await page.getByRole("slider", { name: new RegExp(name) }).count(),
      1
    );
  await page.waitForFunction(
    () => !document.querySelector("#body-scene").hidden
  );
  const canvas = page.locator("#body-scene");
  const captureHash = async () =>
    createHash("sha256")
      .update(await canvas.screenshot())
      .digest("hex");
  const initialScene = await captureHash();
  const physicsBefore = await page.locator("#angle").textContent();
  const timeBefore = await page.locator("#time").textContent();
  for (const [selector, value] of [
    ["#scene-curvature", "0.95"],
    ["#scene-roughness", "0.95"],
    ["#scene-light", "-100"],
    ["#scene-detail", "0.95"],
  ]) {
    await page.locator(selector).evaluate((element, next) => {
      element.value = next;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    assert.notEqual(
      await captureHash(),
      initialScene,
      `${selector} changes pixels`
    );
    assert.equal(await page.locator("#angle").textContent(), physicsBefore);
    assert.equal(await page.locator("#time").textContent(), timeBefore);
    await page.locator("#scene-reset").click();
  }
  await page.locator("#scene-palette").selectOption("violet");
  assert.notEqual(await captureHash(), initialScene, "palette changes pixels");
  await page.locator("#scene-mode").selectOption("artistic");
  assert.equal(await page.locator("#angle").textContent(), physicsBefore);
  await page.screenshot({
    path: `${out}/proprioception-expressive-${width}.png`,
    fullPage: true,
  });
  await page.locator("#scene-reset").click();
  assert.equal(await page.locator("#scene-mode").inputValue(), "inspection");
  await page.screenshot({
    path: `${out}/proprioception-inspection-${width}.png`,
    fullPage: true,
  });
  await page.locator("#center").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#angle").textContent(), "91.0°");
  await page.locator("#play").click();
  await page.waitForFunction(
    () => document.querySelector("#time").textContent !== "0.00 s"
  );
  await page.locator("#play").click();
  const paused = await page.locator("#time").textContent();
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#time").textContent(), paused);
  await page.locator("#reset").click();
  assert.equal(await page.locator("#time").textContent(), "0.00 s");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await page.locator("#connect").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#neural-status").textContent ===
      "MODELLED_INPUT / EXPLORATORY",
    null,
    { timeout: 30000 }
  );
  await page.locator("#play").click();
  await page.waitForFunction(
    () => Number(document.querySelector("#neural-steps").textContent) >= 3
  );
  await page.locator("#play").click();
  const connectedPaused = await page.locator("#time").textContent();
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#time").textContent(), connectedPaused);
  assert.ok(
    Number.isFinite(Number(await page.locator("#vnc-activity").textContent()))
  );
  const dataSnapshot = async () =>
    page
      .locator(
        "#angle, #velocity, #time, #vnc-activity, #ascending-activity, #neural-steps"
      )
      .allTextContents();
  const connectedSnapshot = await dataSnapshot();
  for (const [selector, value] of [
    ["#scene-curvature", "0.9"],
    ["#scene-roughness", "0.9"],
    ["#scene-light", "-80"],
    ["#scene-detail", "0.9"],
  ]) {
    await page.locator(selector).evaluate((element, next) => {
      element.value = next;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    assert.deepEqual(await dataSnapshot(), connectedSnapshot);
  }
  await page.locator("#scene-mode").selectOption("artistic");
  await page.locator("#scene-palette").selectOption("amber");
  assert.deepEqual(await dataSnapshot(), connectedSnapshot);
  await page.locator("#scene-reset").click();
  assert.deepEqual(await dataSnapshot(), connectedSnapshot);
  await page.screenshot({
    path: `${out}/proprioception-${width}.png`,
    fullPage: true,
  });
  await page.locator("#silenced").check();
  await page.locator("#play").click();
  await page.waitForFunction(
    () => Number(document.querySelector("#neural-steps").textContent) >= 3
  );
  await page.locator("#play").click();
  assert.equal(await page.locator("#vnc-activity").textContent(), "0.000000");
  assert.equal(
    await page.locator("#ascending-activity").textContent(),
    "0.000000"
  );
  const contextLossSupported = await page.evaluate(() => {
    const gl = document.querySelector("#body-scene").getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    globalThis.restoreSceneContext = () => extension.restoreContext();
    extension.loseContext();
    return true;
  });
  if (contextLossSupported) {
    await page.waitForFunction(
      () => document.querySelector("#body-scene").hidden
    );
    assert.equal(await page.locator("#scene-fallback").isVisible(), true);
    assert.ok(await page.locator("#angle").isVisible());
    await page.screenshot({
      path: `${out}/proprioception-fallback-${width}.png`,
      fullPage: true,
    });
    const fallbackBefore = await page
      .locator("#fallback-tibia")
      .getAttribute("x2");
    await page.locator("#center").evaluate((element) => {
      element.value = "130";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.notEqual(
      await page.locator("#fallback-tibia").getAttribute("x2"),
      fallbackBefore
    );
    assert.equal(await page.locator("#angle").textContent(), "130.0°");
    await page.evaluate(() => globalThis.restoreSceneContext());
    await page.waitForFunction(
      () => !document.querySelector("#body-scene").hidden
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#time").textContent(), "0.00 s");
  await page.waitForFunction(
    () => !document.querySelector("#body-scene").hidden
  );
  const reducedPixels = await captureHash();
  await page.waitForTimeout(200);
  assert.equal(await captureHash(), reducedPixels);
  assert.equal(await page.locator("#time").textContent(), "0.00 s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return [{ path, viewport: width, status: response.status() }];
}
