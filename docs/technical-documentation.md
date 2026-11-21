# Technical documentation

## Design

This is a static website. HTML provides the content, CSS handles appearance, and classic deferred scripts run in order: `core.js`, then `script.js`. There are no third-party runtime libraries or external fonts. The two scripts are small enough to read without a build tool.

The page keeps the existing portfolio subjects: software engineering, C#/Java project ideas, and working out. The new GitHub section relates directly to the owner’s real projects. The timer gives a visitor a small study tool.

## How the main features work

| Feature | Main functions | Main rule |
| --- | --- | --- |
| Curated projects | `selectProjects`, `renderProjects` | Search AND technology AND difficulty; then sort a copy. |
| External data | `fetchRepositories`, `normalizeRepositories`, `loadGithub` | Validate the HTTP status and data; render safe fields only. |
| GitHub controls | `selectRepositories`, `renderRepositories` | Search AND language; then sort by date, stars, or name. |
| Preferences | `store`, `normalizePreferences`, `initTheme`, `initGreeting` | Validate saved choices before applying them. |
| Contact form | `validateContact`, `showContactError` | Every field and the confirmation must pass. |
| Timer | `normalizeTimer`, `remainingSeconds`, `tickTimer` | Compare the saved deadline to the real clock. |
| IronLog | `isWorkout`, `renderWorkouts`, `initWorkouts` | Volume is sets × reps × weight. |
| FocusList | `isTask`, `renderTasks`, `setTaskFilter` | Progress is completed tasks / all tasks × 100. |

### API integration

Endpoint: `https://api.github.com/users/202254380/repos?type=owner&sort=updated&per_page=100`.

The browser calls GitHub with `fetch`, `async`/`await`, an `Accept` header, and an `AbortController`. No credentials are sent. The request is cancelled after eight seconds. A `finally` block always clears the timeout, ends the busy state, and re-enables the refresh control. Another request cannot start while one is running.

The app checks `response.ok`, parses JSON, and validates the result. A valid empty array means that the account has no public repositories. A malformed object or a nonempty list with no valid records is treated as a failure. Records with unsafe URLs or private visibility are dropped. Repository links must use HTTPS and the exact `github.com` hostname. Missing descriptions, languages, star counts, and dates get clear defaults.

GitHub strings are inserted with `textContent`, never `innerHTML`. Repository links use `noopener noreferrer`. Search, language filtering, and sorting happen locally after one request. Up to 100 repositories are shown; pagination beyond the first 100 is not implemented.

### Cache and error states

A cached response has a retrieval timestamp. For 15 minutes, the app can use it without making a new request. The **Refresh GitHub** button always tries the network. If a later request fails, a valid saved copy up to seven days old remains available. Every saved response is labelled **Saved GitHub copy** with its original retrieval time. It is never described as fresh live data.

No usable cache: show an explanation and a retry button. HTTP 403/429: explain that GitHub is busy or its request limit was reached. Timeout: explain that GitHub took too long. Empty account and empty search results have different messages. Other features continue working when GitHub fails.

### Combined project logic

A project appears only when all active filters match. For example, JavaScript + Intermediate + “workout” gives IronLog. Java + Beginner gives FocusList. Contradictory rules give a useful empty state. Reset clears every project control. Task filter buttons use `data-task-filter`; project buttons use `data-filter`, so the two areas cannot interfere.

The project difficulty labels describe the examples’ relative feature complexity. They are not certifications of the author’s skill. Sorting by difficulty uses an explicit beginner/intermediate/advanced rank. Alphabetical sorting uses `localeCompare`. The original array is not changed.

### Contact validation

| Field | Rule |
| --- | --- |
| Name | Trimmed; 2–60 characters |
| Email | Trimmed; at most 254 characters; simple address pattern with a domain dot |
| Message | Trimmed; 10–1,000 characters |
| Demo confirmation | Must be checked |

The form validates on blur and submit. An invalid field is checked again as it is corrected. Every error is shown beside its field and connected with `aria-describedby`; invalid fields get `aria-invalid`. Submit focuses the first invalid field. Success appears only after every rule passes. The email check is a useful format check, not full RFC validation or proof that the mailbox exists. The form has no sending endpoint and stores no contact details.

### Timer logic

Starting saves `deadline = Date.now() + remaining × 1000`. The display uses `Math.ceil((deadline - Date.now()) / 1000)` and clamps to zero. This avoids losing time when browsers slow down background callbacks. A single interval updates the display; it is stopped on pause, reset, or completion. Returning to the tab also reconciles the clock.

Pausing saves the calculated remaining seconds. Reload restores a validated timer. If the saved running deadline has expired, the session is completed and saved once. Future reloads see a stopped timer, so completion is not counted again. Changing the length resets the current countdown. Reset preserves the total completed-session count. Completion is shown when the page is open or reopened; there is no operating-system alarm or background service.

## State and storage

`projectState`, `githubState`, and `timer` hold the current application state. Workouts and tasks have their own validated arrays. Rendering follows state changes rather than reading counts back out of HTML.

| localStorage key | Contents |
| --- | --- |
| `theme` | `light` or `dark` |
| `visitorName` | The visitor’s chosen greeting name |
| `a3-project-controls` | Search, technology, difficulty, and sort |
| `a3-github-cache` | Validated repositories and retrieval time |
| `a3-focus-timer` | Session length, remaining time, deadline, running state, completion count |
| `ironlog-workouts` | Saved exercise records |
| `focuslist-tasks` | Saved task records |

Objects are converted with `JSON.stringify` and read with `JSON.parse` inside safe error handling. Invalid JSON and invalid records fall back to defaults. The storage wrapper keeps a memory copy and shows a short notice if browser storage is blocked. Memory fallback lasts for the current page; it cannot preserve data after reload. Data is local to a browser origin, not an account or server database. Concurrent edits in multiple open tabs are not synchronized.

## Performance and compatibility

The profile image was resized from 1980 × 2640 to 480 × 640 and compressed from 161,411 to 31,270 bytes. Explicit image dimensions reserve space. Below-the-fold previews use lazy loading. There are no external fonts, JavaScript packages, or CSS frameworks. Deferred scripts let HTML parsing finish. Search input is debounced by 150 ms. The API uses a cache and prevents overlapping requests. The timer writes storage on state transitions, not every second.

The page uses responsive grid/flex layouts and readable system fonts. Controls have labels and visible keyboard focus. Touch controls are generally at least 44 pixels high. Normal document order, a skip link, native dialogs, status messages, and reduced-motion rules support access. Native dialogs provide modal focus handling and Escape dismissal in current major browsers. A visual fallback exists for browsers without `showModal`; its modal keyboard behavior is less complete than native support.

All asset paths are relative. This supports a project hosted below a GitHub Pages repository path. See [the test report](testing-report.md) for the browsers, viewport widths, and checks actually run. No untested browser is claimed as verified.

## References

- [GitHub REST repository documentation](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Lighthouse documentation](https://developer.chrome.com/docs/lighthouse/overview)
- [AI collaboration report](ai-usage-report.md)
