import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";

const port = 3211;
const baseUrl = `http://127.0.0.1:${port}`;
const libraryKey = "worlds-in-motion.world-library.v1";
const runtimeKey = "worlds-in-motion.world-runtime-state.v1";

const worldA = "world-event-log-a";
const worldB = "world-event-log-b";

function runtimeState(events) {
  return {
    currentWorldDate: "永泰二十三年 三月初九　巳时",
    runDays: 18,
    isPaused: false,
    events,
    chapterDraft: {
      title: "",
      summary: "",
      tags: [],
      updatedAt: "",
    },
    latestChapter: null,
    updatedAt: "2026-04-28T10:10:00.000Z",
  };
}

function seedPayload(activeWorldId = worldA) {
  return {
    library: {
      version: 1,
      activeWorldId,
      worlds: [
        {
          id: worldA,
          name: "雾隐盐城",
          type: "权谋群像",
          description: "盐务旧案牵动朝堂、江湖和商路。",
          tags: ["权谋群像", "江南盐务"],
          createdAt: "2026-04-26T09:00:00.000Z",
          updatedAt: "2026-04-28T09:30:00.000Z",
        },
        {
          id: worldB,
          name: "霜桥旧国",
          type: "边境史诗",
          description: "北境桥城守着断裂的旧盟约。",
          tags: ["边境史诗"],
          createdAt: "2026-04-27T09:00:00.000Z",
          updatedAt: "2026-04-28T09:30:00.000Z",
        },
      ],
    },
    runtime: {
      version: 2,
      byWorldId: {
        [worldA]: runtimeState([
          {
            id: "event-rich",
            date: "永泰二十三年 三月初九　巳时",
            title: "盐账当堂公开",
            summary: "沈清辞把盐账副本带入听雨楼，迫使许照夜承认旧盟曾暗中调拨粮船。",
            type: "plot",
            participants: ["沈清辞", "许照夜"],
            location: "听雨楼",
            impact:
              "盐帮声望受损，巡检司得到重新查账的口实，江南商路开始重新站队。",
            detail:
              "沈清辞在第三次茶会前调换账册封皮，将真正副本交给听雨楼掌柜保管。许照夜被迫承认旧盟调拨粮船，但仍隐瞒背后的朝堂名单。",
            importance: "turning-point",
            createdAt: "2026-04-28T10:00:00.000Z",
          },
          {
            id: "event-legacy",
            date: "永泰二十三年 三月初七　酉时",
            title: "旧案重翻",
            summary: "一封没有署名的供词让二十年前的盐务旧案重新浮出水面。",
            type: "secret",
            createdAt: "2026-04-27T10:00:00.000Z",
          },
        ]),
        [worldB]: runtimeState([
          {
            id: "event-other-world",
            date: "霜桥纪年 七月初一",
            title: "霜桥烽火",
            summary: "旧国边军点燃桥头烽火，断裂盟约进入公开冲突。",
            type: "faction",
            participants: ["边军"],
            location: "霜桥",
            impact: "北境诸侯开始集结。",
            detail: "这条事件只属于第二个世界。",
            importance: "important",
            createdAt: "2026-04-28T11:00:00.000Z",
          },
        ]),
      },
    },
  };
}

async function waitForServer(serverLog) {
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
  throw new Error(`Timed out waiting for dev server:\n${serverLog()}`);
}

