# Website for NMB Team

The site is deployed on Netlify.

[notmybugs-team.netlify.app](https://notmybugs-team.netlify.app/)

[notmybugs-team.vercel.app](https://notmybugs-team.vercel.app/) (Vercel deployment)

## Website content

- The homepage UI and metadata live in `src/content/en/home.json`.
- The Developer Wiki button opens the project hub at `/developer/`. Its copy lives in `src/content/<language>/developer/hub.json`, and it shares the wiki's language preference.
- The hub uses the upstream [HashLink](https://github.com/HaxeFoundation/hashlink.haxe.org/blob/master/hashlink.svg) and [Heaps](https://github.com/HeapsIO/heaps.io/blob/master/assets/includes/img/logo.svg) logos and the [Dear ImGui artwork by Albane Kim](https://www.dearimgui.com/).
- The Developer Wiki uses shared article templates in `src/content/developer/articles/`. Layout, code examples, and section IDs live there for every language. The shared sidebar order and icons are in `src/content/developer/navigation.json`.
- Wiki translations live in `src/content/<language>/developer/`. Translate `ui.json` for the page shell, search catalog, and shared labels, and `articles/<route>.json` for each article. Preserve the file names and keys. Use inline HTML inside rich-text values where a sentence includes code, emphasis, or a link.
- `/developer/limen/` redirects to `/developer/limen/en/` or `/developer/limen/ru/` using the saved switcher choice or the browser's preferred languages. English is the fallback. Both locales use `src/content/developer/shell.html`. The redirect and language switcher keep the `#/article` route and optional `?s=section` fragment.
- The Limen API starts at `/developer/api/limen/` in English and `/developer/api/limen/ru/` in Russian. Use `?type=limen.platform.window.Window#member-create` to link directly to a declaration.

## Scripts

- `npm install` installs dependencies.
- `npm run dev` starts the local development server.
- `npm run build` builds the production site.
- `npm run preview` previews the production build locally.


The Limen API reference is generated from Limen's compiled Haxe declarations. To refresh it, check out the intended Limen revision, install Haxe and the `format` haxelib, and run `python scripts/generate-limen-api.py /path/to/Limen`. Commit the resulting catalog with its revision and license.

When refreshing the catalog, update `src/content/ru/developer/api/docs.json` to match any changes to source comments. It is keyed by the full type path, then by member name (an empty key describes the type itself). Keep the Russian `usage.json` in sync with its English counterpart when editing usage notes.

## Run from an editor

Open the project root and run `npm install` once before starting the site.

- **Zed** - Open the task picker with `Ctrl+Shift+R` on Windows or Linux (`Cmd+Shift+R` on macOS) and select **Start NMB Team site**. Vite opens the site in your default browser.
- **VS Code** - Select **Start NMB Team site** in Run and Debug and press `F5`. This starts Vite on port 5173 and opens the integrated browser.
- **Production preview** - Run **Build NMB Team site**, then **Preview NMB Team site** from the editor's task picker.
