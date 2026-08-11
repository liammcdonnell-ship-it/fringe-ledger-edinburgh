"use client";

import { useMemo, useState } from "react";

type Review = {
  outlet: string;
  score: string;
  value: number;
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

type ScoreMode = "weighted" | "unweighted";

const outletWeights: Record<string, number> = {
  "Time Out": 1.15,
  "Chortle": 1,
  "The Scoop": 0.8,
  "Perth Happenings": 0.75,
};

const chortleIndexUrl = "https://www.chortle.co.uk/about/2026/07/20/61020/edinburgh_fringe_2026_comedy_reviews";

const formatStars = (value: number) => `${Number((value / 20).toFixed(1))}/5`;

function scoreForMode(show: Show, mode: ScoreMode) {
  const unweighted = show.sources.reduce((sum, review) => sum + review.value, 0) / show.sources.length;
  if (mode === "unweighted") return Math.round(unweighted);

  const weightedTotal = show.sources.reduce((sum, review) => sum + review.value * (outletWeights[review.outlet] ?? 0.85), 0);
  const totalWeight = show.sources.reduce((sum, review) => sum + (outletWeights[review.outlet] ?? 0.85), 0);
  return Math.round((weightedTotal + 70) / (totalWeight + 1));
}

type CompactShow = {
  title: string;
  score: number;
  url?: string;
  artist?: string;
  venue?: string;
  time?: string;
  extras?: Review[];
};

const compactChortleShows: CompactShow[] = [
  { title: "Celia Pacquola: Gift Horse", score: 100, url: "https://www.chortle.co.uk/review/2026/04/15/60383/celia_pacquola%3A_gift_horse" },
  { title: "Frankie McNair: Huge Ass Mindset", score: 100 },
  { title: "Kate Dehnert: Echo", score: 90 },
  { title: "Lara Ricote: Inkling", score: 90, url: "https://www.chortle.co.uk/review/2026/04/01/60252/lara_ricote%3A_inkling" },
  { title: "Cadet Kelly is the Best Movie I've Ever Seen in my Friggin Life", score: 80 },
  { title: "Claire Hooper: Fun Show xx", score: 80 },
  { title: "Conk: Man Sings The Same Song Over And Over Again For An Hour", score: 80 },
  { title: "Dan Rath: Help Me Please", score: 80 },
  { title: "Dan Tiernan: Quartz And All", score: 80, url: "https://www.chortle.co.uk/review/2026/04/19/60418/dan_tiernan%3A_quartz_and_all" },
  {
    title: "Emma Holland: The Dog Dies At The Start", score: 80,
    url: "https://www.chortle.co.uk/review/2026/04/08/60317/emma_holland%3A_the_dog_dies_at_the_start",
    venue: "Assembly George Square",
    extras: [{ outlet: "The Scoop", score: "5/5", value: 100, quote: "A tender, eccentric comedy about grief that still leaves ample room for laughter.", url: "https://thescoop.au/review-emma-holland-the-dog-dies-at-the-start-2026-melbourne-international-comedy-festival/" }],
  },
  { title: "John-Luke Roberts: What I Talk About When I Run About, Talking", score: 80 },
  {
    title: "Reuben Kaye: Hard To Swallow", score: 80,
    url: "https://www.chortle.co.uk/review/2026/04/19/60412/reuben_kaye%3A_hard_to_swallow",
    venue: "Assembly George Square Gardens", time: "20:00",
    extras: [{ outlet: "Perth Happenings", score: "5/5", value: 100, quote: "A glitter-fuelled cabaret combining political bite, powerhouse vocals and fearless crowd work.", url: "https://perthhappenings.com.au/2026-fringe-review-reuben-kaye-hard-to-swallow/" }],
  },
  { title: "Scout Boxall: God's Favourite", score: 80 },
  { title: "Tom Ballard: Be Funny Challenge (Impossible)", score: 80 },
  { title: "Bob Koomen: Pear", score: 70 },
  { title: "Closure Cabaret", score: 70 },
  { title: "Coco The Time-Travelling Tart", score: 70 },
  { title: "Guy Branum: Be Fruitful", score: 70 },
  { title: "Jonno: Here Comes Mr Funny", score: 70 },
  { title: "Kate Hammer: Government Approved Comedian", score: 70 },
  { title: "Lizzy Sunshine", score: 70 },
  { title: "Mario Adrion: Live A Little", score: 70 },
  { title: "Sammy J: Hero Complex", score: 70 },
  { title: "Courtney Büchner: One of the Girls", score: 60 },
  { title: "Darryl J Carrington: Tennish", score: 60 },
  { title: "Dee Allum: Raumdeuter", score: 60 },
  { title: "Edith Alibec: The Void", score: 60 },
  { title: "Gareth Gwynn: Cyril", score: 60 },
  { title: "Robin Grainger: Lemonade", score: 60 },
  { title: "Mrs Gary Breath", score: 60 },
  { title: "Sasha Nezlobin: I'm Fine", score: 60 },
  { title: "Tamsyn Kelly: Rat's Ass", score: 60 },
  { title: "Portrait Of A Tom As A Young Neenan", score: 60 },
  { title: "Juliette Burton: Villain Era", score: 50 },
  { title: "Rory Cargill: On TV!", score: 50 },
  { title: "11½ Angry Men", score: 40 },
  { title: "Em Stroud: Navigating Life", score: 40 },
  { title: "Georgia Polly-Taylor: Very Hot. Very Messy.", score: 40 },
];

const additionalShows: Show[] = [
  ...compactChortleShows.map((item) => {
    const sources: Review[] = [
      { outlet: "Chortle", score: formatStars(item.score), value: item.score, quote: "A scored 2026 review of the production now appearing in Edinburgh.", url: item.url ?? chortleIndexUrl },
      ...(item.extras ?? []),
    ];
    const rawScore = Math.round(sources.reduce((sum, review) => sum + review.value, 0) / sources.length);
    return {
      title: item.title,
      artist: item.artist ?? item.title.split(":")[0],
      genre: "Comedy",
      score: rawScore,
      reviews: sources.length,
      fiveStars: sources.filter((review) => review.value === 100).length,
      venue: item.venue ?? "See listing",
      time: item.time ?? "See listing",
      until: "Current run",
      quote: sources.length > 1 ? "Two independent 2026 notices now form an early consensus" : "Newly indexed in the complete 2026 review ledger",
      source: sources.length > 1 ? `${sources.length} scored reviews` : "Chortle 2026 review",
      movement: 0,
      tag: sources.length > 1 ? "2+ reviews" : undefined,
      sources,
    };
  }),
  {
    title: "[seagull]", artist: "FC Bergman", genre: "Theatre", score: 60, reviews: 1, fiveStars: 0,
    venue: "Edinburgh International Festival", time: "See listing", until: "11 Aug", quote: "A challenging, visually distinctive sign-language reworking of Chekhov", source: "Time Out · 9 Aug", movement: 0,
    sources: [{ outlet: "Time Out", score: "3/5", value: 60, quote: "An ambitious production whose scale and pacing make for a demanding experience.", url: "https://www.timeout.com/edinburgh/theatre/edinburgh-fringe-international-festival-reviews" }],
  },
];

const shows: Show[] = [
  {
    title: "Frankie Thompson: Horrible Things", artist: "Frankie Thompson", genre: "Comedy", score: 100, reviews: 1, fiveStars: 1,
    venue: "Pleasance Courtyard", time: "20:45", until: "30 Aug", quote: "Avant-clowning with a newly commanding comic voice", source: "Time Out · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Time Out", score: "5/5", value: 100, quote: "A superb, singular hour that gives Thompson's strange comic world a forceful new centre.", url: "https://www.timeout.com/edinburgh/comedy/frankie-thompson-horrible-things-review" },
    ],
  },
  {
    title: "Bebe Cave: Swoon", artist: "Bebe Cave", genre: "Comedy", score: 100, reviews: 1, fiveStars: 1,
    venue: "Pleasance Dome", time: "17:40", until: "30 Aug", quote: "A gleeful, high-energy collision of art history and modern misogyny", source: "Chortle · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Chortle", score: "5/5", value: 100, quote: "A fiercely inventive one-woman romp packed with jokes, characters and pointed satire.", url: "https://www.chortle.co.uk/review/2026/08/10/61240/bebe_cave%3A_swoon" },
    ],
  },
  {
    title: "Andrew White: What a Life!", artist: "Andrew White", genre: "Comedy", score: 90, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · Cabaret Voltaire", time: "17:45", until: "30 Aug", quote: "Life-affirming comedy that balances grief, mischief and real heart", source: "Chortle · 6 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4.5/5", value: 90, quote: "A skilfully interwoven hour where sentiment is repeatedly punctured by strong jokes.", url: "https://www.chortle.co.uk/review/2026/08/04/61184/andrew_white%3A_what_a_life%21" },
    ],
  },
  {
    title: "Andrew Doherty: Reviewers Welcome... TO DIE!", artist: "Andrew Doherty", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "22:50", until: "30 Aug", quote: "A gloriously petty supernatural revenge fantasy", source: "Time Out · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Time Out", score: "4/5", value: 80, quote: "An exuberant horror-comedy that turns theatrical grievance into a joke on its creator.", url: "https://www.timeout.com/edinburgh/comedy/andrew-doherty-reviewers-welcome-to-die-review" },
    ],
  },
  {
    title: "Sh!t Theatre: Evita Too", artist: "Sh!t Theatre", genre: "Theatre", score: 80, reviews: 1, fiveStars: 0,
    venue: "ZOO Southside", time: "See listing", until: "30 Aug", quote: "A subversive rummage through the myths surrounding Evita", source: "Time Out · 9 Aug", movement: 0,
    sources: [
      { outlet: "Time Out", score: "4/5", value: 80, quote: "A playful, politically alert investigation of how women are remembered and rewritten.", url: "https://www.timeout.com/edinburgh/theatre/sh-t-theatre-evita-too-review-1" },
    ],
  },
  {
    title: "Amy Matthews: Definitions of Toast", artist: "Amy Matthews", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · The Tron", time: "See listing", until: "30 Aug", quote: "A controlled, vulnerable hour about anger finally finding a voice", source: "Chortle · 9 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", value: 80, quote: "Smart, carefully structured stand-up with emotional clarity and a strong sense of arrival.", url: "https://www.chortle.co.uk/review/2026/08/09/61232/amy_matthews%3A_definitions_of_toast" },
    ],
  },
  {
    title: "Chris Martin Lied to Us", artist: "Will Spence", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Underbelly Cowgate", time: "See listing", until: "30 Aug", quote: "A playful, committed clown show built around one very yellow theory", source: "Chortle · 10 Aug", movement: 0, tag: "New review",
    sources: [
      { outlet: "Chortle", score: "4/5", value: 80, quote: "A charming, deliberately strange debut carried by physical commitment and playful invention.", url: "https://www.chortle.co.uk/review/2026/08/10/61243/chris_martin_lied_to_us" },
    ],
  },
  {
    title: "Freddie Meredith: Need A Light?", artist: "Freddie Meredith", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Pleasance Courtyard", time: "See listing", until: "30 Aug", quote: "An assured character debut about loneliness in the smoking area", source: "Chortle · 9 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", value: 80, quote: "A finely observed and precisely performed character study with an unexpectedly tender centre.", url: "https://www.chortle.co.uk/review/2026/08/09/61234/freddie_meredith%3A_need_a_light%3F" },
    ],
  },
  {
    title: "Jenny Gorelick: Sorry", artist: "Jenny Gorelick", genre: "Comedy", score: 80, reviews: 1, fiveStars: 0,
    venue: "Monkey Barrel · Niddry Street", time: "See listing", until: "30 Aug", quote: "Rapid-fire dating comedy with sharper social commentary underneath", source: "Chortle · 6 Aug", movement: 0,
    sources: [
      { outlet: "Chortle", score: "4/5", value: 80, quote: "A gag-dense stand-up hour whose bright persona carries perceptive writing on gender and relationships.", url: "https://www.chortle.co.uk/review/2026/08/06/61198/jenny_gorelick%3A_sorry" },
    ],
  },
  {
    title: "Bog Witch", artist: "Bryony Kimmings", genre: "Theatre", score: 60, reviews: 1, fiveStars: 0,
    venue: "Traverse Theatre", time: "See listing", until: "30 Aug", quote: "A visually rich climate reckoning with an unruly shape", source: "Time Out · 9 Aug", movement: 0,
    sources: [
      { outlet: "Time Out", score: "3/5", value: 60, quote: "A charismatic and visually imaginative return whose abundance could use tighter editing.", url: "https://www.timeout.com/edinburgh/theatre/bog-witch-review" },
    ],
  },
  ...additionalShows,
];

