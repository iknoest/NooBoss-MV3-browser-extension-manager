import { GL } from "./i18n";
import { BUY_ME_A_BEER_URL, openExternalLink } from "../../shared/external-link";

export type MainLocation = "extensions" | "autostate" | "history" | "developer" | "options" | "about" | "welcome";

interface NavigatorProps {
  mainLocation: MainLocation;
  onNavigateMain: (loc: MainLocation) => void;
  themeMainColor?: string;
  developerMode?: boolean;
}

export function Navigator({
  mainLocation,
  onNavigateMain,
  developerMode,
}: NavigatorProps) {
  const handleOpenBeer = (e: MouseEvent) => {
    openExternalLink(BUY_ME_A_BEER_URL, e);
  };

  return (
    <nav className="navigator" aria-label="Main navigation">
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

        {developerMode && (
          <button
            type="button"
            className={`nav-link ${mainLocation === "developer" ? "active" : ""}`}
            onClick={() => onNavigateMain("developer")}
          >
            {GL("developer")}
          </button>
        )}

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

      <div className="nav-utility-area">
        <a
          href={BUY_ME_A_BEER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-me-beer-btn"
          title="Buy me a Beer"
          aria-label="Buy me a Beer"
          onClick={handleOpenBeer}
        >
          <span className="beer-icon" aria-hidden="true">🍻</span>
          <span className="beer-label">Buy me a Beer</span>
        </a>
      </div>
    </nav>
  );
}
