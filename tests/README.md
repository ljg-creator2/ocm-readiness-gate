# AdoptIQ automated checks

These run on GitHub for every pull request and every push to `main` (`.github/workflows/checks.yml`). Run them yourself before publishing a preview:

```
cd tests
npm install
npx playwright install chromium   # first time only
npm test                          # everything (about 2 minutes)
node run-all.js training          # one suite: engine, training, uat, command-center, jira, sweep
```

| Suite | What it checks |
|---|---|
| `engine.test.js` | Training rules: measures, blockers, exceptions, review flags, migration |
| `tracker.test.js` | Delivery tracker import: reading tabs by heading, planning, applying, re-import |
| `e2e/training.suite.js` | Editing journey, sign-in drawer, demo story, organization term, phone layout |
| `e2e/uat.suite.js` | Landing, sign-in, Command Center, sidebar, account menu, every project tab, exports, view-only, mobile, keyboard |
| `e2e/command-center.suite.js` | Command Center figures match the data, search, sections, alerts |
| `e2e/jira.suite.js` | Jira import and program mapping (fictional sample file), read-only guards, timeline arithmetic |
| `e2e/sweep.suite.js` | Every screen in light, dark and phone: no script errors, no sideways scroll, images load |

The tests use a local copy of the site with the network blocked and Supabase replaced by a stand-in. They never touch live data.

**Never add a real client Jira export or delivery tracker to this folder.** Use `fixtures/jira-sample.csv`, `fixtures/tracker-sample.js` or another fictional file.

Not covered: colour contrast (four brand colour pairs are knowingly below AA), live Supabase saving and real sign-in.
