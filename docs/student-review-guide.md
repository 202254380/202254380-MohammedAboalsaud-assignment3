# Understand and personalize the code

This version was prepared with substantial AI assistance. The assignment requires you to evaluate and own your work. Do not describe this file as evidence that you have already reviewed or changed the code.

## Read these parts first

1. Open `js/core.js`. These functions take values and return results. They do not change the page.
2. Open `js/script.js`. These functions listen to clicks, update state, and change the page.
3. Open `index.html`. Match each input’s `id` to the JavaScript selector that uses it.
4. Open `css/styles.css`. Find the colour variables and the mobile media queries.

## Simple explanations

| Concept | Explanation |
| --- | --- |
| `filter` | Keeps the items that pass a rule. Search, technology, and level must all pass. |
| `sort` | Changes the order. We sort a new filtered array so the original list stays safe. |
| `async` / `await` | Lets the app wait for GitHub without blocking the rest of the page. |
| `try` / `catch` / `finally` | Try the request, recover from failure, and always reset the loading controls. |
| `AbortController` | Stops a request that takes too long. |
| `localStorage` | Saves strings in this browser. JSON converts objects to strings and back. |
| Application state | JavaScript values that represent the current choices and data. |
| Debounce | Wait briefly after typing so we do not filter repeatedly during every fast keystroke. |
| `textContent` | Displays a value as text. It does not run it as HTML. |
| Timer deadline | A finish time on the clock. It stays useful even when background ticks are delayed. |

## Checks you should be able to explain

- Why do we use AND between project filters?
- Why must the task and project buttons have different data attributes?
- What happens if GitHub returns 403, invalid JSON, or an empty array?
- How can you tell whether repository data came from a saved copy?
- Why does a paused timer keep its remaining time?
- Why does the timer use `Date.now()` instead of subtracting one every second?
- Why does a checked demo confirmation matter to this form?
- What is the workout volume for 3 sets × 8 reps × 20 kg? **480 kg.**
- Why do `css/styles.css` and `js/script.js` need to stay in their own folders?

## Make your own changes before submission

Choose meaningful changes you understand. For example, rewrite the introduction in your own words, replace a project description with details of your own work, or adjust a validation rule and update its test. Explain the reason for each change. Do not claim that changing a name or removing an AI comment makes the code your own.

Record the real changes here after you make them:

| File | My change | Why I made it | How I tested it |
| --- | --- | --- | --- |
| Complete after your review | | | |

Then rerun the checks in the README. Read the required AI declaration. Update its review status only after the statement is true, and include the full conversation export in the separate evidence ZIP.
