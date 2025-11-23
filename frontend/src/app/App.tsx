import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { LandingPage } from "../features/landing";
import { BuilderPage } from "../features/builder";
import { ChatPage } from "../features/chat/ChatPage";
import type { ViewState } from "../shared/types";

const App = () => {
  const [view, setView] = useState<ViewState>("landing");

  return (
    <ReactFlowProvider>
      {view === "landing" && <LandingPage onStart={() => setView("builder")} />}
      {view === "builder" && <BuilderPage onSwitchToChat={() => setView("chat")} />}
      {view === "chat" && <ChatPage onBack={() => setView("builder")} />}
    </ReactFlowProvider>
  );
};

export default App;
