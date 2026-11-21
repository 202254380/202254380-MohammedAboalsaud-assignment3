# AI usage report — Assignment 3

**Student:** Mohammed Abo Alsaud  
**Student ID:** 202254380  
**Date:** 21 November 2026

## Tools used and scope

ChatGPT (GPT-6 coding agent) was used in the current conversation to inspect the supplied Assignment 2 archive, interpret the Assignment 3 instructions, extend the application, draft documentation, and run verification. The new implementation and documentation received substantial AI assistance. The supplied Assignment 2 code and portrait were reused as the baseline; they were not independently created in this conversation.

No claim is made that the student has already personally written, reviewed, tested, or understood the generated changes. The student must direct the final choices, make and record meaningful adaptations, and be able to explain the submission. Earlier AI use for reused Assignment 2 material should remain declared; retain its original evidence and include it if the course requires it for reused code.

## Usage log

| ID | Tool (model) | Date | Purpose | Files affected | What changed and how it was verified |
| --- | --- | --- | --- | --- | --- |
| C01 | ChatGPT (GPT-6 coding agent) | 2026-11-21 | Inspect Assignment 2, implement Assignment 3 features, review and test | HTML, CSS, JavaScript, tests, tools, documentation | Rebuilt the expected folders; added GitHub fetching, combined filters/sort, validated state, contact rules, and a saved timer. Verification is recorded in `testing-report.md`. Complete chat export must be added by the student. |
| A01 | ChatGPT (GPT-6 coding agent) | 2026-11-21 | Preserve the first implementation before QA | `artifacts/A01_Mohammed_ChatGPT_first-implementation.zip` in the separate evidence package | Saved before the final CSS cleanup, browser checks, and documentation. This is a real intermediate artifact, not reconstructed student work. |
| A02 | ChatGPT (GPT-6 coding agent) | 2026-11-21 | Preserve the verified version for comparison | `artifacts/A02_Mohammed_ChatGPT_verified-version.zip` in the separate evidence package | Final implementation at handoff. See the test report for completed checks and limits. |

The evidence package also contains the exact Assignment 2 ZIP supplied by the student as baseline context. It is labelled separately from the newly generated artifacts.

## Benefits and challenges

AI helped connect the requirements to concrete functions and test cases. It helped keep the project buildless, reuse the existing demos, and separate pure rules from browser rendering. It also helped identify the main Assignment 2 failure: the HTML paths expected folders that were missing from the ZIP.

AI output still needed checking. A codebase can look correct while its packaged file structure is broken. Network data can be missing or malformed. A timer based only on callback counts can drift in background tabs. The implementation handles these cases, and the checks exercise the relevant rules.

The first pass also inherited references to optional C#/Java servers. Those requests and unused server files were removed from this static submission. The UI and README now accurately describe the retained projects as browser demos. The CSS was simplified and the portrait compressed instead of adding libraries or external fonts.

## Review, modifications, and responsible use

Agent-performed review included JavaScript syntax checks, automated rule tests, isolated real-browser integration checks, layout checks, a performance audit, and verification of the extracted ZIP’s relative paths. These are AI-assisted checks; they are not presented as student-performed actions.

User/API content is rendered as text, API links are validated, and no API token is embedded. No conversation summaries or invented student/AI exchanges are supplied as full evidence. The `conversations/` folder in the evidence ZIP contains instructions until the student inserts the genuine complete export.

**Student review status: PENDING.** Record actual personal changes and checks in [the review guide](student-review-guide.md), update this report as needed, and only then confirm the declaration below. Do not submit a claim you cannot honestly make.

## Learning outcomes to verify personally

After reviewing the code, the student should be able to explain combining filter rules, sorting without changing the source data, asynchronous requests, timeouts, cache freshness, JSON storage, form validation, and clock-based timers. These are review goals, not a claim that learning has already been demonstrated.

## Required declaration

**Name:** Mohammed Abo Alsaud  
**ID:** 202254380  
**Date:** 21 November 2026

> I declare that this report and the attached evidence document all of my AI use in this assignment, with complete and unedited conversations, and that I understand and can explain all the code I submitted. I understand that undeclared AI use or a false declaration will be treated as plagiarism according to KFUPM regulations.

**Before this declaration is submitted:** finish the personal review, confirm its truth, and add the full unedited conversation export to the evidence package. Keep conversation logs and evidence archives out of the public repository.

## Reference

[Course AI Usage Guidelines](https://github.com/Web-Engineering-KFUPM/web_course_main/blob/main/project%20guidelines/0%20-%20AI%20Usage%20Guidelines.md)
