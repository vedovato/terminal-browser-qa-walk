---
name: qa-walk
description: "Use when asked for a QA walk, walk-through, re-walk or browser walk of a web app: drives it with terminal-browser while the human watches it live as a pane beside the agent. Works from herdr-app (hc terminals); other terminals untested. Project rules (stack, data, model, report) come from the project."
---

# QA walk

An agent-run pass over a running web app in a real browser, shown live next to the conversation. The project decides what to walk and on which stack; this skill only covers the browser: opening it visibly, driving it, closing it.

Project rules win. A walk is a check, not a change, and never replaces the human's own checks. Never use Playwright unless the project says so.

## Open, drive, close

```sh
S=<this skill's dir>/qa-browser.sh
$S open https://app.localhost:3000/        # shows the pane, prints the browser key
$S go https://app.localhost:3000/other     # navigate the same browser
TB="env -u TERM_PROGRAM terminal-browser action --browser $($S key) --"
$TB snapshot -i                            # refs @e1… for interactive elements
$TB click @e3
$TB fill @e4 "text"
$TB eval "document.title"
$TB screenshot /tmp/walk/s1.png            # always an absolute path
$S stop                                    # clears the "agent acting" outline, closes the pane
```

- `env -u TERM_PROGRAM` is needed for `action`/`ls` when the terminal exports `TERM_PROGRAM=ghostty` without being Ghostty (herdr-app does).
- A pane outline means the agent is acting; `stop` (or `terminal-browser action done`) clears it.
- Self-signed TLS: Chromium refuses the cert. Over CDP on the browser's `cdpPort` (`terminal-browser ls --all --json`) send `Security.setIgnoreCertificateErrors {ignore:true}`, then `Page.navigate`. `*.localhost` resolves to `::1` first: a test proxy must listen dual-stack.
- A page may publish WebMCP tools: `$TB webmcp list --json`; prefer `webmcp invoke` over click/fill when one covers the step. `readOnly:false` changes data; `consequential:true` needs the human's OK.
- axe: inject `axe.min.js` through `eval`, then `eval "axe.run().then(r=>JSON.stringify(r.violations.map(v=>v.id)))"`.

## Where the pane comes from

| Agent runs in | How `open` makes the pane | Status |
|---|---|---|
| herdr-app (hc terminal, `$HC_TERMINAL_ID`) | starts the browser as an hc terminal carrying this tab's `herdr.space`/`herdr.tab` labels; herdr-app adopts it as a pane (`terminal-browser open --split` fails there: "Ghostty is not running") | tested |
| herdr TUI pane (`HERDR_ENV=1`) | `terminal-browser open --split right` | untested |
| Ghostty, kitty or another supported terminal | `terminal-browser open --split right` | untested |

The browser needs a terminal with graphics support; over SSH use `terminal-browser open --ssh`.

## Walk, in short
1. Bring up the project's stack as the project says (isolated, not the human's data, unless told otherwise).
2. `open`, follow the spec's flows, record per check: id, PASS/FAIL/BLOCKED, evidence (screenshot path, HTTP status, mail id).
3. Report FAILs with repro steps and the suspect file:line; map each human check to the walk checks that covered it.
4. `stop`, then tear the stack down.

This is interactive, local work: it is not a CI job, and nothing here belongs in a CI workflow.
