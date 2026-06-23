# Migration Tool — Manual Test Plan & Pass Criteria

## What the app does
A Next.js web app that migrates videos **from a source platform → FastPix**. The user walks an
8-step wizard, the app validates credentials against each platform's live API, lets you pick
import settings, then runs the migration and reports created/failed videos.

- **Source platforms:** Mux, Api.video, Cloudflare Stream, Amazon S3, Vimeo
- **Destination:** FastPix
- **Wizard steps (state machine):** `select-source → set-source-credentials → set-video-filter →
  select-destination → set-destination-credentials → set-import-settings → review → migration-status`

## Pre-conditions / test environment
1. `npm install` then `npm run dev` → app at `http://localhost:3000`.
   **Pass:** page loads with no console errors, "Choose a Source Platform" visible.
2. Have **valid** and **invalid** test credentials ready for each source platform, plus a **FastPix**
   account with at least one source platform holding ≥1 video (and ideally an empty account to test
   the "no videos" path).
3. Open browser DevTools (Console + Network) to watch the `/apicalls/*` requests.

---

## A. Global pass criteria (apply to every screen)
- No uncaught errors in the console; no React key/prop warnings.
- The **left SideBar** reflects progress: each completed step appears as a card (Origin Platform →
  Origin Credentials → Video selection → Target Platform → Target credentials → Import settings)
  with the chosen value.
- Layout is intact at desktop and at mobile width (≤768px the main area stacks under the sidebar).
- Footer is visible on every step.

---

## B. Step-by-step functional test cases

### Step 1 — Select Source (`select-source`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 1.1 | Land on home | 5 source platforms shown: Mux, Api.video, Cloudflare Stream, Amazon S3, Vimeo, each with logo + name |
| 1.2 | Click a platform (e.g. Mux) | Advances to credentials step; SideBar shows "Origin Platform = Mux" |
| 1.3 | Keyboard: Tab to a platform, press **Enter/Space** | Same as click (platform tiles are real `<button>`s — keyboard must work) |

### Step 2 — Source Credentials (`set-source-credentials`)
Fields rendered must match the platform:

| Platform | Expected fields |
|----------|-----------------|
| Mux | Access Token ID, Secret Key |
| Api.video | API Key, Environment (sandbox/production dropdown) |
| Cloudflare Stream | Account ID, API Token |
| Amazon S3 | Access Key ID, Secret Access Key, Bucket name |
| Vimeo | Secret Key |

| #   | Action | Pass criteria |
|-----|--------|---------------|
| 2.1 | Submit with a required field empty (or spaces only) | Submit blocked; inline red error on the empty field; no network call |
| 2.2 | Fill fields gradually | Continue button is **disabled** until all required fields are non-empty, then enables |
| 2.3 | Submit **valid** creds | Network call to `/apicalls/validatecredentials` returns 200; advances to video-filter step; SideBar shows "Origin Credentials = Added" |
| 2.4 | Submit **invalid** creds | Validation returns 401; an error notification shows; stays on this step |
| 2.5 | Api.video: switch Environment to sandbox | Validation hits `sandbox.api.video`; production hits `ws.api.video` (verify in Network tab) |
| 2.6 | S3: wrong bucket/region | HeadBucket fails → error notification; correct bucket → 200 |

### Step 3 — Video Filter (`set-video-filter`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 3.1 | Choose the transfer range / filter and continue | Advances to "Choose your Destination"; SideBar shows "Video selection = Select transfer range" |

### Step 4 — Select Destination (`select-destination`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 4.1 | View destination list | Only **FastPix** is offered |
| 4.2 | Click FastPix | Advances to destination credentials; SideBar shows "Target Platform = FastPix" |

### Step 5 — Destination Credentials (`set-destination-credentials`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 5.1 | Fields shown | Access Token ID, Access Token Secret |
| 5.2 | Valid FastPix creds | `/apicalls/validatecredentials` → 200 (Basic auth `btoa(pub:secret)`); advances to import settings |
| 5.3 | Invalid creds | 401 → error notification; stays |

### Step 6 — Import Settings (`set-import-settings`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 6.1 | View options | Encoding tier (smart), Max resolution tier (480p/720p/1080p/1440p/2160p), Playback policy (public/private) |
| 6.2 | Change Max resolution tier | Selection persists |
| 6.3 | Playback policy = private | Selecting one option replaces the array (single-select behavior for playbackPolicy); config updates |
| 6.4 | Submit | Advances to Review; SideBar shows "Import settings = Settings added" |

