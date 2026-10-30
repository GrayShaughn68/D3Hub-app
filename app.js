const app = document.getElementById("app");
const sportsStrip = document.getElementById("sports-strip");
const searchInput = document.getElementById("global-search");
const searchResults = document.getElementById("search-results");
const sportData = Object.fromEntries(D3_SPORTS.map((sport) => [sport.id, demoTeamsForSport(sport.id)]));

const iconPaths = {
  football: '<path d="M4.5 7.2c3.8-3.8 11.2-4.2 15-1.7 2.4 3.8 2.1 11.2-1.7 15-3.8 2.4-11.2 2.1-15-1.7-2.4-3.8-2.1-11.2 1.7-15Z"/><path d="m8 16 8-8M9.4 10.7l3.9 3.9m-5.7-2.1 3.9 3.9m.6-9.3 3.9 3.9"/>',
  basketball: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21M12 3c-2.5 2.4-3.8 5.4-3.8 9s1.3 6.6 3.8 9"/>',
  soccer: '<circle cx="12" cy="12" r="9"/><path d="m12 7 3 2.2-1.1 3.6h-3.8L9 9.2 12 7Zm-3 2.2-3.4-.8M9 12.8l-2.1 3.1m7-3.1 3.1 2.2m-2-5.8 2-3.1m-6 8.8-.2 3.7m5.1-3.6 3.2.5"/>',
  baseball: '<path d="M5 5c3-2.8 11-2.8 14 0s3 11 0 14-11 3-14 0S2 8 5 5Z"/><path d="M5.1 5.1c2.4 1.9 3.9 4.3 4.6 6.9s.2 5.2-1.3 7.9m10.5-14.8c-2.4 1.9-3.9 4.3-4.6 6.9s-.2 5.2 1.3 7.9m-11.8-12 2.1-.2m-.5 2.8 2.2-.6m7.1-2 2.2.6m-1.7 2.2 2.1.2"/>',
  softball: '<circle cx="12" cy="12" r="9"/><path d="M6.5 5c2.3 1.7 3.6 4.1 3.6 7s-1.3 5.3-3.6 7m11-14c-2.3 1.7-3.6 4.1-3.6 7s1.3 5.3 3.6 7m-11-11 2.2.4m-1.4 2.3 2.3.2m6.5-2.9 2.2-.4m-2.3 3.3 2.3-.2"/>',
  volleyball: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/><path d="M7.1 4.5c3.7 2.2 6.2 5.8 6.7 10.3m3-10.1c-2 3.6-5.4 6.4-10 7.4m10.8 5.4c-3.6-1.7-7.8-1.8-12-.1"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.football}</svg>`;
}

function sportById(id) {
  return D3_SPORTS.find((sport) => sport.id === id) || D3_SPORTS[0];
}

function teamById(sportId, teamId) {
  return (sportData[sportId] || []).find((team) => team.id === teamId);
}

function teamBadge(team, extraClass = "") {
  return `<span class="team-mini ${extraClass}" style="background:${team.color};color:white" aria-hidden="true">${team.abbreviation}</span>`;
}

function demoBanner() {
  return `<div class="demo-note"><strong>DEMO DATA</strong><span>Rankings, records and scores are illustrative.</span></div>`;
}

function navMarkup() {
  sportsStrip.innerHTML = `<span class="sports-strip-label">Sports</span>${D3_SPORTS.map((sport) => `<a class="sport-pill" href="#/sport/${sport.id}">${sport.shortName}</a>`).join("")}`;
}

function setPrimaryNav(page) {
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
  const target = page === "home" ? "#/" : page === "directory" || page === "teams" ? "#/directory" : "#/sport/football";
  document.querySelector(`.nav-link[href="${target}"]`)?.classList.add("active");
}

function renderHome() {
  setPrimaryNav("home");
  const featureSport = sportById("football");
  const featureTeams = sportData[featureSport.id];
  const featuredRows = featureTeams.slice(0, 5);
  app.innerHTML = `<div class="page"><div class="container">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span>All Division III. All in one place.</div>
        <h1>Every game.<br><span>Every campus.</span></h1>
        <p>Your front row seat to Division III sports. Explore team rankings, find your school, and keep up with the stories across DIII.</p>
        <div class="hero-actions"><a class="button button-primary" href="#/sport/football">Explore the Top 25 <span class="arrow">→</span></a><a class="button button-secondary" href="#/directory">Browse teams</a></div>
      </div>
      <div class="hero-art" aria-hidden="true"><span class="hero-number">III</span><div class="hero-ball"><svg viewBox="0 0 100 100"><path d="M16 27c19-13 47-14 67-2 13 20 12 48-2 66-20 13-48 12-66-2C2 69 2 42 16 27Z"/><path d="m28 70 44-44M32 40l27 28M40 32l27 28"/></svg></div><span class="hero-art-caption">The DIII community</span></div>
    </section>

    <div class="home-grid">
      <section>
        <div class="section-heading"><div><h2>Choose your sport</h2><p>Find rankings, teams and season updates.</p></div><a class="text-link" href="#/sport/football">All rankings <span class="arrow">→</span></a></div>
        <div class="sport-grid">${D3_SPORTS.map((sport) => `<a class="sport-card" href="#/sport/${sport.id}" data-symbol="${sport.symbol}"><div class="sport-card-top"><span class="sport-icon">${icon(sport.icon)}</span><span class="sport-card-meta">${sport.season} · DIII</span></div><span class="sport-card-title">${sport.name}</span><span class="sport-card-bottom"><span>View Top 25</span><span>↗</span></span></a>`).join("")}</div>
      </section>
      <section>
        <div class="section-heading"><div><h2>Around DIII</h2><p>Sample scoreboard snapshot.</p></div><span class="live-label">Scores</span></div>
        <div class="snapshot-card"><div class="snapshot-head"><strong>Game day</strong><select class="snapshot-sport-select" id="snapshot-sport" aria-label="Choose a sport">${D3_SPORTS.map((sport) => `<option value="${sport.id}" ${sport.id === featureSport.id ? "selected" : ""}>${sport.shortName}</option>`).join("")}</select></div><div id="snapshot-games">${snapshotMarkup(featureTeams, featureSport.id)}</div><div class="snapshot-foot">Illustrative demo scores · Official data not connected</div></div>
      </section>
    </div>

    <section class="rank-section"><div class="section-heading"><div><h2>Top 25 spotlight</h2><p>Start with the DIII Football sample rankings.</p></div><a class="text-link" href="#/sport/football">Full Top 25 <span class="arrow">→</span></a></div><div class="rank-preview">${rankPreviewMarkup(featureTeams.slice(0, 5))}<div class="rank-preview-foot">${demoBanner()}<a class="text-link" href="#/sport/football">See all 25 <span class="arrow">→</span></a></div></div></section>
  </div></div>`;
  document.getElementById("snapshot-sport").addEventListener("change", (event) => {
    document.getElementById("snapshot-games").innerHTML = snapshotMarkup(sportData[event.target.value], event.target.value);
  });
}

function demoScore(sportId, index) {
  const scores = sportId.includes("basketball") ? [[82, 74], [76, 69], [91, 84]]
    : sportId.includes("soccer") ? [[2, 1], [3, 0], [1, 1]]
      : sportId === "baseball" ? [[7, 4], [5, 3], [10, 6]]
        : sportId === "softball" ? [[5, 2], [3, 4], [8, 1]]
          : sportId === "womens-volleyball" ? [[3, 1], [3, 2], [0, 3]]
            : [[24, 13], [35, 20], [29, 27]];
  return scores[index % scores.length].join(" - ");
}

function snapshotMarkup(teams, sportId) {
  return teams.slice(0, 3).map((team, index) => {
    const opponent = teams[(index + 7) % teams.length];
    return `<div class="snapshot-row"><div class="snapshot-team">${teamBadge(team)}<span>${team.school}</span></div><div class="snapshot-score">${demoScore(sportId, index)}<small>FINAL · DEMO</small></div><div class="snapshot-team">${teamBadge(opponent)}<span>${opponent.school}</span></div></div>`;
  }).join("");
}

function rankPreviewMarkup(teams) {
  return `<div class="rank-preview-head"><span>Rank</span><span>Team</span><span>Record</span><span>PF</span><span>PA</span></div>${teams.map((team) => `<div class="rank-row"><span class="rank-num">${String(team.rank).padStart(2, "0")}</span><a class="rank-team-link" href="#/team/football/${team.id}">${teamBadge(team)}<span class="rank-school">${team.school}<span class="rank-mascot">${team.mascot}</span></span></a><span class="rank-stat">${team.record}</span><span class="rank-stat">${team.pointsFor}</span><span class="rank-stat">${team.pointsAgainst}</span></div>`).join("")}`;
}

function renderSport(sportId, view = "rankings") {
  const sport = sportById(sportId);
  const teams = sportData[sport.id];
  setPrimaryNav("rankings");
  document.querySelectorAll(".sport-pill").forEach((pill) => pill.classList.toggle("active", pill.getAttribute("href") === `#/sport/${sport.id}`));
  app.innerHTML = `<div class="page"><div class="container">
    <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><span>${sport.name}</span></div>
    <header class="sport-page-header"><div class="sport-page-title-wrap"><span class="sport-large-icon">${icon(sport.icon)}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>Division III · ${sport.season} season</div><h1>${sport.name}</h1><p>${sport.description}</p></div></div><div class="sport-tabs" role="tablist" aria-label="${sport.name} sections"><button class="sport-tab ${view === "rankings" ? "active" : ""}" data-view="rankings" role="tab" aria-selected="${view === "rankings"}">Top 25</button><button class="sport-tab ${view === "teams" ? "active" : ""}" data-view="teams" role="tab" aria-selected="${view === "teams"}">Teams</button></div></header>
    ${view === "rankings" ? renderRankingsContent(sport, teams) : renderSportTeams(sport, teams)}
  </div></div>`;
  document.querySelectorAll(".sport-tab").forEach((button) => button.addEventListener("click", () => renderSport(sport.id, button.dataset.view)));
}

