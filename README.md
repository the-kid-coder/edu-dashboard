Edu Dashboard - static demo

What this is
- A minimal static single-page app where you can pick educational resources in a Dashboard and they appear on the Home page.
- Selections are stored in `localStorage` (no backend required).

Files
- [index.html](index.html) - main page
- [app.js](app.js) - UI logic
- [styles.css](styles.css) - styling

Run locally
- Option A: Open `index.html` in your browser (double-click or drag into browser).
- Option B: Serve with a simple static server (recommended to avoid CORS or extension issues):

```bash
cd /Users/lukaonvural/Projects/edu-dashboard
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Next steps (I can do these if you want)
- Add persistent backend (API + DB) to store selections per user
- Add user sign-in and per-user saved lists
- Improve UI/UX and add filtering/sorting

Tell me which next step you'd like me to implement.

New features
- Added more resources including Google Classroom, Quizlet, Codecademy, Duolingo, TED-Ed.
- Dashboard now includes filters for `Type` and `Subject`, and a `Sort` control to order resources by learning type and/or subject.
- Home page displays selected resources sorted by type then subject.

If you'd like the sorting controls on the Home page as well, or persistent per-user storage, I can add a small backend.