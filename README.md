# qa-walk

One agent skill, `skills/qa-walk`: drive a web app with [terminal-browser](https://github.com/zenbu-labs/terminal-browser) while the human watches it live as a pane beside the agent.

Project-agnostic: it covers opening, driving and closing the browser. The project's own rules (stack, test data, model, report) stay in the project.

## Install

Copy or symlink `skills/qa-walk` into the agent's skills folder on each machine (omp: `~/.omp/agent/managed-skills/`):

```sh
git clone git@github.com:<owner>/qa-walk.git ~/Developer/qa-walk
ln -s ~/Developer/qa-walk/skills/qa-walk ~/.omp/agent/managed-skills/qa-walk
```

Needs `terminal-browser` (`curl -fsSL https://terminal-browser.sh/install | bash`), `node`, and in herdr-app `hc`.

No CI: it is an interactive helper, not part of any build.
