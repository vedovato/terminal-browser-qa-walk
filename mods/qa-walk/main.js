// QA walk: type a URL, pick where it opens, press Enter. terminal-browser opens as a split to the right
// of the focused pane (default), a split below, a tab, or a floating window you can drag.
// Open the popup with: herdr-app do mod.open --name qa-walk   (or bind a key to mod.open:qa-walk).
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { run, props, closeOverlay, openOverlay, theme, shared, setShared, hc, focused, spaces } from "herdr";

const BROWSER = "terminal-browser";
const PLACES = [["right", "Right split"], ["down", "Split below"], ["tab", "Tab"], ["float", "Floating"]];

export default class QaWalk extends View {
  init(_props, cx) {
    if (props()?.mode === "titlebar") return;
    this.place = shared("qa-walk.place") ?? props()?.place ?? "right";
    this.url = shared("qa-walk.url") ?? props()?.url ?? "http://localhost:3000";
    this.error = "";
    this.input = InputState.new({ value: this.url });
    this.input.set_selected_range({ start: 0, end: this.url.length });
    this.input.on("change", (_e, cx) => { this.url = this.input.value(); cx.notify(); });
    this.input.on("submit", (_e, cx) => this.open(cx));
    this.focused = true;
    this.input.on("focus", (_e, cx) => { this.focused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.focused = false; cx.notify(); });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  open(cx) {
    const url = this.url.trim();
    if (!url) return;
    setShared("qa-walk.url", url);
    setShared("qa-walk.place", this.place);
    const overlay = props().overlay;
    if (this.place !== "float") {
      closeOverlay(overlay);
      run("terminal.open", { argv: [BROWSER, "open", url], place: this.place === "tab" ? "tab" : this.place, name: "browser" });
      return;
    }
    // Floating: start the browser as a plain core terminal (no herdr labels, so no pane), then show it in a window.
    cx.spawn(async (cx) => {
      const machine = spaces().find((s) => s.id === focused()?.space)?.machine ?? null;
      const r = await hc(["run", "--json", "--bg", "--no-parent", ...(machine ? ["--on", machine] : []), BROWSER, "open", url]);
      const terminal = JSON.parse(r.stdout).address;
      closeOverlay(overlay);
      openOverlay({
        kind: "window", key: "qa-walk-float", width: 0.7, height: 0.75,
        layout: { type: "column", children: [
          { type: "block", size: { px: 30 }, content: { mod: "qa-walk", props: { mode: "titlebar", terminal } } },
          { type: "block", content: { terminal } },
        ] },
      });
    }).catch?.(() => {});
  }

  titlebar() {
    const t = theme();
    const { terminal } = props();
    return h_flex().id("qw-bar").size_full().px(10).items_center().bg(t.chrome).text_color(t.foreground).text_size(12)
      .child(div().flex_1().font_semibold().child("QA browser"))
      .child(h_flex().id("qw-close").h(20).px(8).items_center().rounded(5).cursor_pointer().text_color(t.muted)
        .hover((s) => s.bg(t.hover))
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .on_click(() => run("terminal.kill", { terminal })) // the window closes itself when its terminal ends
        .child("Close"));
  }

  render() {
    if (props()?.mode === "titlebar") return this.titlebar();
    const t = theme();
    const button = (id, text, primary, action) => h_flex().id(id).h(32).px(14).items_center().rounded(8)
      .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(12.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);
    const seg = ([key, label]) => h_flex().id(`qw-${key}`).h(28).px(10).items_center().rounded(7).text_size(12).cursor_pointer()
      .bg(this.place === key ? t.selected : t.raised).border_1().border_color(this.place === key ? t.accent : t.border)
      .text_color(this.place === key ? t.foreground : t.muted)
      .on_click((_e, cx) => { this.place = key; cx.notify(); }).child(label);
    return v_flex().id("qa-walk").track_focus(this.handle)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(props().overlay); cx.stop_propagation(); } })
      .w_full().min_h(0).p(18).bg(t.popover).text_color(t.foreground)
      .child(h_flex().items_center()
        .child(div().flex_1().text_size(15).font_semibold().child("QA walk"))
        .child(div().text_size(11).text_color(t.dim).child("Esc")))
      .child(div().pt(14).pb(7).text_size(11.5).text_color(t.dim).child("URL"))
      .child(Input.new(this.input).h(36).px(10).rounded(9).border_1().border_color(this.focused ? t.accent : t.input))
      .child(div().pt(14).pb(7).text_size(11.5).text_color(t.dim).child("Open as"))
      .child(h_flex().gap(6).children(PLACES.map(seg)))
      .child(h_flex().pt(18).gap(8).justify_end()
        .child(button("qw-cancel", "Cancel", false, () => closeOverlay(props().overlay)))
        .child(button("qw-open", "Open browser", true, (_e, cx) => this.open(cx))));
  }
}
