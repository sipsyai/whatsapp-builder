import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { LandingPage } from "../features/landing";
import { BuilderPage } from "../features/builder";
import { ChatPage } from "../features/chat/ChatPage";
import { FlowsListPage } from "../features/flows/components/FlowsListPage";
import { UsersPage } from "../features/users/components/UsersPage";
import { SideBar } from "../shared/components/SideBar";
import type { ViewState } from "../shared/types";

// Extend ViewState type locally since we can't easily edit shared types without seeing them
type ExtendedViewState = ViewState | "flows" | "users";

const App = () => {
  // Start with flows page instead of landing to show sidebar immediately
  const [view, setView] = useState<ExtendedViewState>("flows");

  return (
    <ReactFlowProvider>
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar Navigation - shown on all pages except landing */}
        {view !== "landing" && (
          <SideBar currentView={view} onNavigate={(newView) => setView(newView as ExtendedViewState)} />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {view === "landing" && <LandingPage onStart={() => setView("flows")} />}
          {view === "builder" && <BuilderPage onSwitchToChat={() => setView("chat")} />}
          {view === "chat" && <ChatPage onBack={() => setView("builder")} />}
          {view === "flows" && <FlowsListPage onNavigate={(path) => {
            if (path === '/builder') setView("builder");
            // Handle other paths or query params if needed
          }} />}
          {view === "users" && <UsersPage />}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
