#!/usr/bin/env node
// Usage: node post-linkedin.cjs "Your post content here"
// Connects to the existing Chromium browser via CDP and posts to LinkedIn feed.

const CDP_URL = "http://127.0.0.1:18800";
const FEED_URL = "https://www.linkedin.com/feed/";

async function main() {
  const content = process.argv[2];
  if (!content || content.trim().length === 0) {
    console.error("ERROR: Post content is required as first argument");
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
    let page = pages.find(p => p.url().includes("linkedin.com"));
    if (!page) {
      page = pages[0] || await contexts[0].newPage();
    }

    // Handle any dialogs that pop up (e.g. "Leave page?")
    page.on('dialog', async (dialog) => {
      console.log("OK: Auto-accepting dialog:", dialog.message().substring(0, 80));
      await dialog.accept().catch(() => {});
    });

    // Navigate to feed
    await page.goto(FEED_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    // Verify we're on the feed
    const title = await page.title();
    if (!title.includes("LinkedIn")) {
      console.error("ERROR: Not on LinkedIn. Title:", title);
      process.exit(1);
    }
    console.log("OK: On LinkedIn feed");

    // Click "Start a post"
    const startPostBtn = page.getByRole("button", { name: "Start a post" });
    await startPostBtn.waitFor({ state: "visible", timeout: 10000 });
    await startPostBtn.click();
    await page.waitForTimeout(2000);
    console.log("OK: Clicked 'Start a post'");

    // Find the text editor
    const editor = page.getByRole("textbox", { name: "Text editor for creating content" });
    await editor.waitFor({ state: "visible", timeout: 10000 });
    await editor.click();
    await page.waitForTimeout(500);

    // Use pressSequentially to trigger React events (fill() doesn't work on LinkedIn)
    await editor.pressSequentially(content, { delay: 5 });
    await page.waitForTimeout(2000);
    console.log("OK: Typed post content (" + content.length + " chars)");

    // Wait for Post button to become enabled and click it using Playwright locators
    // LinkedIn's Post button is accessible via aria role but has nested spans,
    // so raw DOM textContent matching fails. Use Playwright's getByRole instead.
    const postBtn = page.getByRole("button", { name: "Post", exact: true });
    let posted = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        // Check if button exists and is enabled
        const isDisabled = await postBtn.getAttribute("aria-disabled", { timeout: 2000 });
        const isHtmlDisabled = await postBtn.isDisabled().catch(() => true);
        if (isDisabled === "true" || isHtmlDisabled) {
          console.log("WAIT: Post button is disabled (attempt " + (attempt + 1) + "/15)");
          await page.waitForTimeout(1000);
          continue;
        }
        await postBtn.click({ timeout: 5000 });
        console.log("OK: Clicked Post button (attempt " + (attempt + 1) + ")");
        posted = true;
        break;
      } catch (e) {
        console.log("WAIT: Post button not ready: " + e.message.substring(0, 60) + " (attempt " + (attempt + 1) + "/15)");
        await page.waitForTimeout(1000);
      }
    }

    if (!posted) {
      console.error("ERROR: Post button never became enabled after 15 attempts");
      process.exit(1);
    }

    // Wait for submission
    await page.waitForTimeout(5000);

    // Verify post was submitted by checking if the modal closed
    const editorStillVisible = await editor.isVisible().catch(() => false);
    if (!editorStillVisible) {
      console.log("SUCCESS: LinkedIn post published! (modal closed)");
    } else {
      console.log("WARN: Editor still visible. Post was clicked but may need more time.");
    }

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
