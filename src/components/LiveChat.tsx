import { useState, useRef, useEffect, useCallback } from "react";
import { useChatMessages } from "@/hooks/useChatMessages";
import { formatDistanceToNowStrict } from "date-fns";
import { Minus, Send } from "lucide-react";

const STORAGE_KEY = "endera_chat_name";
const MAX_LENGTH = 280;

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [nameInput, setNameInput] = useState("");
  const [draft, setDraft] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);

  const { messages, isLoading, sendMessage } = useChatMessages();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);
  const isNearBottom = useRef(true);
  const [, setTick] = useState(0);

  // Auto-refresh timestamps every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 60;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    if (isNearBottom.current) setShowNewBadge(false);
  }, []);

  // Auto-scroll or show badge on new messages
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      if (isOpen && isNearBottom.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (isOpen && !isNearBottom.current) {
        setShowNewBadge(true);
      } else if (!isOpen) {
        setHasUnread(true);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length, isOpen]);

  // Scroll to bottom when opening
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  }, [isOpen]);

  const handleJoin = () => {
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem(STORAGE_KEY, name);
    setUsername(name);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !username) return;
    setDraft("");
    try {
      await sendMessage(username, text);
    } catch {
      // silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewBadge(false);
  };

  // ── Collapsed button ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 meter-panel px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-secondary transition-colors"
      >
        <span className={hasUnread ? "meter-dot-active" : "meter-dot"} />
        <span className="meter-value text-[11px]">CHAT</span>
      </button>
    );
  }

  // ── Expanded panel ──
  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 h-[420px] meter-panel flex flex-col shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="meter-dot-active" />
          <span className="meter-value text-[11px]">ENDERA CHAT</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="meter-label">{messages.length > 0 ? `${messages.length} msgs` : ""}</span>
          <button onClick={() => setIsOpen(false)} className="hover:bg-secondary p-1 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Name prompt overlay */}
      {!username ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="meter-inset p-4 w-full space-y-3">
            <p className="meter-label text-center">ENTER DISPLAY NAME</p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={20}
              placeholder="Your name..."
              className="w-full bg-background border border-border px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <button
              onClick={handleJoin}
              disabled={!nameInput.trim()}
              className="w-full meter-panel py-1.5 meter-value text-[11px] hover:bg-secondary transition-colors disabled:opacity-40"
            >
              JOIN
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-2"
          >
            {isLoading && <p className="meter-label text-center">LOADING...</p>}
            {messages.map((msg) => {
              const isAdmin = msg.username.toLowerCase() === "endera";
              return (
                <div
                  key={msg.id}
                  className={`text-xs ${isAdmin ? "border-l-2 border-destructive pl-2" : ""}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="meter-value text-[10px]">{msg.username}</span>
                    <span className="meter-label">
                      {formatDistanceToNowStrict(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-mono text-foreground leading-snug mt-0.5">{msg.message}</p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* New messages badge */}
          {showNewBadge && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 meter-panel px-3 py-1 meter-value text-[9px] animate-pulse cursor-pointer"
            >
              ▼ NEW
            </button>
          )}

          {/* Input */}
          <div className="border-t border-border p-2">
            <div className="meter-inset flex items-center">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-transparent px-2 py-1.5 text-xs font-mono focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="px-2 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <span className="meter-label">{draft.length}/{MAX_LENGTH}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
