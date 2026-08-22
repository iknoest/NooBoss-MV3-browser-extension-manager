import type { ExtensionInfo, ExtensionGroup, AutoStateRule } from "../../shared/types";
import { GL, GLS } from "./i18n";

export interface OverviewViewProps {
  extensions: ExtensionInfo[];
  groups: ExtensionGroup[];
  rules: AutoStateRule[];
  themeMainColor?: string;
}

export function OverviewView({
  extensions = [],
  groups = [],
  rules = [],
}: OverviewViewProps) {
  const extensionCount = extensions.filter((e) => e.type === "extension").length;
  const appCount = extensions.filter((e) => e.type === "app" || e.type === "hosted_app" || e.type === "packaged_app").length;
  const themeCount = extensions.filter((e) => e.type === "theme").length;
  const groupCount = groups.length;
  const ruleCount = rules.length;

  const enabledCount = extensions.filter((e) => e.enabled).length;
  const disabledCount = extensions.filter((e) => !e.enabled).length;

  return (
    <div className="nb-page" style={{ fontSize: "15px", lineHeight: "2" }}>
      <h2 className="nb-heading" style={{ fontSize: "24px", marginBottom: "16px" }}>
        {GL("you_have")}
      </h2>

      <div style={{ paddingLeft: "16px" }}>
        <div>
          <span>{extensionCount} {GLS("extension_s", extensionCount)}</span>,{" "}
          <span>{appCount} {GLS("app_s", appCount)}</span>,{" "}
          <span>{themeCount} {GL("theme_s")}</span>
        </div>

        <div>
          <span>{groupCount} {GLS("group_s", groupCount)}</span>
        </div>

        <div>
          <span>{ruleCount} {GLS("autoState_rule_s", ruleCount)}</span>
        </div>
      </div>

      <div style={{ marginTop: "24px", paddingLeft: "16px", color: "#666", fontSize: "13px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <strong>Enabled:</strong> {enabledCount}
          </div>
          <div>
            <strong>Disabled:</strong> {disabledCount}
          </div>
          <div>
            <strong>Total:</strong> {extensions.length}
          </div>
        </div>
      </div>
    </div>
  );
}
