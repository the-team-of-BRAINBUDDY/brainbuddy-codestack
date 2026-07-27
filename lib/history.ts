export type HistoryItem = {
  id: string;
  type: "AI Tutor" | "PDF Chat" | "Voice Assistant" | "Quiz" | "Whiteboard" | "Notes" | "Planner" | "Search" | "Presentation" | "Video Summary" | "General";
  title: string;
  detail?: string;
  timestamp: number;
  formattedDate: string;
};

const STORAGE_KEY = "brainbuddy_history";

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getInitialSampleHistory();
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load history:", e);
    return [];
  }
}

export function addHistoryItem(
  type: HistoryItem["type"],
  title: string,
  detail?: string
): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getHistory();
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type,
      title,
      detail,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const updated = [newItem, ...current.filter(item => item.id !== newItem.id)].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save history item:", e);
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
}

function getInitialSampleHistory(): HistoryItem[] {
  const samples: HistoryItem[] = [
    {
      id: "sample-1",
      type: "AI Tutor",
      title: "Asked about Quantum Physics basics",
      detail: "Explained wave-particle duality and Schrödinger's equation.",
      timestamp: Date.now() - 3600000 * 2,
      formattedDate: new Date(Date.now() - 3600000 * 2).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      id: "sample-2",
      type: "Notes",
      title: "Generated notes for Machine Learning",
      detail: "Topic: Neural Networks (Detailed)",
      timestamp: Date.now() - 3600000 * 5,
      formattedDate: new Date(Date.now() - 3600000 * 5).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      id: "sample-3",
      type: "Planner",
      title: "Added task: Complete Calculus practice",
      detail: "Time: 14:00",
      timestamp: Date.now() - 3600000 * 24,
      formattedDate: new Date(Date.now() - 3600000 * 24).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ];
  return samples;
}
