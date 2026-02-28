#!/usr/bin/env node
// Reads the next unposted tweet from /home/mani/kitty-data/tweets/tweets.xlsx,
// posts it to Twitter/X, then marks it as Posted="yes" in the spreadsheet.
// No arguments needed — just run: node post-twitter.cjs

const CDP_URL = "http://127.0.0.1:18800";
const COMPOSE_URL = "https://twitter.com/compose/tweet";
const TWEETS_FILE = "/home/mani/kitty-data/tweets/tweets.xlsx";
const XLSX_MODULE = "/home/mani/kitty-data/node_modules/xlsx";

// Global timeout: 90 seconds
const timeoutHandle = setTimeout(() => {
  console.error("ERROR: Script timed out after 90 seconds — force exiting");
  process.exit(1);
}, 90000);
timeoutHandle.unref();

function getNextTweet() {
  const XLSX = require(XLSX_MODULE);
  const wb = XLSX.readFile(TWEETS_FILE);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Parse as array of arrays to work with raw indices
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (rows.length < 2) {
    return null; // No data rows
  }

  const headers = rows[0].map(h => String(h || "").trim());
  const tweetTextCol = headers.findIndex(h => h.toLowerCase() === "tweet_text");
  const postedCol = headers.findIndex(h => h.toLowerCase() === "posted");

  if (tweetTextCol === -1) {
    console.error("ERROR: Could not find 'tweet_text' column in spreadsheet");
    process.exit(1);
  }
  if (postedCol === -1) {
    console.error("ERROR: Could not find 'Posted' column in spreadsheet");
    process.exit(1);
  }

  // Find first row where Posted != "yes"
  for (let i = 1; i < rows.length; i++) {
    const posted = String(rows[i][postedCol] || "").trim().toLowerCase();
    const text = String(rows[i][tweetTextCol] || "").trim();
    if (posted !== "yes" && text.length > 0) {
      return { rowIndex: i, tweetText: text, wb, ws, sheetName, postedCol };
    }
  }

  return null; // All tweets posted
}

function markAsPosted({ wb, ws, rowIndex, postedCol }) {
  const XLSX = require(XLSX_MODULE);
  const cellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: postedCol });
  ws[cellAddr] = { t: "s", v: "yes" };
  XLSX.writeFile(wb, TWEETS_FILE);
  console.log("OK: Marked row", rowIndex + 1, "as Posted=yes in spreadsheet");
}

async function main() {
  // Step 1: Read next tweet from spreadsheet
  const tweetData = getNextTweet();

  if (!tweetData) {
    console.log("INFO: No unposted tweets remaining in spreadsheet.");
    process.exit(0);
  }

  const { tweetText, rowIndex } = tweetData;

  if (tweetText.length > 280) {
    console.error(`ERROR: Tweet in row ${rowIndex + 1} exceeds 280 chars (${tweetText.length})`);
    process.exit(1);
  }

  console.log(`OK: Found tweet (row ${rowIndex + 1}, ${tweetText.length} chars): ${tweetText.substring(0, 80)}...`);

  // Step 2: Post to Twitter
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

    page.on("dialog", async (dialog) => {
      console.log("OK: Auto-accepting dialog:", dialog.message().substring(0, 80));
      await dialog.accept().catch(() => {});
    });

    // Navigate to compose page
    await page.goto(COMPOSE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

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

    // Clear any stale text
    const existingText = await editor.textContent().catch(() => "");
    if (existingText && existingText.trim().length > 0) {
      console.log("WARN: Clearing stale text from compose box (" + existingText.length + " chars)");
      await editor.press("Control+a");
      await page.waitForTimeout(200);
      await editor.press("Backspace");
      await page.waitForTimeout(500);
    }

    // Type tweet content
    await editor.pressSequentially(tweetText, { delay: 10 });
    await page.waitForTimeout(2000);
    console.log("OK: Typed tweet (" + tweetText.length + " chars)");

    // Wait for Post button to be enabled
    const postBtn = page.getByTestId("tweetButton");
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const isDisabled = await postBtn.isDisabled().catch(() => true);
      if (!isDisabled) { ready = true; break; }
      console.log("WAIT: Post button disabled (attempt " + (attempt + 1) + "/10)");
      await page.waitForTimeout(1000);
    }

    if (!ready) {
      console.error("ERROR: Post button never became enabled");
      process.exit(1);
    }

    // Submit via Ctrl+Enter
    await page.keyboard.press("Control+Enter");
    console.log("OK: Pressed Ctrl+Enter to submit");

    // Verify tweet was submitted
    let posted = false;
    for (let check = 0; check < 10; check++) {
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const editorGone = !(await editor.isVisible().catch(() => false));
      if (editorGone || finalUrl.includes("/home")) {
        posted = true;
        break;
      }
      if (check === 4) {
        console.log("WARN: Retrying Ctrl+Enter");
        await page.keyboard.press("Control+Enter");
      }
    }

    if (!posted) {
      console.error("ERROR: Tweet may not have been published — compose dialog still visible");
      process.exit(1);
    }

    console.log("SUCCESS: Tweet published!");

    // Step 3: Mark as posted in spreadsheet
    markAsPosted(tweetData);

  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
