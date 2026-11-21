# Mohammed’s Portfolio — Assignment 3

**Mohammed Abo Alsaud · 202254380 · SWE 363**

A personal portfolio built with HTML, CSS, and JavaScript. It extends Assignment 2 with live GitHub repositories, combined project controls, stronger contact checks, and a saved study timer.

## Run locally

1. Extract the project ZIP. Keep all the folders together.
2. Open a terminal **inside `202254380-mohammedaboalsaud-assignment3`**, where `index.html` is located.
3. Start a small local server:

```bash
python -m http.server 8000
```

On Windows, use `py -m http.server 8000` if `python` is not found. On macOS/Linux, try `python3 -m http.server 8000`.

4. Open [http://localhost:8000](http://localhost:8000).
5. Stop the server with **Ctrl+C** when finished.

No npm install, framework, build step, server application, API key, or GitHub login is required to run the site. Internet is needed to retrieve fresh GitHub data. The other features run in the browser.

## Features

| Feature | What to try |
| --- | --- |
| Live GitHub repositories | Load my public repositories, search them, select a language, and sort by update date, stars, or name. |
| Combined project controls | Search, technology, difficulty, and sort work together. Your choices are saved. |
| Conditional guidance | The difficulty selector changes the explanation and the projects shown. |
| Saved preferences | Change the theme or save a visitor name, then reload. |
| Study timer | Choose 1–60 minutes, start, pause, resume, reset, and reload during a session. |
| Contact validation | Check name, email, message length, and the demo confirmation before success. |
| IronLog | Add exercises and calculate total sets and training volume. |
| FocusList | Add, complete, filter, and delete saved tasks. |
| Error recovery | API errors show a retry control; a labelled saved copy is used when available. |

IronLog and FocusList are **JavaScript browser demos** of the C# and Java project ideas from Assignment 2. This submission does not include or require those back ends. The contact form checks input; it does not send or save messages.

## Project folders

| Path | Purpose |
| --- | --- |
| `index.html` | Portfolio sections, labelled forms, and project dialogs |
| `css/styles.css` | Responsive layout, readable colours, light/dark themes |
| `js/core.js` | Testable rules for filters, validation, the API, and timer calculations |
| `js/script.js` | Browser events, rendering, saved data, and the two demos |
| `assets/images/` | Optimized profile photo, small SVG previews, and favicon |
| `docs/` | Technical notes, test results, rubric mapping, AI report, and review guide |
| `tests/` | Optional logic tests and an isolated browser test page |
| `tools/verify-submission.py` | Checks real asset paths, local document links, and HTML labels |

Keep `css/`, `js/`, and `assets/` beside `index.html`. Moving their contents into the root folder will break the paths.

## Verify the project

Run the file check with Python 3.9 or later:

```bash
python tools/verify-submission.py
```

With Node.js 18 or later installed, run the optional logic tests. No packages are needed:

```bash
node --test tests/core.test.cjs
```

With the local server running, open [the browser test page](http://localhost:8000/tests/browser-tests.html). It tests the real app with isolated temporary data and mock API responses. It does not change your saved portfolio data.

See [test results](docs/testing-report.md) and [technical documentation](docs/technical-documentation.md).

## AI use and submission

ChatGPT helped implement, review, test, and document this version. The supplied Assignment 2 project was reused as the baseline. See the [AI usage report and required declaration](docs/ai-usage-report.md).

**Student review and personalization are still required.** Read [the code review guide](docs/student-review-guide.md), make and record your own changes, and confirm that the declaration is true. The separate evidence ZIP needs the complete, unedited chat export before submission. A generated summary cannot replace that export.

Use the public repository name **`202254380-mohammedaboalsaud-assignment3`**. Follow [the GitHub and Blackboard checklist](docs/submission-checklist.md). The ZIP includes the real local Git history; pushing it with Git preserves those commits. A GitHub repository and live deployment have not been created by this package.
