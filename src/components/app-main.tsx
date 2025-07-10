"use client";

import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import ChatInput from "./chat-input/chat-input";
import { useChat } from "@/store/useChat";
import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const StepBubble = ({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: "info" | "success";
}) => {
  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-2 ${
        type === "success"
          ? "bg-green-50 border-green-300"
          : "bg-blue-50 border-blue-300"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold flex items-center gap-2 dark:text-black">
            {type === "success" ? "✅" : "⏳"} {title}
          </p>
          <p className="text-sm text-gray-700 mt-1">{description}</p>
        </div>
        <span className="text-xs text-gray-400 pt-1">{time}</span>
      </div>
    </div>
  );
};

const isThinkingMessage = (content: string) =>
  content.startsWith("**Thinking**") ||
  content.startsWith("**Thinking Complete**");

const SkeletonBubble = () => (
  <div className="w-full max-w-4xl mx-auto">
    <div className="rounded-xl border px-4 py-3 mb-2 bg-gray-100 animate-pulse dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2 dark:bg-neutral-700"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3 dark:bg-neutral-700"></div>
    </div>
  </div>
);

const FormRenderer = ({ form }: { form: any }) => {
  const { sendMessage } = useChat();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entries: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      entries[key] = value.toString();
    }

    const formatted = Object.entries(entries)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const message = `I've provided the following project details: ${formatted}`;
    sendMessage(message, "text");
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-5 mb-10">
      <h2 className="text-xl font-semibold text-blue-700 mb-6">
        {form.data.title}
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {form.data.fields.map((field: any, idx: number) => (
          <div key={idx}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {field.label}
            </label>

            {["text", "number"].includes(field.type) && (
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "select" && (
              <select
                name={field.name}
                required={field.required}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Select an option</option>
                {field.options.map((opt: any, i: number) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition"
        >
          {form.data.submit_label || "Submit"}
        </button>
      </form>
    </div>
  );
};

function extractDocumentInfo(content: string) {
  const filenameMatch = content.match(/Filename: (.+)/);
  const sizeMatch = content.match(/Size: ([\d,]+)/);
  const typeMatch = content.match(/Type: (.+)/);
  const base64Match = content.match(/Base64Content: ([A-Za-z0-9+/=]+)/);
  if (filenameMatch && sizeMatch && typeMatch && base64Match) {
    return {
      filename: filenameMatch[1].trim(),
      size: parseInt(sizeMatch[1].replace(/,/g, ""), 10),
      type: typeMatch[1].trim(),
      content: base64Match[1],
    };
  }
  return null;
}

export default function AppMain() {
  const {
    messages,
    hasStartedConversation,
    isLoading,
    suggestedQuestions,
    sendMessage,
    formPayload,
  } = useChat();

  const [removedBubbles, setRemovedBubbles] = useState(new Set());
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(
    new Set()
  );

  // Auto-collapse completed thinking messages
  useEffect(() => {
    // Find all thinking messages
    const thinkingMessages = messages.filter(
      (m) =>
        m.role === "assistant" &&
        typeof m.content === "string" &&
        isThinkingMessage(m.content)
    );
    // Find the last thinking message
    const lastThinking =
      thinkingMessages.length > 0
        ? thinkingMessages[thinkingMessages.length - 1]
        : null;
    // Find the index of the last thinking message
    const lastThinkingIndex = lastThinking
      ? messages.findIndex((m) => m.id === lastThinking.id)
      : -1;
    // If there is a new assistant message after the last thinking message, collapse it
    if (lastThinking && lastThinkingIndex !== -1) {
      const hasCompleted = messages
        .slice(lastThinkingIndex + 1)
        .some(
          (m) =>
            m.role === "assistant" &&
            typeof m.content === "string" &&
            !isThinkingMessage(m.content)
        );
      if (hasCompleted && !collapsedMessages.has(lastThinking.id)) {
        setCollapsedMessages((prev) => new Set([...prev, lastThinking.id]));
      }
    }
  }, [messages]);

  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [visiblePromptIndex, setVisiblePromptIndex] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    };
    const container = chatContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (suggestedQuestions.length > 0) {
      setVisiblePromptIndex(0);
      const interval = setInterval(() => {
        setVisiblePromptIndex((prev) =>
          prev < suggestedQuestions.length ? prev + 1 : prev
        );
      }, 400);
      return () => clearInterval(interval);
    }
  }, [suggestedQuestions]);

  //add
  useEffect(() => {
    setRemovedBubbles(new Set());
  }, [messages.filter((m) => m.role === "user").length]);

  const latestUserMessageIndex = [...messages]
    .reverse()
    .findIndex((m) => m.role === "user");
  const latestUserMessageActualIndex =
    latestUserMessageIndex !== -1
      ? messages.length - 1 - latestUserMessageIndex
      : -1;
  const processingSteps = messages.filter(
    (m, index) =>
      m.role === "assistant" &&
      typeof m.content === "string" &&
      (m.content.includes("⌛ Initialization") ||
        m.content.includes("🤖 Analyzing") ||
        m.content.includes("Analysis completed") ||
        m.content === "skeleton") &&
      !removedBubbles.has(m.id) &&
      // Only show steps after the latest user message
      (latestUserMessageActualIndex !== -1
        ? index > latestUserMessageActualIndex
        : true)
  );

  //Added
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    processingSteps.forEach((msg) => {
      if (
        typeof msg.content === "string" &&
        msg.content.includes("completed")
      ) {
        const timer = setTimeout(() => {
          setRemovedBubbles((prev) => new Set([...prev, msg.id]));
        }, 4000); // Show green state for 4 seconds before removing

        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [processingSteps.map((m) => m.id).join(",")]);

  return (
    <div className="flex flex-col h-full w-full">
      {hasStartedConversation ? (
        <>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto min-h-0 pb-4"
          >
            <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto pt-4">
              {messages.map((message, index) => {
                const parsedDoc =
                  typeof message.content === "string"
                    ? extractDocumentInfo(message.content)
                    : null;

                // Show StepBubble for initialization/processing steps
                if (
                  message.role === "assistant" &&
                  typeof message.content === "string" &&
                  (message.content.includes("⌛ Initialization") ||
                    message.content.includes("🤖 Analyzing") ||
                    message.content.includes("Analysis completed") ||
                    message.content === "skeleton") &&
                  !removedBubbles.has(message.id)
                ) {
                  return (
                    <StepBubble
                      key={message.id}
                      title={
                        message.content.includes("⌛ Initialization")
                          ? "Initialization"
                          : message.content.includes("🤖 Analyzing")
                          ? "Analyzing"
                          : message.content.includes("Analysis completed")
                          ? "Analysis completed"
                          : "Processing..."
                      }
                      description={message.content}
                      time={new Date().toLocaleTimeString()}
                      type={
                        message.content.includes("Analysis completed")
                          ? "success"
                          : "info"
                      }
                    />
                  );
                }

                return (
                  <div key={message.id}>
                    {message.role === "user" && (
                      <div className="flex w-full justify-end">
                        <div className="bg-gray-100 dark:bg-neutral-700 ml-auto max-w-[80%] rounded-2xl py-2 px-4 text-base mb-2">
                          {typeof message.content === "string"
                            ? message.content
                            : ""}
                        </div>
                      </div>
                    )}

                    {message.role === "assistant" && parsedDoc ? (
                      <div className="flex w-full justify-start">
                        <div className="w-full max-w-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 rounded-xl px-5 py-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                📄 {parsedDoc.filename}
                              </p>
                              <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                                <tbody>
                                  <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                                      Type
                                    </td>
                                    <td className="px-3 py-2 text-gray-800 dark:text-white">
                                      {parsedDoc.type}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                                      Size
                                    </td>
                                    <td className="px-3 py-2 text-gray-800 dark:text-white">
                                      {(parsedDoc.size / 1024).toFixed(1)} KB
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="flex flex-col justify-between items-start space-y-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                This is a professionally generated CAPEX report.
                                Click below to download.
                              </p>
                              <button
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                                onClick={() => {
                                  const byteCharacters = atob(
                                    parsedDoc.content
                                  );
                                  const byteNumbers = new Array(
                                    byteCharacters.length
                                  );
                                  for (
                                    let i = 0;
                                    i < byteCharacters.length;
                                    i++
                                  ) {
                                    byteNumbers[i] =
                                      byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], {
                                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = parsedDoc.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                ⬇️ Download Document
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : message.role === "assistant" &&
                      typeof message.content === "string" &&
                      !message.content.includes("⌛") &&
                      !message.content.includes("🤖") &&
                      message.content !== "skeleton" ? (
                      <div className="flex w-full justify-start">
                        <div
                          className={`prose dark:prose-invert max-w-none px-4 py-3 rounded-2xl w-full
                            ${
                              message.documentAttachment
                                ? "bg-gray-50 dark:bg-neutral-800 border border-gray-400 dark:border-neutral-700 shadow-md py-6 px-8"
                                : isThinkingMessage(message.content)
                                ? "bg-gray-50 dark:bg-neutral-800 border border-gray-400 dark:border-neutral-700 px-8 py-8 flex flex-col gap-5"
                                : "bg-white dark:bg-neutral-900"
                            }
                          `}
                        >
                          {isThinkingMessage(message.content) ? (
                            <div className="w-full relative">
                              <button
                                onClick={() =>
                                  toggleMessageCollapse(message.id)
                                }
                                className="absolute top-2 right-2 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 bg-transparent px-2 py-1 z-10"
                                style={{ outline: "none" }}
                              >
                                <span>
                                  {collapsedMessages.has(message.id) ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      className="lucide lucide-chevron-down-icon lucide-chevron-down"
                                    >
                                      <path d="m6 9 6 6 6-6" />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      className="lucide lucide-chevron-up-icon lucide-chevron-up"
                                    >
                                      <path d="m18 15-6-6-6 6" />
                                    </svg>
                                  )}
                                </span>
                                <span className="sr-only">
                                  Toggle Thinking Process
                                </span>
                              </button>
                              <div>
                                {collapsedMessages.has(message.id) ? (
                                  <div className="mt-2 text-gray-500 dark:text-gray-400 pr-10">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {message.content
                                        .split("\n")[0]
                                        .slice(0, 120) +
                                        (message.content.length > 120
                                          ? "..."
                                          : "")}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="mt-2 pr-10">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        table: ({ node, ...props }) => (
                                          <table
                                            className="w-full table-auto border-collapse border border-gray-300 dark:border-neutral-700 mb-5 mt-5"
                                            {...props}
                                          />
                                        ),
                                        thead: ({ node, ...props }) => (
                                          <thead
                                            className="bg-gray-100 dark:bg-neutral-800"
                                            {...props}
                                          />
                                        ),
                                        tr: ({ node, ...props }) => (
                                          <tr
                                            className="border-b border-gray-300 dark:border-neutral-700"
                                            {...props}
                                          />
                                        ),
                                        th: ({ node, ...props }) => (
                                          <th
                                            className="px-4 py-2 text-left font-semibold border border-gray-300 dark:border-neutral-700"
                                            {...props}
                                          />
                                        ),
                                        td: ({ node, ...props }) => (
                                          <td
                                            className="px-4 py-2 border border-gray-300 dark:border-neutral-700"
                                            {...props}
                                          />
                                        ),
                                        ul: ({ node, ...props }) => (
                                          <ul
                                            className="list-disc list-inside ml-5 mb-4"
                                            {...props}
                                          />
                                        ),
                                        li: ({ node, ...props }) => (
                                          <li className="mb-1" {...props} />
                                        ),
                                        h3: ({ node, ...props }) => (
                                          <h3
                                            className="font-medium mt-2 mb-2"
                                            {...props}
                                          />
                                        ),
                                        h2: ({ node, ...props }) => (
                                          <h2
                                            className="text-lg font-semibold mt-2 mb-2"
                                            {...props}
                                          />
                                        ),
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ node, ...props }) => (
                                  <table
                                    className="w-full table-auto border-collapse border border-gray-300 dark:border-neutral-700 mb-5 mt-5"
                                    {...props}
                                  />
                                ),
                                thead: ({ node, ...props }) => (
                                  <thead
                                    className="bg-gray-100 dark:bg-neutral-800"
                                    {...props}
                                  />
                                ),
                                tr: ({ node, ...props }) => (
                                  <tr
                                    className="border-b border-gray-300 dark:border-neutral-700"
                                    {...props}
                                  />
                                ),
                                th: ({ node, ...props }) => (
                                  <th
                                    className="px-4 py-2 text-left font-semibold border border-gray-300 dark:border-neutral-700"
                                    {...props}
                                  />
                                ),
                                td: ({ node, ...props }) => (
                                  <td
                                    className="px-4 py-2 border border-gray-300 dark:border-neutral-700"
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className="list-disc list-inside ml-5 mb-4"
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="mb-1" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    className="font-medium mt-2 mb-2"
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className="text-lg font-semibold mt-2 mb-2"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                          {message.documentAttachment && (
                            <div className="w-full mt-4">
                              <button
                                className="group relative flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-sm shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                aria-label={`Download ${message.documentAttachment.filename}`}
                                onClick={() => {
                                  if (!message.documentAttachment) return;

                                  const byteCharacters = atob(
                                    message.documentAttachment.content
                                  );
                                  const byteNumbers = new Array(
                                    byteCharacters.length
                                  );
                                  for (
                                    let i = 0;
                                    i < byteCharacters.length;
                                    i++
                                  ) {
                                    byteNumbers[i] =
                                      byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], {
                                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download =
                                    message.documentAttachment.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                Download{" "}
                                <span className="font-semibold">
                                  {message.documentAttachment.filename}
                                </span>
                                <span className="ml-2 text-sm">
                                  ({message.documentAttachment.size} KB)
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {isLoading && <SkeletonBubble />}
              {formPayload && <FormRenderer form={formPayload} />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto py-2 relative">
            {showScrollButton && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 rounded-full shadow-md">
                <Button variant="outline" size="icon" onClick={scrollToBottom}>
                  <ArrowDown />
                </Button>
              </div>
            )}

            {suggestedQuestions.length > 0 && visiblePromptIndex > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {suggestedQuestions
                  .slice(0, visiblePromptIndex)
                  .map((question, idx) => (
                    <button
                      key={idx}
                      className="text-sm px-3 py-2 bg-gray-100 text-black border border-black rounded-full hover:bg-gray-200 transition"
                      style={{
                        animationDelay: `${idx * 200}ms`,
                        animationFillMode: "forwards",
                      }}
                      onClick={() => {
                        sendMessage(question, "text");
                        setVisiblePromptIndex(0);
                      }}
                    >
                      {question}
                    </button>
                  ))}
              </div>
            )}

            <ChatInput />
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full max-w-xxl mx-auto">
          <ChatInput />
        </div>
      )}
    </div>
  );
}
