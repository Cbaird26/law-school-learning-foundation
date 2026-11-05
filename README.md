# Law School Learning Foundation

A self-paced learning curriculum by Christopher Michael Baird, with 67 courses across seven stages: elementary school, middle school, high school, college pre-law, first-year law school, upper-level law school, and bar exam preparation.

**[Open the course](https://cbaird26.github.io/law-school-learning-foundation/)**

## Study online or offline

Open the link above, or download `index.html` and open it in a modern web browser. The approximately 10 MB HTML file contains the curriculum, application scripts, and math rendering assets. Optional Google Fonts are requested when online; fallback fonts are available offline.

Each course includes 12 weekly lessons, worked examples, practice, quizzes, a weeks 13–14 project and review guide, and assessments. The site also includes mastery tracking and an error log.

Progress is stored in your browser's local storage. It is specific to that browser and site address, and clearing site data removes it. Progress from a downloaded copy does not automatically transfer to the hosted site.

## Claude tutor for every visitor

Click **Tutor** in the public course. The course owner's Claude API credits fund requests; learners do not provide an API key, buy credits, or sign in. Both the [GitHub Pages course](https://cbaird26.github.io/law-school-learning-foundation/) and [hosted course](https://baird-law-school-claude.goldenbrioche1.chatgpt.site/course.html) use the same server endpoint.

The API key stays in the hosted server's secret environment. Only the server calls Anthropic. Questions, lesson context, and attached photos go to Anthropic when the learner submits them. The app stores no conversations or photos on its server; browser progress remains local.

The shared allowance is **100 requests per UTC day** and **12 per minute**, enforced with atomic, persistent database counters across server instances. Failed or interrupted upstream attempts also count. This is a request limit, not a dollar budget. The owner’s Claude Console billing settings still apply. No billing settings or automatic top-ups are changed by the app.

Contextual help, one photo up to 5 MB, and generated practice are supported. Requests have bounded conversation size and combined thinking/output caps of 4,096 tokens for tutoring or 8,192 for practice. The tutor remains off during assessments. Stop cancels the browser's wait; an already submitted request can still consume credits.

## Optional desktop server

Run `python3 launch.py` or open `Law School with Claude.command` on macOS. It starts `http://127.0.0.1:8742`. This copy prefers the shared hosted tutor too. The existing local backend remains available as a fallback for the owner, using their saved law-school or ToE Math School key. Visitor key setup is not required.

Local fallback checks: `python3 -m unittest -v test_local_server.py`, `node test_adapter.cjs`, and `node test_connect.cjs`. Hosted server checks cover anonymous access, origin restrictions, secret redaction, durable shared limits, and JSON practice parsing.

## Scope

The curriculum is preserved from the supplied course, with a course-funded public Claude tutor added. Publication checks cover application syntax, embedded course data, and representative browser interactions; they are not a legal-content audit. Laws and exam requirements vary by jurisdiction and change over time, so consult current primary sources. The material is for education, not legal advice, academic credit, or bar admission.

## Hosting

GitHub Pages serves the repository root from the `main` branch. `.nojekyll` keeps this a buildless static site. To preview locally, run `python3 -m http.server 8741 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8741/`.
