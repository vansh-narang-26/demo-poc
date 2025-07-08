"use client";

import * as React from "react";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AudioLines, Paperclip, Send } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useChat } from "@/store/useChat";

function Attachments({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-sidebar="attachments"
      data-slot="chat-attachments"
      variant="outline"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      <Paperclip />
      <span className="sr-only">Attachments</span>
    </Button>
  );
}


function SendChat({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-sidebar="send"
      data-slot="chat-send"
      size="icon"
      variant="default"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      <Send />
      <span className="sr-only">Send</span>
    </Button>
  );
}

function VoiceChat({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { sendMessage } = useChat();
  const [isRecording, setIsRecording] = useState(false);
  const [, setTranscript] = useState("");
  const transcriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const handleVoiceClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        setTranscript("");
        transcriptRef.current = "";
        if ('webkitSpeechRecognition' in window) {
          const recognition = new (window as any).webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            console.log("Speech recognition started.");
          };

          recognition.onend = () => {
            console.log("Speech recognition ended.");
          };
          recognition.onerror = (err: any) => {
            console.error("Speech recognition error:", err);
          };
          recognition.onresult = (e: any) => {
            let finalTranscript = "";
            let interimTranscript = "";
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                finalTranscript += e.results[i][0].transcript;
              } else {
                interimTranscript += e.results[i][0].transcript;
              }
            }
            console.log("Interim transcript:", interimTranscript);
            console.log("Final transcript:", finalTranscript);
            setTranscript(finalTranscript);
            transcriptRef.current = finalTranscript;
          };
          recognitionRef.current = recognition;
          recognition.start();
        } else {
          console.warn("webkitSpeechRecognition not available in this browser.");
        }

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log("Audio chunk available:", e.data);
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log("MediaRecorder stopped.");
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (recognitionRef.current) {
            recognitionRef.current.onend = () => {
              console.log("Transcript at recognition end:", transcriptRef.current);
              sendMessage(audioBlob, "audio", transcriptRef.current);
            };
            recognitionRef.current.stop();
          } else {
            sendMessage(audioBlob, "audio", "");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access denied or not available.");
        console.error("Error accessing microphone:", err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    onClick?.(event);
  };

  return (
    <Button
  data-sidebar="voice"
  data-slot="chat-voice"
  size="icon"
  className={cn(
    "size-7 relative transition-colors",
    isRecording
      ? "bg-red-100 animate-pulse ring-2 ring-red-400"
      : "",
    className
  )}
  onClick={handleVoiceClick}
  {...props}
>
  <span className={cn(
    "transition-colors",
    isRecording ? "text-red-600 animate-pulse" : ""
  )}>
    <AudioLines />
  </span>
  <span className="sr-only">Voice</span>
  {isRecording && (
    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
  )}
</Button>

  );
}
interface SuggestionProps extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Suggestion({
  icon,
  label,
  className,
  onClick,
  ...props
}: SuggestionProps) {
  const is1024 = useMediaQuery("(max-width: 1024px)");

  return (
    <Button
      data-sidebar="voice"
      data-slot="chat-voice"
      size="xs"
      variant="outline"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      {icon}
      {!is1024 && <span>{label}</span>}

      <span className="sr-only">{label}</span>
    </Button>
  );
}

export { Attachments, SendChat, VoiceChat, Suggestion };
