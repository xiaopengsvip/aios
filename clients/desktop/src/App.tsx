import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./features/Login";
import { Chat } from "./features/Chat";
import { Agent } from "./features/Agent";
import { Settings } from "./features/Settings";
import { AuthService } from "./services/auth";

type Page = "login" | "chat" | "agent" | "workflow" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(AuthService.isLoggedIn());
    if (AuthService.isLoggedIn()) setPage("chat");
  }, []);

  const handleLogin = () => {
    setIsAuthed(true);
    setPage("chat");
  };

  const handleLogout = () => {
    AuthService.clear();
    setIsAuthed(false);
    setPage("login");
  };

  if (!isAuthed) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case "chat": return <Chat />;
      case "agent": return <Agent />;
      case "settings": return <Settings onLogout={handleLogout} />;
      default: return <Chat />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}
