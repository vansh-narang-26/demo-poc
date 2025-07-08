
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export interface DocumentAttachment {
  filename: string;
  content: string;
  mime_type: string;
  size: number;
  document_type?: string;
  generated_at?: string;
}

export interface ComponentBreakdown {
  component_name: string;
  component_category: string;
  cost_eur: number;
  cost_per_sqm: number;
  priority_level: string;
  lifecycle_years: number | null;
  replacement_urgency: string | null;
}

export interface QualityLevelData {
  quality_level: string;
  total_cost_eur: number;
  cost_per_sqm: number;
  component_breakdown: ComponentBreakdown[];
}

export interface MultiQualityData {
  project_area_sqm: number;
  quality_costs: {
    [key: string]: QualityLevelData;
  };
}

export interface CostEstimate {
  total_cost_eur: number;
  cost_per_sqm: number;
  component_breakdown: ComponentBreakdown[];
  priority_components: string[];
  sql_query_used: string;
  confidence_level: string;
  document_attachment?: DocumentAttachment;
  is_multi_quality: boolean;
  multi_quality_data?: MultiQualityData;
}

export interface Message {
  id: string;
  content: string | Blob;
  role: "user" | "assistant";
  mediaType?: "text" | "audio" | "image" | "video" | "document";
  mediaUrl?: string;
  transcript?: string;
  timestamp: Date;
  cost_estimate?: CostEstimate;
  documentAttachment?: DocumentAttachment;
}

interface ChatState {
  messages: Message[];
  hasStartedConversation: boolean;
  isLoading: boolean;
  sessionId: string;
  createdAt: string;
  abortController: AbortController | null;
  suggestedQuestions: string[];
  formPayload: any;

  addMessage: (
    content: string | Blob,
    role: "user" | "assistant",
    mediaType?: "text" | "audio" | "document",
    mediaUrl?: string,
    transcript?: string,
    documentAttachment?: DocumentAttachment,
    costEstimate?: CostEstimate
  ) => void;

  sendMessage: (
    content: string | Blob,
    mediaType?: "text" | "audio",
    transcript?: string,
    userEmail?: string
  ) => Promise<void>;

  clearMessages: () => void;
  cancelOngoingRequest: () => void;
  loadMessagesForSession: (sessionId: string) => void;
  initializeNewSession: () => void;
}

