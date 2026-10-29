# Flavory

Flavory is a browser-based personal cookbook in Indonesian. Find recipes by title, ingredient, category, or cooking time; write and edit personal recipes; scale servings; follow cooking steps with a timer; save favorites and notes; plan weekly meals; and build a shopping list.

## Features

- Search and filter daily recipes, personal recipes, and the Mustika Rasa collection.
- Write, edit, import, export, and delete personal recipes.
- Save favorites, cooking notes, ratings, meal plans, and shopping lists in browser storage.
- Scale recipe servings, follow step-by-step cooking mode, print recipes, or share recipe text.
- Use the ingredient finder to discover recipes from items in your kitchen.
- Browse a searchable transcription of the historical *Mustika Rasa* cookbook.

The active app has no account system or application database. Personal data stays in the browser's local storage and does not sync between devices. Export a backup before clearing site data or changing browsers. The app can keep up to 30 personal recipes, with up to 20 ingredients and 16 steps per recipe. Cooking timers only run while the page remains open.

## Mustika Rasa data

The catalog includes 1,642 indexed entries from *Mustika Rasa*, four starter recipes, and personal recipes. Historical spelling and units are preserved. The transcription may contain errors and an indexed entry may not be fully segmented into a recipe.

Static data is stored in `public/data/mustikarasa.json`. Its source copy and revision IDs are in `public/data/mustikarasa-source.json`. The app does not make a Wikisource request when browsing the collection. Update the data with `python3 scripts/import-mustikarasa.py`; this command requires network access and caches downloads in `/tmp/flavory-mustikarasa`.

The *Mustika Rasa* transcription is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution and source links are available in the book view. Sources: [Wikimedia Commons scan](https://commons.wikimedia.org/wiki/File:Mustikarasa.pdf) and [Wikisource transcription](https://id.wikisource.org/wiki/Indeks:Mustikarasa.pdf). The application code is licensed under MIT; see [LICENSE](LICENSE).

## Requirements

- PHP 8.5 recommended; PHP 8.4.1 or later is required by the locked development dependencies.
- Composer 2.
- Node.js 22.12+ or 24+.

## Run locally

```sh
composer install
npm ci
cp .env.example .env
php artisan key:generate
npm run build
php artisan serve --port=8001
```

Open <http://localhost:8001>. No database setup or migration is required. For frontend development, run `npm run dev` in a second terminal while the Laravel server is running.

## Docker

`Dockerfile` builds the frontend and packages a production image with FrankenPHP. Build and run it with:

```sh
docker build -t flavory .
docker run --rm -p 127.0.0.1:8080:8080 \
  -e APP_KEY="base64:$(openssl rand -base64 32)" \
  flavory
```

For deployment configuration, HTTPS, and backups, see [DEPLOYMENT.md](DEPLOYMENT.md). `Dockerfile.dev` provides a PHP development container for environments without a local PHP installation. See the local-development instructions in [DEPLOYMENT.md](DEPLOYMENT.md) before using it.

## Checks

```sh
npm test
npm run build
php artisan test
npm run test:e2e
```

Browser tests use `http://localhost:8001` by default; set `TEST_BASE_URL` to use another local server. Install Playwright Chromium with `npx playwright install chromium` before running browser tests. See [QUALITY.md](QUALITY.md) for the recorded verification scope and known limitations.

## Project notes

- The older account and API backend remains in the repository as historical code and has no active public routes in this edition.
- The legacy mobile app at <https://github.com/gevabriel/flavoryapp> uses the old API contract and does not connect to this personal-cookbook edition.
- Existing logo and food photography are inherited project assets. Their commercial provenance has not been verified; review asset rights before commercial distribution.
