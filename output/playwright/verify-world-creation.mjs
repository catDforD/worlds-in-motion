import { spawn } from "node:child_process";
import { once } from "node:events";
import playwright from "/home/gargantua/.npm/_npx/420ff84f11983ee5/node_modules/playwright/index.js";

const { chromium } = playwright;

const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn("/usr/bin/node", ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});

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

try {
  await waitForServer();

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/home/gargantua/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome",
  });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expectText(desktop, "烟雨江南");
  await expectText(desktop, "新建世界");

  await desktop.goto(`${baseUrl}/worlds/new`, { waitUntil: "networkidle" });
  await expectText(desktop, "起一卷新天地");
  await expectText(desktop, "世界雏形预览");
  await desktop.screenshot({ path: "output/playwright/worlds-new-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 1100 }, isMobile: true });
  await mobile.goto(`${baseUrl}/worlds/new`, { waitUntil: "networkidle" });
  await expectText(mobile, "基础设定");
  await expectText(mobile, "创建世界");
  await mobile.screenshot({ path: "output/playwright/worlds-new-mobile.png", fullPage: true });

  await desktop.getByPlaceholder("例如：雾隐十三州").fill("雾隐十三州");
  await desktop.getByRole("button", { name: /魔法学院/ }).click();
  await desktop.getByPlaceholder("写下这个世界的时代、地域、秩序和正在松动的地方。").fill("群山之间的学院掌握所有星砂配给，边境城邦开始质疑法师议会的继承权。");
  await desktop.getByPlaceholder("例如：冷峻群像、温柔怪谈、史诗冒险").fill("冷峻群像");
  await desktop.getByPlaceholder("列出需要长期遵守的力量、社会、资源或禁忌规则。").fill("星砂不可凭空创造，所有法术都需要留下等价记忆。");
  await desktop.getByPlaceholder("写下第一场会推动角色、势力和秘密向前滚动的矛盾。").fill("失踪的院长留下密令，要求低年级学生护送最后一箱星砂离开学院。");
  await expectText(desktop, "魔法学院");
  await desktop.getByRole("button", { name: "创建世界" }).click();
  await desktop.waitForURL(`${baseUrl}/`, { timeout: 8000 });
  await expectText(desktop, "雾隐十三州");
  await expectText(desktop, "群山之间的学院掌握所有星砂配给");
  await desktop.screenshot({ path: "output/playwright/dashboard-created-world.png", fullPage: true });

  await desktop.goto(`${baseUrl}/worlds/new`, { waitUntil: "networkidle" });
  await desktop.getByPlaceholder("例如：雾隐十三州").fill("灰塔边境");
  await desktop.getByRole("button", { name: /自定义/ }).click();
  await desktop.getByPlaceholder("例如：蒸汽神话边境").fill("蒸汽神话边境");
  await expectText(desktop, "蒸汽神话边境");

  await browser.close();
  console.log("verification ok");
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
