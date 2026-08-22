import { useState, useMemo, useRef } from "preact/hooks";
import { JSX } from "preact";
import {
  MaterialSymbol,
  RECOMMENDED_MATERIAL_SYMBOLS,
  searchMaterialSymbols,
  isValidSymbolName,
  normalizeSymbolName,
} from "./MaterialSymbols";
import type { GroupIcon } from "../../shared/types";

interface GroupIconPickerProps {
  currentIcon?: GroupIcon | string;
  onSelectIcon: (icon: GroupIcon) => void;
  onClose: () => void;
}

export function GroupIconPicker({ currentIcon, onSelectIcon, onClose }: GroupIconPickerProps) {
  const [activeTab, setActiveTab] = useState<"material" | "custom">("material");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(72);
  const [manualInput, setManualInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize current icon name
  const currentIconName = useMemo(() => {
    if (typeof currentIcon === "object" && currentIcon?.type === "material") {
      return normalizeSymbolName(currentIcon.name);
    }
    if (typeof currentIcon === "string" && currentIcon.trim()) {
      return normalizeSymbolName(currentIcon);
    }
    return "folder";
  }, [currentIcon]);

  // Search / browse results
  const searchResults = useMemo(() => {
    return searchMaterialSymbols(searchQuery, 300);
  }, [searchQuery]);

  const displayedSearchResults = useMemo(() => {
    return searchResults.slice(0, visibleCount);
  }, [searchResults, visibleCount]);

  // Manual input validation & live preview
  const normalizedManualInput = useMemo(() => {
    return normalizeSymbolName(manualInput);
  }, [manualInput]);

  const isManualValid = useMemo(() => {
    return Boolean(normalizedManualInput && isValidSymbolName(normalizedManualInput));
  }, [normalizedManualInput]);

  const handleSelectMaterial = (name: string) => {
    const validName = isValidSymbolName(name) ? normalizeSymbolName(name) : "folder";
    onSelectIcon({ type: "material", name: validName });
    onClose();
  };

  const handleApplyManual = () => {
    if (isManualValid) {
      handleSelectMaterial(normalizedManualInput);
    }
  };

  const handleManualKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isManualValid) {
      e.preventDefault();
      handleApplyManual();
    }
  };

  const handleFileUpload = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setUploadError("");
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a PNG, JPEG, or WebP image.");
      return;
    }

    if (file.size > 500 * 1024) {
      setUploadError("Image file size must be under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 64);
          const dataUrl = canvas.toDataURL("image/png");
          onSelectIcon({ type: "custom", dataUrl });
          onClose();
        }
      };
      img.onerror = () => {
        setUploadError("Failed to decode uploaded image.");
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="icon-picker-header">
          <div className="icon-picker-title-row">
            <h3>Choose group icon</h3>
          </div>
          <button className="icon-picker-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Top Tabs */}
        <div className="icon-picker-tabs">
          <button
            type="button"
            className={`icon-picker-tab ${activeTab === "material" ? "active" : ""}`}
            onClick={() => setActiveTab("material")}
          >
            Material Symbols
          </button>
          <button
            type="button"
            className={`icon-picker-tab ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            Custom Upload
          </button>
        </div>

        {activeTab === "material" ? (
          <div className="icon-picker-scroll-body">
            {/* Search Input */}
            <div className="icon-picker-search-bar">
              <input
                type="text"
                placeholder="Search 3,800+ icons (e.g. cart, code, shield, book, car)..."
                value={searchQuery}
                onInput={(e) => {
                  setSearchQuery((e.target as HTMLInputElement).value);
                  setVisibleCount(72);
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="icon-picker-clear-search"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 1. Recommended Palette */}
            {!searchQuery && (
              <div className="icon-picker-section">
                <div className="icon-picker-section-title">Recommended</div>
                <div className="icon-picker-grid">
                  {RECOMMENDED_MATERIAL_SYMBOLS.map((item) => {
                    const isSelected = item.name === currentIconName;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        className={`icon-picker-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectMaterial(item.name)}
                        title={`${item.label} (${item.name})`}
                      >
                        <MaterialSymbol name={item.name} size={28} />
                        <span className="icon-item-name">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. All / Search Results Section */}
            <div className="icon-picker-section">
              <div className="icon-picker-section-title">
                {searchQuery
                  ? `Search results for "${searchQuery}" (${searchResults.length})`
                  : "All Material Symbols"}
              </div>

              {searchResults.length > 0 ? (
                <>
                  <div className="icon-picker-grid">
                    {displayedSearchResults.map((name) => {
                      const isSelected = name === currentIconName;
                      return (
                        <button
                          type="button"
                          key={name}
                          className={`icon-picker-item ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectMaterial(name)}
                          title={name}
                        >
                          <MaterialSymbol name={name} size={28} />
                          <span className="icon-item-name">{name.replace(/_/g, " ")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {visibleCount < searchResults.length && (
                    <div className="icon-picker-load-more">
                      <button
                        type="button"
                        className="btn btn-secondary load-more-btn"
                        onClick={() => setVisibleCount((prev) => prev + 72)}
                      >
                        Load more icons ({searchResults.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="icon-picker-empty">
                  No Material Symbol found matching "{searchQuery}".
                </div>
              )}
            </div>

            {/* 3. Browse Google Fonts & Manual Input Section */}
            <div className="icon-picker-manual-card">
              <div className="manual-card-header">
                <span className="manual-card-title">Can't find the icon you want?</span>
                <a
                  href="https://fonts.google.com/icons"
                  target="_blank"
                  rel="noreferrer"
                  className="browse-google-fonts-link"
                >
                  Browse all Material Symbols ↗
                </a>
              </div>
              <p className="manual-card-desc">
                Find an icon name on Google Fonts (e.g. <code>crossword</code>, <code>travel</code>, <code>code</code>), then paste it below.
              </p>

              <div className="manual-input-row">
                <input
                  type="text"
                  className="manual-name-input"
                  placeholder="Paste or type icon name (e.g. crossword)..."
                  value={manualInput}
                  onInput={(e) => setManualInput((e.target as HTMLInputElement).value)}
                  onKeyDown={handleManualKeyDown}
                />
              </div>

              {manualInput.trim() && (
                <div className="manual-preview-row">
                  {isManualValid ? (
                    <div className="manual-preview-valid">
                      <div className="preview-symbol-box">
                        <MaterialSymbol name={normalizedManualInput} size={28} />
                      </div>
                      <span className="preview-name">{normalizedManualInput}</span>
                      <button
                        type="button"
                        className="btn btn-primary use-icon-btn"
                        onClick={handleApplyManual}
                      >
                        Use icon
                      </button>
                    </div>
                  ) : (
                    <div className="manual-preview-invalid">
                      <span className="invalid-icon-warning">⚠️ Icon not found in official Material Symbols catalog</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Custom Upload Section */
          <div className="icon-picker-custom-section">
            <p className="custom-upload-desc">
              Upload a custom PNG, JPEG, or WebP icon. It will be automatically resized to a crisp 64×64 group icon.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn btn-primary upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Image File...
            </button>
            {uploadError && <div className="upload-error-msg">{uploadError}</div>}
          </div>
        )}

        {/* Footer */}
        <div className="icon-picker-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onSelectIcon({ type: "material", name: "folder" });
              onClose();
            }}
          >
            Reset to Default (Folder)
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
