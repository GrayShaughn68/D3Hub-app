# D3Hub-app

## Team

- Grayson Shaughnessy — Driver
- Trevor Younger — Designer
- Sam DeNick — Tester

## Football data

The DIII football scoreboard and regional rankings are loaded from NCAA.com through the community-maintained [ncaa-api](https://github.com/henrygd/ncaa-api). D3Hub requests both through `api/football.js`, which keeps external API calls server-side and caches responses at the hosting edge for 45 seconds. No API key is required or exposed in browser code. The D3football.com national Top 25 is shown as a dated Week 9, 2026 snapshot, with source attribution; it does not update automatically.

The scoreboard supplies the current DIII football games, including upcoming schedules and available scores. Game status is shown from the feed; unknown status or missing scores are labeled unavailable. Football rankings include the D3football.com national poll as a dated Week 9, 2026 snapshot and NCAA regional ranks, in-division records, and NPI grouped into the six NCAA regions. These are separate rankings with different publishers and methods. D3Hub does not currently have a verified full season team roster or team statistics feed, so those values are not invented. Other sport sections still contain clearly labeled illustrative demo content.

The upstream service is community maintained, subject to its availability and request limits. The website shows the source and the upstream update time when supplied (otherwise the proxy retrieval time).

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
