import { MaterialSymbol } from "./MaterialSymbols";

export interface AboutViewProps {
  themeMainColor?: string;
  onOpenWelcome?: () => void;
}

export function AboutView({
  themeMainColor = "#1a73e8",
  onOpenWelcome,
}: AboutViewProps) {
  const handleOpenLink = (url: string, e: MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="nb-page about-view" style={{ fontSize: "13px", lineHeight: "1.6" }}>
      {/* Title & Introduction */}
      <section style={{ position: "relative", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MaterialSymbol name="crossword" size={32} color={themeMainColor} />
            <h2 className="nb-heading" style={{ fontSize: "24px", color: themeMainColor, margin: 0 }}>
              Extension Drawer
            </h2>
          </div>
          {onOpenWelcome && (
            <button
              type="button"
              id="aboutWelcomeBtn"
              className="btn btn-secondary action-btn about-welcome-btn"
              onClick={onOpenWelcome}
              title="Open Getting Started guide"
              aria-label="Getting started"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <MaterialSymbol name="menu_book" size={16} />
              <span>Getting started</span>
            </button>
          )}
        </div>
        <p style={{ fontWeight: "bold", margin: "4px 0" }}>What, Why, Who</p>
        <p style={{ margin: "4px 0" }}>
          Extension Drawer is a browser extension manager for organizing, grouping, enabling and disabling extensions, with Site Rules automation and history tracking.
        </p>
        <p style={{ margin: "4px 0" }}>
          This project began as a Manifest V3 continuation of <strong>NooBoss</strong>, the open-source extension manager originally created by <strong>AInoob</strong>. It preserves many of NooBoss's core ideas while being independently maintained under a new product identity.
        </p>
      </section>

      {/* 1. What can Extension Drawer do? (FIRST substantive section) */}
      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "16px 0 10px 0" }}>
          What can Extension Drawer do?
        </h3>
        <ul style={{ paddingLeft: "20px", margin: "6px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          <li>
            <strong>Manage extensions:</strong> Enable, disable, remove, search and sort extensions.
          </li>
          <li>
            <strong>Groups:</strong> Organize related extensions and control them together.
          </li>
          <li>
            <strong>Site Rules:</strong> Automatically turn extensions on or off based on websites the user opens.
          </li>
          <li>
            <strong>History:</strong> Review install, update, enable and disable activity recorded by Extension Drawer.
          </li>
          <li>
            <strong>Backup &amp; Data:</strong> Export configuration, extension lists and history, and restore configuration.
          </li>
          <li>
            <strong>Developer Workspace:</strong> Optional advanced tools for local builds, GitHub, Chrome Web Store listings, Google Analytics, and Store-extension ZIP download.
          </li>
        </ul>
      </section>

      {/* 2. About this project / lineage */}
      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 6px 0" }}>
          About this project
        </h3>
        <ol style={{ paddingLeft: "20px", margin: "6px 0" }}>
          <li>Extension Drawer is free and open-source software under GPL-3.0.</li>
          <li>No tracking or remote telemetry is collected.</li>
          <li>Groups provide fast bulk controls for related extensions.</li>
          <li>Site Rules support automatic or assisted extension management based on active tabs / URL rules.</li>
          <li>History, extension metadata inspection, and local backup/export are included.</li>
        </ol>
      </section>

      {/* 3. Acknowledgements */}
      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 6px 0" }}>
          Acknowledgements
        </h3>
        <p style={{ margin: "6px 0" }}>
          <strong>NooBoss</strong> was originally created by <strong>AInoob</strong> and is the foundation and inspiration for this project.
        </p>
        <p style={{ margin: "6px 0" }}>
          <a
            href="https://github.com/AInoob/NooBoss"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleOpenLink("https://github.com/AInoob/NooBoss", e)}
            style={{ color: themeMainColor, textDecoration: "underline", fontWeight: 500 }}
          >
            Original NooBoss on GitHub
          </a>
        </p>
        <p style={{ margin: "6px 0" }}>
          <strong>Extension Drawer</strong> is the independently maintained Manifest V3 continuation.
        </p>
        <p style={{ margin: "6px 0" }}>
          <a
            href="https://github.com/iknoest/NooBoss-MV3-browser-extension-manager"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleOpenLink("https://github.com/iknoest/NooBoss-MV3-browser-extension-manager", e)}
            style={{ color: themeMainColor, textDecoration: "underline", fontWeight: 500 }}
          >
            Extension Drawer source on GitHub
          </a>
        </p>
        <ul style={{ paddingLeft: "20px", margin: "8px 0 0 0" }}>
          <li>Google Material Symbols Rounded (Apache License 2.0).</li>
          <li>Built with Preact, TypeScript, and Vite.</li>
          <li>Licensed under GNU General Public License v3.0 (GPL-3.0).</li>
        </ul>
      </section>
    </div>
  );
}
