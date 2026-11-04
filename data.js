/*
 * Sample content for the first D3Hub frontend. Ranking order, records, scores,
 * and schedule details are fictional demo data and must be replaced by a
 * verified DIII sports data source before launch.
 */
const D3_SCHOOLS = [
  ["north-central", "North Central", "Cardinals", "Naperville, IL", "NCC", "#a12635"],
  ["mount-union", "Mount Union", "Purple Raiders", "Alliance, OH", "MU", "#58358d"],
  ["johns-hopkins", "Johns Hopkins", "Blue Jays", "Baltimore, MD", "JHU", "#1464a5"],
  ["uw-whitewater", "UW–Whitewater", "Warhawks", "Whitewater, WI", "UWW", "#bd202e"],
  ["tufts", "Tufts", "Jumbos", "Medford, MA", "TUF", "#3873a7"],
  ["amherst", "Amherst", "Mammoths", "Amherst, MA", "AMH", "#382d67"],
  ["williams", "Williams", "Ephs", "Williamstown, MA", "WIL", "#4f75b6"],
  ["middlebury", "Middlebury", "Panthers", "Middlebury, VT", "MID", "#287e54"],
  ["ithaca", "Ithaca", "Bombers", "Ithaca, NY", "ITH", "#00539B"],
  ["denison", "Denison", "Big Red", "Granville, OH", "DEN", "#a92b35"],
  ["kenyon", "Kenyon", "Owls", "Gambier, OH", "KEN", "#467c5d"],
  ["calvin", "Calvin", "Knights", "Grand Rapids, MI", "CAL", "#293c75"],
  ["hope", "Hope", "Flying Dutchmen", "Holland, MI", "HOP", "#ed7900"],
  ["carnegie-mellon", "Carnegie Mellon", "Tartans", "Pittsburgh, PA", "CMU", "#ad2737"],
  ["washu", "WashU", "Bears", "St. Louis, MO", "WU", "#b32735"],
  ["uchicago", "Chicago", "Maroons", "Chicago, IL", "CHI", "#8a2634"],
  ["mit", "MIT", "Engineers", "Cambridge, MA", "MIT", "#8a2634"],
  ["st-olaf", "St. Olaf", "Oles", "Northfield, MN", "STO", "#b62d39"],
  ["uw-la-crosse", "UW–La Crosse", "Eagles", "La Crosse, WI", "UWL", "#6f1833"],
  ["uw-oshkosh", "UW–Oshkosh", "Titans", "Oshkosh, WI", "UWO", "#db9d21"],
  ["wittenberg", "Wittenberg", "Tigers", "Springfield, OH", "WIT", "#b32934"],
  ["springfield", "Springfield", "Pride", "Springfield, MA", "SPF", "#e8a326"],
  ["trinity-ct", "Trinity (CT)", "Bantams", "Hartford, CT", "TRI", "#bc303b"],
  ["st-johns-mn", "St. John’s (MN)", "Johnnies", "Collegeville, MN", "SJU", "#bc222d"],
  ["wartburg", "Wartburg", "Knights", "Waverly, IA", "WAR", "#f1bd38"]
];

const D3_SPORTS = [
  { id: "football", name: "Football", shortName: "Football", season: "Fall", symbol: "FB", icon: "football", description: "DIII football rankings, team pages, and game day snapshots." },
  { id: "mens-basketball", name: "Men’s Basketball", shortName: "M. Basketball", season: "Winter", symbol: "MBB", icon: "basketball", description: "Follow the season, browse the Top 25, and explore team pages." },
  { id: "womens-basketball", name: "Women’s Basketball", shortName: "W. Basketball", season: "Winter", symbol: "WBB", icon: "basketball", description: "A home for DIII women’s basketball rankings and team information." },
  { id: "mens-soccer", name: "Men’s Soccer", shortName: "M. Soccer", season: "Fall", symbol: "MS", icon: "soccer", description: "Explore DIII men’s soccer teams and the sample Top 25." },
  { id: "womens-soccer", name: "Women’s Soccer", shortName: "W. Soccer", season: "Fall", symbol: "WS", icon: "soccer", description: "Track DIII women’s soccer teams, rankings, and sample results." },
  { id: "baseball", name: "Baseball", shortName: "Baseball", season: "Spring", symbol: "BB", icon: "baseball", description: "DIII baseball rankings and team profiles in one place." },
  { id: "softball", name: "Softball", shortName: "Softball", season: "Spring", symbol: "SB", icon: "softball", description: "Follow NCAA DIII softball scores, schedules, regional rankings, and tournament results." },
  { id: "womens-volleyball", name: "Women’s Volleyball", shortName: "Volleyball", season: "Fall", symbol: "VB", icon: "volleyball", description: "DIII volleyball rankings, teams, and season snapshots." }
];

