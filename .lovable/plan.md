

## Fix: Sticky Header + LiveBar Stacking

**Problem:** Both the SiteHeader and LiveBar use `sticky top-0`, so they overlap each other when scrolling. The LiveBar covers the header instead of sitting below it.

**Solution:** Wrap both SiteHeader and LiveBar in a single sticky container so they stay together at the top of the page as one unit.

### Changes

**`src/pages/Explore.tsx`**
- Wrap `<SiteHeader />` and `<LiveBar />` inside a single `<div>` with `sticky top-0 z-50 bg-background`.

**`src/components/SiteHeader.tsx`**
- Remove `sticky top-0 z-50` from the header (since the parent wrapper now handles sticking).

**`src/components/LiveBar.tsx`**
- Remove `sticky top-0 z-50` from the LiveBar container (same reason).

This ensures both the header and the player bar scroll together as one fixed block at the top of the page, with no overlap or flickering.

### Technical Details

The root cause is two sibling elements both using `position: sticky; top: 0` — they each independently stick to the top, causing them to stack on top of each other. By wrapping them in a single sticky parent, they behave as one cohesive unit. The sticky classes will be moved to the wrapper in Explore.tsx (and similarly in any other pages using both components like Index.tsx).

