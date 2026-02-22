#!/usr/bin/env node
// Usage: node post-twitter.cjs "Your tweet content here"
// Connects to the existing Chromium browser via CDP and posts to Twitter/X.

const CDP_URL = "http://127.0.0.1:18800";
const COMPOSE_URL = "https://twitter.com/compose/tweet";

async function main() {
  const content = process.argv[2];
  if (!content || content.trim().length === 0) {
    console.error("ERROR: Tweet content is required as first argument");
    process.exit(1);
  }
  if (content.length > 280) {
    console.error("ERROR: Tweet exceeds 280 characters (" + content.length + " chars)");
    process.exit(1);
  }

  const pw = require("/home/mani/openclaw/node_modules/playwright-core");
  let browser;

  try {
    browser = await pw.chromium.connectOverCDP(CDP_URL);
  } catch (e) {
    console.error("ERROR: Cannot connect to browser on CDP port 18800. Is the gateway running?");
    process.exit(1);
  }

  try {
    const contexts = browser.contexts();
    if (!contexts.length) {
      console.error("ERROR: No browser contexts found");
      process.exit(1);
    }

    const pages = contexts[0].pages();
    let page = pages.find(p => p.url().includes("twitter.com") || p.url().includes("x.com"));
    if (!page) {
      page = pages[0] || await contexts[0].newPage();
    }

    // Handle any dialogs
    page.on('dialog', async (dialog) => {
      console.log("OK: Auto-accepting dialog:", dialog.message().substring(0, 80));
      await dialog.accept().catch(() => {});
    });

    // Navigate to compose page
    await page.goto(COMPOSE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    // Verify we're on Twitter
    const url = page.url();
    if (!url.includes("twitter.com") && !url.includes("x.com")) {
      console.error("ERROR: Not on Twitter. URL:", url);
      process.exit(1);
    }
    console.log("OK: On Twitter compose page");

    // Find the tweet textbox
    const editor = page.getByRole("textbox", { name: "Post text" });
    await editor.waitFor({ state: "visible", timeout: 10000 });
    await editor.click();
    await page.waitForTimeout(500);

    // Type tweet content using pressSequentially (triggers React events)
    await editor.pressSequentially(content, { delay: 10 });
    await page.waitForTimeout(2000);
    console.log("OK: Typed tweet (" + content.length + " chars)");

    // Verify Post button is enabled before submitting
    const postBtn = page.getByTestId("tweetButton");
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const isDisabled = await postBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        ready = true;
        break;
      }
      console.log("WAIT: Post button disabled (attempt " + (attempt + 1) + "/10)");
      await page.waitForTimeout(1000);
    }

    if (!ready) {
      console.error("ERROR: Post button never became enabled");
      process.exit(1);
    }

    // Use Ctrl+Enter to submit (Twitter's native keyboard shortcut)
    // This is more reliable than clicking the Post button which can be
    // blocked by overlapping elements in the compose dialog.
    await page.keyboard.press("Control+Enter");
    console.log("OK: Pressed Ctrl+Enter to submit");

    // Wait for submission
    await page.waitForTimeout(5000);

    // Verify tweet was submitted (compose dialog should close, URL changes to /home)
    const finalUrl = page.url();
    const editorStillVisible = await editor.isVisible().catch(() => false);
    if (!editorStillVisible || finalUrl.includes("/home")) {
      console.log("SUCCESS: Tweet published!");
    } else {
      console.log("WARN: Editor may still be visible. Tweet submission may need more time.");
    }

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
