# Polishing backlog

Small UX and visual tweaks to revisit — not blocking current build phases.

## Exercise / settings editors

- [ ] **Custom field add/delete animation** — Settings and logged-field rows should animate in and out (Health-style list transitions). Current per-row opacity/height workaround is unreliable; need a native-friendly approach (`List.ForEach`, `withAnimation` + worklets, or accept system `Form` limits).

## Chrome

- [ ] **Header gradient blur** — Form sheets and nav headers should use a softened gradient/blur treatment instead of a hard cutoff under the toolbar.

## Workout

- [ ] **Routine switcher** — Quick way to change the active routine without leaving the workout flow (design and placement TBD).