async function seedLocalStorage(page, activeWorldId = worldA) {
  const payload = seedPayload(activeWorldId);
  await page.evaluate(
    ({ library, runtime, keys }) => {
      localStorage.clear();
      localStorage.setItem(keys.library, JSON.stringify(library));
      localStorage.setItem(keys.runtime, JSON.stringify(runtime));
    },
    {
      library: payload.library,
      runtime: payload.runtime,
      keys: { library: libraryKey, runtime: runtimeKey },
    },
  );
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
  const consoleErrors = [];

  server.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
  });

  try {
    await waitForServer(() => serverLog);

    const browser = await chromium.launch({
      executablePath: "/usr/bin/google-chrome",
      headless: true,
      args: ["--no-sandbox"],
    });
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    desktop.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    desktop.on("pageerror", (error) => consoleErrors.push(error.message));

    await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await seedLocalStorage(desktop);
    await desktop.reload({ waitUntil: "networkidle" });

    await expect(desktop.getByText("盐账当堂公开")).toBeVisible();
    await expect(desktop.getByText("旧案重翻")).toBeVisible();
    await desktop
      .locator(".content-panel")
      .filter({ hasText: "近期事件" })
      .getByRole("link", { name: "查看全部" })
      .click();
    await desktop.waitForURL(`${baseUrl}/events`);

    await expect(desktop.getByRole("heading", { name: "事件日志" })).toBeVisible();
    await expect(desktop.getByText("当前世界：雾隐盐城")).toBeVisible();
    await expect(desktop.getByText("2 条")).toBeVisible();
    await expect(desktop.locator(".event-detail h2")).toHaveText("盐账当堂公开");
    await expect(
      desktop.locator(".event-detail-facts").getByText("沈清辞、许照夜", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      desktop.locator(".event-detail-facts").getByText("听雨楼", { exact: true }),
    ).toBeVisible();
    await expect(desktop.getByText("转折").first()).toBeVisible();
    await expect(desktop.getByText("霜桥烽火")).toHaveCount(0);

    await desktop.getByRole("button", { name: /旧案重翻/ }).click();
    await expect(desktop.locator(".event-detail h2")).toHaveText("旧案重翻");
    await expect(
      desktop.locator(".event-detail-facts").getByText("未记录角色", { exact: true }),
    ).toBeVisible();
    await expect(
      desktop.locator(".event-detail-facts").getByText("未记录地点", { exact: true }),
    ).toBeVisible();
    await expect(
      desktop.locator(".event-detail-facts").getByText("暂无影响记录", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      desktop.locator(".event-detail-copy").getByText("一封没有署名的供词"),
    ).toBeVisible();

    await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await desktop
      .locator(".sidebar-nav")
      .getByRole("link", { name: "事件" })
      .click();
    await desktop.waitForURL(`${baseUrl}/events`);

    await seedLocalStorage(desktop, worldB);
    await desktop.reload({ waitUntil: "networkidle" });
    await expect(desktop.getByText("当前世界：霜桥旧国")).toBeVisible();
    await expect(desktop.locator(".event-detail h2")).toHaveText("霜桥烽火");
    await expect(desktop.getByText("盐账当堂公开")).toHaveCount(0);

    await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await expect(desktop.getByRole("heading", { name: "霜桥旧国" })).toBeVisible();
    await expect(desktop.locator(".event-row h3").first()).toHaveText("霜桥烽火");
    await expect(desktop.getByText("盐账当堂公开")).toHaveCount(0);

    await seedLocalStorage(desktop);
    await desktop.goto(`${baseUrl}/events`, { waitUntil: "networkidle" });
    await desktop.screenshot({
      path: "output/playwright/event-log-desktop.png",
      fullPage: true,
    });
    await assertNoHorizontalOverflow(desktop, "desktop /events");

    const mobile = await browser.newPage({
      viewport: { width: 390, height: 1000 },
      isMobile: true,
    });
    mobile.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    mobile.on("pageerror", (error) => consoleErrors.push(error.message));
    await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await seedLocalStorage(mobile);
    await mobile.goto(`${baseUrl}/events`, { waitUntil: "networkidle" });
    await expect(mobile.getByRole("heading", { name: "事件日志" })).toBeVisible();
    await expect(mobile.locator(".event-detail h2")).toHaveText("盐账当堂公开");
    await expect(mobile.locator(".event-detail h2")).toHaveText("盐账当堂公开");
    await assertNoHorizontalOverflow(mobile, "mobile /events");
    await mobile.screenshot({
      path: "output/playwright/event-log-mobile.png",
      fullPage: true,
    });

    await desktop.evaluate(
      (keys) => {
        localStorage.clear();
        localStorage.setItem(keys.library, "{broken");
        localStorage.setItem(keys.runtime, "{broken");
      },
      { library: libraryKey, runtime: runtimeKey },
    );
    await desktop.goto(`${baseUrl}/events`, { waitUntil: "networkidle" });
    await expect(desktop.getByText("尚未选择世界")).toBeVisible();
    await assertNoHorizontalOverflow(desktop, "corrupt localStorage /events");

    if (consoleErrors.length > 0) {
      throw new Error(`browser console errors: ${consoleErrors.join(" | ")}`);
    }

    await browser.close();
    console.log("event log verification ok");
  } finally {
    server.kill("SIGTERM");
    await Promise.race([
      once(server, "exit"),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