const SESSION_STORAGE_KEY = "chatHistory";

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  hasStartedConversation: false,
  isLoading: false,
  sessionId: uuidv4(),
  createdAt: new Date().toISOString(),
  abortController: null,
  suggestedQuestions: [],
  formPayload: null,

  addMessage: (
    content,
    role,
    mediaType,
    mediaUrl,
    transcript,
    documentAttachment,
    costEstimate
  ) => {
    const message: Message = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
      mediaType,
      mediaUrl,
      transcript,
      documentAttachment,
      cost_estimate: costEstimate,
    };
    const newMessages = [...get().messages, message];
    set({ messages: newMessages, hasStartedConversation: true });

    const { sessionId, createdAt } = get();
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const sessions = stored ? JSON.parse(stored) : {};
    sessions[sessionId] = { id: sessionId, createdAt, messages: newMessages };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event("chatHistoryUpdated"));
  },

  sendMessage: async (
    content,
    mediaType = "text",
    transcript,
    userEmail = "web_user"
  ) => {
    const { addMessage, cancelOngoingRequest, sessionId } = get();
    cancelOngoingRequest();
    set({ isLoading: true, formPayload: null });

    const controller = new AbortController();
    set({ abortController: controller });

    if (mediaType === "audio" && content instanceof Blob) {
      const audioUrl = URL.createObjectURL(content);
      addMessage("", "user", mediaType, audioUrl, transcript);
    } else if (mediaType === "text" && typeof content === "string") {
      addMessage(content, "user", mediaType);
    }
    //https://generali-backend.stage.neuralcompany.team/

    const streamUrl = `https://generali-backend.stage.neuralcompany.team/chat/stream?message=${encodeURIComponent(
      typeof content === "string" ? content : transcript || ""
    )}&user_id=${encodeURIComponent(userEmail)}&thread_id=${sessionId}`;

    const eventSource = new EventSource(streamUrl);
    let resultBlockId = uuidv4();
    let finalText = "";
    let suggestions: string[] = [];

    const streamWordByWord = (text: string) => {
      const words = text.split(" ");
      let i = 0;
      const loop = () => {
        if (i >= words.length) return;
        finalText += (finalText ? " " : "") + words[i];
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === resultBlockId && typeof msg.content === "string"
              ? { ...msg, content: finalText }
              : msg
          ),
        }));
        i++;
        setTimeout(loop, 30);
      };
      loop();
    };

    const removeInitAndFinalBlocks = () => {
      return get().messages.filter(
        (msg) =>
          !(
            msg.role === "assistant" &&
            typeof msg.content === "string" &&
            (msg.content.includes("⌛ Initialization") ||
              msg.content.includes("Analysis completed"))
          )
      );
    };

    eventSource.addEventListener("thinking", () => {
      const exists = get().messages.find(
        (m) =>
          m.role === "assistant" &&
          typeof m.content === "string" &&
          m.content === "Analyzing your query..."
      );
      if (!exists) {
        addMessage("Analyzing your query...", "assistant", "text");
      }
    });

    eventSource.addEventListener("start", (e) => {
      const data = JSON.parse(e.data);
      const currentMessages = removeInitAndFinalBlocks();
      currentMessages.push({
        id: uuidv4(),
        content: `⌛ Initialization — ${data.message}`,
        role: "assistant",
        timestamp: new Date(),
        mediaType: "text",
      });
      set({ messages: currentMessages });
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      addMessage(data.message || "Working...", "assistant", "text");
    });

    eventSource.addEventListener("form", (e) => {
      const data = JSON.parse(e.data);
      set({ formPayload: data });
    });

    eventSource.addEventListener("result", (e) => {
      const data = JSON.parse(e.data);
      suggestions = data.suggested_question || [];
      resultBlockId = uuidv4();
      const updatedMessages = removeInitAndFinalBlocks();

      // Handle nested cost_estimate structure
      const costEstimate = data.cost_estimate as CostEstimate;
      const documentAttachment = costEstimate?.document_attachment;

      if (documentAttachment) {
        updatedMessages.push({
          id: uuidv4(),
          content: "Document ready for download",
          role: "assistant",
          timestamp: new Date(),
          mediaType: "document",
          documentAttachment: documentAttachment,
        });
      }

      // Handle legacy document_attachment (backward compatibility)
      if (data.document_attachment && !documentAttachment) {
        updatedMessages.push({
          id: uuidv4(),
          content: "Document ready for download",
          role: "assistant",
          timestamp: new Date(),
          mediaType: "document",
          documentAttachment: data.document_attachment,
        });
      }

      updatedMessages.push({
        id: uuidv4(),
        content: "Analysis completed — here are the insights.",
        role: "assistant",
        timestamp: new Date(),
        mediaType: "text",
      });

      updatedMessages.push({
        id: resultBlockId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        mediaType: "text",
        cost_estimate: costEstimate,
      });

      set({ messages: updatedMessages });
      streamWordByWord(data.response || "");
    });

    eventSource.addEventListener("end", () => {
      set({
        isLoading: false,
        abortController: null,
        suggestedQuestions: suggestions,
      });
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("SSE error", err);
      eventSource.close();
      set({ isLoading: false, abortController: null });
    };

    set({
      abortController: {
        abort: () => eventSource.close(),
      } as any,
    });
  },

  clearMessages: () =>
    set({
      messages: [],
      hasStartedConversation: false,
      isLoading: false,
      sessionId: uuidv4(),
      createdAt: new Date().toISOString(),
      suggestedQuestions: [],
      formPayload: null,
    }),

  cancelOngoingRequest: () => {
    const controller = get().abortController;
    controller?.abort();
    set({ abortController: null });
  },

  loadMessagesForSession: (sessionId) => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const sessions = stored ? JSON.parse(stored) : {};
    const session = sessions[sessionId];
    if (session) {
      set({
        sessionId,
        messages: session.messages,
        hasStartedConversation: session.messages.length > 0,
        createdAt: session.createdAt,
        suggestedQuestions: [],
        formPayload: null,
      });
    }
  },

  initializeNewSession: () => {
    set({
      sessionId: uuidv4(),
      messages: [],
      hasStartedConversation: false,
      createdAt: new Date().toISOString(),
      suggestedQuestions: [],
      formPayload: null,
    });
  },
}));
