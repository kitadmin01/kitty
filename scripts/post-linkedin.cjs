#!/usr/bin/env node
// Usage: node post-linkedin.cjs "Your post content here" [--image /path/to/image.png]
// Connects to the existing Chromium browser via CDP and posts to LinkedIn feed.
// With --image: attaches an image to the post.

const CDP_URL = "http://127.0.0.1:18800";
const FEED_URL = "https://www.linkedin.com/feed/";

// Global timeout: kill process after 180 seconds (image upload needs more time)
const SCRIPT_TIMEOUT_MS = 180000;
const timeoutHandle = setTimeout(() => {
  console.error("ERROR: Script timed out after 180 seconds — force exiting");
  process.exit(1);
}, SCRIPT_TIMEOUT_MS);
timeoutHandle.unref();

async function main() {
  // Parse arguments: content is first arg, --image <path> is optional
  const rawArgs = process.argv.slice(2);
  const content = rawArgs[0];
  let imagePath = null;
  const imgIdx = rawArgs.indexOf("--image");
  if (imgIdx !== -1 && rawArgs[imgIdx + 1]) {
    imagePath = rawArgs[imgIdx + 1];
  }

  if (!content || content.trim().length === 0) {
    console.error("ERROR: Post content is required as first argument");
    process.exit(1);
  }

  if (imagePath) {
    const fs = require("fs");
    if (!fs.existsSync(imagePath)) {
      console.error("ERROR: Image file not found:", imagePath);
      process.exit(1);
    }
    console.log("OK: Image file found:", imagePath);
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
    page.on("dialog", async (dialog) => {
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

    // ── IMAGE UPLOAD (if provided) ──────────────────────────────────────────
    if (imagePath) {
      console.log("OK: Uploading image...");

      // NOTE: LinkedIn's compose modal is in shadow DOM; use page-level Playwright
      // locators which automatically pierce shadow DOM.
      // Click "Add media" button → filechooser → LinkedIn shows image Editor UI
      // → click "Next" to return to compose with image attached.
      let uploadedImage = false;

      try {
        const addMediaBtn = page.getByLabel("Add media");
        await addMediaBtn.waitFor({ state: "visible", timeout: 5000 });
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 10000 }),
          addMediaBtn.click(),
        ]);
        await fileChooser.setFiles(imagePath);
        uploadedImage = true;
        console.log("OK: Image selected via 'Add media' button");
      } catch (e) {
        console.log("WARN: Could not open filechooser:", e.message.substring(0, 80));
      }

      if (!uploadedImage) {
        console.log("WARN: Could not upload image — posting text only");
      } else {
        // Wait for LinkedIn's image Editor UI to fully render
        await page.waitForTimeout(5000);

        // Click "Next" to confirm the image and return to the compose view
        const nextBtn = page.getByRole("button", { name: /^Next$/i });
        if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(2000);
          console.log("OK: Clicked Next (image confirmed)");
        } else {
          // Try Done or Apply as fallback
          for (const btnName of ["Done", "Apply"]) {
            const btn = page.getByRole("button", { name: new RegExp(`^${btnName}$`, "i") });
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await btn.click();
              await page.waitForTimeout(2000);
              console.log(`OK: Clicked ${btnName} (image confirmed)`);
              break;
            }
          }
        }
      }
    }
    // ── END IMAGE UPLOAD ────────────────────────────────────────────────────

    // Find the text editor (works both with and without image attached)
    const editorSelectors = [
      page.getByRole("textbox", { name: "Text editor for creating content" }),
      page.getByRole("textbox", { name: /Add a caption/i }),
      page.getByRole("textbox", { name: /What do you want to talk about/i }),
    ];

    let editor = null;
    for (const loc of editorSelectors) {
      if (await loc.count() > 0 && await loc.isVisible({ timeout: 3000 }).catch(() => false)) {
        editor = loc;
        break;
      }
    }

    if (!editor) {
      // Fallback: any visible textbox
      editor = page.getByRole("textbox").first();
    }

    await editor.waitFor({ state: "visible", timeout: 10000 });
    await editor.click();
    await page.waitForTimeout(500);

    // Use pressSequentially to trigger React events (fill() doesn't work on LinkedIn)
    await editor.pressSequentially(content, { delay: 5 });
    await page.waitForTimeout(2000);
    console.log("OK: Typed post content (" + content.length + " chars)");

    // Wait for Post button to become enabled and click it
    const postBtn = page.getByRole("button", { name: "Post", exact: true });
    let posted = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
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
      console.log("SUCCESS: LinkedIn post published!" + (imagePath ? " (with image)" : ""));
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
