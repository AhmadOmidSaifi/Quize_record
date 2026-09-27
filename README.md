# team-quiz-platform
Real-time team-based online competitive examination platform with Django backend and React frontend.

## Running locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # or register a host account from the app
python manage.py runserver
```
Channels/WebSockets need an ASGI server for production, but `runserver` is fine for local dev with the in-memory channel layer.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000`. Copy `.env.example` to `.env.local` if your backend isn't on `http://localhost:8000`.

## What's in the frontend

- **Landing** (`/`) — overview + entry points for players and hosts.
- **Join** (`/join`) and **Team room** (`/room/:code/:teamId`) — enter a room code and team name, then play: live countdown, question, instant feedback, live leaderboard. Reconnects and resumes correctly on page refresh.
- **Host sign in / register** (`/login`, `/register`) — JWT auth against `accounts` app.
- **Host console** (`/host`) — list/create competitions.
- **Competition builder** (`/host/:id`) — add MCQ / True-False questions, start/pause/resume/next/finish the live game, watch teams join and score in real time.

## Backend changes made alongside the frontend

Two small, additive changes in `competitions/` were needed for the frontend to work, on top of what was already there:

1. **`GET /api/competitions/<id>/current-question/`** (new) — the team-facing client needs a way to fetch the live question's text/options and its start time (to sync the countdown), since the WebSocket broadcast only carries a question ID. This endpoint returns that, without exposing which option is correct.
2. **`GET /api/competitions/<id>/questions/`** (added `GET` to the existing create-only view) — lets the host console list the questions already attached to a competition.
3. **Fixed a URL routing bug** in `competitions/urls.py`: the generic `competitions/<id>/<action>/` control route was registered *before* the specific `leaderboard/`, `results/`, `submit/` routes. Since both shapes match the same two-segment URL, Django's top-to-bottom resolution meant those specific routes were being shadowed by the control view. Reordered so specific routes are matched first.

No existing endpoint's behavior changed — these are additions and a routing-order fix only.
