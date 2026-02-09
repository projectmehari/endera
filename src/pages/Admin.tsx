import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, GripVertical, Music, LogOut, ArrowUp, ArrowDown } from "lucide-react";
import type { Track } from "@/lib/radio-types";

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
        setError("Invalid password");
      } else {
        sessionStorage.setItem("admin_token", data.token);
        onLogin();
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radio-dark p-4">
      <div className="radio-panel rounded-xl p-8 w-full max-w-sm border border-border">
        <h1 className="font-display text-2xl font-bold radio-glow-text text-center mb-6">
          Admin Access
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-secondary border-border"
              autoFocus
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function TrackManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const token = sessionStorage.getItem("admin_token") || "";

  const fetchTracks = async () => {
    const { data } = await supabase
      .from("tracks" as any)
      .select("*")
      .order("play_order", { ascending: true });
    setTracks((data as unknown as Track[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title) return;

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("admin-upload", {
        body: {
          token,
          title,
          artist: artist || "Unknown",
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type,
        },
      });

      if (error || !data?.success) throw new Error(data?.error || "Upload failed");

      toast({ title: "Track uploaded!" });
      setTitle("");
      setArtist("");
      if (fileRef.current) fileRef.current.value = "";
      fetchTracks();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteTrack = async (track: Track) => {
    const { error } = await supabase.functions.invoke("admin-delete-track", {
      body: { token, trackId: track.id },
    });
    if (!error) {
      toast({ title: "Track deleted" });
      fetchTracks();
    }
  };

  const moveTrack = async (trackId: string, direction: "up" | "down") => {
    const idx = tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tracks.length) return;

    const { error } = await supabase.functions.invoke("admin-reorder", {
      body: {
        token,
        trackId1: tracks[idx].id,
        order1: tracks[swapIdx].play_order,
        trackId2: tracks[swapIdx].id,
        order2: tracks[idx].play_order,
      },
    });
    if (!error) fetchTracks();
  };

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-radio-dark p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold radio-glow-text">Track Manager</h1>
          <div className="flex gap-2">
            <a href="/" className="text-xs text-muted-foreground hover:text-primary font-mono">
              ← radio
            </a>
            <button onClick={logout} className="text-xs text-muted-foreground hover:text-destructive font-mono">
              logout
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="radio-panel rounded-xl p-5 border border-border mb-6">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Track
          </h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Artist</Label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="bg-secondary border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">MP3 File *</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="audio/mpeg,audio/mp3"
                className="bg-secondary border-border mt-1"
                required
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload Track"}
            </Button>
          </form>
        </div>

        {/* Track List */}
        <div className="radio-panel rounded-xl p-5 border border-border">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Music className="w-4 h-4" /> Playlist ({tracks.length} tracks)
          </h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : tracks.length === 0 ? (
            <p className="text-muted-foreground text-sm font-typewriter">No tracks yet. Upload some music!</p>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 group"
                >
                  <span className="text-muted-foreground font-mono text-xs w-5 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{track.title}</p>
                    <p className="text-muted-foreground text-xs truncate">{track.artist}</p>
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">
                    {Math.floor(track.duration_seconds / 60)}:{(track.duration_seconds % 60).toString().padStart(2, "0")}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveTrack(track.id, "up")}
                      disabled={i === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveTrack(track.id, "down")}
                      disabled={i === tracks.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteTrack(track)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
