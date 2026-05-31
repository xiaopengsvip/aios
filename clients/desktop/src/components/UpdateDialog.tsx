import { UpdateInfo } from "../services/api";

const CURRENT_VERSION = "0.0.1";

interface Props {
  info: UpdateInfo;
  onClose: () => void;
}

export function UpdateDialog({ info, onClose }: Props) {
  const handleDownload = () => {
    // Open download URL in default browser
    window.open(info.downloadUrl, "_blank");
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    return ` (${(bytes / 1024 / 1024).toFixed(1)} MB)`;
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#1a1a2e", borderRadius: 16, padding: "32px",
        width: 420, maxWidth: "90vw", border: "1px solid #2a2a4a",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#fff",
          }}>A</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>
              发现新版本 v{info.versionName}
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              v{CURRENT_VERSION} → v{info.versionName}
              {formatSize(info.apkSize)}
            </div>
          </div>
        </div>

        {/* Release notes */}
        {info.releaseNotes && (
          <div style={{
            background: "#0f0f1a", borderRadius: 10, padding: "14px 16px",
            marginBottom: 20, border: "1px solid #1e1e3a",
          }}>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 8 }}>
              更新内容
            </div>
            <div style={{
              fontSize: 13, color: "#94a3b8", lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {info.releaseNotes}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              background: "#252540", border: "1px solid #3a3a5a",
              color: "#94a3b8", fontSize: 14, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a4a")}
            onMouseLeave={e => (e.currentTarget.style.background = "#252540")}
          >
            稍后再说
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 2, padding: "12px 0", borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
}
