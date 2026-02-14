import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown, Pencil, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TracklistDialog from "@/components/TracklistDialog";
import { useTrackGenres } from "@/hooks/useGenres";
import type { Track } from "@/lib/radio-types";

const NTS_GENRES = [
  "acid", "ambient", "art rock", "bass", "breakbeat", "club", "cumbia", "dark ambient",
  "deep house", "disco", "drum & bass", "dub", "dubstep", "electro", "electronica",
  "experimental", "folk", "footwork", "funk", "gamelan", "garage", "grime", "guaracha",
  "house", "indie rock", "industrial", "interview", "jazz", "jungle", "leftfield pop",
  "live performance", "lovers rock", "minimal", "minimal synth", "modern classical",
  "noise", "noise rock", "post punk", "psychedelic rock", "rap", "reggae", "rnb",
  "soul", "soundtrack", "techno", "trance", "trip hop", "uk garage",
].sort();

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("admin-auth", {
        body: { password },
      });
      if (fnErr || !data?.success) {
        setError("INVALID PASSWORD");
      } else {
        sessionStorage.setItem("admin_token", data.token);
        onLogin();
      }
    } catch {
      setError("CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="meter-panel w-full max-w-sm">
        <div className="border-b border-foreground px-4 py-2">
          <span className="meter-label">ADMIN ACCESS REQUIRED</span>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-4">
            <span className="font-display text-lg font-bold uppercase">AUTHENTICATE</span>
          </div>
          <div>
            <Label className="meter-label">PASSWORD</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 font-mono"
              autoFocus
            />
          </div>
          {error && <p className="text-destructive text-xs font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full meter-panel px-4 py-2 meter-value text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {loading ? "VERIFYING..." : "ENTER"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTrackDialog({
  track,
  open,
  onOpenChange,
  onSave,
}: {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fields: { title?: string; artist?: string; artworkUrl?: string; genres?: string[] }) => Promise<void>;
}) {
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist);
  const [editGenres, setEditGenres] = useState("");
  const [saving, setSaving] = useState(false);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const { data: existingGenres } = useTrackGenres(track.id);

  useEffect(() => {
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setArtworkFile(null);
  }, [track]);

  useEffect(() => {
    if (existingGenres) setEditGenres(existingGenres.join(", "));
  }, [existingGenres]);

  const handleSave = async () => {
    setSaving(true);
    const fields: { title?: string; artist?: string; artworkUrl?: string; genres?: string[] } = {};
    if (editTitle.trim() !== track.title) fields.title = editTitle.trim();
    if (editArtist.trim() !== track.artist) fields.artist = editArtist.trim();
    // Always send genres to allow updates
    fields.genres = editGenres.split(",").map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
    if (editArtist.trim() !== track.artist) fields.artist = editArtist.trim();

    if (artworkFile) {
      const artworkPath = `${crypto.randomUUID()}-${artworkFile.name}`;
      const { error } = await supabase.storage.from("artwork").upload(artworkPath, artworkFile, {
        contentType: artworkFile.type,
      });
      if (!error) {
        const { data } = supabase.storage.from("artwork").getPublicUrl(artworkPath);
        fields.artworkUrl = data.publicUrl;
      }
    }

    if (Object.keys(fields).length > 0) {
      await onSave(fields);
    } else {
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-foreground bg-background p-0 gap-0">
        <DialogTitle className="px-4 py-3 border-b border-foreground meter-label">EDIT TRACK</DialogTitle>
        <div className="p-4 space-y-3">
          <div>
            <Label className="meter-label">TITLE</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <Label className="meter-label">ARTIST</Label>
            <Input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <Label className="meter-label">REPLACE ARTWORK</Label>
            {track.artwork_url && (
              <img src={track.artwork_url} alt="" className="w-12 h-12 border border-foreground object-cover mt-1 mb-1" />
            )}
            <Input type="file" accept="image/*" onChange={(e) => setArtworkFile(e.target.files?.[0] || null)} className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <Label className="meter-label">GENRES (COMMA-SEPARATED)</Label>
            <Input value={editGenres} onChange={(e) => setEditGenres(e.target.value)} placeholder="ambient, house, techno" className="mt-1 font-mono text-xs" />
            <div className="flex flex-wrap gap-1 mt-2">
              {NTS_GENRES.filter((g) => !editGenres.split(",").map(s => s.trim().toLowerCase()).includes(g)).slice(0, 20).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGenres((prev) => prev ? `${prev}, ${g}` : g)}
                  className="text-[8px] font-mono uppercase tracking-wider border border-foreground/20 px-1.5 py-0.5 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  + {g}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full meter-panel px-4 py-2 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChatModerator() {
  const [messages, setMessages] = useState<{ id: string; username: string; message: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const token = sessionStorage.getItem("admin_token") || "";

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setMessages((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("admin-delete-chat", {
      body: { token, messageId: id },
    });
    if (!error && data?.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "MESSAGE DELETED" });
    } else {
      toast({ title: "DELETE FAILED", variant: "destructive" });
    }
  };

  return (
    <div className="meter-panel mb-4">
      <div className="border-b border-foreground px-4 py-2 flex items-center justify-between">
        <span className="meter-label">— CHAT MODERATION —</span>
        <span className="meter-label">{messages.length} MESSAGES</span>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {loading ? (
          <p className="meter-label p-2">LOADING...</p>
        ) : messages.length === 0 ? (
          <p className="meter-label p-2">NO MESSAGES</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 py-1 px-2 receipt-line last:border-0 group hover:bg-secondary transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="meter-value text-[10px]">{msg.username}</span>
                  <span className="meter-label text-[9px]">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs font-mono truncate">{msg.message}</p>
              </div>
              <button
                onClick={() => deleteMessage(msg.id)}
                className="shrink-0 p-1 text-muted-foreground hover:text-destructive meter-label text-[10px]"
              >
                [DEL]
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TrackManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracklistTrack, setTracklistTrack] = useState<Track | null>(null);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState("");
  const [publishedDate, setPublishedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [trackGenresMap, setTrackGenresMap] = useState<Record<string, string[]>>({});
  const [tracklistCounts, setTracklistCounts] = useState<Record<string, number>>({});
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [pwaEnabled, setPwaEnabled] = useState(false);
  const [pwaLoading, setPwaLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const artworkRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const token = sessionStorage.getItem("admin_token") || "";

  const fetchTracks = async () => {
    const { data } = await supabase
      .from("tracks" as any)
      .select("*")
      .order("published_date", { ascending: sortAsc });
    setTracks((data as unknown as Track[]) || []);
    setLoading(false);
    // Fetch all genres
    const { data: genreData } = await supabase.from("track_genres" as any).select("track_id, genre");
    if (genreData) {
      const map: Record<string, string[]> = {};
      (genreData as any[]).forEach((r) => {
        if (!map[r.track_id]) map[r.track_id] = [];
        map[r.track_id].push(r.genre);
      });
      setTrackGenresMap(map);
    }
    // Fetch tracklist counts
    const { data: tlData } = await supabase.from("mix_tracklists" as any).select("mix_id");
    if (tlData) {
      const counts: Record<string, number> = {};
      (tlData as any[]).forEach((r) => {
        counts[r.mix_id] = (counts[r.mix_id] || 0) + 1;
      });
      setTracklistCounts(counts);
    }
  };

  useEffect(() => { fetchTracks(); }, [sortAsc]);

  useEffect(() => {
    supabase.from("station_config").select("pwa_enabled").limit(1).single().then(({ data }) => {
      if (data) setPwaEnabled(data.pwa_enabled ?? false);
    });
  }, []);

  const togglePwa = async (enabled: boolean) => {
    setPwaLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-update-config", {
      body: { token, pwaEnabled: enabled },
    });
    if (!error && data?.success) {
      setPwaEnabled(enabled);
      toast({ title: enabled ? "PWA ENABLED" : "PWA DISABLED" });
    } else {
      toast({ title: "UPDATE FAILED", variant: "destructive" });
    }
    setPwaLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      // Upload MP3
      const filePath = `${crypto.randomUUID()}-${file.name}`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${supabaseUrl}/storage/v1/object/tracks/${filePath}`);
        xhr.setRequestHeader("Authorization", `Bearer ${supabaseKey}`);
        xhr.setRequestHeader("apikey", supabaseKey);
        xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      const { data: urlData } = supabase.storage.from("tracks").getPublicUrl(filePath);

      // Upload artwork if provided
      let artworkUrl: string | undefined;
      const artworkFile = artworkRef.current?.files?.[0];
      if (artworkFile) {
        const artworkPath = `${crypto.randomUUID()}-${artworkFile.name}`;
        const { error: artErr } = await supabase.storage.from("artwork").upload(artworkPath, artworkFile, {
          contentType: artworkFile.type,
        });
        if (!artErr) {
          const { data: artUrlData } = supabase.storage.from("artwork").getPublicUrl(artworkPath);
          artworkUrl = artUrlData.publicUrl;
        }
        setUploadProgress(95);
      }

      const durationSeconds = Math.round(file.size / 24000);

      const genresArray = genres.split(",").map(g => g.trim().toLowerCase()).filter(g => g.length > 0);

      const { data, error } = await supabase.functions.invoke("admin-upload", {
        body: { token, title, artist: artist || "Unknown", fileUrl: urlData.publicUrl, durationSeconds, artworkUrl, publishedDate, genres: genresArray },
      });
      if (error || !data?.success) throw new Error(data?.error || "Upload failed");
      toast({ title: "TRACK UPLOADED" });
      setTitle(""); setArtist(""); setGenres(""); setPublishedDate(new Date().toISOString().slice(0, 10));
      if (fileRef.current) fileRef.current.value = "";
      if (artworkRef.current) artworkRef.current.value = "";
      fetchTracks();
    } catch (err: any) {
      toast({ title: "UPLOAD FAILED", description: err.message, variant: "destructive" });
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const deleteTrack = async (track: Track) => {
    const { error } = await supabase.functions.invoke("admin-delete-track", {
      body: { token, trackId: track.id },
    });
    if (!error) { toast({ title: "TRACK DELETED" }); fetchTracks(); }
  };

  const moveTrack = async (trackId: string, direction: "up" | "down") => {
    const idx = tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tracks.length) return;
    await supabase.functions.invoke("admin-reorder", {
      body: { token, trackId1: tracks[idx].id, order1: tracks[swapIdx].play_order, trackId2: tracks[swapIdx].id, order2: tracks[idx].play_order },
    });
    fetchTracks();
  };

  const updatePublishedDate = async (trackId: string, date: string) => {
    const { data, error } = await supabase.functions.invoke("admin-update-track", {
      body: { token, trackId, publishedDate: date },
    });
    if (!error && data?.success) { toast({ title: "DATE UPDATED" }); fetchTracks(); }
  };

  const updateTrackMeta = async (trackId: string, fields: { title?: string; artist?: string; artworkUrl?: string; genres?: string[] }) => {
    const { data, error } = await supabase.functions.invoke("admin-update-track", {
      body: { token, trackId, ...fields },
    });
    if (!error && data?.success) { toast({ title: "TRACK UPDATED" }); fetchTracks(); }
    else { toast({ title: "UPDATE FAILED", variant: "destructive" }); }
  };

  const shazamScan = async (trackId: string) => {
    setScanningId(trackId);
    toast({ title: "SHAZAM SCANNING...", description: "This may take a minute" });
    try {
      const { data, error } = await supabase.functions.invoke("shazam-scan", {
        body: { token, mix_id: trackId },
      });
      if (error || !data?.success) {
        toast({ title: "SCAN FAILED", description: data?.error || "Unknown error", variant: "destructive" });
      } else {
        toast({ title: `SCAN COMPLETE`, description: `Detected ${data.detected_count} tracks` });
        fetchTracks();
      }
    } catch {
      toast({ title: "SCAN ERROR", variant: "destructive" });
    } finally {
      setScanningId(null);
    }
  };

  const logout = () => { sessionStorage.removeItem("admin_token"); window.location.reload(); };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="meter-panel mb-4">
          <div className="border-b border-foreground px-4 py-2 flex items-center justify-between">
            <span className="meter-label">TRACK MANAGEMENT CONSOLE</span>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <Label className="meter-label cursor-pointer" htmlFor="pwa-toggle">PWA</Label>
                <Switch id="pwa-toggle" checked={pwaEnabled} onCheckedChange={togglePwa} disabled={pwaLoading} className="scale-75" />
              </div>
              <a href="/" className="meter-label hover:text-foreground transition-colors">[RADIO]</a>
              <button onClick={logout} className="meter-label hover:text-foreground transition-colors">[LOGOUT]</button>
            </div>
          </div>
        </div>

        {/* Chat Moderation */}
        <ChatModerator />

        {/* Upload */}
        <div className="meter-panel mb-4">
          <div className="border-b border-foreground px-4 py-2">
            <span className="meter-label">— UPLOAD NEW TRACK —</span>
          </div>
          <form onSubmit={handleUpload} className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="meter-label">TITLE *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 font-mono text-xs" required />
              </div>
              <div>
                <Label className="meter-label">ARTIST</Label>
                <Input value={artist} onChange={(e) => setArtist(e.target.value)} className="mt-1 font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label className="meter-label">MP3 FILE *</Label>
              <Input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3" className="mt-1 font-mono text-xs" required />
            </div>
            <div>
              <Label className="meter-label">PUBLISHED DATE</Label>
              <Input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <Label className="meter-label">ARTWORK IMAGE (OPTIONAL)</Label>
              <Input ref={artworkRef} type="file" accept="image/*" className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <Label className="meter-label">GENRES (COMMA-SEPARATED)</Label>
              <Input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="ambient, house, techno" className="mt-1 font-mono text-xs" />
              <div className="flex flex-wrap gap-1 mt-2">
                {NTS_GENRES.filter((g) => !genres.split(",").map(s => s.trim().toLowerCase()).includes(g)).slice(0, 20).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenres((prev) => prev ? `${prev}, ${g}` : g)}
                    className="text-[8px] font-mono uppercase tracking-wider border border-foreground/20 px-1.5 py-0.5 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            </div>
            {uploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="meter-label text-foreground">UPLOADING</span>
                  <span className="meter-label text-foreground">{uploadProgress}%</span>
                </div>
                <div className="h-[3px] bg-muted w-full">
                  <div className="h-full bg-foreground transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <button type="submit" disabled={uploading} className="w-full meter-panel px-4 py-2 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
              {uploading ? `UPLOADING... ${uploadProgress}%` : "UPLOAD TRACK"}
            </button>
          </form>
        </div>

        {/* Track List */}
        <div className="meter-panel">
          <div className="border-b border-foreground px-4 py-2 flex items-center justify-between">
            <span className="meter-label">— PLAYLIST —</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="meter-label hover:text-foreground transition-colors"
              >
                [{sortAsc ? "OLDEST → NEWEST" : "NEWEST → OLDEST"}]
              </button>
              <span className="meter-label">{tracks.length} TRACKS</span>
            </div>
          </div>
          <div className="p-2">
            {loading ? (
              <p className="meter-label p-2">LOADING...</p>
            ) : tracks.length === 0 ? (
              <p className="meter-label p-2">NO TRACKS LOADED</p>
            ) : (
              tracks.map((track, i) => (
                <div key={track.id} className="flex flex-wrap items-center gap-2 py-1.5 px-2 receipt-line last:border-0 group hover:bg-secondary transition-colors">
                  <span className="meter-label text-foreground w-5 text-right shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  {track.artwork_url && (
                    <img src={track.artwork_url} alt="" className="w-6 h-6 border border-foreground object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono uppercase truncate block">{track.title}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="meter-label">{track.artist.toUpperCase()}</span>
                      {(trackGenresMap[track.id] || []).map((g) => (
                        <Badge key={g} variant="outline" className="text-[8px] px-1 py-0 leading-tight font-mono uppercase">{g}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="date"
                      value={track.published_date || ""}
                      onChange={(e) => updatePublishedDate(track.id, e.target.value)}
                      className="meter-label text-foreground bg-transparent border-none font-mono text-[10px] w-24 cursor-pointer"
                    />
                    <span className="meter-label text-foreground whitespace-nowrap">
                      {Math.floor(track.duration_seconds / 60)}:{(track.duration_seconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => moveTrack(track.id, "up")} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveTrack(track.id, "down")} disabled={i === tracks.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteTrack(track)} className="p-1 text-muted-foreground hover:text-destructive meter-label">[DEL]</button>
                    <button onClick={() => setTracklistTrack(track)} className="p-1 text-muted-foreground hover:text-foreground meter-label">
                      [TL{tracklistCounts[track.id] ? `:${tracklistCounts[track.id]}` : ""}]
                    </button>
                    {!tracklistCounts[track.id] && (
                      <button
                        onClick={() => shazamScan(track.id)}
                        disabled={scanningId === track.id}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:animate-pulse meter-label"
                        title="Shazam scan"
                      >
                        {scanningId === track.id ? "[...]" : "[SCAN]"}
                      </button>
                    )}
                    <button onClick={() => setEditTrack(track)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            )}
        </div>

        {tracklistTrack && (
          <TracklistDialog
            track={tracklistTrack}
            open={!!tracklistTrack}
            onOpenChange={(open) => { if (!open) setTracklistTrack(null); }}
          />
        )}

        {editTrack && (
          <EditTrackDialog
            track={editTrack}
            open={!!editTrack}
            onOpenChange={(open) => { if (!open) setEditTrack(null); }}
            onSave={async (fields) => {
              await updateTrackMeta(editTrack.id, fields);
              setEditTrack(null);
            }}
          />
        )}
      </div>
    </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("admin_token"));
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <TrackManager />;
}
