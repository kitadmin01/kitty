#!/usr/bin/env node
// Usage: node post-linkedin-with-diagram.cjs "Post content" --xml-file /path/diagram.xml [--out /tmp/diagram.png]
//        node post-linkedin-with-diagram.cjs "Post content" --xml "<mxGraphModel>...</mxGraphModel>" [--out /tmp/diagram.png]
// Renders a diagrams.net diagram to PNG, then posts it to LinkedIn — all in one process.
// The diagram is created BEFORE LinkedIn posting to avoid race conditions.

const CDP_URL = "http://127.0.0.1:18800";
const FEED_URL = "https://www.linkedin.com/feed/";

// Global timeout: 300 seconds
const timeoutHandle = setTimeout(() => {
  console.error("ERROR: Script timed out after 300 seconds — force exiting");
  process.exit(1);
}, 300000);
timeoutHandle.unref();

async function renderDiagram(browser, xml, outputPath) {
  const fs = require("fs");
  const path = require("path");

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const contexts = browser.contexts();
  if (!contexts.length) throw new Error("No browser contexts");
  const page = await contexts[0].newPage();

  try {
    page.on("dialog", async (d) => { await d.dismiss().catch(() => {}); });

    const encodedXml = encodeURIComponent(xml);
    const url = `https://app.diagrams.net/?title=KittyDiagram&chrome=0&nav=0&toolbar=0#R${encodedXml}`;

    console.log("OK: Opening diagrams.net...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    console.log("OK: Diagrams.net page loaded");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(2000);

    const CANVAS_SELECTORS = [".geDiagramContainer", ".geEditor", "svg.mxgraph", "[id='graph']", "canvas"];
    let canvasEl = null;
    for (const sel of CANVAS_SELECTORS) {
      try {
        await page.waitForSelector(sel, { timeout: 8000 });
        const el = await page.$(sel);
        if (el) {
          const bbox = await el.boundingBox();
          if (bbox && bbox.width > 100 && bbox.height > 100) {
            canvasEl = el;
            console.log(`OK: Found diagram canvas (${sel}): ${Math.round(bbox.width)}x${Math.round(bbox.height)}px`);
            break;
          }
        }
      } catch { /* Try next */ }
    }

    await page.waitForTimeout(3000);

    if (canvasEl) {
      await canvasEl.screenshot({ path: outputPath });
      const bbox = await canvasEl.boundingBox();
      console.log(`OK: Diagram saved to ${outputPath} (${Math.round(bbox?.width || 0)}x${Math.round(bbox?.height || 0)}px)`);
    } else {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.screenshot({ path: outputPath, clip: { x: 0, y: 60, width: 1280, height: 840 } });
      console.log(`OK: Saved full-page screenshot to ${outputPath}`);
    }

    return outputPath;
  } finally {
    await page.close().catch(() => {});
  }
}

async function postToLinkedIn(browser, content, imagePath) {
  const contexts = browser.contexts();
  if (!contexts.length) throw new Error("No browser contexts");

  const pages = contexts[0].pages();
  let page = pages.find(p => p.url().includes("linkedin.com"));
  if (!page) {
    page = pages[0] || await contexts[0].newPage();
  }

  page.on("dialog", async (dialog) => {
    console.log("OK: Auto-accepting dialog:", dialog.message().substring(0, 80));
    await dialog.accept().catch(() => {});
  });

  await page.goto(FEED_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);

  const title = await page.title();
  if (!title.includes("LinkedIn")) {
    throw new Error("Not on LinkedIn. Title: " + title);
  }
  console.log("OK: On LinkedIn feed");

  const startPostBtn = page.getByRole("button", { name: "Start a post" });
  await startPostBtn.waitFor({ state: "visible", timeout: 10000 });
  await startPostBtn.click();
  await page.waitForTimeout(2000);
  console.log("OK: Clicked 'Start a post'");

  // ── IMAGE UPLOAD ──────────────────────────────────────────────────────────
  if (imagePath) {
    console.log("OK: Uploading image:", imagePath);
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
      await page.waitForTimeout(5000);
      const nextBtn = page.getByRole("button", { name: /^Next$/i });
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
        console.log("OK: Clicked Next (image confirmed)");
      } else {
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
  // ── END IMAGE UPLOAD ──────────────────────────────────────────────────────

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
  if (!editor) editor = page.getByRole("textbox").first();

  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.waitForTimeout(500);

  await editor.pressSequentially(content, { delay: 5 });
  await page.waitForTimeout(2000);
  console.log("OK: Typed post content (" + content.length + " chars)");

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
      console.log("WAIT: Post button not ready: " + e.message.substring(0, 60));
      await page.waitForTimeout(1000);
    }
  }

  if (!posted) throw new Error("Post button never became enabled after 15 attempts");

  await page.waitForTimeout(5000);

  const editorStillVisible = await editor.isVisible().catch(() => false);
  if (!editorStillVisible) {
    console.log("SUCCESS: LinkedIn post published!" + (imagePath ? " (with image)" : ""));
  } else {
    console.log("WARN: Editor still visible. Post may need more time.");
  }
}

async function main() {
  const args = process.argv.slice(2);

  const content = args[0];
  if (!content || content.trim().length === 0) {
    console.error("ERROR: Post content is required as first argument");
    process.exit(1);
  }

  // Parse --xml-file or --xml
  let xml = null;
  let outputPath = `/tmp/kitty-diagram-${Date.now()}.png`;

  const xmlFileIdx = args.indexOf("--xml-file");
  if (xmlFileIdx !== -1 && args[xmlFileIdx + 1]) {
    const fs = require("fs");
    const xmlFile = args[xmlFileIdx + 1];
    if (!fs.existsSync(xmlFile)) {
      console.error("ERROR: XML file not found:", xmlFile);
      process.exit(1);
    }
    xml = fs.readFileSync(xmlFile, "utf8").trim();
    console.log("OK: XML loaded from file:", xmlFile);
  } else {
    const xmlIdx = args.indexOf("--xml");
    if (xmlIdx !== -1 && args[xmlIdx + 1]) {
      xml = args[xmlIdx + 1];
    }
  }

  const outIdx = args.indexOf("--out");
  if (outIdx !== -1 && args[outIdx + 1]) {
    outputPath = args[outIdx + 1];
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
    let imagePath = null;

    if (xml) {
      // Step 1: render diagram
      imagePath = await renderDiagram(browser, xml, outputPath);
      console.log("OK: Diagram created:", imagePath);
    }

    // Step 2: post to LinkedIn (with image if diagram was created)
    await postToLinkedIn(browser, content, imagePath);

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
