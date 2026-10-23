import { useEffect, useRef, useCallback } from "react";
import { useTranscriptionStore } from "@/stores/transcriptionStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { apiFetch } from "@/lib/apiFetch";

export const useLiveTranscription = (isActive: boolean) => {
  const { localStream } = useMeetingStore();
  const { addTranscript } = useTranscriptionStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);

  const recordChunk = useCallback(async () => {
    if (!localStream || !isActive) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);

    try {
      let options = { mimeType: "audio/webm;codecs=opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/webm" };
      }

      const recorder = new MediaRecorder(audioStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 1000 && isActive) {
          const formData = new FormData();
          formData.append("audio", e.data, "chunk.webm");

          try {
            const res = await apiFetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              if (data.text && data.text.trim().length > 0) {
                addTranscript(data.text);
              }
            }
          } catch (err) {
            console.error("Transcription chunk failed", err);
          }
        }
      };

      recorder.start();
      
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 7000);
      
    } catch (err) {
      console.error("Failed to start transcription MediaRecorder", err);
    }
  }, [localStream, addTranscript, isActive]);

  useEffect(() => {
    if (isActive && localStream) {
      isRecordingRef.current = true;
      recordChunk();
      
      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current) {
          recordChunk();
        }
      }, 7500);
    } else {
      isRecordingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }

    return () => {
      isRecordingRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isActive, localStream, recordChunk]);
};
