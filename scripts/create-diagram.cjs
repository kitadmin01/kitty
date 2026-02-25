#!/usr/bin/env node
// Usage: node create-diagram.cjs --file /path/to/diagram.xml [/path/output.png]
//        node create-diagram.cjs "<mxGraphModel xml>" [/path/output.png]
// Renders a diagrams.net (draw.io) XML diagram to PNG using headless Chrome.

const CDP_URL = "http://127.0.0.1:18800";

// Global timeout: 120 seconds
const timeoutHandle = setTimeout(() => {
  console.error("ERROR: Script timed out after 120 seconds — force exiting");
  process.exit(1);
}, 120000);
timeoutHandle.unref();

async function main() {
  const args = process.argv.slice(2);
  let xml, outputPath;

  if (args[0] === "--file") {
    if (!args[1]) {
      console.error("ERROR: --file requires a path argument");
      process.exit(1);
    }
    xml = require("fs").readFileSync(args[1], "utf8").trim();
    outputPath = args[2] || `/tmp/kitty-diagram-${Date.now()}.png`;
  } else {
    xml = args[0];
    outputPath = args[1] || `/tmp/kitty-diagram-${Date.now()}.png`;
  }

  if (!xml || xml.trim().length === 0) {
    console.error("ERROR: Diagram XML is required");
    console.error("  Usage: node create-diagram.cjs --file diagram.xml [output.png]");
    console.error("  Or:    node create-diagram.cjs \"<mxGraphModel>...\" [output.png]");
    process.exit(1);
  }

  // Ensure output directory exists
  const path = require("path");
  const fs = require("fs");
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pw = require("/home/mani/openclaw/node_modules/playwright-core");
  let browser;

  try {
    browser = await pw.chromium.connectOverCDP(CDP_URL);
  } catch (e) {
    console.error("ERROR: Cannot connect to browser on CDP port 18800. Is the gateway running?");
    process.exit(1);
  }

  const contexts = browser.contexts();
  if (!contexts.length) {
    console.error("ERROR: No browser contexts found");
    process.exit(1);
  }

  // Open a NEW page to avoid interfering with LinkedIn/Twitter sessions
  const page = await contexts[0].newPage();

  try {
    // Dismiss any unexpected dialogs
    page.on("dialog", async (d) => {
      await d.dismiss().catch(() => {});
    });

    // diagrams.net URL: #R{url-encoded-xml} loads the XML directly without dialogs
    const encodedXml = encodeURIComponent(xml);
    const url = `https://app.diagrams.net/?title=KittyDiagram&chrome=0&nav=0&toolbar=0#R${encodedXml}`;

    console.log("OK: Opening diagrams.net...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    console.log("OK: Page loaded");

    // Press Escape to dismiss any open modals (e.g. "unsaved changes" prompts)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(2000);

    // Wait for the diagram canvas to fully render
    const CANVAS_SELECTORS = [
      ".geDiagramContainer",
      ".geEditor",
      "svg.mxgraph",
      "[id='graph']",
      "canvas",
    ];

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
      } catch {
        // Try next selector
      }
    }

    // Extra wait for rendering to complete
    await page.waitForTimeout(3000);

    if (canvasEl) {
      // Screenshot just the diagram canvas element
      await canvasEl.screenshot({ path: outputPath });
      const bbox = await canvasEl.boundingBox();
      console.log(`SUCCESS: Diagram saved to ${outputPath} (${Math.round(bbox?.width || 0)}x${Math.round(bbox?.height || 0)}px)`);
    } else {
      // Fallback: screenshot the full viewport (trim browser chrome)
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.screenshot({ path: outputPath, clip: { x: 0, y: 60, width: 1280, height: 840 } });
      console.log(`OK: Saved full-page screenshot to ${outputPath} (canvas selector not found)`);
    }

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await page.close().catch(() => {});
    await browser.close();
  }
}

main();
