import { useEffect, useRef } from "react";
import { useTranscriptionStore } from "@/stores/transcriptionStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BotMessageSquare } from "lucide-react";

const TranscriptionPanel = () => {
  const { transcripts } = useTranscriptionStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-full">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <BotMessageSquare className="w-6 h-6" />
        </div>
        <p className="font-medium text-foreground">Live Transcription</p>
        <p className="text-sm mt-1">
          Start speaking to see the live transcript here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {transcripts.map((t) => (
            <div
              key={t.id}
              className="bg-card p-3 rounded-lg border border-border shadow-sm"
            >
              <span className="text-xs text-muted-foreground block mb-1">
                {new Date(t.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <p className="text-sm text-foreground">{t.text}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionPanel;
