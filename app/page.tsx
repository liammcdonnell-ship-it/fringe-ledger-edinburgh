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

const shows: Show[] = [
  {
    title: "Frankie Thompson: Horrible Things", artist: "Frankie Thompson", genre: "Comedy", score: 100, reviews: 1, fiveStars: 1,
    venue: "Pleasance Courtyard", time: "20:45", until: "30 Aug", quote: "Avant-clowning with a newly commanding comic voice", source: "Time Out · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Time Out", score: "5/5", quote: "A superb, singular hour that gives Thompson's strange comic world a forceful new centre.", url: "https://www.timeout.com/edinburgh/comedy/frankie-thompson-horrible-things-review" },
    ],
  },
  {
    title: "Bebe Cave: Swoon", artist: "Bebe Cave", genre: "Comedy", score: 100, reviews: 1, fiveStars: 1,
    venue: "Pleasance Dome", time: "17:40", until: "30 Aug", quote: "A gleeful, high-energy collision of art history and modern misogyny", source: "Chortle · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Chortle", score: "5/5", quote: "A fiercely inventive one-woman romp packed with jokes, characters and pointed satire.", url: "https://www.chortle.co.uk/review/2026/08/10/61240/bebe_cave%3A_swoon" },
    ],
  },
  {
    title: "Andrew White: What a Life!", artist: "Andrew White", genre: "Comedy", score: 90, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · Cabaret Voltaire", time: "17:45", until: "30 Aug", quote: "Life-affirming comedy that balances grief, mischief and real heart", source: "Chortle · 6 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4.5/5", quote: "A skilfully interwoven hour where sentiment is repeatedly punctured by strong jokes.", url: "https://www.chortle.co.uk/review/2026/08/04/61184/andrew_white%3A_what_a_life%21" },
    ],
  },
  {
    title: "Andrew Doherty: Reviewers Welcome... TO DIE!", artist: "Andrew Doherty", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "22:50", until: "30 Aug", quote: "A gloriously petty supernatural revenge fantasy", source: "Time Out · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Time Out", score: "4/5", quote: "An exuberant horror-comedy that turns theatrical grievance into a joke on its creator.", url: "https://www.timeout.com/edinburgh/comedy/andrew-doherty-reviewers-welcome-to-die-review" },
    ],
  },
  {
    title: "Sh!t Theatre: Evita Too", artist: "Sh!t Theatre", genre: "Theatre", score: 80, reviews: 1, fiveStars: 0,
    venue: "ZOO Southside", time: "See listing", until: "30 Aug", quote: "A subversive rummage through the myths surrounding Evita", source: "Time Out · 9 Aug", movement: 0,
    sources: [
      { outlet: "Time Out", score: "4/5", quote: "A playful, politically alert investigation of how women are remembered and rewritten.", url: "https://www.timeout.com/edinburgh/theatre/sh-t-theatre-evita-too-review-1" },
    ],
  },
  {
    title: "Amy Matthews: Definitions of Toast", artist: "Amy Matthews", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · The Tron", time: "See listing", until: "30 Aug", quote: "A controlled, vulnerable hour about anger finally finding a voice", source: "Chortle · 9 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", quote: "Smart, carefully structured stand-up with emotional clarity and a strong sense of arrival.", url: "https://www.chortle.co.uk/review/2026/08/09/61232/amy_matthews%3A_definitions_of_toast" },
    ],
  },
  {
    title: "Chris Martin Lied to Us", artist: "Will Spence", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Underbelly Cowgate", time: "See listing", until: "30 Aug", quote: "A playful, committed clown show built around one very yellow theory", source: "Chortle · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Chortle", score: "4/5", quote: "A charming, deliberately strange debut carried by physical commitment and playful invention.", url: "https://www.chortle.co.uk/review/2026/08/10/61243/chris_martin_lied_to_us" },
    ],
  },
  {
    title: "Freddie Meredith: Need A Light?", artist: "Freddie Meredith", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "See listing", until: "30 Aug", quote: "An assured character debut about loneliness in the smoking area", source: "Chortle · 9 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", quote: "A finely observed and precisely performed character study with an unexpectedly tender centre.", url: "https://www.chortle.co.uk/review/2026/08/09/61234/freddie_meredith%3A_need_a_light%3F" },
    ],
  },
  {
    title: "Jenny Gorelick: Sorry", artist: "Jenny Gorelick", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · Niddry Street", time: "See listing", until: "30 Aug", quote: "Rapid-fire dating comedy with sharper social commentary underneath", source: "Chortle · 6 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", quote: "A gag-dense stand-up hour whose bright persona carries perceptive writing on gender and relationships.", url: "https://www.chortle.co.uk/review/2026/08/06/61198/jenny_gorelick%3A_sorry" },
    ],
  },
  {
    title: "Bog Witch", artist: "Bryony Kimmings", genre: "Theatre", score: 60, reviews: 1, fiveStars: 0,
    venue: "Traverse Theatre", time: "See listing", until: "30 Aug", quote: "A visually rich climate reckoning with an unruly shape", source: "Time Out · 9 Aug", movement: 0,
    sources: [
      { outlet: "Time Out", score: "3/5", quote: "A charismatic and visually imaginative return whose abundance could use tighter editing.", url: "https://www.timeout.com/edinburgh/theatre/bog-witch-review" },
    ],
  },
];

