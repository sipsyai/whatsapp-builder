import { useState, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { LandingPage } from "../features/landing";
import { BuilderPage } from "../features/builder";
import { ChatPage } from "../features/chat/ChatPage";
import { ChatBotsListPage } from "../features/chatbots/components/ChatBotsListPage";
import { UsersPage } from "../features/users/components/UsersPage";
import { WhatsappConfigPage } from "../features/settings/WhatsappConfigPage";
import { FlowsPage } from "../features/flows";
import { SessionsListPage, SessionDetailPage } from "../features/sessions/components";
import { FlowBuilderPage } from "../features/flow-builder/FlowBuilderPage";
import { SideBar } from "../shared/components/SideBar";
import { LoginPage } from "../features/auth/components/LoginPage";
import { useAuth } from "../contexts/AuthContext";
import { flowsApi } from "../features/flows/api";
import type { ViewState } from "../shared/types";
import type { ChatBot } from "../features/chatbots/api";
import type { WhatsAppFlow } from "../features/flows/api";

// Extend ViewState type locally since we can't easily edit shared types without seeing them
type ExtendedViewState = ViewState | "chatbots" | "users" | "flows" | "flowBuilder" | "sessions" | "sessionDetail";

// Parse URL hash to determine initial view state
const parseUrlHash = (): { view: ExtendedViewState; sessionId?: string } => {
  const hash = window.location.hash.slice(1); // Remove # prefix
  if (!hash) return { view: "chatbots" };

  // Parse /sessions/:sessionId format
  const sessionMatch = hash.match(/^sessions\/([a-f0-9-]+)$/i);
  if (sessionMatch) {
    return { view: "sessionDetail", sessionId: sessionMatch[1] };
  }

  // Map hash to view state
  const viewMap: Record<string, ExtendedViewState> = {
    'chatbots': 'chatbots',
    'sessions': 'sessions',
    'users': 'users',
    'flows': 'flows',
    'flowBuilder': 'flowBuilder',
    'settings': 'settings',
    'builder': 'builder',
  };

  return { view: viewMap[hash] || "chatbots" };
};

// Update URL hash based on current view
const updateUrlHash = (view: ExtendedViewState, sessionId?: string | null) => {
  let hash = '';

  if (view === 'sessionDetail' && sessionId) {
    hash = `sessions/${sessionId}`;
  } else if (view !== 'chatbots') {
    hash = view;
  }

  // Update without triggering navigation
  const newUrl = hash ? `#${hash}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
};

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Parse initial state from URL hash
  const initialState = parseUrlHash();

  // Start with chatbots page instead of landing to show sidebar immediately
  const [view, setView] = useState<ExtendedViewState>(initialState.view);
  const [selectedChatBot, setSelectedChatBot] = useState<ChatBot | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialState.sessionId || null);
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);

  // Update URL hash when view or session changes
  useEffect(() => {
    updateUrlHash(view, selectedSessionId);
  }, [view, selectedSessionId]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const { view: newView, sessionId } = parseUrlHash();
      setView(newView);
      if (sessionId) {
        setSelectedSessionId(sessionId);
      } else if (newView !== 'sessionDetail') {
        setSelectedSessionId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Clear selected chatbot when navigating away from builder
  useEffect(() => {
    if (view !== "builder") {
      setSelectedChatBot(null);
    }
  }, [view]);

  // Clear selected session when navigating away from session detail
  useEffect(() => {
    if (view !== "sessionDetail") {
      setSelectedSessionId(null);
    }
  }, [view]);

  // Clear selected flow when navigating away from flow builder
  useEffect(() => {
    if (view !== "flowBuilder") {
      setSelectedFlow(null);
    }
  }, [view]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-emerald-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar Navigation - shown on all pages except landing */}
        {view !== "landing" && (
          <SideBar currentView={view} onNavigate={(newView) => setView(newView as ExtendedViewState)} />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {view === "landing" && <LandingPage onStart={() => setView("chatbots")} />}
          {view === "builder" && <BuilderPage
            onSwitchToChat={() => setView("chat")}
            initialFlow={selectedChatBot || undefined}
            onFlowSaved={() => {
              // Optional: could refresh chatbots list or show notification
            }}
          />}
          {view === "chat" && <ChatPage onBack={() => setView("builder")} />}
          {view === "chatbots" && <ChatBotsListPage
            onNavigate={(path) => {
              if (path === '/builder') setView("builder");
            }}
            onLoadChatBot={(chatbot) => {
              setSelectedChatBot(chatbot);
              setView("builder");
            }}
          />}
          {view === "users" && <UsersPage />}
          {view === "flows" && <FlowsPage
            onEditInBuilder={(flow) => {
              setSelectedFlow(flow);
              setView("flowBuilder");
            }}
          />}
          {view === "flowBuilder" && selectedFlow && (
            <FlowBuilderPage
              initialFlowId={selectedFlow.id}
              initialFlowData={{
                version: '7.2',
                name: selectedFlow.name,
                screens: selectedFlow.flowJson.screens,
              }}
              onSave={async (flowJson) => {
                try {
                  // Update flow via API
                  await flowsApi.update(selectedFlow.id, {
                    name: flowJson.name,
                    flowJson: flowJson,
                  });

                  // Navigate back to flows page
                  setView("flows");
                } catch (error) {
                  console.error('Failed to save flow:', error);
                  throw error; // Re-throw to let FlowBuilderPage handle the error
                }
              }}
              onBack={() => setView("flows")}
            />
          )}
          {view === "sessions" && <SessionsListPage
            onViewSession={(sessionId) => {
              setSelectedSessionId(sessionId);
              setView("sessionDetail");
            }}
          />}
          {view === "sessionDetail" && selectedSessionId && <SessionDetailPage
            sessionId={selectedSessionId}
            onBack={() => setView("sessions")}
          />}
          {view === "settings" && <WhatsappConfigPage />}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
