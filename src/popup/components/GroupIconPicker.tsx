import { useState, useMemo, useRef } from "preact/hooks";
import { JSX } from "preact";
import { MaterialSymbol, searchMaterialSymbols } from "./MaterialSymbols";
import type { GroupIcon } from "../../shared/types";

interface GroupIconPickerProps {
  currentIcon?: GroupIcon | string;
  onSelectIcon: (icon: GroupIcon) => void;
  onClose: () => void;
}

export function GroupIconPicker({ currentIcon, onSelectIcon, onClose }: GroupIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"material" | "custom">("material");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredIcons = useMemo(() => {
    return searchMaterialSymbols(searchQuery);
  }, [searchQuery]);

  const currentIconName =
    typeof currentIcon === "object" && currentIcon?.type === "material"
      ? currentIcon.name
      : typeof currentIcon === "string"
      ? "folder"
      : "folder";

  const handleSelectMaterial = (name: string) => {
    onSelectIcon({ type: "material", name });
    onClose();
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
        // Downscale to 64x64 square
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
        <div className="icon-picker-header">
          <h3>Choose group icon</h3>
          <button className="icon-picker-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="icon-picker-tabs">
          <button
            className={`icon-picker-tab ${selectedTab === "material" ? "active" : ""}`}
            onClick={() => setSelectedTab("material")}
          >
            Material Symbols
          </button>
          <button
            className={`icon-picker-tab ${selectedTab === "custom" ? "active" : ""}`}
            onClick={() => setSelectedTab("custom")}
          >
            Custom Upload
          </button>
        </div>

        {selectedTab === "material" ? (
          <>
            <div className="icon-picker-search-bar">
              <input
                type="text"
                placeholder="Search icons (e.g. cart, car, code, dev, star, security)..."
                value={searchQuery}
                onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="icon-picker-clear-search"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="icon-picker-grid">
              {filteredIcons.map((meta) => {
                const isSelected = meta.name === currentIconName;
                return (
                  <button
                    key={meta.name}
                    className={`icon-picker-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectMaterial(meta.name)}
                    title={meta.name}
                  >
                    <MaterialSymbol name={meta.name} size={28} />
                    <span className="icon-item-name">{meta.name.replace(/_/g, " ")}</span>
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <div className="icon-picker-empty">
                  No icons matching "{searchQuery}". Try searching "folder", "code", or "tool".
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="icon-picker-custom-section">
            <p className="custom-upload-desc">
              Upload a custom PNG, JPEG, or WebP icon. It will be automatically resized to a crisp 64×64 icon.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <button
              className="btn btn-primary upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Image File...
            </button>
            {uploadError && <div className="upload-error-msg">{uploadError}</div>}
          </div>
        )}

        <div className="icon-picker-footer">
          <button
            className="btn btn-secondary"
            onClick={() => {
              onSelectIcon({ type: "material", name: "folder" });
              onClose();
            }}
          >
            Reset to Default
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