### Step 7 — Review (`review`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 7.1 | Review screen | Summary of source, destination, and chosen settings is shown |
| 7.2 | Start migration | Advances to migration-status and kicks off the migration API |

### Step 8 — Migration Status (`migration-status`)
| #   | Action | Pass criteria |
|-----|--------|---------------|
| 8.1 | While running | "Videos are currently migrating…" message + loading spinner; user is asked to stay on page |
| 8.2 | Success | Each migrated video listed with VIDEO ID + **CREATED** badge; row numbers sequential |
| 8.3 | Some videos fail | "Failed Videos List" header appears and a Failed Videos table lists the failures with reason/code |
| 8.4 | Source has 0 videos | API returns 400 "No Videos found"; an Error UI message is shown (not a blank screen) |
| 8.5 | Mux master-access path | For Mux assets needing master access, migration waits (~60s poll) then proceeds; no crash, eventual created/failed result |

---

## C. SideBar / navigation tests
| #   | Action | Pass criteria |
|-----|--------|---------------|
| C.1 | Progress through steps | Each completed step's card appears in order with the correct value |
| C.2 | Click an **edit** action on a completed SideBar card | Returns to that step; downstream state cleared as designed (e.g. editing import settings resets origin video list) |
| C.3 | Browser refresh mid-flow | App reloads to start (state is in-memory) — confirm it doesn't render a broken intermediate screen |

## D. Negative / resilience tests
| #   | Scenario | Pass criteria |
|-----|----------|---------------|
| D.1 | Disconnect network, submit creds | Caught gracefully → "Invalid credentials"/error notification, no uncaught exception |
| D.2 | Validation endpoint returns 500 | Migration POST returns 500 with a message; UI shows an error, not a white screen |
| D.3 | Whitespace-only inputs | Treated as empty (trim validation) → blocked |
| D.4 | Rapid double-click "Continue"/platform | No duplicate navigation or duplicate API calls causing inconsistent state |

## E. Accessibility / cross-cutting
- Platform tiles and primary buttons are reachable and operable by **keyboard** (Tab + Enter/Space).
- All `<img>` (logos) have `alt` text → no broken-alt warnings.
- Works in latest Chrome, Safari, Firefox; responsive at 1440px, 1024px, 768px, 375px.

---

## Definition of done (release gate)
- [ ] Happy-path E2E passes for **all 5 source platforms** → FastPix (at least one real migrated video each, CREATED badge shown).
- [ ] Every invalid-credential case returns 401 and surfaces an error without crashing.
- [ ] "No videos found" and "some videos failed" paths both render correct UI.
- [ ] SideBar progress + edit navigation behave correctly throughout.
- [ ] No console errors/warnings on any step.
- [ ] Verified in Chrome + Safari + Firefox and at mobile width.

---

## Appendix — Sign-off sheet (fill per test run)

| Test ID | Tester | Date | Browser | Result (Pass/Fail) | Notes |
|---------|--------|------|---------|--------------------|-------|
| 1.1 |  |  |  |  |  |
| 1.2 |  |  |  |  |  |
| 1.3 |  |  |  |  |  |
| 2.1 |  |  |  |  |  |
| 2.2 |  |  |  |  |  |
| 2.3 |  |  |  |  |  |
| 2.4 |  |  |  |  |  |
| 2.5 |  |  |  |  |  |
| 2.6 |  |  |  |  |  |
| 3.1 |  |  |  |  |  |
| 4.1 |  |  |  |  |  |
| 4.2 |  |  |  |  |  |
| 5.1 |  |  |  |  |  |
| 5.2 |  |  |  |  |  |
| 5.3 |  |  |  |  |  |
| 6.1 |  |  |  |  |  |
| 6.2 |  |  |  |  |  |
| 6.3 |  |  |  |  |  |
| 6.4 |  |  |  |  |  |
| 7.1 |  |  |  |  |  |
| 7.2 |  |  |  |  |  |
| 8.1 |  |  |  |  |  |
| 8.2 |  |  |  |  |  |
| 8.3 |  |  |  |  |  |
| 8.4 |  |  |  |  |  |
| 8.5 |  |  |  |  |  |
| C.1 |  |  |  |  |  |
| C.2 |  |  |  |  |  |
| C.3 |  |  |  |  |  |
| D.1 |  |  |  |  |  |
| D.2 |  |  |  |  |  |
| D.3 |  |  |  |  |  |
| D.4 |  |  |  |  |  |
