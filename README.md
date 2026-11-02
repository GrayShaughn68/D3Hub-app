# D3Hub-app

## Team

- Grayson Shaughnessy — Driver
- Trevor Younger — Designer
- Sam DeNick — Tester

## Football data

The DIII football scoreboard and regional rankings are loaded from NCAA.com through the community-maintained [ncaa-api](https://github.com/henrygd/ncaa-api). D3Hub requests both through `api/football.js`, which keeps external API calls server-side and caches responses at the hosting edge for 45 seconds. No API key is required or exposed in browser code.

The scoreboard supplies the current DIII football games, including upcoming schedules and available scores. Game status is shown from the feed; unknown status or missing scores are labeled unavailable. The rankings tab shows NCAA regional ranks, in-division records, and NPI grouped into the six NCAA regions; these regional ranks are not a national Top 25. D3Hub does not currently have a verified full season team roster or team statistics feed, so those values are not invented. Other sport sections still contain clearly labeled illustrative demo content.

The upstream service is community maintained, subject to its availability and request limits. The website shows the source and the upstream update time when supplied (otherwise the proxy retrieval time).

## Softball data

The DIII softball page uses NCAA.com feeds through `api/softball.js`. Its `scoreboard` feed returns games for a selected date; `schedule` lists season dates and daily game counts for the verified 2024–2026 seasons; `rankings` currently returns regional NPI rankings, not a national poll; `history` returns championship results; and `bracket` returns the 2026 NCAA tournament bracket with committee seeds. The UI calendar year is mapped to the NCAA schedule endpoint's season-year value. Tournament seeds are kept separate from regional rankings. The community API's softball `standings` route returned an upstream error during verification, so D3Hub labels standings unavailable instead of showing demo values.

The softball proxy validates each feed response, adds a `source` and `retrievedAt` timestamp, and caches successful responses at the hosting edge for 45 seconds. The local `server.js` proxy uses an equivalent in-memory cache. The API is community maintained and can be unavailable; the softball page shows a temporary unavailable state rather than substituting demo games.

While **Scores & schedule** is open and the browser tab is visible, the selected date's scoreboard refreshes approximately every 60 seconds through that same proxy. Polling pauses when another softball section or sport is open, or when the browser tab is hidden. Refreshes update only the score results, preserving the selected season/date and page scroll; a failed refresh leaves the last successful scores visible with a status notice.

## Run locally

The local runner uses only Node.js built-in modules; no package installation is needed.

1. From this folder, run:

   ```powershell
   node server.js
   ```

2. Open [http://127.0.0.1:4174](http://127.0.0.1:4174).
3. Stop the server with `Ctrl+C` in the terminal.

Opening `index.html` directly or using `python -m http.server` will display the site, but football data will show its unavailable message because those static servers do not run the `/api/football` proxy.

## Deploy

Import the repository into Vercel with the project root set to this folder. Vercel serves the static files and deploys `api/football.js` as a serverless function. No environment variables are required. A different static host needs an equivalent server-side function/proxy and route at `/api/football`.
