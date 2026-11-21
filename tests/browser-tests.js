"use strict";

/* Integration checks use the actual HTML/CSS/JS with isolated test-only storage. */
const repository = { id: 1, name: "Example project", html_url: "https://github.com/202254380/example",
  description: "A browser test fixture", language: "JavaScript", stargazers_count: 2,
  updated_at: "2026-11-20T10:00:00Z" };

function setupFixture(config) {
  const values = new Map(Object.entries(config.saved || {}));
  window.__qaRequests = 0;
  window.__qaErrors = [];
  window.addEventListener("error", (event) => window.__qaErrors.push(event.message));
  Object.defineProperty(window, "localStorage", { value: {
    getItem(key) { if (config.blockStorage) throw new Error("Storage blocked"); return values.get(key) ?? null; },
    setItem(key, value) { if (config.blockStorage) throw new Error("Storage blocked"); values.set(key, String(value)); },
    removeItem(key) { if (config.blockStorage) throw new Error("Storage blocked"); values.delete(key); }
  }});
  window.fetch = async () => {
    window.__qaRequests += 1;
    if (config.networkError) throw new TypeError("Network unavailable");
    return { ok: !config.status, status: config.status || 200,
      json: async () => config.data ?? [config.repository] };
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function until(predicate, message, timeout = 3500) {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function run() {
  const response = await fetch("../index.html");
  if (!response.ok) throw new Error("Could not load index.html. Use a local HTTP server.");
  const html = await response.text();
  const results = document.querySelector("#test-results");
  let passed = 0;
  let failed = 0;
  async function check(name, config, callback) {
    const frame = document.createElement("iframe");
    frame.title = `Test fixture: ${name}`;
    frame.style.cssText = `position:absolute;left:-100000px;top:0;width:${config.width || 1200}px;height:900px;border:0`;
    const settings = JSON.stringify({ repository, ...config }).replace(/</g, "\\u003c");
    const fixture = `<base href="../"><script>(${setupFixture.toString()})(${settings})<\/script>`;
    const loaded = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
    frame.srcdoc = html.replace("<head>", `<head>${fixture}`);
    document.body.append(frame);
    const item = document.createElement("li");
    try {
      await loaded;
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      await until(() => doc.querySelector("#project-count").textContent.includes("of 3"), "Application did not initialize");
      await callback(doc, win);
      assert(win.__qaErrors.length === 0, `Uncaught browser error: ${win.__qaErrors.join(", ")}`);
      item.textContent = `PASS — ${name}`;
      passed += 1;
    } catch (error) {
      item.textContent = `FAIL — ${name}: ${error.message}`;
      item.className = "is-error";
      failed += 1;
    } finally {
      frame.remove();
      results.append(item);
      document.querySelector("#summary").textContent = `${passed} passed; ${failed} failed.`;
    }
  }
  const click = (doc, selector) => doc.querySelector(selector).click();
  const input = (doc, win, selector, value, event = "input") => {
    doc.querySelector(selector).value = value;
    doc.querySelector(selector).dispatchEvent(new win.Event(event, { bubbles: true }));
  };

  await check("Live API response renders a safe repository link", {}, async (doc) => {
    await until(() => doc.querySelectorAll(".repository-card").length === 1, "Repository not rendered");
    assert(doc.querySelector("#github-source").textContent.startsWith("Live"), "Source label missing");
    assert(doc.querySelector(".repository-card a").rel.includes("noopener"), "Unsafe external link");
  });
  await check("No cached data: network failure shows a retry button", { networkError: true }, async (doc) => {
    await until(() => !doc.querySelector("#github-retry").hidden, "Retry missing");
    assert(doc.querySelector("#github-message").textContent.includes("connection"), "No helpful message");
  });
  await check("Rate-limit replies explain the request limit", { status: 403 }, async (doc) => {
    await until(() => !doc.querySelector("#github-retry").hidden, "Retry missing");
    assert(doc.querySelector("#github-message").textContent.includes("limit"), "Rate limit not explained");
  });
  await check("Unexpected API data is handled as an error", { data: { bad: true } }, async (doc) => {
    await until(() => !doc.querySelector("#github-retry").hidden, "Malformed data was not rejected");
  });
  await check("A successful empty API response has a clear empty state", { data: [] }, async (doc) => {
    await until(() => !doc.querySelector("#github-empty").hidden, "Empty state missing");
    assert(doc.querySelector("#github-empty").textContent.includes("no public"), "Incorrect empty message");
  });
  await check("A fresh saved copy avoids an unnecessary network request", { saved: {
    "a3-github-cache": JSON.stringify({ repositories: [repository], fetchedAt: Date.now() })
  }}, async (doc, win) => {
    assert(win.__qaRequests === 0, "Fresh cache made a request");
    assert(doc.querySelector("#github-source").textContent.startsWith("Saved"), "Cache is labelled as live");
  });
  await check("A stale cache remains available during an API failure", { networkError: true, saved: {
    "a3-github-cache": JSON.stringify({ repositories: [repository], fetchedAt: Date.now() - 3600000 })
  }}, async (doc) => {
    await until(() => !doc.querySelector("#github-retry").hidden, "Failure handler did not finish");
    assert(doc.querySelectorAll(".repository-card").length === 1, "Saved data was discarded");
    assert(doc.querySelector("#github-source").textContent.startsWith("Saved"), "Stale cache is labelled as live");
  });
  await check("Blocked storage uses in-memory state", { blockStorage: true }, async (doc, win) => {
    input(doc, win, "#visitor-name", "Visitor");
    doc.querySelector("#name-form").requestSubmit();
    assert(doc.querySelector("#greeting").textContent.includes("Visitor"), "Memory fallback failed");
    assert(!doc.querySelector("#storage-note").hidden, "Storage limit was not explained");
  });
  await check("Corrupt saved preferences and timer do not break startup", { saved: {
    "a3-project-controls": "broken JSON", "a3-focus-timer": JSON.stringify({ minutes: 999, running: true }),
    "ironlog-workouts": "null", "focuslist-tasks": "{}", "visitorName": " ".repeat(40),
    "a3-github-cache": JSON.stringify({ repositories: [repository], fetchedAt: String(Date.now()) })
  }}, async (doc, win) => {
    assert(doc.querySelector("#timer-display").textContent === "20:00", "Timer fallback is wrong");
    assert(doc.querySelectorAll("[data-project]:not([hidden])").length === 3, "Projects did not recover");
    assert(doc.querySelector("#forget-name").hidden, "Invalid saved name was kept");
    assert(win.__qaRequests === 1, "Invalid cache timestamp was trusted");
  });
  await check("Search, technology, difficulty, and sorting work together", {}, async (doc, win) => {
    input(doc, win, "#project-search", "workout");
    click(doc, '[data-filter="javascript"]');
    input(doc, win, "#project-level", "intermediate", "change");
    input(doc, win, "#project-sort", "title-desc", "change");
    const shown = [...doc.querySelectorAll("[data-project]:not([hidden]) h3")];
    assert(shown.length === 1 && shown[0].textContent.includes("IronLog"), "Combined rules failed");
    click(doc, "#clear-project-options");
    assert(doc.querySelectorAll("[data-project]:not([hidden])").length === 3, "Reset failed");
  });
  await check("Project controls are restored from saved preferences", { saved: {
    "a3-project-controls": JSON.stringify({ query: "task", technology: "java", level: "beginner", sort: "title-desc" })
  }}, async (doc) => {
    assert(doc.querySelector("#project-level").value === "beginner", "Saved level missing");
    assert(doc.querySelector("#project-count").textContent.includes("1 of 3"), "Saved rules were not applied");
  });
  await check("Contact success requires all fields and explicit consent", {}, async (doc, win) => {
    const form = doc.querySelector("#contact-form");
    form.requestSubmit();
    assert(doc.querySelectorAll('#contact-form [aria-invalid="true"]').length === 4, "Blank fields were accepted");
    input(doc, win, "#name", "Visitor");
    input(doc, win, "#email", "visitor@example.com");
    input(doc, win, "#message", "This is a test message.");
    form.requestSubmit();
    assert(doc.querySelector("#consent-msg").textContent, "Consent was not required");
    click(doc, "#contact-consent");
    form.requestSubmit();
    assert(doc.querySelector("#form-status").textContent.includes("passed all checks"), "Valid form failed");
  });
  await check("IronLog calculates volume and keeps user text as text", {}, async (doc, win) => {
    click(doc, '[data-open="dlg-ironlog"]');
    input(doc, win, "#exercise", '<img src=x onerror="alert(1)">');
    doc.querySelector("#workout-form").requestSubmit();
    assert(doc.querySelector("#volume-count").textContent === "480", "Volume calculation is wrong");
    assert(!doc.querySelector("#workout-list img"), "User text was parsed as HTML");
    click(doc, "#clear-workouts");
    assert(doc.querySelector("#workout-count").textContent === "0", "Clear workouts failed");
  });
  await check("FocusList updates progress and filters independently of projects", {}, async (doc, win) => {
    click(doc, '[data-open="dlg-focuslist"]');
    input(doc, win, "#task-input", "Review Assignment 3");
    doc.querySelector("#task-form").requestSubmit();
    click(doc, '#task-list input[type="checkbox"]');
    assert(doc.querySelector("#progress-label").textContent === "100% complete", "Task progress is wrong");
    click(doc, '[data-task-filter="open"]');
    assert(doc.querySelectorAll("#task-list article").length === 0, "Open task filter failed");
    assert(doc.querySelector("#project-count").textContent.includes("3 of 3"), "Task controls changed project controls");
  });
  await check("Timer starts, pauses, resumes, and resets", {}, async (doc) => {
    click(doc, "#timer-toggle");
    assert(doc.querySelector("#focus-minutes").disabled, "Running timer length should be locked");
    click(doc, "#timer-toggle");
    assert(!doc.querySelector("#focus-minutes").disabled, "Pause did not unlock controls");
    click(doc, "#timer-toggle");
    click(doc, "#timer-reset");
    assert(doc.querySelector("#timer-display").textContent === "25:00", "Reset failed");
  });
  await check("Expired saved sessions complete once on reload", { saved: {
    "a3-focus-timer": JSON.stringify({ minutes: 1, remaining: 60, running: true, deadline: Date.now() - 1000, completed: 2 })
  }}, async (doc) => {
    assert(doc.querySelector("#session-count").textContent === "3", "Expired session was not counted once");
    assert(doc.querySelector("#timer-display").textContent === "00:00", "Expired session did not finish");
  });
  for (const width of [320, 390, 768, 1440]) {
    await check(`Layout and images fit a ${width}px viewport`, { width }, async (doc, win) => {
      await until(() => [...doc.images].every((image) => image.complete || image.loading === "lazy"), "Hero image did not load");
      assert(doc.documentElement.scrollWidth <= win.innerWidth + 1, `Horizontal overflow: ${doc.documentElement.scrollWidth}px`);
      assert(doc.querySelector(".profile-image").naturalWidth > 0, "Profile image is broken");
      assert(win.getComputedStyle(doc.body).backgroundColor !== "rgba(0, 0, 0, 0)", "Stylesheet missing");
    });
  }
  document.querySelector("#summary").textContent = `Complete: ${passed} passed; ${failed} failed.`;
  document.title = `${failed ? "FAIL" : "PASS"}: ${passed} browser checks`;
}

run().catch((error) => {
  document.querySelector("#summary").textContent = `Could not run checks: ${error.message}`;
});