function renderRankingsContent(sport, teams) {
  return `<div class="content-layout"><section class="panel ranking-panel"><div class="panel-title-row"><h2>${sport.name} Top 25</h2><small>Sample ranking · 25 teams</small></div><div class="ranking-table-head"><span>Rank</span><span>School / team</span><span>Record</span><span>For</span><span>Ag</span><span>Streak</span></div>${teams.map((team) => `<div class="ranking-entry"><span class="rank-num">${String(team.rank).padStart(2, "0")}</span><a class="rank-team-link" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span class="rank-school">${team.school}<span class="rank-mascot">${team.mascot} · ${team.location}</span></span></a><span class="ranking-record">${team.record}</span><span class="ranking-record">${team.pointsFor}</span><span class="ranking-record">${team.pointsAgainst}</span><span class="ranking-record">${team.streak}</span></div>`).join("")}<div class="rank-preview-foot">${demoBanner()}<span class="footer-note">Last updated: demo</span></div></section><aside class="ranking-side"><section class="panel side-card"><h3>Season snapshot</h3><p>Browse the sample rankings and open a school to view its DIII team page.</p><div class="season-line"><span>Season</span><strong>${sport.season} 2026</strong></div><div class="season-line"><span>Teams listed</span><strong>25</strong></div><div class="season-line"><span>Level</span><strong>NCAA Division III</strong></div></section><section class="panel side-card"><h3>About these rankings</h3><p>This interface uses illustrative demo rankings, records, and statistics. Ranking methodology and official data feeds are not connected yet.</p></section><a class="button button-secondary" href="#/directory">Browse all sample teams <span class="arrow">→</span></a></aside></div>`;
}

