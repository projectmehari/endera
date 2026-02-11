import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Track, MixTracklistEntry } from "@/lib/radio-types";

interface Props {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TracklistDialog({ track, open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<MixTracklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: "", artist: "", timestamp: "" });
  const { toast } = useToast();
  const token = sessionStorage.getItem("admin_token") || "";

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-tracklist", {
      body: { token, action: "list", mix_id: track.id },
    });
    setEntries(data?.entries || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchEntries();
  }, [open]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setAdding(true);
    const nextPosition = entries.length > 0 ? Math.max(...entries.map((e) => e.position)) + 1 : 1;
    const { data, error } = await supabase.functions.invoke("admin-tracklist", {
      body: {
        token,
        action: "add",
        mix_id: track.id,
        position: nextPosition,
        timestamp_label: timestamp || null,
        track_artist: artist || "Unknown",
        track_title: title,
      },
    });
    if (error || !data?.success) {
      toast({ title: "FAILED TO ADD", variant: "destructive" });
    } else {
      setTitle("");
      setArtist("");
      setTimestamp("");
      fetchEntries();
    }
    setAdding(false);
  };

  const handleDelete = async (entryId: string) => {
    const { data, error } = await supabase.functions.invoke("admin-tracklist", {
      body: { token, action: "delete", entry_id: entryId },
    });
    if (!error && data?.success) fetchEntries();
  };

  const startEdit = (entry: MixTracklistEntry) => {
    setEditingId(entry.id);
    setEditFields({
      title: entry.track_title,
      artist: entry.track_artist,
      timestamp: entry.timestamp_label || "",
    });
  };

  const handleUpdate = async (entryId: string) => {
    const { data, error } = await supabase.functions.invoke("admin-tracklist", {
      body: {
        token,
        action: "update",
        entry_id: entryId,
        track_title: editFields.title,
        track_artist: editFields.artist || "Unknown",
        timestamp_label: editFields.timestamp || null,
      },
    });
    if (error || !data?.success) {
      toast({ title: "FAILED TO UPDATE", variant: "destructive" });
    } else {
      setEditingId(null);
      fetchEntries();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-foreground bg-background p-0 gap-0">
        <DialogTitle className="sr-only">Tracklist for {track.title}</DialogTitle>

        <div className="border-b border-foreground px-4 py-2">
          <span className="meter-label">TRACKLIST — {track.title.toUpperCase()}</span>
        </div>

        <ScrollArea className="max-h-[50vh] p-4">
          {loading ? (
            <p className="meter-label">LOADING...</p>
          ) : entries.length === 0 ? (
            <p className="meter-label">NO ENTRIES</p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => (
                <div key={entry.id}>
                  {editingId === entry.id ? (
                    <div className="space-y-1.5 py-1 border border-foreground/30 p-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <Input
                          value={editFields.timestamp}
                          onChange={(e) => setEditFields({ ...editFields, timestamp: e.target.value })}
                          placeholder="00:15:30"
                          className="font-mono text-xs h-7"
                        />
                        <Input
                          value={editFields.artist}
                          onChange={(e) => setEditFields({ ...editFields, artist: e.target.value })}
                          className="font-mono text-xs h-7"
                        />
                        <Input
                          value={editFields.title}
                          onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                          className="font-mono text-xs h-7"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdate(entry.id)}
                          className="meter-label hover:text-foreground transition-colors"
                        >
                          [SAVE]
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="meter-label hover:text-foreground transition-colors"
                        >
                          [CANCEL]
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-1.5 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="meter-label text-foreground w-6 text-right">{String(entry.position).padStart(2, "0")}</span>
                        <span className="meter-label text-foreground w-16 shrink-0">{entry.timestamp_label || "—"}</span>
                        <span className="text-xs font-mono truncate flex-1">
                          {entry.track_artist.toUpperCase()} — {entry.track_title.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2 pl-8">
                        <button
                          onClick={() => startEdit(entry)}
                          className="meter-label text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-foreground/20 hover:border-foreground"
                        >
                          [EDIT]
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="meter-label text-muted-foreground hover:text-destructive transition-colors px-2 py-1 border border-foreground/20 hover:border-destructive"
                        >
                          [DEL]
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleAdd} className="border-t border-foreground p-4 space-y-2">
          <span className="meter-label">ADD ENTRY</span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="meter-label text-[9px]">TIMESTAMP</Label>
              <Input
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="00:15:30"
                className="font-mono text-xs h-8"
              />
            </div>
            <div>
              <Label className="meter-label text-[9px]">ARTIST</Label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="font-mono text-xs h-8"
              />
            </div>
            <div>
              <Label className="meter-label text-[9px]">TITLE *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-mono text-xs h-8"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="w-full meter-panel px-3 py-1.5 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {adding ? "ADDING..." : "ADD"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}