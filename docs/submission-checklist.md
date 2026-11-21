# GitHub and Blackboard checklist

## 1. Finish your review

- Read [the review guide](student-review-guide.md), understand the functions, and make your own meaningful adaptations.
- Record your real changes and checks. Do not invent a review history.
- Read [the AI report and declaration](ai-usage-report.md). Confirm it only after it is true.
- Add the complete, unedited export of this conversation to the separate evidence ZIP. Include other AI conversations if used.
- The declaration and full evidence are mandatory. The assignment states that missing evidence or declaration gives zero.

## 2. Create the required public repository

Repository name: **`202254380-mohammedaboalsaud-assignment3`**.

A remote repository was not created during preparation because GitHub authentication was not connected. Create a new **public** repository in your own GitHub account. Leave automatic README, licence, and .gitignore creation unchecked, so the remote starts empty.

The source ZIP contains a local Git repository with real implementation commits. Extract it fully. Open a terminal inside the folder containing `index.html` and `README.md`. With Git installed, check the history:

```bash
git log --oneline
```

After your personal edits, commit them with a meaningful message. Follow the course’s AI disclosure requirements for any code you adapt. Then connect the empty remote and push:

```bash
git remote add origin https://github.com/202254380/202254380-mohammedaboalsaud-assignment3.git
git push -u origin main
```

Use your actual account name in the URL if it differs. Complete GitHub’s normal authentication in your Git client when prompted. Never place an access token in source files.

If your extraction program did not retain Git metadata, a new repository can still be initialized, but it will not preserve the included implementation history. Re-extract the original ZIP before continuing. Uploading through GitHub’s browser interface also does not preserve the included commits.

## 3. Check the uploaded website

- `index.html` and `README.md` must be at the repository root.
- Keep `css/`, `js/`, `assets/`, `docs/`, `tests/`, and `tools/` as folders.
- Do not flatten the folders as happened in Assignment 2.
- Run `python tools/verify-submission.py` locally.
- Run `node --test tests/core.test.cjs` if Node.js is available.
- Start the local server and open `tests/browser-tests.html` to repeat browser checks.
- Open the project in your usual browser and on your phone. Check the theme, project demos, live GitHub data, contact errors, and timer.
- GitHub Pages is optional. If enabled, choose the `main` branch and root folder. Test the published URL separately.
- Do not upload the evidence ZIP, private chat logs, access tokens, or dependency folders to the repository.

## 4. Submit on Blackboard

Submit both:

1. Your public repository link.
2. **`202254380-mohammedaboalsaud-assignment3-ai-evidence.zip`**, after adding complete conversations and your final adapted version.

The source ZIP is a project delivery file. It does not replace the required public repository link.
