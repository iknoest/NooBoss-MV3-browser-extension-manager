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
  themeMainColor,
}: NavigatorProps) {
  return (
    <nav className="navigator" style={themeMainColor ? { backgroundColor: themeMainColor } : undefined}>
      <div
        className={`nav-link ${mainLocation === "overview" ? "active" : ""}`}
        onClick={() => onNavigateMain("overview")}
      >
        {GL("overview")}
      </div>

      <div
        className={`nav-link has-sub ${mainLocation === "extensions" ? "active" : ""}`}
        onClick={() => onNavigateMain("extensions")}
      >
        {GL("extensions")}
        <div className="sub-menu">
          <div
            className={`sub-link ${mainLocation === "extensions" && subLocation === "manage" ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateMain("extensions");
              onNavigateSub("manage");
            }}
          >
            {GL("manage")}
          </div>
          <div
            className={`sub-link ${mainLocation === "extensions" && subLocation === "autoState" ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateMain("extensions");
              onNavigateSub("autoState");
            }}
          >
            {GL("autoState")}
          </div>
        </div>
      </div>

      <div
        className={`nav-link ${mainLocation === "history" ? "active" : ""}`}
        onClick={() => onNavigateMain("history")}
      >
        {GL("history")}
      </div>

      <div
        className={`nav-link ${mainLocation === "options" ? "active" : ""}`}
        onClick={() => onNavigateMain("options")}
      >
        {GL("options")}
      </div>

      <div
        className={`nav-link ${mainLocation === "about" ? "active" : ""}`}
        onClick={() => onNavigateMain("about")}
      >
        {GL("about")}
      </div>
    </nav>
  );
}
