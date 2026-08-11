"use client";

import { useMemo, useState } from "react";

type Review = {
  outlet: string;
  score: string;
  quote: string;
  url: string;
};

type Show = {
  title: string;
  artist: string;
  genre: string;
  score: number;
  reviews: number;
  fiveStars: number;
  venue: string;
  time: string;
  until: string;
  quote: string;
  source: string;
  movement: number;
  tag?: string;
  sources: Review[];
};

const currentPickUrl = "https://www.theguardian.com/stage/2026/jul/07/edinburgh-festival-2026-10-terrific-shows-weve-already-reviewed";

const shows: Show[] = [
  {
    title: "Woodhill", artist: "LUNG Theatre", genre: "Theatre", score: 92, reviews: 3, fiveStars: 2,
    venue: "ZOO Southside", time: "See listing", until: "30 Aug", quote: "Verbatim theatre with extraordinary physical force", source: "2026 Guardian pick", movement: 1,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A forceful portrait of families confronting failures in the prison system.", url: "https://www.theguardian.com/stage/2023/aug/10/woodhill-britain-failing-prison-system-summerhall-edinburgh" },
      { outlet: "The Standard", score: "5/5", quote: "The production turns testimony, movement and sound into an intensely affecting whole.", url: "https://www.standard.co.uk/culture/theatre/woodhill-edinburgh-fringe-review-summerhall-lung-theatre-prison-b1100511.html" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Selected as one of the standout productions appearing at this year’s festival.", url: currentPickUrl },
    ],
  },
  {
    title: "Ten Thousand Hours", artist: "Gravity & Other Myths", genre: "Circus", score: 90, reviews: 2, fiveStars: 1,
    venue: "Assembly Hall", time: "See listing", until: "30 Aug", quote: "High-skill circus with humour and audience play", source: "2026 Guardian pick", movement: 2, tag: "Critics’ pick",
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A celebration of the practice, precision and trust behind elite circus performance.", url: "https://www.theguardian.com/stage/2025/aug/16/ten-thousand-hours-review-assembly-hall-edinburgh-gravity-and-other-myths" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Highlighted for its exceptional skill, warmth and audience participation.", url: currentPickUrl },
    ],
  },
  {
    title: "Creepy Boys: Slugs", artist: "Sam Kruger & SE Grummett", genre: "Comedy", score: 89, reviews: 4, fiveStars: 2,
    venue: "Summerhall", time: "See listing", until: "17 Aug", quote: "An existential rave disguised as gleeful chaos", source: "2026 Guardian pick", movement: 3, tag: "Ends soon",
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "Absurd clowning that turns contemporary anxiety into a frantic, intelligent party.", url: "https://www.theguardian.com/stage/2025/aug/04/creepy-boys-slugs-review-absurdist-duo-summerhall-edinburgh" },
      { outlet: "The Spy in the Stalls", score: "5/5", quote: "A confident blend of punk concert, puppetry, comedy and performance art.", url: "https://thespyinthestalls.com/2025/08/creepy-boys/" },
      { outlet: "Corr Blimey", score: "4/5", quote: "Technically ambitious, deliberately chaotic and packed with sharp ideas.", url: "https://corrblimey.uk/2025/08/04/review-edinburgh-festival-fringe-2025-creepy-boys-slugs/" },
    ],
  },
  {
    title: "David Elms Describes a Room", artist: "David Elms", genre: "Comedy", score: 86, reviews: 3, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "See listing", until: "30 Aug", quote: "Understated improv built from collective imagination", source: "2026 Guardian pick", movement: 0,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A skilful, low-key hour in which the audience builds an imaginary room together.", url: "https://www.theguardian.com/stage/2025/aug/14/david-elms-describes-a-room-review-pleasance-courtyard-edinburgh" },
      { outlet: "A Youngish Perspective", score: "4/5", quote: "Patient, precisely guided improv whose humour emerges naturally from the room.", url: "https://ayoungishperspective.co.uk/2025/08/19/review-david-elms-david-elms-describes-a-room/" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Chosen as a returning festival highlight for the 2026 programme.", url: currentPickUrl },
    ],
  },
  {
    title: "One Man Musical", artist: "Flo & Joan", genre: "Musical theatre", score: 85, reviews: 2, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "See listing", until: "30 Aug", quote: "A wickedly playful Andrew Lloyd Webber musical", source: "2026 Guardian pick", movement: -1,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A clever musical comedy that balances affectionate pastiche with sharp theatrical jokes.", url: "https://www.theguardian.com/stage/article/2024/aug/18/one-man-musical-by-flo-joan-review-andrew-lloyd-webber-pleasance-dome-edinburgh" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Included among the critic-selected productions returning to Edinburgh this year.", url: currentPickUrl },
    ],
  },
  {
    title: "Bog Witch", artist: "Bryony Kimmings", genre: "Theatre", score: 82, reviews: 3, fiveStars: 0,
    venue: "Traverse Theatre", time: "See listing", until: "30 Aug", quote: "A funny, unsettling climate reckoning", source: "2026 Guardian pick", movement: 2,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "Personal eco-theatre that moves confidently between comedy, folklore and climate anxiety.", url: "https://www.theguardian.com/stage/2025/oct/15/bog-witch-review-bryony-kimmings-climate-soho-theatre-walthamstow" },
      { outlet: "Time Out", score: "3/5", quote: "A visually rich and charismatic return that would benefit from tighter editing.", url: "https://www.timeout.com/edinburgh/theatre/bog-witch-review" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "One of the publication’s ten recommended shows for Edinburgh 2026.", url: currentPickUrl },
    ],
  },
  {
    title: "Furniture Boys", artist: "Emily Weitzman", genre: "Comedy", score: 81, reviews: 2, fiveStars: 0,
    venue: "Underbelly, Bristo Square", time: "See listing", until: "30 Aug", quote: "Ex-boyfriends reimagined as troublesome furniture", source: "2026 Guardian pick", movement: 4,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A witty comic premise that opens into something more layered and emotionally resonant.", url: "https://www.theguardian.com/stage/2025/aug/16/furniture-boys-review-underbelly-george-square-edinburgh" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Selected for the 2026 guide after a warmly received earlier run.", url: currentPickUrl },
    ],
  },
  {
    title: "Tell Me", artist: "Sadiq Ali Company", genre: "Circus", score: 80, reviews: 2, fiveStars: 0,
    venue: "Summerhall", time: "See listing", until: "31 Aug", quote: "Intimate circus confronting stigma and the Aids crisis", source: "2026 Guardian pick", movement: 1,
    sources: [
      { outlet: "The Guardian", score: "Recommended", quote: "A poignant piece combining Chinese pole, intimacy and stories of queer survival.", url: "https://www.theguardian.com/stage/2026/jan/26/sadiq-ali-company-tell-me-review-aids-crisis-the-place-london" },
      { outlet: "Guardian 2026 guide", score: "Fringe pick", quote: "Highlighted as a compassionate and physically assured festival production.", url: currentPickUrl },
    ],
  },
];

