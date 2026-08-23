import { GL } from "./i18n";

export type MainLocation = "extensions" | "autostate" | "history" | "options" | "about";

interface NavigatorProps {
  mainLocation: MainLocation;
  onNavigateMain: (loc: MainLocation) => void;
  themeMainColor?: string;
}

export function Navigator({
  mainLocation,
  onNavigateMain,
}: NavigatorProps) {
  return (
    <nav className="navigator">
      <div className="nav-items-container">
        <button
          type="button"
          className={`nav-link ${mainLocation === "extensions" ? "active" : ""}`}
          onClick={() => onNavigateMain("extensions")}
        >
          {GL("extensions")}
        </button>

        <button
          type="button"
          className={`nav-link ${mainLocation === "autostate" ? "active" : ""}`}
          onClick={() => onNavigateMain("autostate")}
        >
          {GL("autoState")}
        </button>

        <button
          type="button"
          className={`nav-link ${mainLocation === "history" ? "active" : ""}`}
          onClick={() => onNavigateMain("history")}
        >
          {GL("history")}
        </button>

        <button
          type="button"
          className={`nav-link ${mainLocation === "options" ? "active" : ""}`}
          onClick={() => onNavigateMain("options")}
        >
          {GL("options")}
        </button>

        <button
          type="button"
          className={`nav-link ${mainLocation === "about" ? "active" : ""}`}
          onClick={() => onNavigateMain("about")}
        >
          {GL("about")}
        </button>
      </div>
    </nav>
  );
}
