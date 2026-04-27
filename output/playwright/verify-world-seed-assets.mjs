import { spawn } from "node:child_process";
import { once } from "node:events";
import playwright from "/home/gargantua/.npm/_npx/420ff84f11983ee5/node_modules/playwright/index.js";

const { chromium } = playwright;

const port = 3211;
const baseUrl = `http://127.0.0.1:${port}`;
const storageKey = "worlds-in-motion.world-seed-assets.v1";
const server = spawn(
  "/usr/bin/node",
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        return;
      }
    } catch {
      // Next is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for dev server:\n${serverLog}`);
}

async function expectText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 8000 });
}

async function openSeedPanel(page) {
  await page.getByRole("button", { name: "管理内容种子" }).click();
  await expectText(page, "整理世界资产");
}

try {
  await waitForServer();

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      "/home/gargantua/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome",
  });

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const consoleErrors = [];
  desktop.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await desktop.evaluate((key) => {
    localStorage.removeItem(key);
    sessionStorage.clear();
  }, storageKey);
  await desktop.reload({ waitUntil: "networkidle" });
  await openSeedPanel(desktop);
  await expectText(desktop, "角色种子");
  await expectText(desktop, "势力种子");
  await expectText(desktop, "地点种子");
  await expectText(desktop, "关系种子");
  await expectText(desktop, "还没有角色种子");

  await desktop.getByRole("button", { name: "新增角色" }).click();
  await desktop.getByPlaceholder("例如：沈清辞").fill("陆离");
  await desktop.getByPlaceholder("例如：盐务巡检").fill("巡城司密探");
  await desktop
    .getByPlaceholder("写下角色正在追逐或回避的事。")
    .fill("找到雾港失踪账册，并确认书院是否参与走私。");
  await desktop
    .getByPlaceholder("例如：潜伏、受伤、结盟观望。")
    .fill("潜伏在码头茶馆");

  await desktop.getByRole("button", { name: "新增势力" }).click();
  await desktop.getByPlaceholder("例如：江南盐帮").fill("云麓书院");
  await desktop.getByPlaceholder("例如：拥护新政").fill("表面中立");
  await desktop
    .getByPlaceholder("写下钱粮、人脉、据点或秘术。")
    .fill("藏书楼、旧生网络、星砂契约");
  await desktop
    .getByPlaceholder("写下它与谁、因何事发生长期摩擦。")
    .fill("与巡城司争夺雾港档案");

  await desktop.getByRole("button", { name: "新增地点" }).click();
  await desktop.getByPlaceholder("例如：听雨楼").fill("雾港茶馆");
  await desktop.getByPlaceholder("例如：码头、禁宫、书院").fill("码头据点");
  await desktop
    .getByPlaceholder("写下地点为什么会影响世界走向。")
    .fill("所有失踪账册都曾从这里中转。");

  await desktop.getByRole("button", { name: "新增关系" }).click();
  await desktop.getByPlaceholder("例如：叶晚棠").fill("陆离");
  await desktop.getByPlaceholder("例如：盐帮").fill("云麓书院");
  await desktop.getByPlaceholder("例如：互相利用").fill("暗线同盟");
  await desktop.locator(".tension-field input").evaluate((input) => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(input, "78");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await desktop
    .getByPlaceholder("补充关系的隐情、触发点或未公开信息。")
    .fill("双方都握有对方不能公开的旧案线索。");

  await desktop.screenshot({
    path: "output/playwright/world-seed-assets-desktop.png",
    fullPage: true,
  });
  await desktop.getByRole("button", { name: "保存内容种子" }).click();
  await expectText(desktop, "陆离");
  await expectText(desktop, "巡城司密探");
  await expectText(desktop, "暗线同盟");
  await expectText(desktop, "敌意 78");

  await desktop.reload({ waitUntil: "networkidle" });
  await expectText(desktop, "陆离");
  await expectText(desktop, "云麓书院");
  await expectText(desktop, "暗线同盟");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 1100 },
    isMobile: true,
  });
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await openSeedPanel(mobile);
  await expectText(mobile, "保存内容种子");
  await mobile.screenshot({
    path: "output/playwright/world-seed-assets-mobile.png",
    fullPage: true,
  });

  await desktop.evaluate((key) => {
    localStorage.setItem(key, "{bad json");
  }, storageKey);
  await desktop.reload({ waitUntil: "networkidle" });
  await expectText(desktop, "萧景琰");
  await openSeedPanel(desktop);
  await expectText(desktop, "还没有角色种子");

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors observed:\n${consoleErrors.join("\n")}`);
  }

  await browser.close();
  console.log("world seed asset verification ok");
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