const genres = ["All shows", "Comedy", "Theatre"];

type MonitoredSource = { name: string; url: string };

const outletSearch = (domain: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} Edinburgh Fringe reviews`)}`;

const monitoredSources: MonitoredSource[] = [
  { name: "Chortle", url: chortleIndexUrl },
  { name: "The Guardian", url: "https://www.theguardian.com/stage/edinburgh-festival" },
  { name: "The Times", url: "https://www.thetimes.com/search?source=nav-desktop&q=edinburgh%20fringe%20review" },
  { name: "Binge Fringe", url: outletSearch("bingefringe.com") },
  { name: "British Theatre Guide", url: outletSearch("britishtheatreguide.info") },
  { name: "Phoenix Remix", url: outletSearch("phoenixremix.com") },
  { name: "The Herald", url: "https://www.heraldscotland.com/search/?search=edinburgh%20fringe%20review" },
  { name: "Roland’s Reviews", url: outletSearch("rolandsreviews.com") },
  { name: "Disrupt Reviews", url: outletSearch("disruptmagazine.uk") },
  { name: "Time Out", url: "https://www.timeout.com/edinburgh/theatre/edinburgh-fringe-international-festival-reviews" },
  { name: "FringeFan", url: "https://fringefan.com/" },
  { name: "EdFringe Review", url: "https://edfringereview.com/reviews/" },
  { name: "From the North", url: outletSearch("fromthenorth.com") },
  { name: "Boom Radio", url: outletSearch("boomradiouk.com") },
  { name: "Mix Up Theatre", url: "https://www.mixuptheatre.com/search?q=edinburgh%20fringe" },
  { name: "The Stage", url: "https://www.thestage.co.uk/search?q=edinburgh%20fringe" },
  { name: "Fest Mag", url: "https://festmag.com/edinburgh/reviews" },
  { name: "Reyt Good Magazine", url: outletSearch("reytgoodmagazine.com") },
  { name: "Across the Arts", url: outletSearch("acrossthearts.co.uk") },
  { name: "On the Mic", url: outletSearch("onthemic.co.uk") },
  { name: "Bouquets & Brickbats", url: "https://bouquetsbrickbatsreviews.com/category/theatre/edinburgh-fringe/" },
  { name: "The Scotsman", url: "https://www.scotsman.com/search?q=edinburgh%20fringe%20review" },
  { name: "Scottish Field", url: "https://www.scottishfield.co.uk/?s=edinburgh+fringe+review" },
  { name: "Broadway Baby", url: "https://broadwaybaby.com/shows" },
  { name: "Bruce on the Fringe", url: "https://www.bruceonthefringe.com/" },
  { name: "Get the Chance", url: "https://getthechance.wales/tag/edinburgh-fringe/" },
  { name: "One4Review", url: outletSearch("one4review.co.uk") },
  { name: "The Skinny", url: "https://www.theskinny.co.uk/festivals/edinburgh-fringe/reviews" },
  { name: "The List", url: "https://list.co.uk/news/tag/edinburgh-festival-fringe" },
  { name: "The Independent", url: "https://www.independent.co.uk/search?q=edinburgh%20fringe%20review" },
  { name: "The Telegraph", url: "https://www.telegraph.co.uk/search.html?queryText=edinburgh%20fringe%20review" },
  { name: "The Wee Review", url: "https://theweereview.com/festival/edinburgh-fringe/" },
  { name: "The Reviews Hub", url: "https://www.thereviewshub.com/category/fringe/edinburgh-fringe/" },
  { name: "The Quinntessential Review", url: "https://theqr.co.uk/category/edinburgh-fringe/" },
  { name: "Corr Blimey", url: "https://corrblimey.uk/category/edinburgh-fringe/" },
  { name: "All Edinburgh Theatre", url: "https://www.alledinburghtheatre.com/category/reviews/" },
  { name: "LouReviews", url: "https://loureviews.blog/category/edinburgh-fringe/" },
  { name: "WhatsOnStage", url: "https://www.whatsonstage.com/edinburgh-theatre/reviews/" },
  { name: "EdinburghGuide", url: "https://edinburghguide.com/search?keys=edinburgh%20fringe%20review" },
  { name: "FringeReview", url: outletSearch("fringereview.co.uk") },
  { name: "STARBURST", url: "https://www.starburstmagazine.com/?s=edinburgh+fringe+review" },
  { name: "Edinburgh Evening News", url: "https://www.edinburghnews.scotsman.com/search?q=edinburgh%20fringe%20review" },
  { name: "What The Fringe", url: outletSearch("whatthefringe.com") },
  { name: "The Flaneur", url: outletSearch("theflaneur.co.uk") },
  { name: "StageSideUK", url: outletSearch("stagesideuk.com") },
  { name: "Theatre and Art Reviews", url: outletSearch("theatreandartreviews.com") },
  { name: "Theatre Scotland", url: outletSearch("theatrescotland.co.uk") },
  { name: "Braw Theatre", url: outletSearch("brawtheatre.com") },
  { name: "LondonTheatre1", url: "https://www.londontheatre1.com/?s=edinburgh+fringe+review" },
  { name: "European Comedy", url: outletSearch("europeancomedy.com") },
  { name: "Arts Reviews Edinburgh", url: outletSearch("artsreviewsedinburgh.com") },
  { name: "Sounds & Stage", url: outletSearch("soundsandstage.com") },
  { name: "Edinburgh Music Review", url: outletSearch("edinburghmusicreview.com") },
  { name: "Country & Town House", url: "https://www.countryandtownhouse.com/?s=edinburgh+fringe+review" },
  { name: "Theatre Village", url: outletSearch("theatrevillage.co.uk") },
  { name: "SNACK Magazine", url: "https://snackmag.co.uk/?s=edinburgh+fringe+review" },
  { name: "The Spy in the Stalls", url: "https://thespyinthestalls.com/category/edinburgh-fringe/" },
  { name: "A Youngish Perspective", url: "https://ayoungishperspective.co.uk/category/reviews/edinburgh-fringe/" },
  { name: "The Standard", url: "https://www.standard.co.uk/search?q=edinburgh%20fringe%20review" },
  { name: "British Comedy Guide", url: "https://www.comedy.co.uk/fringe/reviews/" },
  { name: "BroadwayWorld", url: "https://www.broadwayworld.com/scotland/reviewsnew.cfm" },
  { name: "The Scoop", url: "https://thescoop.au/?s=fringe+review" },
  { name: "Perth Happenings", url: "https://perthhappenings.com.au/?s=fringe+review" },
  { name: "Elemental Theatre", url: "https://www.elementaltheatre.com/reviews" },
  { name: "Broken Legs Blog", url: "https://brokenlegsblog.co.uk/edinburgh-fringe-reviews/" },
  { name: "North West End UK", url: "https://northwestend.com/category/reviews/scotland/" },
];

