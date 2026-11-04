#!/usr/bin/env bash
# qa-browser.sh doctor | setup | open <url> | go <url> | key | stop
# Shows terminal-browser live beside the agent and prints its key. Drive it with:
#   env -u TERM_PROGRAM terminal-browser action --browser "$(qa-browser.sh key)" -- snapshot|click|fill|eval|screenshot /tmp/x.png
# Where the agent runs decides how the pane is made:
#   hc terminal (herdr-app)  $HC_TERMINAL_ID: start the browser as an hc terminal with this tab's herdr.space/herdr.tab
#                            labels; herdr-app adopts it as a pane.            [tested]
#   herdr TUI pane           $HERDR_ENV=1: terminal-browser's own --split right.   [untested]
#   Ghostty/kitty/other      terminal-browser's own --split right.                 [untested]
set -euo pipefail
NAME=qa-browser
STATE=${TMPDIR:-/tmp}/qa-browser.key
# Dependencies: terminal-browser and node always; hc only inside herdr-app.
missing() {
  command -v terminal-browser >/dev/null || echo terminal-browser
  command -v node >/dev/null || echo node
  [ -z "${HC_TERMINAL_ID:-}" ] || command -v hc >/dev/null || echo hc
}
need() { m=$(missing); [ -z "$m" ] || { echo "missing: $(echo $m); run: $0 setup" >&2; exit 3; }; }
tb() { env -u TERM_PROGRAM terminal-browser "$@"; }
key() { [ -s "$STATE" ] || { echo "no qa browser open: run open <url>" >&2; return 1; }; cat "$STATE"; }
newkey() { # the browser that was not there before
  tb ls --all --json | node -e 'const b=JSON.parse(require("fs").readFileSync(0,"utf8")).browsers,o=process.argv[1].split(" ");console.log((b.map(x=>x.key).filter(k=>!o.includes(k)).pop()||(b.at(-1)||{}).key||""))' "$1"
}
keys() { tb ls --all --json | node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).browsers.map(x=>x.key).join(" "))'; }
case "${1:-}" in
  doctor) m=$(missing); if [ -z "$m" ]; then echo "ok: $(terminal-browser --version 2>&1 | head -1)"; else echo "missing: $(echo $m)"; exit 3; fi ;;
  setup)
    for d in $(missing); do
      case $d in
        terminal-browser) # third-party installer: the caller must have the human's OK before running setup
          if command -v brew >/dev/null; then brew install terminal-browser
          else curl -fsSL https://terminal-browser.sh/install | bash; fi ;;
        node) echo "node is missing: install it (https://nodejs.org or nvm); not installed automatically" >&2 ;;
        hc) echo "hc is missing: it ships with herdr-app (herdr-core); not installed automatically" >&2 ;;
      esac
    done
    m=$(missing); [ -z "$m" ] || { echo "still missing: $(echo $m)" >&2; exit 3; }; echo ok ;;
  open)
    need
    url=${2:?url}; before=$(keys)
    if [ -n "${HC_TERMINAL_ID:-}" ]; then
      l=$(hc get "$HC_TERMINAL_ID" --json)
      s=$(grep -o '"herdr.space":"[^"]*"' <<<"$l" | cut -d'"' -f4); t=$(grep -o '"herdr.tab":"[^"]*"' <<<"$l" | cut -d'"' -f4)
      [ -n "$s" ] && [ -n "$t" ] || { echo "no herdr.space/herdr.tab labels on $HC_TERMINAL_ID" >&2; exit 1; }
      hc run --bg --keep --no-parent --name "$NAME" --label "herdr.space=$s" --label "herdr.tab=$t" terminal-browser open "$url" >/dev/null
      sleep 4
    else
      tb open "$url" --split right >/dev/null; sleep 2
    fi
    newkey "$before" | tee "$STATE" ;;
  go) tb action --browser "$(key)" -- open "${2:?url}" ;;
  key) key ;;
  stop)
    k=$(key 2>/dev/null || true)
    [ -z "$k" ] || tb action --browser "$k" done >/dev/null 2>&1 || true
    if [ -n "${HC_TERMINAL_ID:-}" ]; then hc kill "$NAME" >/dev/null 2>&1 || true; hc rm "$NAME" >/dev/null 2>&1 || true
    else tb shutdown >/dev/null 2>&1 || true; fi   # shortcut: closes every terminal-browser, not just ours
    rm -f "$STATE" ;;
  *) echo "usage: $0 open <url> | go <url> | key | stop" >&2; exit 2 ;;
esac
