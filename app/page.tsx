"use client";

import { useMemo, useState } from "react";

type Review = {
  outlet: string;
  score: string;
  quote: string;
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
    title: "A History of Paper",
    artist: "Oliver Emanuel & Gareth Williams",
    genre: "Musical theatre",
    score: 91,
    reviews: 9,
    fiveStars: 7,
    venue: "Traverse Theatre",
    time: "14:15",
    until: "24 Aug",
    quote: "Quietly devastating",
    source: "The Scotsman",
    movement: 0,
    tag: "Tickets limited",
    sources: [
      { outlet: "The Scotsman", score: "5/5", quote: "A miniature epic with an enormous heart." },
      { outlet: "The Stage", score: "5/5", quote: "Delicate, assured and beautifully performed." },
      { outlet: "Fest", score: "4/5", quote: "A tender musical act of remembrance." },
    ],
  },
  {
    title: "Baby Doomer",
    artist: "Hannah Platt",
    genre: "Comedy",
    score: 89,
    reviews: 12,
    fiveStars: 8,
    venue: "Monkey Barrel 2",
    time: "19:40",
    until: "25 Aug",
    quote: "Bleak, bold and horribly funny",
    source: "Chortle",
    movement: 2,
    tag: "Selling fast",
    sources: [
      { outlet: "Chortle", score: "5/5", quote: "Pin-sharp writing with a fearless final turn." },
      { outlet: "The Guardian", score: "4/5", quote: "A compellingly sour comic voice." },
      { outlet: "Broadway Baby", score: "5/5", quote: "An hour that keeps tightening the screw." },
    ],
  },
  {
    title: "Weather Girl",
    artist: "Brian Watkins",
    genre: "Theatre",
    score: 87,
    reviews: 7,
    fiveStars: 4,
    venue: "Summerhall",
    time: "17:45",
    until: "24 Aug",
    quote: "A scorched-earth performance",
    source: "The Stage",
    movement: -1,
    sources: [
      { outlet: "The Stage", score: "5/5", quote: "Urgent, ferocious and darkly funny." },
      { outlet: "The List", score: "4/5", quote: "A climate drama with real atmospheric pressure." },
      { outlet: "Fest", score: "4/5", quote: "An electrifying central performance." },
    ],
  },
  {
    title: "Buffy Revamped",
    artist: "Brendan Murphy",
    genre: "Comedy",
    score: 85,
    reviews: 16,
    fiveStars: 7,
    venue: "Pleasance Dome",
    time: "20:30",
    until: "25 Aug",
    quote: "A fanboy tour de force",
    source: "Broadway Baby",
    movement: 1,
    sources: [
      { outlet: "Broadway Baby", score: "5/5", quote: "Fast, fond and phenomenally committed." },
      { outlet: "Chortle", score: "4/5", quote: "A cult hit with sharpened comic teeth." },
      { outlet: "The Skinny", score: "4/5", quote: "Inventive parody made with genuine affection." },
    ],
  },
  {
    title: "Instructions",
    artist: "SUBJECT OBJECT",
    genre: "Experimental",
    score: 84,
    reviews: 6,
    fiveStars: 3,
    venue: "Summerhall TechCube",
    time: "12:05",
    until: "24 Aug",
    quote: "Formally daring, deeply human",
    source: "Fest",
    movement: 3,
    sources: [
      { outlet: "Fest", score: "5/5", quote: "A playful experiment that lands emotionally." },
      { outlet: "The Scotsman", score: "4/5", quote: "The audience becomes part of the argument." },
      { outlet: "Exeunt", score: "4/5", quote: "Unusually generous interactive theatre." },
    ],
  },
  {
    title: "Horses",
    artist: "Elf Lyons",
    genre: "Comedy",
    score: 83,
    reviews: 14,
    fiveStars: 5,
    venue: "Monkey Barrel 3",
    time: "16:50",
    until: "25 Aug",
    quote: "Clowning at its most magnificently strange",
    source: "The Guardian",
    movement: -2,
    sources: [
      { outlet: "The Guardian", score: "4/5", quote: "A gloriously unruly feat of clowning." },
      { outlet: "Chortle", score: "4/5", quote: "Absurd, athletic and unexpectedly moving." },
      { outlet: "The Telegraph", score: "4/5", quote: "A fearless performer at full gallop." },
    ],
  },
  {
    title: "The Bookbinder",
    artist: "Trick of the Light",
    genre: "Theatre",
    score: 81,
    reviews: 8,
    fiveStars: 3,
    venue: "Assembly Roxy",
    time: "15:20",
    until: "23 Aug",
    quote: "Storytelling with ink-black magic",
    source: "The List",
    movement: 4,
    sources: [
      { outlet: "The List", score: "5/5", quote: "A handmade marvel of light and shadow." },
      { outlet: "The Stage", score: "4/5", quote: "Simple stagecraft, exquisitely deployed." },
      { outlet: "The Skinny", score: "4/5", quote: "A beautifully bound gothic miniature." },
    ],
  },
  {
    title: "Night Dances",
    artist: "Emma Martin / United Fall",
    genre: "Dance",
    score: 79,
    reviews: 5,
    fiveStars: 2,
    venue: "Dance Base",
    time: "18:00",
    until: "22 Aug",
    quote: "Wild energy, rigorously contained",
    source: "The Skinny",
    movement: 1,
    sources: [
      { outlet: "The Skinny", score: "5/5", quote: "A thunderous encounter with movement and sound." },
      { outlet: "Fest", score: "4/5", quote: "Precise, propulsive and gloriously loud." },
      { outlet: "The Scotsman", score: "3/5", quote: "An exhilarating, if uneven, late-night rush." },
    ],
  },
];

const genres = ["All shows", "Comedy", "Theatre", "Musical theatre", "Dance", "Experimental"];

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
          <div className="edition editionRight">1,842 reviews indexed<br />Across 63 publications</div>
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
            <p className="summary">From a blistering one-woman epic to an hour of exquisitely engineered nonsense, these are the shows Edinburgh’s critics agree deserve your attention. Scores update whenever a verified review lands.</p>
            <p className="demoNote">First-version prototype · review data shown here is illustrative.</p>
          </div>
          <aside className="standfirst" id="method">
            <div className="stat"><strong>91</strong><span>highest<br />Ledger score</span></div>
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
            <div><b>03 · Qualify</b><p>A show needs three independent published reviews before entering the Ledger.</p></div>
            <div><b>04 · Update</b><p>Scores recalculate as new criticism appears, with every source retained.</p></div>
          </section>
        )}

        <section className="controls" id="ranking">
          <div><h2>The Ledger 50</h2><p>Showing {filtered.length} of {shows.length} demo shows · minimum 3 reviews</p></div>
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
                    <div className="sourceIntro"><span>Source reviews</span><p>Three of {show.reviews} indexed reviews</p></div>
                    {show.sources.map((review) => <div className="sourceReview" key={review.outlet}><div><b>{review.outlet}</b><strong>{review.score}</strong></div><p>“{review.quote}”</p><a href="#prototype-note" onClick={(event) => event.preventDefault()}>Read review ↗</a></div>)}
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
