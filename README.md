# Indic Keyboard website

The site for [Indic Keyboard](https://github.com/smc/indic-keyboard), built with [Eleventy](https://www.11ty.dev/).

## Develop

Use the Node version in `.nvmrc`, then:

```sh
npm install
npm start        # dev server with live reload
npm run build    # writes the site to _site/
```

## Language and layout data

The home page counts, language list and hero keyboards (`src/_data/home.json`) and the languages and layout pages (`src/_data/layouts.json`) are generated from a local checkout of the app:

```sh
INDIC_KEYBOARD_REPO=~/git/indic-keyboard npm run data
```

- Counts, names and new-in-release flags come from the app's `method.xml` and string files, compared against the `compareRef` tag in `data/meta.json` (override with `INDIC_KEYBOARD_COMPARE_REF`).
- Keyboards on the layout pages are the app's key files, alphabet rows only.
- English names, regions, layout names the app does not spell out, extra layout references and the hero layouts live in `data/meta.json`. The script warns about anything it cannot name, so new languages and layouts in the app show up as a to-do list.

## Layout

- `src/index.njk` home page, `src/assets/home.js` its hero keyboard and language filter
- `src/languages.njk` languages and their layouts (`src/assets/languages.js` filters it), `src/layout-page.njk` one page per layout under `/languages/<language>/`
- `src/whats-new.md` release notes, one `## version - date` heading and list per release
- `src/privacy.md`, `src/code-of-conduct.md` plain text pages
- `src/_includes/` layouts, header and footer; `src/assets/site.css` all styles
- `src/static/` copied to the site root (icons, `funding.json`)
