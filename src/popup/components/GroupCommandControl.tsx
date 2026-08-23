import { JSX } from "preact";
import type { ExtensionGroup, ExtensionInfo } from "../../shared/types";
import { computeGroupRuntimeSummary } from "./group-summary";

export interface GroupCommandControlProps {
  group: ExtensionGroup;
  allExtensions?: ExtensionInfo[];
  onToggleGroup?: (groupId: string, targetEnabled: boolean) => void;
  className?: string;
  size?: "small" | "medium";
}

export function GroupCommandControl({
  group,
  allExtensions = [],
  onToggleGroup,
  className = "",
  size = "medium",
}: GroupCommandControlProps) {
  const summary = computeGroupRuntimeSummary(group, allExtensions);
  const isDisabled = summary.installedMemberCount === 0;

  const handleOffClick = (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isDisabled) return;
    onToggleGroup?.(group.id, false);
  };

  const handleOnClick = (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isDisabled) return;
    onToggleGroup?.(group.id, true);
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLButtonElement>, targetEnabled: boolean) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (isDisabled) return;
      onToggleGroup?.(group.id, targetEnabled);
    }
  };

  return (
    <div
      className={`group-cmd-segmented size-${size} ${className}`}
      role="group"
      aria-label={`Commands for ${group.name}`}
    >
      <button
        type="button"
        className="group-cmd-btn cmd-off"
        onClick={handleOffClick}
        onKeyDown={(e) => handleKeyDown(e, false)}
        title={`Disable all available extensions in ${group.name}`}
        aria-label={`Disable all available extensions in ${group.name}`}
        disabled={isDisabled}
      >
        OFF
      </button>
      <div className="group-cmd-divider" />
      <button
        type="button"
        className="group-cmd-btn cmd-on"
        onClick={handleOnClick}
        onKeyDown={(e) => handleKeyDown(e, true)}
        title={`Enable all available extensions in ${group.name}`}
        aria-label={`Enable all available extensions in ${group.name}`}
        disabled={isDisabled}
      >
        ON
      </button>
    </div>
  );
}
