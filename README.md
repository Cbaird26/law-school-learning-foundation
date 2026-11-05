# Law School Learning Foundation

A self-paced learning curriculum by Christopher Michael Baird, with 67 courses across seven stages: elementary school, middle school, high school, college pre-law, first-year law school, upper-level law school, and bar exam preparation.

**[Open the course](https://cbaird26.github.io/law-school-learning-foundation/)**

## Study online or offline

Open the link above, or download `index.html` and open it in a modern web browser. The approximately 10 MB HTML file contains the curriculum, application scripts, and math rendering assets. Optional Google Fonts are requested when online; fallback fonts are available offline.

Each course includes 12 weekly lessons, worked examples, practice, quizzes, a weeks 13–14 project and review guide, and assessments. The site also includes mastery tracking and an error log.

Progress is stored in your browser's local storage. It is specific to that browser and site address, and clearing site data removes it. Progress from a downloaded copy does not automatically transfer to the hosted site.

The Tutor button prepares a prompt you can copy into Claude. This public release does not include an API key or a hosted AI tutor service.

## Scope

This repository publishes the existing course as supplied. Publication checks cover application syntax, embedded course data, and representative browser interactions; they are not a legal-content audit. Laws and exam requirements vary by jurisdiction and change over time, so consult current primary sources. The material is for education, not legal advice, academic credit, or bar admission.

## Hosting

GitHub Pages serves the repository root from the `main` branch. `.nojekyll` keeps this a buildless static site. To preview locally, run `python3 -m http.server 8741 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8741/`.
