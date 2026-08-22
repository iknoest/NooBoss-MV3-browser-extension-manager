import { JSX } from "preact";
import type { ExtensionInfo } from "../../shared/types";

export type GroupAggregateState = "allOn" | "allOff" | "mixed" | "empty";

export function computeGroupAggregateState(
  groupExtensionIds: string[],
  allExtensions: ExtensionInfo[]
): GroupAggregateState {
  if (!groupExtensionIds || groupExtensionIds.length === 0) {
    return "empty";
  }

  // Find member extensions that actually exist
  const memberExts = allExtensions.filter((e) => groupExtensionIds.includes(e.id));
  if (memberExts.length === 0) {
    return "empty";
  }

  const enabledCount = memberExts.filter((e) => e.enabled).length;
  if (enabledCount === memberExts.length) {
    return "allOn";
  }
  if (enabledCount === 0) {
    return "allOff";
  }
  return "mixed";
}

interface GroupStateToggleProps {
  groupId: string;
  extensionIds: string[];
  allExtensions: ExtensionInfo[];
  onToggleGroup: (groupId: string, targetEnabled: boolean) => void;
  size?: "small" | "medium";
  className?: string;
}

export function GroupStateToggle({
  groupId,
  extensionIds,
  allExtensions,
  onToggleGroup,
  size = "medium",
  className = "",
}: GroupStateToggleProps) {
  const aggregateState = computeGroupAggregateState(extensionIds, allExtensions);

  const handleClick = (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (aggregateState === "empty") return;

    if (aggregateState === "allOn") {
      // Turn all off
      onToggleGroup(groupId, false);
    } else {
      // Turn all on (from allOff or mixed)
      onToggleGroup(groupId, true);
    }
  };

  let titleText = "Enable all extensions in group";
  if (aggregateState === "allOn") {
    titleText = "Disable all extensions in group";
  } else if (aggregateState === "mixed") {
    titleText = "Some extensions in this group are enabled (click to enable all)";
  } else if (aggregateState === "empty") {
    titleText = "Group is empty (no extensions)";
  }

  return (
    <button
      type="button"
      className={`group-state-toggle size-${size} state-${aggregateState} ${className}`}
      onClick={handleClick}
      title={titleText}
      aria-label={titleText}
      disabled={aggregateState === "empty"}
    >
      <span className="toggle-track">
        <span className="toggle-thumb">
          {aggregateState === "mixed" && <span className="indeterminate-dash" />}
        </span>
      </span>
    </button>
  );
}
