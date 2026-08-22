import { MaterialSymbol } from "./MaterialSymbols";

export interface AboutViewProps {
  themeMainColor?: string;
}

export function AboutView({ themeMainColor = "#1a73e8" }: AboutViewProps) {
  return (
    <div className="nb-page" style={{ fontSize: "13px", lineHeight: "1.6" }}>
      <section style={{ position: "relative", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <MaterialSymbol name="crossword" size={32} color={themeMainColor} />
          <h2 className="nb-heading" style={{ fontSize: "24px", color: themeMainColor, margin: 0 }}>
            NooBoss
          </h2>
        </div>
        <p style={{ fontWeight: "bold", margin: "4px 0" }}>What, Why, Who</p>
        <p style={{ margin: "4px 0" }}>
          In short, AInoob made NooBoss, an extension that manages extensions, only to empower/facilitate/help those who need it, like myself.
        </p>
        <p style={{ margin: "4px 0" }}>
          This Manifest V3 edition faithfully restores the classic NooBoss user experience while running on Chrome&apos;s modern extension architecture.
        </p>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 6px 0" }}>
          A list about NooBoss
        </h3>
        <ol style={{ paddingLeft: "20px", margin: "6px 0" }}>
          <li>NooBoss is open source software and charge free (GPL-V3).</li>
          <li>No tracking or remote telemetry is collected.</li>
          <li>AutoState rules allow automatic or assisted enabling/disabling of extensions based on active tabs.</li>
          <li>Full support for Groups, History logging, CRX metadata viewing, and Backup/Export.</li>
        </ol>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 6px 0" }}>
          What can NooBoss do?
        </h3>
        <ul style={{ paddingLeft: "20px", margin: "6px 0" }}>
          <li>
            <strong>Manage your extensions:</strong> Enable, disable, or remove extensions with single clicks or batch actions in Tile, Big Tile, and List views.
          </li>
          <li>
            <strong>Extension Groups:</strong> Organize extensions into custom groups to quickly toggle related workflows together.
          </li>
          <li>
            <strong>AutoState management:</strong> Automatically enable or disable extensions based on URL pattern matching rules.
          </li>
          <li>
            <strong>History tracking:</strong> View historical records of extension installations, updates, enabling, and disabling events.
          </li>
          <li>
            <strong>Detailed inspection:</strong> View extension permissions, host permissions, install types, and direct links to Chrome Web Store / manifest.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "12px 0 6px 0" }}>
          Acknowledgements
        </h3>
        <ul style={{ paddingLeft: "20px", margin: "6px 0" }}>
          <li>Original NooBoss created by AInoob.</li>
          <li>Material Symbols Rounded by Google (Apache 2.0).</li>
          <li>Modern MV3 rebuild powered by Preact, TypeScript, and Vite.</li>
        </ul>
      </section>
    </div>
  );
}
