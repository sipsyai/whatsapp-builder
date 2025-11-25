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
import { flowsApi } from "../features/flows/api";
import type { ViewState } from "../shared/types";
import type { ChatBot } from "../features/chatbots/api";
import type { WhatsAppFlow } from "../features/flows/api";

// Extend ViewState type locally since we can't easily edit shared types without seeing them
type ExtendedViewState = ViewState | "chatbots" | "users" | "flows" | "flowBuilder" | "sessions" | "sessionDetail";

const App = () => {
  // Start with chatbots page instead of landing to show sidebar immediately
  const [view, setView] = useState<ExtendedViewState>("chatbots");
  const [selectedChatBot, setSelectedChatBot] = useState<ChatBot | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);

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
