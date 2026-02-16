export const MUSIC_SERVICES = {
  bandcamp: {
    name: "Bandcamp",
    label: "BC",
  },
  nina: {
    name: "nina protocol",
    label: "NINA",
  },
  subvert: {
    name: "subvert.fm",
    label: "SUB",
  },
  soundcloud: {
    name: "SoundCloud",
    label: "SC",
  },
  spotify: {
    name: "Spotify",
    label: "SP",
  },
} as const;

export type MusicServiceType = keyof typeof MUSIC_SERVICES;
