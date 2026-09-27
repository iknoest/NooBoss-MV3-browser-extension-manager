import { useEffect, useState, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "./MaterialSymbols";

export interface WalkthroughOverlayProps {
  currentStep: number;
  subStep?: string;
  developerMode?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onPreviewDeveloper?: () => void;
  themeMainColor?: string;
}

interface StepContent {
  title: string;
  body: string;
  supporting?: string;
  targetSelectors: string[];
}

const STEP_CONTENTS: Record<number, StepContent> = {
  1: {
    title: "Manage extensions",
    body: "Find extensions, change their state, inspect them, and choose how the list is organized.",
    targetSelectors: ["#extensionManagerCatalog", "#selectorActionBar", ".selector-root"],
  },
  2: {
    title: "Organize with Groups",
    body: "Keep related extensions together so you can find and control them as a set.",
    targetSelectors: ["#newGroupBtn", ".group-selector", ".action-bar"],
  },
  3: {
    title: "Automate with Site Rules",
    body: "Turn extensions on or off automatically depending on the websites you open.",
    targetSelectors: ["#autostateRuleBuilder", ".autostate-form-card", ".autostate-view"],
  },
  4: {
    title: "Review History",
    body: "See install, update, enable and disable activity recorded by Extension Drawer. Filter or search the history when you need to trace what changed.",
    targetSelectors: [
      "#historyContentArea",
      "#historyToolbar",
      "#historyTableWrapper",
      ".history-view",
    ],
  },
  5: {
    title: "Backup, export and restore",
    body: "Back up your Extension Drawer setup, export your extension list or history, and restore a saved configuration when needed.",
    targetSelectors: ["#optionsBackupSection", ".options-view"],
  },
  6: {
    title: "Developer Workspace · Optional",
    body: "Turn on Developer Workspace when you need tools for local test builds, GitHub and Chrome Web Store links, analytics, and extension packages.",
    supporting: "It stays hidden unless you choose to enable it.",
    targetSelectors: ["#optionsDeveloperRow", "#optionsDeveloperSection", ".settings-section"],
  },
};

export function WalkthroughOverlay({
  currentStep,
  subStep = "",
  developerMode = false,
  onNext,
  onBack,
  onSkip,
  onFinish,
  onPreviewDeveloper,
  themeMainColor = "#1a73e8",
}: WalkthroughOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine active step content
  let content = STEP_CONTENTS[currentStep] || STEP_CONTENTS[1];
  let targetSelectors = content.targetSelectors;

  if (currentStep === 6 && subStep === "preview") {
    content = {
      title: "Developer Workspace · Optional",
      body: "Manage local test builds and connect project links, Store analytics and extension packages from here.",
      targetSelectors: ["#developerWorkspaceRoot", ".developer-workspace-view"],
    };
    targetSelectors = content.targetSelectors;
  }

  // Find target element and compute bounding rect
  useEffect(() => {
    const findAndMeasure = () => {
      let foundEl: HTMLElement | null = null;
      for (const sel of targetSelectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            foundEl = el;
            break;
          }
        }
      }

      if (foundEl) {
        foundEl.scrollIntoView({ behavior: "auto", block: "center" });
        const rect = foundEl.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    findAndMeasure();

    const t1 = setTimeout(findAndMeasure, 50);
    const t2 = setTimeout(findAndMeasure, 150);
    const t3 = setTimeout(findAndMeasure, 350);

    const handleResizeOrScroll = () => {
      findAndMeasure();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [currentStep, subStep, targetSelectors]);

  // Handle keyboard shortcuts (Escape exits tour)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  // Focus the card on step change for accessibility
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.focus();
    }
  }, [currentStep, subStep]);

  // Calculate card position relative to spotlight rect
  const cardStyle: JSX.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    width: "min(400px, calc(100vw - 32px))",
    backgroundColor: "var(--card-bg, #ffffff)",
    color: "var(--text-primary, #202124)",
    borderRadius: "10px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
    border: "1px solid var(--border-color, #dadce0)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    outline: "none",
  };

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 800;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 600;
  const padding = 14;
  const cardWidth = Math.min(400, viewportWidth - 32);
  const estimatedCardHeight = 220;

  if (targetRect) {
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top: number;
    if (spaceBelow >= estimatedCardHeight + padding) {
      top = targetRect.bottom + padding;
    } else if (spaceAbove >= estimatedCardHeight + padding) {
      top = Math.max(padding, targetRect.top - estimatedCardHeight - padding);
    } else {
      top = Math.max(padding, (viewportHeight - estimatedCardHeight) / 2);
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    let left = targetCenterX - cardWidth / 2;
    const maxLeft = viewportWidth - cardWidth - padding;
    left = Math.max(padding, Math.min(left, maxLeft));

    cardStyle.top = `${top}px`;
    cardStyle.left = `${left}px`;
  } else {
    // Fallback: centered
    cardStyle.top = "50%";
    cardStyle.left = "50%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  const isFinalStep = currentStep === 6;
  const isFirstStep = currentStep === 1;

  return (
    <div
      className="walkthrough-overlay-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthroughTitle"
      aria-describedby="walkthroughBody"
    >
      {/* Dimmed backdrop or spotlight cutout */}
      {targetRect ? (
        <div
          className="walkthrough-spotlight"
          style={{
            position: "fixed",
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
            borderRadius: "8px",
            border: `2px solid ${themeMainColor}`,
            pointerEvents: "none",
            zIndex: 9998,
            transition: "all 0.2s ease-out",
          }}
        />
      ) : (
        <div
          className="walkthrough-backdrop-fallback"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Guided Card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="walkthrough-card"
        style={cardStyle}
      >
        {/* Header: Title and step indicator */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <div
              id="walkthroughStepIndicator"
              className="walkthrough-step-indicator"
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: themeMainColor,
                marginBottom: "4px",
              }}
            >
              Step {currentStep} of 6
            </div>
            <h3
              id="walkthroughTitle"
              className="walkthrough-title"
              style={{
                fontSize: "16px",
                fontWeight: "700",
                margin: 0,
                color: "var(--text-primary, #202124)",
                lineHeight: "1.3",
              }}
            >
              {content.title}
            </h3>
          </div>

          <button
            type="button"
            id="walkthroughCloseIconBtn"
            onClick={onSkip}
            title="Exit tour (Esc)"
            aria-label="Exit tour"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #5f6368)",
              cursor: "pointer",
              padding: "2px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialSymbol name="close" size={18} />
          </button>
        </div>

        {/* Body Text */}
        <p
          id="walkthroughBody"
          className="walkthrough-body"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary, #5f6368)",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          {content.body}
        </p>

        {/* Step 5: Format explanation line */}
        {currentStep === 5 && (
          <div
            id="walkthroughBackupFormats"
            className="walkthrough-formats-badge"
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "var(--text-secondary, #5f6368)",
              backgroundColor: "var(--hover-bg, #f1f3f4)",
              padding: "6px 10px",
              borderRadius: "4px",
              letterSpacing: "0.2px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Configuration · JSON</span>
            <span>Extension list · HTML</span>
            <span>History · CSV</span>
          </div>
        )}

        {/* Step 6: Supporting copy when on Options toggle */}
        {currentStep === 6 && subStep !== "preview" && (
          <p
            id="walkthroughDevSupporting"
            className="walkthrough-supporting-text"
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #5f6368)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            It stays hidden unless you choose to enable it.
          </p>
        )}

        {/* Step 6: Preview button if Developer Workspace is already enabled */}
        {currentStep === 6 && subStep !== "preview" && developerMode && onPreviewDeveloper && (
          <div style={{ marginTop: "2px" }}>
            <button
              type="button"
              id="walkthroughPreviewDevBtn"
              className="btn btn-secondary btn-sm walkthrough-preview-dev-btn"
              onClick={onPreviewDeveloper}
              style={{
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                color: themeMainColor,
                borderColor: themeMainColor,
                cursor: "pointer",
              }}
            >
              <MaterialSymbol name="visibility" size={16} />
              <span>Preview Developer Workspace</span>
            </button>
          </div>
        )}

        {/* Action Controls Footer */}
        <div
          className="walkthrough-controls"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "6px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color, #dadce0)",
          }}
        >
          {/* Skip tour link */}
          <button
            type="button"
            id="walkthroughSkipBtn"
            className="walkthrough-skip-btn"
            onClick={onSkip}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #5f6368)",
              fontSize: "12px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              textDecoration: "underline",
            }}
          >
            Skip tour
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Back Button */}
            {!isFirstStep && (
              <button
                type="button"
                id="walkthroughBackBtn"
                className="btn btn-secondary btn-sm walkthrough-back-btn"
                onClick={onBack}
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}

            {/* Next or Finish Button */}
            {isFinalStep ? (
              <button
                type="button"
                id="walkthroughFinishBtn"
                className="btn btn-primary btn-sm walkthrough-finish-btn"
                onClick={onFinish}
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "6px 16px",
                  backgroundColor: themeMainColor,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Finish tour</span>
                <MaterialSymbol name="check" size={16} />
              </button>
            ) : (
              <button
                type="button"
                id="walkthroughNextBtn"
                className="btn btn-primary btn-sm walkthrough-next-btn"
                onClick={onNext}
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "6px 16px",
                  backgroundColor: themeMainColor,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Next</span>
                <MaterialSymbol name="arrow_forward" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
