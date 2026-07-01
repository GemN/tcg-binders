#!/bin/sh

title=${1:-Codex}
message=${2:-Notification}

if command -v osascript >/dev/null 2>&1; then
  osascript \
    -e 'on run argv' \
    -e 'display notification (item 2 of argv) with title (item 1 of argv)' \
    -e 'end run' \
    "$title" "$message" >/dev/null 2>&1 && exit 0
fi

if command -v notify-send >/dev/null 2>&1; then
  notify-send "$title" "$message" >/dev/null 2>&1 && exit 0
fi

printf '\a' >&2
exit 0