function renderSportTeams(sport, teams) {
  return `<div class="section-heading"><div><h2>${sport.name} teams</h2><p>Choose a school to open its team page.</p></div>${demoBanner()}</div><div class="directory-grid">${teams.map((team) => `<a class="directory-card" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${team.mascot} · ${team.record}</small></span></a>`).join("")}</div>`;
}

function renderTeam(sportId, teamId) {
  const sport = sportById(sportId);
  const team = teamById(sport.id, teamId);
  if (!team) return renderNotFound();
  setPrimaryNav("teams");
  const teammates = sportData[sport.id];
  const datesBySeason = { Fall: ["Sat, Oct 31", "Sat, Nov 7", "Sat, Nov 14", "Sat, Nov 21"], Winter: ["Sat, Jan 9 ’27", "Sat, Jan 16 ’27", "Sat, Jan 23 ’27", "Sat, Jan 30 ’27"], Spring: ["Sat, Mar 6 ’27", "Sat, Mar 13 ’27", "Sat, Mar 20 ’27", "Sat, Mar 27 ’27"] };
  const demoResult = sport.id.includes("basketball") ? "W 82–74" : sport.id.includes("soccer") ? "W 2–1" : sport.id === "baseball" ? "W 7–4" : sport.id === "softball" ? "W 5–2" : sport.id === "womens-volleyball" ? "W 3–1" : "W 31–17";
  const games = D3_DEMO_GAMES.map((game, index) => ({ ...game, date: datesBySeason[sport.season][game.dateIndex], opponent: teammates[(team.rank + index + 4) % teammates.length], result: index === 0 ? demoResult : index === 1 ? "12:00 PM" : index === 2 ? "1:00 PM" : "TBD" }));
  app.innerHTML = `<div class="page"><div class="container"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/sport/${sport.id}">${sport.name}</a><span>/</span><span>${team.school}</span></div>
    <section class="team-hero"><div class="team-heading"><span class="team-crest" style="background:${team.color}" aria-hidden="true">${team.abbreviation}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>NCAA Division III · ${sport.name}</div><h1>${team.school}</h1><p>${team.mascot} · ${team.location}</p></div><div class="team-summary"><div class="summary-stat"><strong>${team.record}</strong><span>Record</span></div><div class="summary-stat"><strong>#${team.rank}</strong><span>Sample rank</span></div><div class="summary-stat"><strong>${team.streak}</strong><span>Streak</span></div></div></div></section>
    <div class="team-content"><section class="panel"><div class="panel-title-row"><h2>Schedule & results</h2><small>${sport.season} season · sample</small></div>${games.map((game, index) => `<div class="schedule-row"><span class="schedule-date">${game.date}</span><span class="schedule-opponent">${teamBadge(game.opponent)}<span><strong>${index < 1 ? "vs." : "at"} ${game.opponent.school}</strong><small>${game.opponent.mascot} · NCAA Division III</small></span></span><span class="schedule-result">${game.result}<small>${game.note}</small></span></div>`).join("")}<div class="rank-preview-foot">${demoBanner()}</div></section><aside class="ranking-side"><section class="panel side-card"><h3>Season stats</h3><div class="team-side-stats"><div class="team-side-stat"><strong>${team.pointsFor}</strong><span>For / game</span></div><div class="team-side-stat"><strong>${team.pointsAgainst}</strong><span>Ag / game</span></div><div class="team-side-stat"><strong>${team.streak}</strong><span>Current streak</span></div><div class="team-side-stat"><strong>#${team.rank}</strong><span>Sample rank</span></div></div></section><section class="panel side-card"><h3>Team information</h3><div class="season-line"><span>School</span><strong>${team.school}</strong></div><div class="season-line"><span>Nickname</span><strong>${team.mascot}</strong></div><div class="season-line"><span>Location</span><strong>${team.location}</strong></div><div class="season-line"><span>Sport</span><strong>${sport.name}</strong></div><div class="season-line"><span>Division</span><strong>NCAA DIII</strong></div></section><a class="button button-secondary" href="#/sport/${sport.id}">← Back to ${sport.shortName} Top 25</a></aside></div>
  </div></div>`;
}

