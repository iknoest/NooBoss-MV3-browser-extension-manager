import { MaterialSymbol } from "./MaterialSymbols";

export interface WelcomeViewProps {
  onOpenExtensions: () => void;
  themeMainColor?: string;
}

export function WelcomeView({
  onOpenExtensions,
  themeMainColor = "#1a73e8",
}: WelcomeViewProps) {
  return (
    <div className="nb-page welcome-view" style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 20px" }}>
      <header className="welcome-header" style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
          <MaterialSymbol name="crossword" size={48} color={themeMainColor} />
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0", color: themeMainColor }}>
          Extension Drawer
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary, #5f6368)", margin: "0 auto", maxWidth: "480px", lineHeight: "1.5" }}>
          Manage, organize and automate your Chrome extensions from one place.
        </p>
      </header>

      <div
        className="welcome-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="welcome-card settings-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div className="welcome-card-icon" style={{ marginTop: "2px" }}>
            <MaterialSymbol name="extension" size={24} color={themeMainColor} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "var(--text-primary, #202124)" }}>
              Manage extensions
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #5f6368)", margin: 0, lineHeight: "1.4" }}>
              Search, sort, enable, disable and inspect extensions.
            </p>
          </div>
        </div>

        <div className="welcome-card settings-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div className="welcome-card-icon" style={{ marginTop: "2px" }}>
            <MaterialSymbol name="folder" size={24} color={themeMainColor} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "var(--text-primary, #202124)" }}>
              Organize with Groups
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #5f6368)", margin: 0, lineHeight: "1.4" }}>
              Keep related extensions together and control them as a set.
            </p>
          </div>
        </div>

        <div className="welcome-card settings-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div className="welcome-card-icon" style={{ marginTop: "2px" }}>
            <MaterialSymbol name="alt_route" size={24} color={themeMainColor} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "var(--text-primary, #202124)" }}>
              Site Rules
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #5f6368)", margin: 0, lineHeight: "1.4" }}>
              Automatically turn extensions on or off for specific websites.
            </p>
          </div>
        </div>

        <div className="welcome-card settings-card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div className="welcome-card-icon" style={{ marginTop: "2px" }}>
            <MaterialSymbol name="history" size={24} color={themeMainColor} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "var(--text-primary, #202124)" }}>
              History &amp; Backup
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #5f6368)", margin: 0, lineHeight: "1.4" }}>
              Review Extension Drawer activity and keep portable backups.
            </p>
          </div>
        </div>
      </div>

      <div
        className="welcome-developer-callout settings-card"
        style={{
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          marginBottom: "28px",
          borderLeft: `3px solid ${themeMainColor}`,
        }}
      >
        <MaterialSymbol name="code" size={20} color={themeMainColor} style={{ marginTop: "2px" }} />
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 2px 0", color: "var(--text-primary, #202124)" }}>
            Developer tools · Optional
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary, #5f6368)", margin: 0, lineHeight: "1.4" }}>
            Developer Workspace can connect local builds, GitHub, Chrome Web Store listings and analytics when needed.
          </p>
        </div>
      </div>

      <div className="welcome-cta-container" style={{ textAlign: "center" }}>
        <button
          type="button"
          id="welcomeOpenBtn"
          className="btn btn-primary welcome-open-btn"
          onClick={onOpenExtensions}
          style={{
            minWidth: "220px",
            height: "42px",
            fontSize: "14px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: themeMainColor,
            color: "#ffffff",
          }}
        >
          <span>Open Extension Drawer</span>
          <MaterialSymbol name="arrow_forward" size={18} />
        </button>
      </div>
    </div>
  );
}