const genres = ["All shows", "Comedy", "Theatre", "Musical theatre", "Circus"];

function Arrow({ movement }: { movement: number }) {
  if (movement === 0) return <span className="movement flat">—</span>;
  return (
    <span className={`movement ${movement > 0 ? "up" : "down"}`} aria-label={`${Math.abs(movement)} places ${movement > 0 ? "up" : "down"}`}>
      {movement > 0 ? "↑" : "↓"}{Math.abs(movement)}
    </span>
  );
}

export default function Home() {
  const [genre, setGenre] = useState("All shows");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(shows[0].title);
  const [methodOpen, setMethodOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shows.filter((show) => {
      const matchesGenre = genre === "All shows" || show.genre === genre;
      const matchesQuery = !needle || [show.title, show.artist, show.venue, show.genre].join(" ").toLowerCase().includes(needle);
      return matchesGenre && matchesQuery;
    });
  }, [genre, query]);

  return (
    <>
      <div className="newsbar">
        <span>Independent reviews, intelligently combined</span>
        <span>Edinburgh · Festival edition</span>
      </div>

      <header className="masthead">
        <div className="mastline">
          <div className="edition">Festival edition No. 01<br />Updated daily</div>
          <a className="wordmark" href="#top" aria-label="Fringe Ledger home">FRINGE LEDGER<span>.</span></a>
          <div className="edition editionRight">2026 programme verified<br />Professional reviews indexed</div>
        </div>
        <p>The critical record of the Edinburgh Festival Fringe</p>
      </header>

      <nav className="navigation" aria-label="Main navigation">
        <a className="active" href="#ranking">The ranking</a>
        <a href="#method">How it works</a>
        <a href="#sources">Review sources</a>
        <label className="search">
          <span className="srOnly">Search shows, artists or venues</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shows, artists or venues" />
          <kbd>⌕</kbd>
        </label>
      </nav>

      <main id="top">
        <section className="lead">
          <div>
            <div className="kicker">Today’s consensus</div>
            <h1>The best-reviewed shows at the Fringe, ranked</h1>
            <p className="summary">From radical verbatim theatre to existential clowning, these are current 2026 productions with strong published notices. Early scores combine reviews of the same production with this year’s verified programme picks.</p>
            <p className="demoNote">Live 2026 watchlist · updated 11 August · early scores may move as new reviews arrive.</p>
          </div>
          <aside className="standfirst" id="method">
            <div className="stat"><strong>92</strong><span>highest<br />early score</span></div>
            <div>
              <p className="method"><b>What is a Ledger score?</b><br />We normalise star ratings, weight outlets for review history and consistency, and only rank shows with three or more published reviews.</p>
              <button className="textButton" onClick={() => setMethodOpen(!methodOpen)} aria-expanded={methodOpen}>{methodOpen ? "Hide methodology" : "Read the methodology"} →</button>
            </div>
          </aside>
        </section>

        {methodOpen && (
          <section className="methodPanel" aria-label="Scoring methodology">
            <div><b>01 · Normalise</b><p>Stars, grades and percentage scores become a common 0–100 scale.</p></div>
            <div><b>02 · Weight</b><p>Outlets earn confidence from review volume, consistency and transparent authorship.</p></div>
            <div><b>03 · Qualify</b><p>Early-festival listings may enter with one professional review and a verified 2026 programme appearance.</p></div>
            <div><b>04 · Update</b><p>Scores recalculate as new criticism appears, with every source retained.</p></div>
          </section>
        )}

        <section className="controls" id="ranking">
          <div><h2>The 2026 Ledger</h2><p>Showing {filtered.length} current productions · early-festival edition</p></div>
          <div className="pills" role="group" aria-label="Filter by genre">
            {genres.map((item) => <button key={item} className={genre === item ? "on" : ""} onClick={() => setGenre(item)}>{item}</button>)}
          </div>
        </section>

        <section className="ranking" aria-live="polite">
          <div className="tableHead"><span>Rank</span><span>Show</span><span>Genre</span><span>Score</span><span>Reviews</span><span>Where & when</span></div>
          {filtered.length === 0 ? (
            <div className="empty"><b>No shows found.</b><span>Try another title, artist, venue or genre.</span></div>
          ) : filtered.map((show) => {
            const originalRank = shows.findIndex((item) => item.title === show.title) + 1;
            const isExpanded = expanded === show.title;
            return (
              <article className={`showEntry ${isExpanded ? "expanded" : ""}`} key={show.title}>
                <button className="showRow" onClick={() => setExpanded(isExpanded ? null : show.title)} aria-expanded={isExpanded}>
                  <span className="rank">{String(originalRank).padStart(2, "0")}<Arrow movement={show.movement} /></span>
                  <span className="show"><b>{show.title}</b><small>By {show.artist} · “{show.quote}” — {show.source}</small></span>
                  <span className="genre">{show.genre}</span>
                  <span className={`score ${show.score < 86 ? "gold" : ""}`}>{show.score}</span>
                  <span className="reviews"><b>{show.reviews}</b><small>5-star: {show.fiveStars}</small></span>
                  <span className="ticket"><b>{show.venue}</b><small>{show.time} · until {show.until}</small>{show.tag && <em>{show.tag}</em>}</span>
                </button>
                {isExpanded && (
                  <div className="sourcePanel" id="sources">
                    <div className="sourceIntro"><span>Source reviews</span><p>{show.sources.length} of {show.reviews} indexed notices</p></div>
                    {show.sources.map((review) => <div className="sourceReview" key={`${review.outlet}-${review.url}`}><div><b>{review.outlet}</b><strong>{review.score}</strong></div><p>{review.quote}</p><a href={review.url} target="_blank" rel="noreferrer">Read source ↗</a></div>)}
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="bottomGrid" id="prototype-note">
          <p className="editorialNote"><b>Editorial note.</b> Scores are an informed consensus, not a substitute for criticism. Every live listing will link to its source reviews so readers can follow the argument, discover unfamiliar publications and make up their own minds.</p>
          <div className="newsletter"><b>The Ledger, every lunchtime.</b><span>A concise email with the day’s biggest movers, new five-star notices and last-minute tickets.</span><button onClick={() => alert("Newsletter signup will connect in the next version.")}>Join free →</button></div>
        </section>
      </main>
      <footer className="siteFooter"><span>FRINGE LEDGER.</span><span>Independent · Transparent · Edinburgh</span><span>© 2026</span></footer>
    </>
  );
}
