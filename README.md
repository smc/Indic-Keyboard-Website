# Indic Keyboard website

The site for [Indic Keyboard](https://gitlab.com/indicproject/indic-keyboard), built with [Eleventy](https://www.11ty.dev/).

## Develop

Use the Node version in `.nvmrc`, then:

```sh
npm install
npm start        # dev server with live reload
npm run build    # writes the site to _site/
```

## Language data

The home page counts, language list and hero keyboards come from `src/_data/home.json`, generated from a local checkout of the app:

```sh
INDIC_KEYBOARD_REPO=~/git/indic-keyboard npm run data
```

It compares against the `compareRef` tag in `data/meta.json` to decide what is new (override with `INDIC_KEYBOARD_COMPARE_REF`). English names, regions, layout names the app does not spell out, and the hero layouts live in `data/meta.json`. The script warns about anything it cannot name, so new languages and layouts in the app show up as a to-do list. Commit the regenerated `home.json`.

## Layout

- `src/index.njk` home page, `src/assets/home.js` its hero keyboard and language filter
- `src/whats-new.md` release notes, one `## version - date` heading and list per release
- `src/privacy.md`, `src/code-of-conduct.md` plain text pages
- `src/_includes/` layouts, header and footer; `src/assets/site.css` all styles
- `src/static/` copied to the site root (icons, `funding.json`)

## Deploy

Pushing to `master` on GitHub builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
