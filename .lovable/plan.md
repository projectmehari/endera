

# Plan: Readable Mix URLs, Dialog-Based Selection, and Download Button

## Overview

Three changes: (1) make mix URLs human-readable like `/mix/artist/title`, (2) revert mix selection to open a dialog/popup instead of navigating to a new page, and (3) add a download button on the mix detail page.

---

## 1. Readable Mix URLs

**Current**: `/mix/3e1a2fa4-9c3d-4954-a151-ae418c68f66f`
**New**: `/mix/kiru/deserter`

### How it works
- Generate slugs from artist and title (lowercase, replace spaces/special chars with hyphens)
- Route becomes `/mix/:artist/:title`
- The `MixDetail` page will query the database matching on artist + title slugs instead of UUID
- All links (`MixCard`, `Explore`) updated to generate the slug-based URL

### Technical details
- Add a `slugify()` utility to `src/lib/utils.ts`
- Update route in `App.tsx`: `/mix/:artist/:title`
- Update `MixDetail.tsx` to use `useParams<{ artist: string; title: string }>()` and query tracks by matching slugified artist/title
- Update `MixCard.tsx` and `Explore.tsx` navigate calls to use `/mix/${slugify(artist)}/${slugify(title)}`

---

## 2. Revert to Dialog-Based Mix Selection

Clicking a mix row (homepage) or explore card will open a popup/dialog with the mix details (artwork, title, date, tracklist, play button, download) instead of navigating away.

### Technical details
- **MixCard.tsx**: Replace `navigate()` with state to open a Dialog. Add a `<Dialog>` component inline that shows the mix detail content (artwork, title, artist, duration, tracklist, play/download buttons)
- **Explore.tsx**: Same approach -- clicking a card opens a Dialog with the mix details and tracklist (fetched on open)
- **MixDetail.tsx**: Keep the dedicated page as-is for the readable URL route (direct link / sharing). The dialog and the page share the same visual layout
- Create a shared `MixDetailContent` component used by both the Dialog and the standalone page to avoid duplication

---

## 3. Add Download Button

Add a download option on both the mix detail page and the dialog.

### Technical details
- Add a download button (using lucide `Download` icon) next to the play button
- Uses an `<a>` tag with `href={mix.file_url}` and `download` attribute to trigger browser download
- Styled consistently with the existing play button (rounded circle, border, same size)

---

## Files to modify

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `slugify()` function |
| `src/App.tsx` | Update route to `/mix/:artist/:title` |
| `src/components/MixDetailContent.tsx` | **New** -- shared mix detail UI (artwork, info, tracklist, play, download) |
| `src/pages/MixDetail.tsx` | Use slug params to fetch mix, render `MixDetailContent` |
| `src/components/MixCard.tsx` | Replace navigate with Dialog, render `MixDetailContent` inside |
| `src/pages/Explore.tsx` | Replace navigate with Dialog, render `MixDetailContent` inside |

