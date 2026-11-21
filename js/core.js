"use strict";

/* Pure rules shared by the website and the optional Node.js tests. */
globalThis.PortfolioCore = (() => {
  const projectSorts = ["title-asc", "title-desc", "level"];
  const levels = ["all", "beginner", "intermediate", "advanced"];
  const technologies = ["all", "csharp", "java", "javascript"];
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };

  function selectProjects(projects, filters) {
    const query = String(filters.query || "").trim().toLowerCase();
    const selected = projects.filter((project) => {
      const matchesTechnology = filters.technology === "all"
        || project.tags.includes(filters.technology);
      const matchesLevel = filters.level === "all" || project.level === filters.level;
      return matchesTechnology && matchesLevel && project.searchText.includes(query);
    });

    // Sort a filtered copy so changing the controls never mutates the source list.
    return selected.sort((a, b) => {
      if (filters.sort === "level") {
        const difference = levelOrder[a.level] - levelOrder[b.level];
        if (difference) return difference;
      }
      const byName = a.title.localeCompare(b.title, "en");
      return filters.sort === "title-desc" ? -byName : byName;
    });
  }

  function validateContact(values) {
    const name = String(values.name || "").trim();
    const email = String(values.email || "").trim();
    const message = String(values.message || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
    return {
      name: name.length < 2 || name.length > 60
        ? "Enter a name between 2 and 60 characters." : "",
      email: email.length > 254 || !emailPattern.test(email)
        ? "Enter an email address like name@example.com." : "",
      message: message.length < 10 || message.length > 1000
        ? "Write a message between 10 and 1,000 characters." : "",
      consent: values.consent === true ? "" : "Please confirm that you understand this is a demo."
    };
  }

  function normalizePreferences(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      technology: technologies.includes(source.technology) ? source.technology : "all",
      level: levels.includes(source.level) ? source.level : "all",
      sort: projectSorts.includes(source.sort) ? source.sort : "title-asc",
      query: typeof source.query === "string" ? source.query.slice(0, 80) : ""
    };
  }

  function remainingSeconds(timer, now = Date.now()) {
    return timer.running
      ? Math.max(0, Math.ceil((timer.deadline - now) / 1000))
      : timer.remaining;
  }

  function normalizeTimer(value, now = Date.now()) {
    const source = value && typeof value === "object" ? value : {};
    const minutes = Number.isInteger(source.minutes) && source.minutes >= 1
      && source.minutes <= 60 ? source.minutes : 20;
    const remaining = Number.isInteger(source.remaining) && source.remaining >= 0
      && source.remaining <= minutes * 60 ? source.remaining : minutes * 60;
    const running = source.running === true && Number.isFinite(source.deadline)
      && source.deadline > 0 && source.deadline <= now + minutes * 60000;
    return {
      minutes, remaining, running,
      deadline: running ? source.deadline : null,
      completed: Number.isInteger(source.completed) && source.completed >= 0
        && source.completed <= 1000000 ? source.completed : 0
    };
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function normalizeRepositories(data) {
    if (!Array.isArray(data)) throw new Error("The API did not return a repository list.");
    const repositories = data.filter((repo) => {
      if (!repo || !Number.isInteger(repo.id) || typeof repo.name !== "string") return false;
      if (typeof repo.html_url !== "string") return false;
      try {
        const url = new URL(repo.html_url);
        return url.protocol === "https:" && url.hostname === "github.com"
          && !url.username && !url.password && repo.private !== true;
      } catch { return false; }
    }).map((repo) => ({
      id: repo.id,
      name: repo.name.slice(0, 100),
      description: typeof repo.description === "string"
        ? repo.description.slice(0, 300) : "No description has been added yet.",
      html_url: repo.html_url,
      language: typeof repo.language === "string" ? repo.language.slice(0, 40) : "Not specified",
      stargazers_count: Number.isInteger(repo.stargazers_count) && repo.stargazers_count >= 0
        ? repo.stargazers_count : 0,
      updated_at: Number.isFinite(Date.parse(repo.updated_at)) ? repo.updated_at : null
    }));
    // An empty account is valid. A nonempty response containing no valid records is not.
    if (data.length && !repositories.length) throw new Error("The API returned invalid repository data.");
    return repositories;
  }

  function selectRepositories(repositories, query, language, sort) {
    const search = query.trim().toLowerCase();
    return repositories.filter((repo) => (language === "all" || repo.language === language)
      && `${repo.name} ${repo.description}`.toLowerCase().includes(search))
      .sort((a, b) => {
        if (sort === "stars") {
          const difference = b.stargazers_count - a.stargazers_count;
          if (difference) return difference;
        } else if (sort === "updated") {
          const difference = (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0);
          if (difference) return difference;
        }
        return a.name.localeCompare(b.name, "en");
      });
  }

  async function fetchRepositories(fetcher = fetch, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(
        "https://api.github.com/users/202254380/repos?type=owner&sort=updated&per_page=100",
        { signal: controller.signal, headers: { Accept: "application/vnd.github+json" } }
      );
      if (!response.ok) {
        const error = new Error("GitHub could not return the repositories.");
        error.status = response.status;
        throw error;
      }
      return normalizeRepositories(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }

  return Object.freeze({ selectProjects, validateContact, normalizePreferences,
    remainingSeconds, normalizeTimer, formatTime, normalizeRepositories,
    selectRepositories, fetchRepositories });
})();
