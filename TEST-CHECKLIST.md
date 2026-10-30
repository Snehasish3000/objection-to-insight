# Objection-to-Insight — manual smoke-test checklist

Use this checklist after launching the app locally and before an interview demonstration.

## Initial launch

- [ ] `index.html` opens without a blank page.
- [ ] The fictional-data banner is visible on first launch.
- [ ] Overview cards, sample objection themes, follow-up watchlist and recent records appear.
- [ ] Sidebar navigation opens Overview, Sales practice, Objection insights, Conversation records and Settings & data.

## Sales practice

- [ ] Scenario dropdown changes the prospect scenario and resets the response draft.
- [ ] “Surprise me” selects another scenario.
- [ ] Response word and character counts update while typing.
- [ ] CARE checkboxes update the self-review score in 25-point increments.
- [ ] TruthGuard warns when a configured phrase such as “guaranteed placement” is typed.
- [ ] Saving a response shorter than eight characters is blocked with a helpful message.
- [ ] A valid practice round is saved and appears in Recent practice.
- [ ] “Log as an insight” becomes available after saving a practice round and opens a prefilled conversation form.

## Conversation records

- [ ] A new conversation can be saved with the required prospect, concern and date.
- [ ] A record can be edited and deleted.
- [ ] Search, category filter, outcome filter and Clear filters work.
- [ ] A flagged absolute phrase in a response prompts a confirmation before saving.
- [ ] A follow-up date appears in the overview watchlist and is classified as due/overdue as appropriate.

## Objection intelligence and exports

- [ ] Objection and outcome charts reflect records in the current workspace.
- [ ] Sales & Marketing suggestions correspond to recorded objection categories.
- [ ] Export insight brief downloads a `.txt` file.
- [ ] Export records downloads a `.csv` file.
- [ ] Export full backup downloads a `.json` file.
- [ ] Restoring a valid backup replaces the current workspace after confirmation.

## Data and responsiveness

- [ ] Refreshing the page retains saved data in the same browser profile.
- [ ] Replace with demo workspace reloads fictional sample data after confirmation.
- [ ] Clear all local data empties records and practice history after confirmation.
- [ ] Layout remains usable at desktop and narrow mobile widths.

## Browser developer console

- [ ] Open browser Developer Tools → Console and check for red JavaScript errors while exercising the flows above.

The project is deliberately client-side. These checks do not establish multi-user sync, production security, or compliance suitability.