const genres = ["All shows", "Comedy", "Theatre"];

const monitoredSources = [
  "Chortle", "The Guardian", "The Times", "Binge Fringe", "British Theatre Guide",
  "Phoenix Remix", "The Herald", "Roland’s Reviews", "Disrupt Reviews", "Time Out",
  "FringeFan", "EdFringe Review", "From the North", "Boom Radio", "Mix Up Theatre",
  "The Stage", "Fest Mag", "Reyt Good Magazine", "Across the Arts", "On the Mic",
  "Bouquets & Brickbats", "The Scotsman", "Scottish Field", "Broadway Baby",
  "Bruce on the Fringe", "Get the Chance", "One4Review",
  "The Skinny", "The List", "The Independent", "The Telegraph", "The Wee Review",
  "The Reviews Hub", "The Quinntessential Review", "Corr Blimey", "All Edinburgh Theatre",
  "LouReviews", "WhatsOnStage", "EdinburghGuide", "FringeReview", "STARBURST",
  "Edinburgh Evening News", "What The Fringe", "The Flaneur", "StageSideUK",
  "Theatre and Art Reviews", "Theatre Scotland", "Braw Theatre", "LondonTheatre1",
  "European Comedy", "Arts Reviews Edinburgh", "Sounds & Stage", "Edinburgh Music Review",
  "Country & Town House", "Theatre Village", "SNACK Magazine", "The Spy in the Stalls",
  "A Youngish Perspective", "The Standard", "British Comedy Guide", "BroadwayWorld",
];

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
          <div className="edition editionRight">Checked every hour<br />{monitoredSources.length} publications monitored</div>
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
            <p className="summary">These are shows currently playing at the 2026 Fringe with scored reviews published this year. Archive reviews and preview selections no longer contribute to the ranking.</p>
            <p className="demoNote">2026 reviews only · checked 11 August · early scores may move quickly as new notices arrive.</p>
          </div>
          <aside className="standfirst" id="method">
            <div className="stat"><strong>100</strong><span>highest<br />early score</span></div>
            <div>
              <p className="method"><b>What is a Ledger score?</b><br />We convert published ratings to a common 0–100 scale. During the opening week, a show can enter with one professional 2026 review; its review count stays visible.</p>
              <button className="textButton" onClick={() => setMethodOpen(!methodOpen)} aria-expanded={methodOpen}>{methodOpen ? "Hide methodology" : "Read the methodology"} →</button>
            </div>
          </aside>
        </section>

        {methodOpen && (
          <section className="methodPanel" aria-label="Scoring methodology">
            <div><b>01 · Normalise</b><p>Stars, grades and percentage scores become a common 0–100 scale.</p></div>
            <div><b>02 · Verify</b><p>Only reviews of a production in the current 2026 programme qualify; previews and archive notices are excluded.</p></div>
            <div><b>03 · Combine</b><p>Multiple reviews are averaged, with the number of contributing notices shown beside every score.</p></div>
            <div><b>04 · Update</b><p>Scores recalculate as new criticism appears, with every contributing source retained.</p></div>
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
                  <span className="ticket"><b>{show.venue}</b><small>{show.time} · current 2026 run</small>{show.tag && <em>{show.tag}</em>}</span>
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

        <section className="sourceDirectory" aria-labelledby="source-heading">
          <div>
            <span className="kicker">Coverage desk</span>
            <h2 id="source-heading">Publications monitored hourly</h2>
            <p>New 2026 Fringe reviews are checked, matched to the correct production and deduplicated before they affect a score. Crowd ratings and aggregation sites are used for discovery only.</p>
          </div>
          <div className="sourceTags">
            {monitoredSources.map((source) => <span key={source}>{source}</span>)}
          </div>
        </section>

        <section className="bottomGrid" id="prototype-note">
          <p className="editorialNote"><b>Editorial note.</b> Scores are an informed consensus, not a substitute for criticism. Every listing links to its contributing reviews so readers can follow the argument, discover unfamiliar publications and make up their own minds.</p>
          <div className="newsletter"><b>The Ledger, every lunchtime.</b><span>A concise email with the day’s biggest movers, new five-star notices and last-minute tickets.</span><button onClick={() => alert("Newsletter signup will connect in the next version.")}>Join free →</button></div>
        </section>
      </main>
      <footer className="siteFooter"><span>FRINGE LEDGER.</span><span>Independent · Transparent · Edinburgh</span><span>© 2026</span></footer>
    </>
  );
}
