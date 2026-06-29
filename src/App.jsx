import { useEffect, useMemo, useState, useDeferredValue, startTransition } from "react";
import { curatedMovies, moodOptions, surprisePool } from "./data";

const OMDB_BASE_URL = "https://www.omdbapi.com/";
const fallbackApiKey = "";

const filters = [
  { key: "genre", label: "Genre" },
  { key: "year", label: "Year" },
  { key: "type", label: "Format" },
  { key: "mood", label: "Mood" },
];

const quote = {
  body: "Cinema is a matter of what's in the frame and what's out.",
  author: "Martin Scorsese",
};

function App() {
  const [query, setQuery] = useState("Inception");
  const deferredQuery = useDeferredValue(query);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("reel-ritual-omdb-key") || import.meta.env.VITE_OMDB_API_KEY || fallbackApiKey,
  );
  const [library, setLibrary] = useState(curatedMovies);
  const [activeMovie, setActiveMovie] = useState(curatedMovies[0]);
  const [watchlist, setWatchlist] = useState(curatedMovies.slice(6, 11));
  const [selectedMood, setSelectedMood] = useState("Think deeper");
  const [selectedFilters, setSelectedFilters] = useState({
    genre: "Any",
    year: "Any",
    type: "movie",
    mood: "Think deeper",
  });
  const [status, setStatus] = useState("Showing curated picks while you set your OMDb key.");

  useEffect(() => {
    localStorage.setItem("reel-ritual-omdb-key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || deferredQuery.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setStatus(`Searching OMDb for "${deferredQuery.trim()}"...`);

      try {
        const searchResponse = await fetch(
          `${OMDB_BASE_URL}?apikey=${apiKey}&s=${encodeURIComponent(deferredQuery.trim())}&type=${selectedFilters.type}`,
          { signal: controller.signal },
        );
        const searchData = await searchResponse.json();

        if (searchData.Response !== "True") {
          throw new Error(searchData.Error || "No results found.");
        }

        const detailResults = await Promise.all(
          searchData.Search.slice(0, 6).map(async (movie) => {
            const detailResponse = await fetch(
              `${OMDB_BASE_URL}?apikey=${apiKey}&i=${movie.imdbID}&plot=short`,
              { signal: controller.signal },
            );
            const detailData = await detailResponse.json();
            return {
              ...detailData,
              mood: inferMood(detailData),
            };
          }),
        );

        startTransition(() => {
          setLibrary(detailResults);
          setActiveMovie(detailResults[0]);
          setStatus(`Pulled ${detailResults.length} live results from OMDb.`);
        });
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setStatus(error.message === "Invalid API key!"
          ? "OMDb rejected that API key. Paste a valid key to unlock live search."
          : `${error.message} Falling back to the curated shelf.`);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [apiKey, deferredQuery, selectedFilters.type]);

  const visibleMovies = useMemo(() => {
    return library.filter((movie) => {
      if (selectedFilters.genre !== "Any" && !movie.Genre?.toLowerCase().includes(selectedFilters.genre.toLowerCase())) {
        return false;
      }

      if (selectedFilters.year !== "Any" && movie.Year !== selectedFilters.year) {
        return false;
      }

      if (selectedFilters.mood !== "Any") {
        const movieMood = (movie.mood || "").toLowerCase();
        const selectedMoodValue = selectedFilters.mood.toLowerCase();
        if (!movieMood.includes(selectedMoodValue) && !selectedMoodValue.includes(movieMood)) {
          return false;
        }
      }

      return true;
    });
  }, [library, selectedFilters]);

  const years = Array.from(new Set(curatedMovies.map((movie) => movie.Year))).sort((a, b) => Number(b) - Number(a));
  const genres = ["Any", "Drama", "Sci-Fi", "Mystery", "Thriller", "Romance", "Animation"];

  function toggleWatchlist(movie) {
    setWatchlist((current) => {
      const exists = current.some((item) => item.imdbID === movie.imdbID);
      if (exists) {
        return current.filter((item) => item.imdbID !== movie.imdbID);
      }

      return [movie, ...current].slice(0, 8);
    });
  }

  function spinSurpriseMe() {
    const targetTitle = surprisePool[Math.floor(Math.random() * surprisePool.length)];
    setQuery(targetTitle);
    setStatus(`Rolled a surprise ritual: ${targetTitle}.`);
  }

  function applyMood(mood) {
    setSelectedMood(mood);
    setSelectedFilters((current) => ({ ...current, mood }));
  }

  return (
    <div className="app-shell">
      <aside className="brand-rail">
        <div className="brand-lockup">
          <span>Reel</span>
          <span>Ritual</span>
        </div>

        <div className="brand-illustration">
          <div className="brand-sun" />
          <div className="brand-figure" />
        </div>

        <nav className="rail-nav">
          {["Discover", "Mood board", "Watchlist", "Collections", "Rituals", "Actors", "Directors"].map((item, index) => (
            <button key={item} className={index === 0 ? "rail-link active" : "rail-link"}>
              {item}
            </button>
          ))}
        </nav>

        <div className="daily-ritual">
          <p className="kicker">Daily ritual</p>
          <p>Watch something that teaches you something new.</p>
        </div>
      </aside>

      <main className="content-area">
        <div className="film-strip" aria-hidden="true" />

        <section className="hero-copy">
          <div>
            <h1>
              Find a film for
              <br />
              the <em>mood</em> you are in
            </h1>
            <p>
              Search OMDb, keep a ritual watchlist, and browse recommendations that feel editorial instead of algorithmic.
            </p>
          </div>

          <blockquote className="hero-quote">
            <span className="quote-mark">"</span>
            <p>{quote.body}</p>
            <footer>{quote.author}</footer>
          </blockquote>
        </section>

        <section className="search-cluster">
          <div className="search-bar">
            <span className="search-icon">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, actor, director or keyword..."
            />
          </div>

          <button className="surprise-button" onClick={spinSurpriseMe}>
            Surprise me
          </button>
        </section>

        <section className="filters-row">
          <select value={selectedFilters.genre} onChange={(event) => setSelectedFilters((current) => ({ ...current, genre: event.target.value }))}>
            <option>Any</option>
            {genres.slice(1).map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>
          <select value={selectedFilters.year} onChange={(event) => setSelectedFilters((current) => ({ ...current, year: event.target.value }))}>
            <option>Any</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
          <select value={selectedFilters.type} onChange={(event) => setSelectedFilters((current) => ({ ...current, type: event.target.value }))}>
            <option value="movie">Movie</option>
            <option value="series">Series</option>
            <option value="episode">Episode</option>
          </select>
          <select value={selectedFilters.mood} onChange={(event) => applyMood(event.target.value)}>
            <option>Any</option>
            {moodOptions.map((mood) => (
              <option key={mood}>{mood}</option>
            ))}
          </select>
        </section>

        <section className="status-panel">
          <div>
            <span className="kicker">OMDb access</span>
            <p>{status}</p>
          </div>
          <label className="api-key-field">
            <span>API key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value.trim())}
              placeholder="Paste your OMDb key"
            />
          </label>
        </section>

        <section className="spotlight-panel">
          <div className="spotlight-copy">
            <span className="kicker">Featured spotlight</span>
            <h2>{activeMovie.Title}</h2>
            <div className="meta-row">
              <span>{activeMovie.Year}</span>
              <span>{activeMovie.Director}</span>
              <span>{activeMovie.Runtime}</span>
              <span>{activeMovie.imdbRating ? `IMDb ${activeMovie.imdbRating}` : "IMDb pending"}</span>
            </div>
            <p>{activeMovie.Plot}</p>
            <div className="spotlight-actions">
              <button className="primary-action" onClick={() => toggleWatchlist(activeMovie)}>
                {watchlist.some((movie) => movie.imdbID === activeMovie.imdbID) ? "Remove from ritual" : "Add to ritual"}
              </button>
              <button className="secondary-action" onClick={() => setQuery(activeMovie.Title)}>
                View details
              </button>
            </div>
          </div>

          <div className="spotlight-poster">
            <img src={getPoster(activeMovie)} alt={`${activeMovie.Title} poster`} />
          </div>
        </section>

        <section className="shelf-header">
          <h3>
            Because you watched <em>{activeMovie.Title}</em>
          </h3>
          <button className="ghost-action">See all</button>
        </section>

        <section className="movie-shelf">
          {visibleMovies.map((movie) => (
            <article
              key={movie.imdbID}
              className={`movie-card ${activeMovie.imdbID === movie.imdbID ? "selected" : ""}`}
              onClick={() => setActiveMovie(movie)}
            >
              <img src={getPoster(movie)} alt={`${movie.Title} poster`} />
              <div className="movie-card-copy">
                <h4>{movie.Title}</h4>
                <p>{movie.Year}</p>
                <span>{movie.imdbRating ? `★ ${movie.imdbRating}` : movie.mood}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="mood-section">
          <h3>Explore by mood</h3>
          <div className="mood-grid">
            {moodOptions.map((mood) => (
              <button
                key={mood}
                className={selectedMood === mood ? "mood-chip active" : "mood-chip"}
                onClick={() => applyMood(mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </section>
      </main>

      <aside className="watchlist-rail">
        <div className="watchlist-header">
          <h3>Your watchlist</h3>
          <span>{watchlist.length}</span>
        </div>

        <div className="watchlist-stack">
          {watchlist.map((movie) => (
            <article key={movie.imdbID} className="watchlist-item">
              <img src={getPoster(movie)} alt={`${movie.Title} poster`} />
              <div>
                <h4>{movie.Title}</h4>
                <p>{movie.Year}</p>
                <span>{movie.imdbRating ? `★ ${movie.imdbRating}` : movie.mood}</span>
              </div>
              <button onClick={() => toggleWatchlist(movie)} className="mini-action">
                •••
              </button>
            </article>
          ))}
        </div>

        <button className="watchlist-footer">View full watchlist</button>
      </aside>
    </div>
  );
}

function getPoster(movie) {
  if (movie.Poster && movie.Poster !== "N/A") {
    return movie.Poster;
  }

  return "https://placehold.co/300x450/f4e7d3/112528?text=No+Poster";
}

function inferMood(movie) {
  const descriptor = `${movie.Genre || ""} ${movie.Plot || ""}`.toLowerCase();

  if (descriptor.includes("romance") || descriptor.includes("love")) return "Heartfelt";
  if (descriptor.includes("thriller") || descriptor.includes("crime")) return "Edge of seat";
  if (descriptor.includes("animation") || descriptor.includes("fantasy")) return "Escape reality";
  if (descriptor.includes("mystery") || descriptor.includes("sci-fi")) return "Think deeper";
  if (descriptor.includes("comedy")) return "Feel good";
  return "Mind-bending";
}

export default App;
