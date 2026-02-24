"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Plane } from "lucide-react";

interface ToolPart {
  type: string;
  toolName: string;
  toolCallId: string;
  state: string;
  output?: Record<string, unknown>;
}

function ToolResult({ part }: { part: ToolPart }) {
  if (part.state !== "output-available" || !part.output) return null;

  const { toolName, output } = part;

  // Booking created
  if (toolName === "create_booking" && output.success) {
    const event = output.event as Record<string, string>;
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Plane className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700">Booking Created</span>
          </div>
          <p className="font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(event.start).toLocaleString()} –{" "}
            {new Date(event.end).toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Booking conflict
  if (toolName === "create_booking" && !output.success) {
    const conflicts = output.conflicts as string[];
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-3 text-sm">
          <p className="font-medium text-red-700">Scheduling Conflict</p>
          {conflicts?.map((c, i) => (
            <p key={i} className="text-xs text-red-600">
              {c}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Booking cancelled
  if (toolName === "cancel_booking" && output.success) {
    const cancelled = output.cancelled as Record<string, string>;
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-3 text-sm">
          <p className="font-medium text-orange-700">Booking Cancelled</p>
          <p>{cancelled.title}</p>
        </CardContent>
      </Card>
    );
  }

  // Aircraft status
  if (toolName === "get_aircraft_status") {
    const summary = output.summary as Record<string, number>;
    return (
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          {summary.available} Available
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700">
          {summary.inMaintenance} Maintenance
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700">
          {summary.grounded} Grounded
        </Badge>
      </div>
    );
  }

  // Schedule list
  if (toolName === "get_my_schedule") {
    const events = output.events as Record<string, string>[];
    if (!events?.length) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No upcoming events
        </p>
      );
    }
    return (
      <div className="space-y-1.5">
        {events.slice(0, 5).map((e, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded border bg-white p-2 text-sm"
          >
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.start).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {e.type?.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, setMessages } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const history = await res.json();
        if (history.length > 0) {
          setMessages(history);
        }
      }
      setHistoryLoaded(true);
    }
    loadHistory();
  }, [setMessages]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0F1B2D]">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Schedule flights, check availability, manage bookings
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border bg-white p-4 space-y-4"
      >
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1B2D] mb-3">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-[#0F1B2D]">
              Crossocean Flight Assistant
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              I can help you book flights, check schedules, view aircraft
              status, and more. Try asking:
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {[
                "Book a flight training tomorrow 9 AM to 11 AM",
                "What's my schedule this week?",
                "Show available aircraft",
                "Schedule a ground school class on Friday at 2 PM",
              ].map((q) => (
                <button
                  key={q}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  onClick={() => setInput(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F1B2D]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] space-y-2 ${
                  msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-[#1A6FB5] text-white px-4 py-2.5"
                    : ""
                }`}
              >
                {msg.parts.map((part, idx) => {
                  if (part.type === "text" && part.text) {
                    return (
                      <div
                        key={idx}
                        className="text-sm whitespace-pre-wrap leading-relaxed"
                      >
                        {part.text}
                      </div>
                    );
                  }

                  // Tool parts (type starts with "tool-")
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as unknown as ToolPart;
                    if (toolPart.state === "output-available") {
                      return <ToolResult key={idx} part={toolPart} />;
                    }
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running {(toolPart.toolName ?? "tool").replace("_", " ")}...
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && messages.at(-1)?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F1B2D]">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about schedules, book a flight..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-[#1A6FB5] hover:bg-[#155d99]"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