function renderDirectory(filter = "all", query = "") {
  setPrimaryNav("directory");
  const allTeams = D3_SCHOOLS.map((school) => ({ id: school[0], school: school[1], mascot: school[2], location: school[3], abbreviation: school[4], color: school[5] }));
  const normalized = query.trim().toLowerCase();
  const visible = allTeams.filter((team) => (!normalized || `${team.school} ${team.mascot} ${team.location}`.toLowerCase().includes(normalized)));
  app.innerHTML = `<div class="page"><div class="container"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><span>Team directory</span></div><header class="directory-head"><div><div class="eyebrow"><span class="eyebrow-dot"></span>Explore Division III</div><h1>Team directory</h1><p>Browse sample Division III team pages across the sports in D3Hub.</p></div>${demoBanner()}</header><div class="filter-row">${D3_SPORTS.map((sport, index) => `<a class="filter-chip ${filter === "all" ? (index === 0 ? "" : "") : filter === sport.id ? "active" : ""}" href="#/sport/${sport.id}">${sport.shortName}</a>`).join("")}<span class="filter-chip active">All sample schools</span></div>${visible.length ? `<div class="directory-grid">${visible.map((team) => `<a class="directory-card" href="#/team/football/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${team.mascot} · NCAA Division III</small></span></a>`).join("")}</div>` : `<div class="empty-state">No teams match “${escapeHtml(query)}”. Try another school name.</div>`}</div></div>`;
}

