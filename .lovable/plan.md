

# Live Chat Component for ENDERA.FM

## Overview

A floating live chat widget inspired by n10.as's community board, adapted to ENDERA.FM's industrial meter aesthetic. The chat appears as a collapsible panel in the bottom-right corner of every page, letting listeners talk to each other in real time.

---

## Features

### Core (requested)
- **Name login**: A simple "enter your name" prompt stored in localStorage -- no account needed
- **Minimize / maximize**: A small floating button toggles the chat panel open and closed
- **Real-time messaging**: Messages appear instantly for all connected users via Lovable Cloud realtime subscriptions

### Suggested additions
- **"Now listening" indicator**: Show a small listener count or dot next to the chat title so people know the room is active
- **Timestamps**: Each message displays a relative time (e.g. "2m ago") in the `meter-label` style
- **Auto-scroll with "new messages" nudge**: Chat auto-scrolls to the bottom; if the user has scrolled up, a small "NEW" badge appears instead of forcing them down
- **Admin messages**: Messages from the admin (matched by name or a flag) get a subtle accent border so station announcements stand out
- **Message length limit**: 280 characters max to keep it snappy, with a character counter

---

## Visual Design

The chat follows ENDERA's instrument-panel aesthetic:

- **Collapsed state**: A small `meter-panel` button in the bottom-right reading "CHAT" with a pulsing `meter-dot-active` when there are unread messages
- **Expanded state**: A 320px-wide, 420px-tall `meter-panel` box with:
  - Header bar: "ENDERA CHAT" in `meter-value` style + minimize button (a dash icon)
  - Listener count in `meter-label` style
  - Message area: scrollable, each message shows name in bold `meter-value` (10px), text in JetBrains Mono, and timestamp in `meter-label`
  - Input bar at the bottom: a single-line input with a "SEND" button, bordered in the `meter-inset` style
- **Name prompt**: On first open, a small `meter-panel` overlay inside the chat asks for a display name with a single input + "JOIN" button

---

## Technical Plan

### 1. Database table: `chat_messages`

New table with columns:
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `username` (text, not null)
- `message` (text, not null)
- `created_at` (timestamptz, default `now()`)

RLS policy: public SELECT (anyone can read), public INSERT (anyone can insert -- no auth required for a simple chat room). No UPDATE or DELETE for regular users.

Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;`

### 2. New component: `src/components/LiveChat.tsx`

A self-contained floating widget:
- State: `isOpen`, `username` (from localStorage), `messages`, `newMessage`
- On mount: fetch last 50 messages, subscribe to realtime inserts
- On send: insert into `chat_messages` via Supabase client
- Username stored in `localStorage` under key `endera_chat_name`
- Input validation: trim whitespace, 280 char max, prevent empty sends
- Auto-scroll logic with "new messages" indicator

### 3. Mount in `App.tsx`

Add `<LiveChat />` inside `AudioPlayerProvider` so it appears on every page, floating above all content with `fixed bottom-4 right-4 z-40`.

### 4. New hook: `src/hooks/useChatMessages.ts`

- `useQuery` to fetch the latest 50 messages ordered by `created_at desc` (reversed for display)
- Realtime subscription via `supabase.channel('chat')` listening for `INSERT` events on `chat_messages`
- Appends new messages to the query cache for instant updates

---

## Files to Create / Modify

| File | Action |
|------|--------|
| Migration SQL | Create `chat_messages` table + RLS + realtime |
| `src/components/LiveChat.tsx` | New -- full chat widget component |
| `src/hooks/useChatMessages.ts` | New -- data fetching + realtime hook |
| `src/App.tsx` | Add `<LiveChat />` component |

