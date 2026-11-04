// QA walk: type a URL, press Enter, and terminal-browser opens as a split to the right of the focused pane.
// Open it with: herdr-app do mod.open --name qa-walk   (or bind a key to mod.open).
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { run, props, closeOverlay, theme, shared, setShared } from "herdr";

export default class QaWalk extends View {
  init(_props, cx) {
    this.url = shared("qa-walk.url") ?? props()?.url ?? "http://localhost:3000";
    this.input = InputState.new({ value: this.url });
    this.input.set_selected_range({ start: 0, end: this.url.length });
    this.input.on("change", (_e, cx) => { this.url = this.input.value(); cx.notify(); });
    this.input.on("submit", () => this.open());
    this.focused = true;
    this.input.on("focus", (_e, cx) => { this.focused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.focused = false; cx.notify(); });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }
  open() {
    const url = this.url.trim();
    if (!url) return;
    setShared("qa-walk.url", url);
    closeOverlay(props().overlay);
    run("pane.split", { direction: "right", argv: ["terminal-browser", "open", url] });
  }
  render() {
    const t = theme();
    const button = (id, text, primary, action) => h_flex().id(id).h(32).px(14).items_center().rounded(8)
      .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(12.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);
    return v_flex().id("qa-walk").track_focus(this.handle)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(props().overlay); cx.stop_propagation(); } })
      .w_full().min_h(0).p(18).bg(t.popover).text_color(t.foreground)
      .child(h_flex().items_center()
        .child(div().flex_1().text_size(15).font_semibold().child("QA walk"))
        .child(div().text_size(11).text_color(t.dim).child("Esc")))
      .child(div().pt(14).pb(7).text_size(11.5).text_color(t.dim).child("URL to open beside this pane"))
      .child(Input.new(this.input).h(36).px(10).rounded(9).border_1().border_color(this.focused ? t.accent : t.input))
      .child(h_flex().pt(18).gap(8).justify_end()
        .child(button("qw-cancel", "Cancel", false, () => closeOverlay(props().overlay)))
        .child(button("qw-open", "Open browser", true, () => this.open())));
  }
}