const D3_RECORDS = ["8-0", "7-1", "9-1", "6-1", "7-2", "8-2", "6-2", "7-1", "5-1", "6-2", "8-1", "7-2", "5-2", "6-1", "7-3", "5-2", "6-2", "8-2", "5-1", "7-3", "6-2", "5-2", "7-1", "6-3", "5-3"];

function demoTeamsForSport(sportId) {
  const offset = D3_SPORTS.findIndex((sport) => sport.id === sportId) % D3_SCHOOLS.length;
  const rotated = [...D3_SCHOOLS.slice(offset), ...D3_SCHOOLS.slice(0, offset)];
  const basketball = sportId.includes("basketball");
  const soccer = sportId.includes("soccer");
  const baseball = sportId === "baseball" || sportId === "softball";
  const volleyball = sportId === "womens-volleyball";
  return rotated.map((school, index) => ({
    id: school[0],
    school: school[1],
    mascot: school[2],
    location: school[3],
    abbreviation: school[4],
    color: school[5],
    rank: index + 1,
    record: D3_RECORDS[(index + offset) % D3_RECORDS.length],
    pointsFor: basketball ? 66 + ((index * 7 + offset * 3) % 28) : soccer ? 1 + ((index + offset) % 4) : baseball ? 3 + ((index * 2 + offset) % 8) : volleyball ? 2 + ((index + offset) % 3) : 32 + ((index * 7 + offset * 3) % 28),
    pointsAgainst: basketball ? 58 + ((index * 5 + offset * 4) % 27) : soccer ? (index + offset) % 3 : baseball ? 2 + ((index * 3 + offset) % 7) : volleyball ? 1 + ((index + offset) % 3) : 10 + ((index * 5 + offset * 4) % 23),
    streak: index % 5 === 0 ? "W4" : index % 4 === 0 ? "L1" : `W${(index % 3) + 1}`
  }));
}

const D3_DEMO_GAMES = [
  { dateIndex: 0, note: "Final" },
  { dateIndex: 1, note: "Upcoming" },
  { dateIndex: 2, note: "Upcoming" },
  { dateIndex: 3, note: "Upcoming" }
];

// D3football.com weekly national poll, captured from the Week 9 page.
// This is a dated snapshot; do not present it as a live feed.
const D3_FOOTBALL_TOP25 = {
  week: "2026 Week 9",
  through: "Through games of Oct. 31, 2026",
  url: "https://www.d3football.com/top25/2026/week9",
  entries: [
    [1,"Wheaton (Ill.)","8-0",613,"-5","1",17],
    [2,"UW-Platteville","8-0",597,"+8","2",7],
    [3,"St. John's","8-0",556,"-7","3",0],
    [4,"UW-Whitewater","8-0",555,"+8","5",1],
    [5,"North Central (Ill.)","7-1",549,"-5","4",0],
    [6,"Hardin-Simmons","7-0",494,"-8","6",0],
    [7,"Endicott","8-0",454,"+3","7",0],
    [8,"Washington U.","8-0",436,"+1","8",0],
    [9,"Hope","8-0",387,"+23","9",0],
    [10,"Cortland","8-0",371,"+12","11",0],
    [11,"Christopher Newport","8-0",369,"-4","10",0],
    [12,"Wartburg","6-2",329,"-13","12",0],
    [13,"Baldwin Wallace","8-0",328,"+38","13",0],
    [14,"UW-River Falls","6-2",291,"+7","15",0],
    [15,"Mary Hardin-Baylor","7-1",275,"+29","17",0],
    [16,"Bethel","6-2",261,"+7","16",0],
    [17,"DePauw","7-1",191,"+133","25",0],
    [18,"Trinity (Texas)","7-1",187,"+15","18",0],
    [19,"Susquehanna","7-1",163,"+47","20",0],
    [20,"Linfield","6-1",131,"+26","21",0],
    [21,"Chapman","7-1",130,"+46","22",0],
    [22,"Utica","7-1",93,"+41","—",0],
    [23,"John Carroll","6-2",63,"-225","14",0],
    [24,"Rowan","6-2",57,"-25","23",0],
    [25,"Calvin","8-0",53,"+32","—",0]
  ].map(([rank, school, record, points, change, previous, firstPlaceVotes]) => ({ rank, school, record, points, change, previous, firstPlaceVotes })),
  others: "Mount Union 41; Lake Forest 32; Washington & Jefferson 25; Franklin & Marshall 21; Springfield 21; Trinity (Conn.) 18; Concordia-Moorhead 9; UW-Eau Claire 6; Concordia Wisconsin 4; Heidelberg 4; UW-Stout 3; Berry 2; Ithaca 2; Randolph-Macon 2; Hampden-Sydney 1; Salisbury 1.",
  dropped: "No. 19 Berry (minus-130); No. 24 Heidelberg (minus-77)."
};
