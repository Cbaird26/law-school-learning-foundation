# Law School Learning Foundation

A self-paced learning curriculum by Christopher Michael Baird, with 67 courses across seven stages: elementary school, middle school, high school, college pre-law, first-year law school, upper-level law school, and bar exam preparation.

**[Open the course](https://cbaird26.github.io/law-school-learning-foundation/)**

## Study online or offline

Open the link above, or download `index.html` and open it in a modern web browser. The approximately 10 MB HTML file contains the curriculum, application scripts, and math rendering assets. Optional Google Fonts are requested when online; fallback fonts are available offline.

Each course includes 12 weekly lessons, worked examples, practice, quizzes, a weeks 13–14 project and review guide, and assessments. The site also includes mastery tracking and an error log.

Progress is stored in your browser's local storage. It is specific to that browser and site address, and clearing site data removes it. Progress from a downloaded copy does not automatically transfer to the hosted site.

Choose **Open with Claude** to use the tutor through a private local connection on your computer. The public site also lets you copy a ready-made tutor prompt into Claude.

## Use your Claude API credits

Run `python3 launch.py` in this folder, or open `Law School with Claude.command` on macOS. The launcher starts the school at `http://127.0.0.1:8742` and opens it in your browser. Launching it again reuses the running server. Python 3 is required; no extra packages are needed.

The law tutor automatically reuses an existing key at `~/.config/toe-learning-foundation/credentials.json`. Otherwise, choose **Connect Claude** and connect your own API account. Law-school-specific settings are stored at `~/.config/law-school-learning-foundation/credentials.json` and take precedence over the shared math-school connection. An `ANTHROPIC_API_KEY` environment variable is supported when neither file provides a key. These files stay outside the repository with owner-only permissions when saved by the app.

The API key is sent only by the local backend to Anthropic, never included in the public site or browser storage. The service listens only on loopback, rejects cross-origin API calls, and requires a session token for writes. Public visitors cannot use the owner's credits. Questions, lesson context, and attached photos are sent to Anthropic when you ask the tutor. Your Claude Console billing settings control credit usage and any charges; the app does not change them or purchase credits.

Contextual tutoring, photos up to 5 MB, and generated practice are supported. The tutor stays off during assessments. Requests are limited to one at a time and 12 per minute, with medium effort and a combined reasoning/output cap of 4,096 tokens per tutor reply or 8,192 for generated practice. The budget includes Claude's adaptive thinking so that JSON practice responses have room to finish. Stop cancels the browser's wait; an already submitted API request may still use credits. Public and local progress remain separate because they use different site addresses.

Connection checks: `python3 -m unittest -v test_local_server.py`, `node test_adapter.cjs`, and `node test_connect.cjs`. Automated tests use fake API responses and temporary credentials. API integration follows the [Claude API overview](https://platform.claude.com/docs/en/api/overview) and [thinking budget guidance](https://platform.claude.com/docs/en/build-with-claude/thinking).

## Scope

The curriculum is preserved from the supplied course, with a local Claude tutor connection added. Publication checks cover application syntax, embedded course data, and representative browser interactions; they are not a legal-content audit. Laws and exam requirements vary by jurisdiction and change over time, so consult current primary sources. The material is for education, not legal advice, academic credit, or bar admission.

## Hosting

GitHub Pages serves the repository root from the `main` branch. `.nojekyll` keeps this a buildless static site. To preview locally, run `python3 -m http.server 8741 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8741/`.
