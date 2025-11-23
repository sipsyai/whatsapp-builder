import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { LandingPage } from "../features/landing";
import { BuilderPage } from "../features/builder";
import { ChatPage } from "../features/chat/ChatPage";
import { FlowsListPage } from "../features/flows/components/FlowsListPage";
import { UsersPage } from "../features/users/components/UsersPage";
import type { ViewState } from "../shared/types";

// Extend ViewState type locally since we can't easily edit shared types without seeing them
type ExtendedViewState = ViewState | "flows" | "users";

const App = () => {
  const [view, setView] = useState<ExtendedViewState>("landing");

  return (
    <ReactFlowProvider>
      {view === "landing" && <LandingPage onStart={() => setView("builder")} />}
      {view === "builder" && <BuilderPage onSwitchToChat={() => setView("chat")} />}
      {view === "chat" && <ChatPage onBack={() => setView("builder")} />}
      {view === "flows" && <FlowsListPage onNavigate={(path) => {
        if (path === '/builder') setView("builder");
        // Handle other paths or query params if needed
      }} />}
      {view === "users" && <UsersPage />}

      {/* Temporary Navigation for testing new pages */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button onClick={() => setView("flows")} className="px-3 py-1 bg-gray-800 text-white rounded text-xs">Flows</button>
        <button onClick={() => setView("users")} className="px-3 py-1 bg-gray-800 text-white rounded text-xs">Users</button>
        <button onClick={() => setView("builder")} className="px-3 py-1 bg-gray-800 text-white rounded text-xs">Builder</button>
        <button onClick={() => setView("chat")} className="px-3 py-1 bg-gray-800 text-white rounded text-xs">Chat</button>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
