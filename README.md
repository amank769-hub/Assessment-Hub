# Nexora AI

An end-to-end interview intelligence platform for Talent Acquisition teams, Hiring Managers, candidates
and leadership. Not an ATS — the layer above one, where interviews are run, evidence is captured and
hiring decisions get made with something to point at.

The assessment model is lifted from a real **Interview Assessment Sheet (IAS v3.1)**: a 1–6 rating
legend, weighted competency scoring, a 1–3 cultural fitment scale, per-level interviewer sheets, and an
Overall Summary that averages every level and tracks the ageing between them. What the spreadsheet
hard-codes as five fixed tabs, this platform generates from each requisition's own workflow.

## Opening it

**Just want to look at it?** Open **`Nexora-AI.html`** in the project root. One self-contained file —
no install, no server, works offline. Double-click it.

**Want to edit it?**

```bash
npm install
npm run dev               # http://localhost:5173
npm run build             # typecheck + production bundle into dist/
npm run build:standalone  # regenerate Nexora-AI.html
```

> `index.html` in the root is the Vite entry point, not a page — it points at TypeScript source that a
> browser cannot run on its own. Opening it directly tells you so rather than showing a blank screen.

No backend. All state lives in a React reducer, so every interaction is real: decisions mutate the
pipeline, sign-offs recompute scores, and the audit trail grows as you use it.

## The six screens

| Screen | What it does |
|---|---|
| **Dashboard** | Recruiter command centre — ten live metrics, pipeline funnel, requisition RAG health, today's interviews across four timezones, tasks, and an AI insights panel where every claim expands to show the facts behind it. |
| **Requisitions** | List plus a seven-tab workspace: JD, hiring team, interview workflow, competency framework, pipeline, assessment templates, scorecard config, activity and audit. |
| **↳ AI competency mapping** | Paste or upload a JD, or start from the repository. Extracts technical, functional, leadership and domain competencies with weightings, critical-vs-trainable calls, evidence to look for, interview questions and the stage to assess each at. Every row is editable, and editing one flips it from AI-authored to human-authored. |
| **Candidates** | Ranked on consolidated interview score first, AI match second. Select two to six for comparison. |
| **↳ AI screening** | Match scores that trace back to verbatim CV lines, gap analysis split by critical vs trainable, duplicate check, targeted screening questions — and a decision panel that makes the human gate explicit. |
| **Candidate portal** | External, mobile-first, outside the recruiter shell. Status tracker, the published competency framework, interview prep, documents, messages, rescheduling inside the rules, and an apply flow where parsed CV fields are always shown back for correction. |
| **Interview hub** | A working meeting surface: audio, camera, screen share, recording, participants, chat, an interview clock, and a transcript that streams against it. Coverage, talk-time split and follow-up suggestions recompute from what has actually been said. |
| **Assessments** | One IAS-shaped scorecard per interview level, generated from the workflow. AI drafts ~80%; the interviewer reviews, edits and signs. |
| **Analysis** | Five views — candidate comparison, candidate deep-dive, requisition analytics, interview quality, leadership. |

## Unlimited interview levels

Nothing about the number of rounds is fixed. A requisition declares its own workflow and everything
downstream follows: interviews, assessment levels, the comparison matrix, the ageing rollup. The sample
data ships three requisitions with **four, three and five** interview levels to prove the point. Adding
a level from the workflow tab generates the matching assessment for every candidate in process.

## Where AI stops

This is the design constraint the whole platform is built around.

- **It drafts.** Competency frameworks from a JD. Match scores with cited evidence. Roughly 80% of every
  scorecard. Interview summaries and suggested ratings.
- **It never decides.** No path exists for a model to progress, reject, or hire. Screening decisions are
  recruiter actions. Scorecards do not count until a named person signs them, and sign-off is blocked
  until every row is rated, cultural fitment is chosen and a decision is recorded.
- **It shows its working.** Every score, insight and recommendation expands to the facts it was built
  from. Where an interviewer overrides a suggestion, both values are kept — which is the only reliable
  way to notice a model drifting.

AI-drafted content stays visibly labelled until a human touches it, and only interviewer-confirmed rows
contribute to the weighted average.

## Data visualisation

The categorical palette was chosen by running candidate orderings through a CVD validator and keeping
only those clearing every gate: worst adjacent CVD ΔE 9.2 (target ≥8) and worst adjacent normal-vision
ΔE 15.6 (floor ≥15) on white. Slots 1–4 also clear the all-pairs test, so radar overlays cap at four
series and fall back to small multiples beyond that rather than inventing hues.

Funnel stages use a validated single-hue ordinal ramp (monotone lightness, adjacent ΔL ≥ 0.06). Heat maps
use a sequential blue ramp with values printed in-cell. Status colours are reserved and always ship with
an icon and a word. Every chart carries a hover layer, a legend where there is more than one series, and
a table view.

## Sample data

Three active requisitions across India, the UK and Singapore. Eight candidates with full screening,
evidence trails and consent records. Interview transcripts, IAS scorecards in every state (signed,
in review, overdue), and analytics derived from live pipeline state rather than authored — so the
numbers move when you use the product.

Two things are deliberately left needing a human: Kavya Nair's Level 2 scorecard is drafted and waiting
on Arjun Mehta's signature, and James Okonkwo's Level 1 feedback is four days past SLA with his Level 2
running today.

## Architecture

A flow-first model of the system, drawn for showing to a team — the four planes, the spine from
application to offer, how one workflow declaration generates N interview levels, and the three human
gates.

- **`docs/Nexora-AI-Architecture.pdf`** — 11 pages, A4 landscape. The version to email or print.
- **`docs/architecture.html`** — the same document on screen. Fonts are embedded, so it holds its
  typography opened from disk with no network. Regenerate the PDF from it by printing to PDF, or with
  the Playwright snippet noted in the file header.

## Stack

React 18, TypeScript, Vite, Tailwind, Recharts, React Router. `src/data/` holds the domain model and
sample data, `src/store/` the reducer and audit trail, `src/components/charts/` the visualisation
library, `src/screens/` one directory per screen.
