"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../js/core.js"), "utf8"));
const core = globalThis.PortfolioCore;

const projects = [
  { title: "IronLog", tags: ["csharp", "javascript"], level: "intermediate", searchText: "ironlog workout tracker" },
  { title: "FocusList", tags: ["java", "javascript"], level: "beginner", searchText: "focuslist task manager" },
  { title: "Portfolio", tags: ["javascript"], level: "advanced", searchText: "portfolio live github api" }
];
const filters = (changes) => ({ technology: "all", level: "all", query: "", sort: "title-asc", ...changes });
const names = (items) => items.map((item) => item.title);

test("project technology, level, and search are combined with AND", () => {
  assert.deepEqual(names(core.selectProjects(projects, filters({ technology: "javascript", level: "intermediate", query: " WORKOUT " }))), ["IronLog"]);
});
test("Java filtering does not accidentally include JavaScript projects", () => {
  assert.deepEqual(names(core.selectProjects(projects, filters({ technology: "java" }))), ["FocusList"]);
});
test("contradictory filters give an empty list", () => {
  assert.equal(core.selectProjects(projects, filters({ technology: "csharp", level: "beginner" })).length, 0);
});
test("both alphabetical sort directions work", () => {
  assert.deepEqual(names(core.selectProjects(projects, filters())), ["FocusList", "IronLog", "Portfolio"]);
  assert.deepEqual(names(core.selectProjects(projects, filters({ sort: "title-desc" }))), ["Portfolio", "IronLog", "FocusList"]);
});
test("difficulty ordering uses a defined rank", () => {
  assert.deepEqual(names(core.selectProjects(projects, filters({ sort: "level" }))), ["FocusList", "IronLog", "Portfolio"]);
});
test("filtering and sorting preserve the source collection", () => {
  core.selectProjects(projects, filters());
  assert.deepEqual(names(projects), ["IronLog", "FocusList", "Portfolio"]);
});
test("invalid saved filter values return to safe defaults", () => {
  assert.deepEqual(core.normalizePreferences({ sort: "run-code", level: null, technology: "unknown", query: 123 }), filters());
  assert.deepEqual(core.normalizePreferences(null), filters());
});
test("a valid saved query is kept but capped at the input limit", () => {
  assert.equal(core.normalizePreferences({ query: "x".repeat(200) }).query.length, 80);
});

const validContact = { name: "Mohammed", email: "student@example.com", message: "A useful message.", consent: true };
test("a complete contact message passes every rule", () => {
  assert.ok(Object.values(core.validateContact(validContact)).every((error) => error === ""));
});
test("blank or whitespace-only contact fields fail", () => {
  const errors = core.validateContact({ name: " ", email: "", message: "\n", consent: false });
  assert.ok(Object.values(errors).every(Boolean));
});
test("contact email handles valid subdomains and rejects common mistakes", () => {
  for (const email of ["a+b@sub.example.com", "student@example.sa"]) {
    assert.equal(core.validateContact({ ...validContact, email }).email, "");
  }
  for (const email of ["a@b", "a@@b.com", "a@.com", "a@b..com", "a b@example.com"]) {
    assert.ok(core.validateContact({ ...validContact, email }).email);
  }
});
test("contact minimum and maximum lengths are enforced", () => {
  assert.ok(core.validateContact({ ...validContact, name: "M" }).name);
  assert.ok(core.validateContact({ ...validContact, name: "a".repeat(61) }).name);
  assert.ok(core.validateContact({ ...validContact, message: "a".repeat(1001) }).message);
  assert.equal(core.validateContact({ ...validContact, message: "a".repeat(10) }).message, "");
});
test("consent must be an actual checked boolean", () => {
  assert.ok(core.validateContact({ ...validContact, consent: "true" }).consent);
  assert.ok(core.validateContact({ ...validContact, consent: false }).consent);
});

