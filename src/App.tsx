import { ShellPage } from "./modules/shell";
import { VisudevProvider } from "./lib/visudev/store";

export default function App() {
  return (
    <VisudevProvider>
      <ShellPage />
    </VisudevProvider>
  );
}
