# D3Hub-app

## Team

- Grayson Shaughnessy — Driver
- Trevor Younger — Designer
- Sam DeNick — Tester

## Football data

The DIII football scoreboard is loaded from NCAA.com through the community-maintained [ncaa-api](https://github.com/henrygd/ncaa-api). D3Hub requests it through `api/football.js`, which keeps the external API call server-side and caches responses at the hosting edge for 45 seconds. No API key is required or exposed in browser code.

The feed supplies the current DIII scoreboard window, including upcoming games and available scores. Game status is shown from the feed; unknown status or missing scores are labeled unavailable. D3Hub does not currently have a verified football ranking, full season team roster, record, or statistics feed, so those values are not invented. Other sport sections still contain clearly labeled illustrative demo content.

The upstream service is community maintained, subject to its availability and request limits. The website shows the source and the upstream update time when supplied (otherwise the proxy retrieval time).

## Run locally

The frontend is static, but its football data route is a Vercel Function. Use Vercel's local development server so `/api/football` is available:

1. Install Node.js if it is not installed.
2. From this folder, run:

   ```powershell
   npx vercel dev
   ```

3. Open the local URL printed by Vercel (usually [http://localhost:3000](http://localhost:3000)).

Opening `index.html` directly or using `python -m http.server` will display the site, but the football feed will show its unavailable message because those static servers do not run the API function.

## Deploy

Import the repository into Vercel with the project root set to this folder. Vercel serves the static files and deploys `api/football.js` as a serverless function. No environment variables are required. A different static host needs an equivalent server-side function/proxy and route at `/api/football`.
