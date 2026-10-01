# AmmaCare

A web app for Sri Lankan pregnant mothers and parents of young children.

| Section | How it works |
|---|---|
| Trimester tracker | Enter days pregnant (or last period date). Calculates week, trimester, due date, baby size and trimester tips. Saved in the browser and moves forward daily. |
| AI weekly activity planner | Gemini creates a week-by-week plan: safe activities, baby development, foods and warning signs. |
| Food check | Gemini says whether a food is healthy, moderate or best avoided, personalised to the pregnancy week or the child's age. |
| Nutrition and predictions | Gemini estimates nutrients for the exact grams (and per gram), pros and cons, and a day-by-day prediction for 1 to 7 days. |
| Symptom checker | A Prolog knowledge base (`prolog/diagnosis.pl`) matches symptoms to possible conditions and recommends the right doctor, with red-flag emergency rules. |
| Articles | 12 articles in `public/data/articles.json` with live search and category filters. |
| Community | Posts, replies and likes, stored in `data/posts.json`. |
| Accounts | Optional sign-in. Guests can use Food check, Nutrition, Symptoms and Articles, and read the community. The trimester tracker, AI weekly plan, and posting/replying/liking need an account. |

## Setup

1. Install **Node.js 18 or newer**.
2. In this folder run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and paste your Gemini key (free from Google AI Studio: https://aistudio.google.com/app/apikey).
4. Put your background picture at `public/images/background.jpg`. (Any name works if you change it in `public/css/styles.css`, search for `background.jpg`.)
5. Start the server:
   ```bash
   npm start
   ```
6. Open http://localhost:3000

## If Gemini does not work

1. Run this in the project folder and read what Google says for each model:
   ```bash
   npm run check-gemini
   ```
2. Common fixes:
   - `API key not valid`: copy the key again, no spaces or quotes, then restart with `npm start`.
   - `429 RESOURCE_EXHAUSTED`: the free quota is used up. Wait and try again later. The site already tries other models automatically.
   - `404 ... no longer available`: set `GEMINI_MODEL=` in `.env` to the model name Google suggests in the message (for example `gemini-3.6-flash`). The server also picks up the suggested model automatically.
   - `could not connect`: check your internet connection.
3. To preview every AI screen with sample answers, set `DEMO_MODE=true` in `.env` and restart. Set it back to `false` for real answers.

## Accounts

- Accounts are stored in `data/users.json`. Passwords are hashed with scrypt; they are never saved as plain text.
- Sign-in uses a secure cookie that lasts 30 days. The secret that signs it is created automatically in `data/.session-secret`, or you can set `SESSION_SECRET=` in `.env`.
- The tracker is saved to the account, so it works on any device. Signing out removes it from the browser.
- Members can post or reply without showing their name ("Post without my name").
- To reset everyone's accounts, stop the server and delete `data/users.json`.

## Article photos

Every article has an illustrated cover. To use a real photo instead, save it as
`public/images/articles/<article id>.jpg`, for example `public/images/articles/iron-rich-foods.jpg`.
The article ids are in `public/data/articles.json`.

## Where the symptom checker sends people

`data/places.json` lists public hospitals for each specialty. Add verified doctors in the same format.

## Project structure

```
server.js                 Express server and all API routes
lib/gemini.js             Gemini REST call (key stays on the server)
lib/auth.js               Accounts, passwords and sign-in cookie
data/users.json           Accounts (created when the first person signs up)
lib/prolog.js             Runs the Prolog rules with Tau-Prolog
prolog/diagnosis.pl       Symptoms, conditions, doctors, red flags
data/posts.json           Community posts
public/index.html         All pages (hash routing: #tracker, #food ...)
public/css/styles.css     Sage green theme (#A3B18A)
public/js/*.js            One module per section
public/data/articles.json Articles
```

## API routes

| Method | Route | Body |
|---|---|---|
| POST | `/api/food/check` | `{ food, note, profile }` |
| POST | `/api/food/nutrition` | `{ food, grams, days, profile }` |
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login`, `/api/auth/logout` | `{ email, password }` |
| GET | `/api/auth/me` | |
| PUT | `/api/me/tracker` (members) | `{ days, savedOn }` |
| POST | `/api/activities` (members) | `{ week }` |
| GET | `/api/symptoms` | |
| POST | `/api/diagnose` | `{ symptoms: [ids], group: "pregnancy" or "child" }` |
| GET | `/api/posts` | |
| POST | `/api/posts` (members) | `{ category, title, body, anonymous }` |
| POST | `/api/posts/:id/replies`, `/api/posts/:id/like` (members) | |

`profile` is `{ who: "mother", week }` or `{ who: "child", childAgeMonths }`, taken from the tracker, so the AI tailors every answer to the stage.

## Extending the Prolog engine

Add a symptom and a condition in `prolog/diagnosis.pl`:

```prolog
symptom(swollen_feet, 'Swollen feet and ankles', pregnancy).

condition(oedema, 'Normal pregnancy swelling', pregnancy,
    'PHM or MOH clinic',
    'Rest with your feet raised. Sudden swelling of face or hands needs an urgent check.',
    [swollen_feet]).
```

Restart the server and it appears on the Symptoms page automatically. The score is `matched symptoms / total symptoms of the condition x 100`, computed in Prolog by `suggest/9`. Avoid apostrophes inside quoted text (write "do not", not "don't").

The file is also valid SWI-Prolog, so you can test it directly:

```prolog
?- suggest([fever, burning_urination], pregnancy, Id, Name, Doc, Adv, M, T, S).
```

## Notes before going live

- All AI and Prolog output is guidance, not diagnosis. Have a doctor or PHM review the knowledge base and article text.
- The community has accounts but no moderation yet. Add a way to report or remove posts before real users join.
- When the site is online, run it over HTTPS so sign-in cookies are protected.
- `data/posts.json` is fine for a demo; switch to a database (for example MongoDB or SQLite) for production.
