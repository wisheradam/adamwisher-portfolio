"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AskAdamMessage,
  AskAdamRequest,
  AskAdamResponse,
  AskAdamErrorResponse,
} from "@/types/ask-adam";

const SUGGESTED_QUESTIONS = [
  "What are Adam's strongest skills?",
  "Show me his AI experience",
  "Which projects should I look at?",
  "Tell me about Adam's technical background",
];

export function AskAdam() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<AskAdamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);
    setInput("");

    const userMessage: AskAdamMessage = { role: "user", content: trimmed };
    const nextHistory = [...history, userMessage];
    setHistory(nextHistory);

    try {
      const payload: AskAdamRequest = {
        question: trimmed,
        history,
      };

      const res = await fetch("/api/ask-adam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | AskAdamErrorResponse
          | null;
        throw new Error(errBody?.error ?? "Ask Adam couldn't process that question.");
      }

      const data = (await res.json()) as AskAdamResponse;
      setHistory([...nextHistory, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong reaching Ask Adam. Try again in a moment."
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitQuestion(input);
  }

  return (
    <section
      aria-labelledby="ask-adam-heading"
      className="rounded-lg border border-white/[0.14] bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(59,130,246,0.18)]",
            !isLoading && "animate-blink"
          )}
          aria-hidden="true"
        />
        <h2
          id="ask-adam-heading"
          className="font-display text-sm font-medium tracking-wide"
        >
          Ask Adam
        </h2>
        <span
          aria-hidden="true"
          className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent"
        >
          AI
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Ask my AI assistant about my experience, projects, skills or
        background.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="ask-adam-input" className="sr-only">
          Ask about Adam&apos;s product experience
        </label>
        <input
          id="ask-adam-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about my product experience..."
          disabled={isLoading}
          autoComplete="off"
          className="focus-ring h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          aria-label="Send question to Ask Adam"
        >
          {isLoading ? (
            <span className="text-xs" aria-hidden="true">
              …
            </span>
          ) : (
            <span aria-hidden="true">→</span>
          )}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => submitQuestion(q)}
            disabled={isLoading}
            className="focus-ring rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-xs text-red-400">
          {error}
        </p>
      )}

      {history.length > 0 && (
        <div
          className="mt-5 flex max-h-80 flex-col gap-3 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {history.map((message, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md border px-3 py-2 text-sm leading-relaxed",
                message.role === "user"
                  ? "self-end border-border bg-background/60"
                  : "self-start border-accent/30 bg-accent/10"
              )}
            >
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {message.role === "user" ? "You" : "Ask Adam"}
              </span>
              {message.content}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