function renderNotFound() {
  app.innerHTML = `<div class="page"><div class="container"><div class="empty-state"><strong>Page not found.</strong><br><a class="text-link" href="#/">Return to D3Hub home →</a></div></div></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function route() {
  searchResults.hidden = true;
  searchInput.value = "";
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) {
    document.querySelectorAll(".sport-pill").forEach((pill) => pill.classList.remove("active"));
    return renderHome();
  }
  if (parts[0] === "sport" && parts[1]) return renderSport(parts[1]);
  if (parts[0] === "team" && parts[1] && parts[2]) return renderTeam(parts[1], parts[2]);
  if (parts[0] === "directory") return renderDirectory();
  return renderNotFound();
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.hidden = true;
    return;
  }
  const seen = new Set();
  const matches = [];
  D3_SPORTS.forEach((sport) => sportData[sport.id].forEach((team) => {
    const key = `${sport.id}:${team.id}`;
    if (!seen.has(key) && `${team.school} ${team.mascot} ${team.location}`.toLowerCase().includes(query)) {
      seen.add(key);
      matches.push({ team, sport });
    }
  }));
  searchResults.innerHTML = `<div class="search-results-title">${matches.length ? "Teams" : "No matches"}</div>${matches.slice(0, 7).map(({ team, sport }) => `<a class="search-result" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${sport.name} · ${team.mascot}</small></span></a>`).join("") || `<div class="search-results-title">Try a school name or mascot.</div>`}`;
  searchResults.hidden = false;
}

navMarkup();
route();
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    searchResults.hidden = true;
    searchInput.blur();
  }
});
searchInput.addEventListener("input", handleSearch);
searchInput.addEventListener("focus", handleSearch);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box") && !event.target.closest(".search-results")) searchResults.hidden = true;
});
document.getElementById("menu-toggle").addEventListener("click", (event) => {
  const isExpanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  event.currentTarget.setAttribute("aria-expanded", String(!isExpanded));
  sportsStrip.classList.toggle("collapsed", isExpanded);
});
