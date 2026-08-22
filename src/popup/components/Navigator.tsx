import { GL } from "./i18n";

export type MainLocation = "overview" | "extensions" | "history" | "options" | "about";
export type SubLocation = "manage" | "autoState";

interface NavigatorProps {
  mainLocation: MainLocation;
  subLocation: SubLocation;
  onNavigateMain: (loc: MainLocation) => void;
  onNavigateSub: (sub: SubLocation) => void;
  themeMainColor?: string;
}

export function Navigator({
  mainLocation,
  subLocation,
  onNavigateMain,
  onNavigateSub,
}: NavigatorProps) {
  return (
    <nav className="navigator">
      <div className="nav-items-container">
        <button
          type="button"
          className={`nav-link ${mainLocation === "overview" ? "active" : ""}`}
          onClick={() => onNavigateMain("overview")}
        >
          {GL("overview")}
        </button>

        <div className={`nav-link-dropdown ${mainLocation === "extensions" ? "active" : ""}`}>
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              onNavigateMain("extensions");
              onNavigateSub("manage");
            }}
          >
            {GL("extensions")}
            <span className="dropdown-caret">▾</span>
          </button>
          <div className="sub-menu">
            <button
              type="button"
              className={`sub-link ${mainLocation === "extensions" && subLocation === "manage" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateMain("extensions");
                onNavigateSub("manage");
              }}
            >
              {GL("manage")}
            </button>
            <button
              type="button"
              className={`sub-link ${mainLocation === "extensions" && subLocation === "autoState" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateMain("extensions");
                onNavigateSub("autoState");
              }}
            >
              {GL("autoState")}
            </button>
          </div>
        </div>

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
