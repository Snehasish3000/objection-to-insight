# Objection-to-Insight

**The EdTech Sales Conversation Simulator & Intelligence Board**  
Version 1.0.0 · Static, offline-first browser application

Objection-to-Insight is a compact sales-practice and conversation-learning prototype. It helps a user practise responses to common institutional EdTech objections, review a response with the CARE checklist, record real or simulated conversation outcomes, identify recurring objection themes, and prepare a small Sales & Marketing insight brief.

## Run locally

No package manager, backend, database, API key or build step is required.

1. Extract the ZIP archive.
2. Open the `Objection-to-Insight` folder in Visual Studio Code.
3. Open `index.html` in a browser, or use the VS Code **Live Server** extension and select **Open with Live Server**.

Alternative with Python (from this folder):

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Features

- **Sales Practice:** eight institutional EdTech conversation scenarios, editable response area and a four-part CARE self-review.
- **CARE checklist:** Confirm, Ask, Relate and Establish. Each manually checked principle contributes 25 points. The score is a self-assessment, not an AI or language-quality score.
- **TruthGuard:** local phrase matching for a short list of absolute claims such as “guaranteed placement” or “100% placement”. A match prompts a review; it does not fact-check the statement or provide legal/compliance approval.
- **Conversation Records:** create, edit, delete, search and filter records by category and outcome.
- **Objection Intelligence:** simple frequency charts for objection categories, channels and outcomes, plus suggested Sales & Marketing actions based on recorded categories.
- **Exports:** CSV conversation export, JSON workspace backup and a plain-text insight brief.
- **Local persistence:** records remain in this browser using `localStorage`.
- **Responsive layout:** desktop, tablet and mobile-friendly views.

## Suggested demonstration flow

1. Open **Overview** and explain that the initial records are fictional sample data.
2. Open **Sales practice** and choose “We already have a training partner”.
3. Write a response and tick only the CARE principles it genuinely contains.
4. Save the practice round; show the self-review score and practice history.
5. Select **Log as an insight**, add a fictional prospect name and save the conversation.
6. Open **Objection insights** to show the category and outcome analysis.
7. Export the insight brief and explain how the team might use aggregated concerns to improve FAQs or approved communication material.

## Important limitations and responsible use

- This is a front-end prototype, not a production CRM or shared company system.
- Data is stored in the current browser profile on the current device. It does not synchronise between users or computers. Clearing browser storage can erase it; export JSON backups regularly.
- The application does not source leads, scrape contacts, send calls/emails/WhatsApp messages, or integrate with an external CRM.
- CARE scoring is a manual self-review checklist. It does not use AI or automatically judge persuasion quality.
- TruthGuard only flags configured phrases. It cannot know whether a claim is accurate, approved, complete or legally compliant. Check all programme, placement, salary, certification and outcome statements against current official company material.
- Sample institutions, personas and conversations are fictional. Do not represent them as actual customers, company results or testimonials.
- Avoid storing sensitive personal, financial, student or other confidential information in this prototype. Use only authorised data and follow the organisation's policies.
- Insight charts are counts of records in this browser, not statistically representative market research.

## Files

```text
Objection-to-Insight/
├── index.html
├── styles.css
├── app.js
├── README.md
├── DEPLOY.md
├── TEST-CHECKLIST.md
├── .gitignore
└── assets/
    └── favicon.svg
```

## Technology

HTML5 · CSS3 · Vanilla JavaScript · Browser LocalStorage · CSV/JSON/Text exports · GitHub Pages
