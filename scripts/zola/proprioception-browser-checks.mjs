import assert from "node:assert/strict";

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
  return [{ path, viewport: width, status: response.status() }];
}
