# Testing report

**Date:** 21 November 2026  
**Performed during:** AI-assisted development in this conversation

These results describe checks that were actually run. They are not a claim that the student personally ran them, and they do not guarantee a mark.

## Automated logic checks

Command: `node --test tests/core.test.cjs`.

**Result: 29 tests passed, 0 failed.** Node.js 24 was used for the development run. The tests use built-in Node modules and do not require npm packages.

Coverage includes combined project rules, Java versus JavaScript tags, conflicting filters, both alphabetical directions, difficulty order, immutable source data, saved-filter recovery, contact bounds, email mistakes, confirmation checks, timer boundaries and deadlines, paused/expired sessions, malformed API replies, safe links, missing optional fields, repository sorting, HTTP failures, network failures, invalid JSON, and request timeouts.

## Real-browser integration checks

Open `tests/browser-tests.html` through the local server to repeat them. The page loads the actual application in isolated frames and uses mock API replies and temporary in-memory storage. This makes error cases reproducible without exhausting GitHub’s API limit.

**Result: 20 checks passed, 0 failed in the available Chrome browser.**

| Area | Checks that passed |
| --- | --- |
| API success | A valid repository renders with a safe link and a live-response label. |
| API failure | Network error, HTTP 403, and unexpected payload show retry/error states. |
| Empty API response | An empty account is shown as empty, without a false failure. |
| API cache | Fresh cache avoids a request; stale cache survives a network failure and is labelled as saved. |
| Storage failure | Blocked storage uses memory and shows a notice. |
| Invalid storage | Malformed filters, cache, workout/task lists, and timer recover without breaking startup. |
| Project logic | Search, technology, difficulty, and sorting combine; reset restores all cards; saved controls restore. |
| Contact form | All four rules are required before success. |
| IronLog | Volume is correct; markup-like input stays text; clearing resets totals. |
| FocusList | Completion updates progress; task filtering does not affect project filtering. |
| Timer | Start, pause, resume, reset, and expired saved-session recovery work. |
| Responsive layout | No horizontal document overflow at 320, 390, 768, and 1440 pixels; stylesheet and portrait load. |

## Additional browser checks

The actual live GitHub request succeeded and displayed the account’s two public repositories at test time. Unlike the fixture checks, this verifies the real endpoint and browser request. The count can change when public repositories are added or removed.

The theme and visitor name were changed through the UI and remained after a real reload. Desktop appearance was visually inspected. The packaged project is also checked below a repository-style URL path so CSS, JavaScript, and image requests use the extracted files.

## File and ZIP checks

`tools/verify-submission.py` verifies the required files, local HTML/CSS/Markdown links, duplicate HTML IDs, anchors, and label/ARIA targets. It rejects root-relative asset paths that would break below a GitHub Pages repository path. Its `--zip` option extracts and checks the actual delivery ZIP, rather than only checking the working folder.

The final handoff includes the result of this check. Keep the same folders after uploading to GitHub. Moving files out of their folders can reintroduce the Assignment 2 failure even when the original ZIP passes.

## Performance work and audit limit

- Profile photo: **161,411 bytes reduced to 31,270 bytes**, about 80.6% smaller.
- The image dimensions are explicit, and lower project previews are lazy loaded.
- No external fonts, CSS framework, or third-party runtime JavaScript are loaded.
- Scripts are deferred, search is debounced, and GitHub responses are cached.
- Refresh requests cannot overlap. Timer state is saved on transitions, not every second.

Lighthouse 13.6.0 was installed and a mobile audit was attempted. The environment blocked Chrome’s local process socket. The browser’s built-in developer tools were also blocked by its organization policy. **No Lighthouse score was produced, and none is claimed.** These restrictions are about the testing environment, not a measured defect in the site.

Repeat the audit on your own computer:

1. Start the local server and open the portfolio in Chrome.
2. Press F12, open the **Lighthouse** panel, and select **Navigation** and **Mobile**.
3. Select Performance, Accessibility, Best Practices, and SEO.
4. Run the audit and record the actual scores. Repeat with Desktop if needed.
5. Fix any relevant findings and save the genuine report. Scores depend on hardware, network, API availability, and hosting.

## Browser limits and final student checks

Chrome was available for real-browser verification. Firefox, Safari, physical iOS/Android devices, and a public GitHub Pages deployment were not available for direct testing in this run. Their compatibility has not been falsely reported as tested. The implementation uses standard browser features and responsive CSS; native dialogs work best in current browsers.

Before submission, the student should repeat the checks after personal edits, run Lighthouse locally, and smoke-test any other available browsers and a phone. There is no backend email delivery, account login, cross-tab synchronization, or background operating-system alarm.
