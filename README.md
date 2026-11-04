# terminal-browser QA

A [Herdr](https://herdr.dev) mod for opening [terminal-browser](https://terminal-browser.sh) ([source](https://github.com/zenbu-labs/terminal-browser)), a real browser that runs inside your terminal, next to your work. Type a URL, choose where it opens and press Enter. Useful for walking a web app yourself, or watching an agent do it. Not affiliated with terminal-browser or Herdr.

![terminal-browser opening herdr.dev in a right split](terminal-browser-qa/preview.png)

Browse it at [herdr.dev/mods](https://herdr.dev/mods). It is a piece you add to your layout, not a whole window.

| Mod | |
| --- | --- |
| [terminal-browser QA](terminal-browser-qa/) | a popup: URL plus where to open it: right split (default), split below, tab or a floating window |

| Popup | Floating window |
| --- | --- |
| ![popup](terminal-browser-qa/popup.png) | ![floating](terminal-browser-qa/floating.png) |

The folder is laid out like `~/.config/herdr-app`, with no `layouts/` folder:

```
terminal-browser-qa/
├── RECIPE.md                      the brief to build it from scratch
├── preview.png
├── mods/terminal-browser-qa/      main.js, mod.json
└── keys.json                      optional snippet to merge into your keys
```

## Add it to your Herdr

Ask your agent:

```
Read ~/.config/herdr-app/AGENTS.md, then add this mod: herdr.dev/mods/vedovato/terminal-browser-qa
```

It reads the recipe and every file first, and tells you the mod runs programs (`terminal-browser` and `hc`) before adding it. Or by hand:

```sh
git clone https://github.com/vedovato/terminal-browser-qa-walk.git
cp -R terminal-browser-qa-walk/terminal-browser-qa/mods/terminal-browser-qa ~/.config/herdr-app/mods/
herdr-app check ~/.config/herdr-app/mods/terminal-browser-qa
```

Then merge [`keys.json`](terminal-browser-qa/keys.json) into `~/.config/herdr-app/keys.json` (it binds `ctrl-alt-b`; keep your own binding if it is taken), and open the popup with `ctrl-alt-b` or:

```sh
herdr-app do mod.open --name terminal-browser-qa
```

Remove it by deleting `~/.config/herdr-app/mods/terminal-browser-qa` and its keys. Mods are trusted code, so read `main.js` first: it is one short file.

## Requirements

- Herdr app. Checked with `herdr-app 0.1.12`.
- `terminal-browser` on the machine where the focused pane runs: `brew install terminal-browser` or `curl -fsSL https://terminal-browser.sh/install | bash`. The mod opens the browser as the new terminal's own program, on the focused pane's machine.

## Use

Open the popup, type a URL, pick **Right split**, **Split below**, **Tab** or **Floating**, and press Enter. The last choice and URL are remembered. Quit a split or tab browser with `ctrl+q` inside it; the floating window has a Close button and can be dragged by its title bar.

While the popup is open, scripts and agents can drive it:

```sh
herdr-app do terminal-browser-qa.url=https://example.com
herdr-app do terminal-browser-qa.place-float      # place-right | place-down | place-tab | place-float
herdr-app do terminal-browser-qa.submit
```

An agent can then drive the page with terminal-browser's own CLI, for example `env -u TERM_PROGRAM terminal-browser action -- snapshot` (see its [docs](https://github.com/zenbu-labs/terminal-browser)). `env -u TERM_PROGRAM` is needed because Herdr reports itself as `ghostty`, which terminal-browser then tries to script.

## Limits

- `terminal-browser open --split` does not work inside Herdr ("Ghostty is not running"), which is why the mod starts the browser as the new terminal's program instead.
- The floating browser is an unlabeled core terminal: it never shows in a tab or the agents list. If a window is lost, end it with `hc ls` and `hc kill <address>`.
- Chromium refuses self-signed certificates. Over CDP on the browser's port (`terminal-browser ls --all --json`) send `Security.setIgnoreCertificateErrors`, then `Page.navigate`.
- The popup and its buttons were checked by screenshot; the placements were driven through the commands above. Pressing the buttons by mouse was not exercised.

## Share your own

Put a mod in a public repo, one folder per mod like this one, with a `RECIPE.md` and a `preview.png`, and add the GitHub topic `herdr-mod`. It shows up at [herdr.dev/mods](https://herdr.dev/mods) within the hour. See the [Herdr mod guide](https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md).

## License

Apache-2.0
