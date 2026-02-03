import { Toaster } from "sonner";
import { ShellPage } from "./modules/shell";
import { VisudevProvider } from "./lib/visudev/store";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGate } from "./components/AuthGate";

export default function App() {
  return (
    <AuthProvider>
      <VisudevProvider>
        <AuthGate>
          <ShellPage />
        </AuthGate>
      </VisudevProvider>
      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}
