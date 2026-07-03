# Reel Ritual

Reel Ritual is a movie discovery app built with React and Vite. It uses the OMDb API for live search, keeps a local ritual watchlist, and avoids the standard "generic streaming clone" look by leaning into an editorial cinema direction instead: paper-toned backgrounds, serif display typography, a film-strip rail, and asymmetric content shelves.

## What it does

- Searches OMDb live when you add your API key
- Falls back to a curated in-app shelf so the interface is still usable without secrets
- Lets you filter by genre, year, format, and mood
- Keeps a local watchlist in the right rail
- Includes a surprise picker for quick discovery

## Stack

- React 19
- Vite 7
- Plain CSS with design tokens in `src/styles.css`
- OMDb API

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your OMDb key:

```bash
VITE_OMDB_API_KEY=your_key_here
VITE_BASE_PATH=/
```

3. Start the dev server:

```bash
npm run dev
```

If you do not have a key yet, the app still loads with curated sample titles. You can also paste a key directly into the UI and it will be stored in local storage for later sessions.

## Deployment

Vercel works with the default root base path, and this repo now uses:

```bash
VITE_BASE_PATH=/
```

That is already the default. If you later deploy this same app to a GitHub Pages project site, build it with:

```bash
VITE_BASE_PATH=/movie_mulearn/
```

Production build:

```bash
npm run build
```

For Vercel, the framework can stay as `Vite` and the output directory is `dist`. Add `VITE_OMDB_API_KEY` in the Vercel project environment variables if you want live search in production instead of curated fallback only.

## Design notes

This app deliberately avoids default tech-product styling. The layout is built around three ideas:

- a cinema-zine left rail instead of a normal dashboard sidebar
- a serif-led hero with a strong editorial headline instead of a generic app masthead
- warm cream, burnt orange, and deep teal tokens instead of the usual purple gradient formula

## OMDb

Create a free OMDb key here: https://www.omdbapi.com/apikey.aspx
