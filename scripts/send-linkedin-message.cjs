#!/usr/bin/env node
// Usage: node send-linkedin-message.cjs "Full Name" "First Name" "employer keyword"
// Sends a LinkedIn demo request message via browser automation (shadow DOM aware)

const CDP_URL = "http://127.0.0.1:18800";
const PROFILE_URL = "https://www.linkedin.com/feed/";

const timeoutHandle = setTimeout(() => {
  console.error("ERROR: Script timed out after 180 seconds");
  process.exit(1);
}, 180000);
timeoutHandle.unref();

const args = process.argv.slice(2);
const FULL_NAME = args[0];
const FIRST_NAME = args[1] || FULL_NAME.split(" ")[0];

if (!FULL_NAME) {
  console.error("ERROR: Usage: node send-linkedin-message.cjs \"Full Name\" \"First Name\"");
  process.exit(1);
}

const MESSAGE = `Hi ${FIRST_NAME},

I'm building Analytickit, a Web2 + Web3 analytics platform that combines website behavior data with on-chain activity to give deeper insights into user journeys.

I'm not reaching out to sell anything. I'm looking for a few thoughtful people who'd be open to a short demo and willing to give honest feedback — what's useful, what's confusing, what's missing, and what doesn't matter.

If you're open to a quick 20-30 minute walkthrough sometime in the next couple of weeks, I'd really value your perspective. You can book here: https://calendly.com/analytickit

No pressure at all — just trying to make the product better.

Thanks,
James`;

async function main() {
  const pw = require("/home/mani/openclaw/node_modules/playwright-core");
  let browser;
  try {
    browser = await pw.chromium.connectOverCDP(CDP_URL);
  } catch (e) {
    console.error("ERROR: Cannot connect to browser:", e.message);
    process.exit(1);
  }

  try {
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();
    let page = pages.find(p => p.url().includes("linkedin.com")) || pages[0] || await ctx.newPage();
    page.on("dialog", async d => { await d.dismiss().catch(() => {}); });

    // Navigate to LinkedIn feed to get a clean page
    await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(4000);
    console.log("OK: On LinkedIn feed");

    // Open Compose via shadow DOM
    await page.evaluate(() => {
      const outlet = document.getElementById("interop-outlet");
      if (!outlet || !outlet.shadowRoot) return;
      const btns = Array.from(outlet.shadowRoot.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim().includes("Compose message"));
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);
    console.log("OK: Opened compose");

    // Search for recipient
    const searchBox = page.locator("#interop-outlet").locator("input").first();
    await searchBox.waitFor({ state: "visible", timeout: 8000 });
    await searchBox.fill(FULL_NAME);
    await page.waitForTimeout(3000);
    console.log("OK: Searched for:", FULL_NAME);

    // Get suggestions and find the right one (prefer 1st connection)
    const suggestions = await page.evaluate(() => {
      const outlet = document.getElementById("interop-outlet");
      if (!outlet || !outlet.shadowRoot) return [];
      const items = outlet.shadowRoot.querySelectorAll("[role='option']");
      return Array.from(items).map(el => ({
        text: el.textContent.trim().replace(/\s+/g, " ").substring(0, 150),
        is1st: el.textContent.includes("• 1st")
      }));
    });
    console.log("OK: Suggestions:", JSON.stringify(suggestions.map(s => s.text)));

    // Prefer 1st-degree, else first result
    const targetIdx = suggestions.findIndex(s => s.is1st && s.text.toLowerCase().includes(FULL_NAME.toLowerCase()));
    const finalIdx = targetIdx !== -1 ? targetIdx : suggestions.findIndex(s => s.text.toLowerCase().includes(FULL_NAME.toLowerCase()));
    if (finalIdx === -1) {
      console.error("ERROR: Could not find", FULL_NAME, "in suggestions — skipping");
      process.exit(2); // exit 2 = not found, caller can mark as skip
    }
    console.log("OK: Selecting suggestion:", suggestions[finalIdx].text.substring(0, 80));

    // JS-click the suggestion (avoids overlay interception)
    await page.evaluate((idx) => {
      const outlet = document.getElementById("interop-outlet");
      const items = outlet.shadowRoot.querySelectorAll("[role='option']");
      if (items[idx]) items[idx].click();
    }, finalIdx);
    await page.waitForTimeout(2000);
    console.log("OK: Recipient selected");

    // Dismiss any upsell/modal that might appear
    const modal = page.locator("[data-test-modal-id='modal-upsell'], .artdeco-modal-overlay").first();
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1000);
      console.log("OK: Dismissed upsell modal");
    }

    // JS-focus then keyboard-type into the compose box (bypasses overlay blocking)
    await page.evaluate(() => {
      const outlet = document.getElementById("interop-outlet");
      if (!outlet || !outlet.shadowRoot) return;
      const box = outlet.shadowRoot.querySelector("[contenteditable='true'][aria-label*='message']");
      if (box) box.focus();
    });
    await page.waitForTimeout(500);
    await page.keyboard.type(MESSAGE, { delay: 5 });
    await page.waitForTimeout(2000);
    console.log("OK: Typed message (" + MESSAGE.length + " chars)");

    // JS-click send button
    const sent = await page.evaluate(() => {
      const outlet = document.getElementById("interop-outlet");
      if (!outlet || !outlet.shadowRoot) return false;
      const btns = Array.from(outlet.shadowRoot.querySelectorAll("button"));
      const sendBtn = btns.find(b => b.textContent.trim() === "Send" || b.getAttribute("aria-label") === "Send");
      if (!sendBtn || sendBtn.disabled) return false;
      sendBtn.click();
      return true;
    });

    if (!sent) {
      console.error("ERROR: Send button not found or disabled");
      process.exit(1);
    }

    await page.waitForTimeout(3000);
    console.log("SUCCESS: LinkedIn message sent to", FULL_NAME);

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