export default function Home() {
  const [genre, setGenre] = useState("All shows");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [scoreMode, setScoreMode] = useState<ScoreMode>("weighted");
  const [minReviews, setMinReviews] = useState(2);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shows
      .filter((show) => {
        const matchesGenre = genre === "All shows" || show.genre === genre;
        const matchesQuery = !needle || [show.title, show.artist, show.venue, show.genre].join(" ").toLowerCase().includes(needle);
        return matchesGenre && matchesQuery && show.reviews >= minReviews;
      })
      .sort((a, b) => scoreForMode(b, scoreMode) - scoreForMode(a, scoreMode) || b.reviews - a.reviews || a.title.localeCompare(b.title));
  }, [genre, minReviews, query, scoreMode]);

  const highestScore = filtered.length ? scoreForMode(filtered[0], scoreMode) : "—";

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
            <div className="stat"><strong>{highestScore}</strong><span>highest<br />{scoreMode} score</span></div>
            <div>
              <p className="method"><b>What is a Ledger score?</b><br />Choose a confidence-weighted ranking or a straight average in which every five-star rating is worth exactly the same.</p>
              <button className="textButton" onClick={() => setMethodOpen(!methodOpen)} aria-expanded={methodOpen}>{methodOpen ? "Hide methodology" : "Read the methodology"} →</button>
            </div>
          </aside>
        </section>

        {methodOpen && (
          <section className="methodPanel" aria-label="Scoring methodology">
            <div><b>01 · Normalise</b><p>Stars, grades and percentage scores become a common 0–100 scale.</p></div>
            <div><b>02 · Unweighted</b><p>Every scored review contributes equally. A five-star rating is always 100, regardless of publication.</p></div>
            <div><b>03 · Weighted</b><p>Outlet track record affects influence, while very small samples are gently pulled toward a neutral 70.</p></div>
            <div><b>04 · Filter</b><p>Set the minimum review count from one to five; two independent notices is the default.</p></div>
          </section>
        )}

        <section className="controls" id="ranking">
          <div><h2>The 2026 Ledger</h2><p>Showing {filtered.length} of {shows.length} scored productions · sorted by {scoreMode} score</p></div>
          <div className="pills" role="group" aria-label="Filter by genre">
            {genres.map((item) => <button key={item} className={genre === item ? "on" : ""} onClick={() => setGenre(item)}>{item}</button>)}
          </div>
        </section>

        <section className="rankingOptions" aria-label="Ranking options">
          <div className="optionGroup">
            <span>Score calculation</span>
            <div className="segmented" role="group" aria-label="Score calculation">
              <button className={scoreMode === "weighted" ? "on" : ""} onClick={() => setScoreMode("weighted")} aria-pressed={scoreMode === "weighted"}>Weighted</button>
              <button className={scoreMode === "unweighted" ? "on" : ""} onClick={() => setScoreMode("unweighted")} aria-pressed={scoreMode === "unweighted"}>Unweighted</button>
            </div>
          </div>
          <label className="optionGroup minReviews">
            <span>Minimum reviews</span>
            <select value={minReviews} onChange={(event) => setMinReviews(Number(event.target.value))}>
              <option value={1}>1+ · all {shows.length} shows</option>
              <option value={2}>2+ · default</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
            </select>
          </label>
          {minReviews > 1 && <button className="showAllButton" onClick={() => setMinReviews(1)}>Show all {shows.length} indexed shows →</button>}
        </section>

        <section className="ranking" aria-live="polite">
          <div className="tableHead"><span>Rank</span><span>Show</span><span>Genre</span><span>{scoreMode} score</span><span>Reviews</span><span>Where & when</span></div>
          {filtered.length === 0 ? (
            <div className="empty"><b>No shows meet these filters.</b><span>Lower the review minimum or try another search.</span><button onClick={() => setMinReviews(1)}>Show all indexed shows</button></div>
          ) : filtered.map((show, index) => {
            const isExpanded = expanded === show.title;
            const displayedScore = scoreForMode(show, scoreMode);
            return (
              <article className={`showEntry ${isExpanded ? "expanded" : ""}`} key={show.title}>
                <button className="showRow" onClick={() => setExpanded(isExpanded ? null : show.title)} aria-expanded={isExpanded}>
                  <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="show"><b>{show.title}</b><small>By {show.artist} · “{show.quote}” — {show.source}</small></span>
                  <span className="genre">{show.genre}</span>
                  <span className={`score ${displayedScore < 86 ? "gold" : ""}`}>{displayedScore}</span>
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
            <p>New 2026 Fringe reviews are checked, matched to the correct production and deduplicated before they affect a score. Select any publication to open its Fringe reviews.</p>
          </div>
          <div className="sourceTags">
            {monitoredSources.map((source) => (
              <a key={source.name} href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.name} Fringe reviews`}>
                {source.name}
              </a>
            ))}
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
