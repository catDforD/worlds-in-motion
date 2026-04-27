import { chromium, expect } from "@playwright/test";

const appUrl = "http://localhost:3000";
const runtimeKey = "worlds-in-motion.world-runtime-state.v1";
const seedKey = "worlds-in-motion.world-seed-assets.v1";

function seedPayload() {
  return {
    version: 1,
    assets: {
      characters: [
        {
          id: "character-one",
          name: "沈清辞",
          identity: "盐务巡检",
          goal: "查清账册",
          status: "暗访中",
        },
        {
          id: "character-two",
          name: "许照夜",
          identity: "听雨楼掌柜",
          goal: "保住旧盟",
          status: "观望",
        },
      ],
      factions: [],
      locations: [],
      relationships: [
        {
          id: "relationship-one",
          participantA: "沈清辞",
          participantB: "许照夜",
          description: "旧账牵连",
          tension: 73,
          note: "互相试探",
        },
      ],
    },
  };
}

async function getRuntime(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), runtimeKey);
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    html: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));

  if (overflow.body > overflow.viewport + 2 || overflow.html > overflow.viewport + 2) {
    throw new Error(`${label} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await expect(page.getByText("已连续运行 12 天")).toBeVisible();
  await expect(page.locator(".time-date")).toHaveText("三月初八　辰时");
  await expect(page.getByText("第十六章 · 暗潮初起")).toBeVisible();
  await assertNoHorizontalOverflow(page, "default desktop");

  await page.getByRole("button", { name: "暂停运行" }).click();
  await expect(page.getByText("世界已暂停")).toBeVisible();
  await expect(page.getByRole("button", { name: "继续运行" })).toBeVisible();
  let runtime = await getRuntime(page);
  if (runtime.state.isPaused !== true) {
    throw new Error("pause toggle did not persist isPaused=true");
  }

  await page.getByRole("button", { name: "继续运行" }).click();
  await expect(page.getByText("世界运行中")).toBeVisible();
  runtime = await getRuntime(page);
  if (runtime.state.isPaused !== false) {
    throw new Error("continue toggle did not persist isPaused=false");
  }

  await page.getByRole("button", { name: "推进一日" }).click();
  await expect(page.getByText("已连续运行 13 天")).toBeVisible();
  await expect(page.locator(".time-date")).toHaveText("永泰二十三年 三月初九　辰时");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("已连续运行 13 天")).toBeVisible();
  await expect(page.locator(".time-date")).toHaveText("永泰二十三年 三月初九　辰时");

  await page.getByRole("button", { name: "记录事件" }).click();
  await expect(page.getByText("标题和摘要都需要填写。")).toBeVisible();
  runtime = await getRuntime(page);
  if (runtime.state.events.length !== 0) {
    throw new Error("empty event submission changed the event list");
  }

  await page.getByLabel("事件标题").fill("密会破局");
  await page.getByLabel("摘要").fill("沈清辞在听雨楼截下盐账，逼许照夜交出旧盟线索。");
  await page.getByLabel("类型").selectOption("plot");
  await page.getByRole("button", { name: "记录事件" }).click();
  await expect(page.getByText("密会破局")).toBeVisible();

  await page.getByLabel("事件标题").fill("第二条新事");
  await page.getByLabel("摘要").fill("许照夜把账册副本转交给江南盐帮，局势继续升温。");
  await page.getByRole("button", { name: "记录事件" }).click();
  const firstEventTitle = await page.locator(".event-row h3").first().textContent();
  if (firstEventTitle !== "第二条新事") {
    throw new Error(`latest event was not shown first: ${firstEventTitle}`);
  }

  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: seedKey, value: seedPayload() },
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "沈清辞" })).toBeVisible();
  await expect(page.getByText("旧账牵连")).toBeVisible();
  await expect(page.locator(".time-date")).toHaveText("永泰二十三年 三月初九　辰时");
  await expect(page.getByText("第二条新事")).toBeVisible();

  await page.evaluate((key) => localStorage.setItem(key, "{broken"), runtimeKey);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("世界运行中")).toBeVisible();
  await expect(page.getByText("已连续运行 12 天")).toBeVisible();
  await expect(page.locator(".time-date")).toHaveText("永泰二十三年 三月初八　辰时");

  await page.screenshot({
    path: "output/playwright/world-runtime-desktop.png",
    fullPage: true,
  });
  await assertNoHorizontalOverflow(page, "corrupt fallback desktop");

  await page.setViewportSize({ width: 390, height: 1000 });
  await page.reload({ waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "mobile");
  await page.screenshot({
    path: "output/playwright/world-runtime-mobile.png",
    fullPage: true,
  });

  if (consoleErrors.length > 0) {
    throw new Error(`browser console errors: ${consoleErrors.join(" | ")}`);
  }

  await browser.close();
  console.log("runtime validation passed");
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
