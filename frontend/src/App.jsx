import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card shadow-sm">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SmartDine</h1>
            <p className="text-sm text-muted-foreground">Restaurant management starter</p>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/about">About</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}
