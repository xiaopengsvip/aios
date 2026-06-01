pragma Singleton
import AIOS
import QtQuick

QtObject {
    // Current mode: "light", "dark", "system"
    readonly property string mode: storeManager ? storeManager.themeMode : "dark"

    // Detect system dark from Qt platform theme
    readonly property bool systemDark: {
        // Qt 6.5+ has QStyleHints.colorScheme, but we check via a simpler heuristic
        // Default to dark if system detection unavailable
        if (mode === "dark") return true
        if (mode === "light") return false
        // system mode: try to detect from palette or default dark
        return true
    }

    readonly property bool isDark: mode === "dark" || (mode === "system" && systemDark)

    // === Language ===
    readonly property string lang: storeManager ? storeManager.language : "zh-CN"
    readonly property bool isChinese: lang === "zh-CN"

    // Translation helper
    function t(zh, en) {
        return isChinese ? zh : en
    }

    // === Colors ===
    readonly property color bgColor:         isDark ? "#0A0A0F" : "#F5F5F7"
    readonly property color bgCard:          isDark ? "#141420" : "#FFFFFF"
    readonly property color bgHover:         isDark ? "#1A1A2E" : "#E8E8ED"
    readonly property color bgActive:        isDark ? "#252540" : "#D1D1D6"
    readonly property color borderColor:     isDark ? "#2A2A3E" : "#D1D1D6"
    readonly property color textPrimary:     isDark ? "#E8E8ED" : "#1D1D1F"
    readonly property color textSecondary:   isDark ? "#8B8BA3" : "#6E6E73"
    readonly property color textMuted:       isDark ? "#5A5A72" : "#AEAEB2"
    readonly property color accentColor:     isDark ? "#6366F1" : "#5856D6"
    readonly property color accentHover:     isDark ? "#818CF8" : "#7472E0"
    readonly property color successColor:    isDark ? "#22C55E" : "#34C759"
    readonly property color warningColor:    isDark ? "#F59E0B" : "#FF9500"
    readonly property color errorColor:      isDark ? "#EF4444" : "#FF3B30"
    readonly property color sidebarBg:       isDark ? "#0E0E16" : "#E8E8ED"

    // === Spacing ===
    readonly property int spacingXs: 4
    readonly property int spacingSm: 8
    readonly property int spacingMd: 12
    readonly property int spacingLg: 16
    readonly property int spacingXl: 24

    // === Radius ===
    readonly property int radiusSm: 6
    readonly property int radiusMd: 10
    readonly property int radiusLg: 14
    readonly property int radiusXl: 20

    // === Font sizes ===
    readonly property int fontXs: 11
    readonly property int fontSm: 12
    readonly property int fontMd: 14
    readonly property int fontLg: 16
    readonly property int fontXl: 20
    readonly property int fontXxl: 28
}
