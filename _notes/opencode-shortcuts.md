# OpenCode Keyboard Shortcuts

This note records the useful OpenCode shortcuts we covered, with a focus on faster model handling.

## Global Defaults

- `Ctrl+X` is the leader key (prefix for many actions).
- Most custom shortcuts are defined in `~/.config/opencode/tui.json`.

## Model Selection (Most Requested)

- `Ctrl+X m` (`<leader> m`): open `/models` selector.
- `F2`: cycle to next recently used model.
- `Shift+F2`: cycle to previous model.
- `Ctrl+A`: open model/provider list view.
- `Ctrl+F`: toggle bookmark for selected model.

## Navigation and Editing

- `j`, `k`: move cursor up/down in list mode.
- `h`, `l`: move left/right / expand-collapse actions depending on focus.
- `Enter`: confirm selection / submit in focused UI area.
- `Esc`: close modal or return to previous mode.
- `/`: search within current list/table.

## Chat / Session Shortcuts

- `Ctrl+N`: start new conversation/chat.
- `Ctrl+R`: rename current conversation.
- `Ctrl+O`: open quick options or context actions.
- `Ctrl+S`: save current draft state.
- `Ctrl+Q`: close current panel/window.

## Session and Terminal Management

- `Ctrl+W`: close pane/tab.
- `Ctrl+T`: open new tab.
- `Ctrl+P`: open command/search palette.
- `Ctrl+Shift+P`: open alternate command palette.

## Notes

- You can reduce model switching friction by setting a default model in `~/.config/opencode/opencode.jsonc` and keeping `model_list` only for occasional changes.
- If defaults change across your machine, verify exact keys in `tui.json` because key names can vary by OpenCode version.