test("timer formatting covers minute boundaries", () => {
  assert.equal(core.formatTime(60), "01:00");
  assert.equal(core.formatTime(59), "00:59");
  assert.equal(core.formatTime(3600), "60:00");
  assert.equal(core.formatTime(-1), "00:00");
});
test("timer uses a clock deadline, including after background throttling", () => {
  const timer = { running: true, deadline: 61000 };
  assert.equal(core.remainingSeconds(timer, 1000), 60);
  assert.equal(core.remainingSeconds(timer, 40500), 21);
  assert.equal(core.remainingSeconds(timer, 90000), 0);
});
test("paused timers do not lose time", () => {
  assert.equal(core.remainingSeconds({ running: false, remaining: 43 }, 999999), 43);
});
test("invalid saved timers are sanitized", () => {
  const timer = core.normalizeTimer({ minutes: 500, remaining: -5, completed: "50", running: true, deadline: "tomorrow" });
  assert.equal(timer.minutes, 25);
  assert.equal(timer.remaining, 1500);
  assert.equal(timer.running, false);
  assert.equal(timer.completed, 0);
});
test("reload preserves valid running and expired deadlines for one-time completion", () => {
  const source = { minutes: 1, remaining: 60, running: true, deadline: 61000, completed: 3 };
  assert.equal(core.normalizeTimer(source, 1000).running, true);
  const expired = core.normalizeTimer(source, 90000);
  assert.equal(expired.running, true);
  assert.equal(core.remainingSeconds(expired, 90000), 0);
});

const rawRepo = (changes) => ({ id: 1, name: "project", html_url: "https://github.com/202254380/project", description: "A project", language: "JavaScript", stargazers_count: 2, updated_at: "2026-11-20T10:00:00Z", ...changes });
test("empty repository accounts are a valid response", () => {
  assert.deepEqual(core.normalizeRepositories([]), []);
});
test("malformed API payloads are rejected", () => {
  for (const data of [null, {}, { message: "API rate limit" }, [{ html_url: "bad" }]]) {
    assert.throws(() => core.normalizeRepositories(data));
  }
});
test("repository URLs reject scripts, credentials, lookalike hosts, and private data", () => {
  const data = [rawRepo(),
    rawRepo({ html_url: "javascript:alert(1)" }),
    rawRepo({ html_url: "https://github.com.evil.example/x" }),
    rawRepo({ html_url: "https://name:password@github.com/project" }),
    rawRepo({ private: true })];
  assert.equal(core.normalizeRepositories(data).length, 1);
});
test("missing optional GitHub fields get readable defaults", () => {
  const [repo] = core.normalizeRepositories([rawRepo({ description: null, language: null, stargazers_count: -1, updated_at: "invalid" })]);
  assert.equal(repo.language, "Not specified");
  assert.equal(repo.stargazers_count, 0);
  assert.equal(repo.updated_at, null);
});
test("repository search, language, and star sorting work together", () => {
  const repos = core.normalizeRepositories([rawRepo({ id: 1, name: "Alpha", stargazers_count: 2 }), rawRepo({ id: 2, name: "Beta", stargazers_count: 9 }), rawRepo({ id: 3, name: "Java", language: "Java" })]);
  assert.deepEqual(core.selectRepositories(repos, "project", "JavaScript", "stars").map((r) => r.name), ["Beta", "Alpha"]);
});
test("repository date sorting handles missing dates", () => {
  const repos = core.normalizeRepositories([rawRepo({ id: 1, name: "Old", updated_at: null }), rawRepo({ id: 2, name: "New" })]);
  assert.equal(core.selectRepositories(repos, "", "all", "updated")[0].name, "New");
});
test("API success validates data and uses the expected public endpoint", async () => {
  const repos = await core.fetchRepositories(async (url, options) => {
    assert.ok(url.startsWith("https://api.github.com/users/202254380/repos?"));
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => [rawRepo()] };
  });
  assert.equal(repos[0].name, "project");
});
test("API HTTP errors keep the status for a helpful rate-limit message", async () => {
  await assert.rejects(core.fetchRepositories(async () => ({ ok: false, status: 403 })), (error) => error.status === 403);
});
test("API network errors propagate to the fallback handler", async () => {
  await assert.rejects(core.fetchRepositories(async () => { throw new TypeError("Network failed"); }), /Network failed/);
});
test("invalid JSON is an API failure rather than an unhandled success", async () => {
  await assert.rejects(core.fetchRepositories(async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })), /Invalid JSON/);
});
test("slow API requests are aborted", async () => {
  const pending = (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true });
  });
  await assert.rejects(core.fetchRepositories(pending, 15), (error) => error.name === "AbortError");
});
