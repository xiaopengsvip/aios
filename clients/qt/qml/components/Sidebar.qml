import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: sidebar
    color: Theme.sidebarBg
    width: 56

    // Category definitions
    property var categories: [
        { icon: "💬", id: "ai",    label: "AI" },
        { icon: "📋", id: "office", label: "办公" },
        { icon: "📁", id: "files",  label: "文件" },
        { icon: "📚", id: "knowledge", label: "知识库" },
        { icon: "⚡", id: "flow",   label: "流程" },
        { icon: "🔧", id: "dev",    label: "开发" },
        { icon: "🛍", id: "market", label: "市场" }
    ]

    // Sub-items for each category
    property var categoryItems: {
        "ai": [
            { icon: "💬", page: "chat",        label: "AI 对话" },
            { icon: "🔍", page: "ai-search",   label: "AI 搜索" },
            { icon: "🖼", page: "image",       label: "AI 生图" },
            { icon: "🎬", page: "video",       label: "AI 视频" },
            { icon: "🎵", page: "audio",       label: "AI 音乐" },
            { icon: "📊", page: "ai-ppt",      label: "AI PPT" },
            { icon: "🎙", page: "ai-podcast",  label: "AI 播客" },
            { icon: "✍",  page: "ai-writing",  label: "AI 写作" },
            { icon: "🌐", page: "ai-translate", label: "AI 翻译" },
            { icon: "💻", page: "ai-code",     label: "AI 编程" },
            { icon: "⚡", page: "code",        label: "代码执行" },
            { icon: "🤖", page: "agent",       label: "Agent" },
            { icon: "🖥", page: "local-model", label: "本地模型" }
        ],
        "office": [
            { icon: "👥", page: "contacts",  label: "联系人" },
            { icon: "📋", page: "sheet",     label: "多维表格" },
            { icon: "⭐", page: "favorites", label: "收藏夹" },
            { icon: "📝", page: "notes",     label: "笔记" },
            { icon: "📅", page: "calendar",  label: "日历" },
            { icon: "📧", page: "email",     label: "邮箱" },
            { icon: "✅", page: "todo",      label: "待办" },
            { icon: "📌", page: "kanban",    label: "看板" }
        ],
        "files": [
            { icon: "📁", page: "files",       label: "文件管理" },
            { icon: "📂", page: "local-files", label: "本地目录" }
        ],
        "knowledge": [
            { icon: "📚", page: "knowledge",       label: "个人知识库" },
            { icon: "🏢", page: "team-knowledge",  label: "团队知识库" }
        ],
        "flow": [
            { icon: "🔄", page: "workflow", label: "工作流" },
            { icon: "⏰", page: "cron",     label: "定时任务" }
        ],
        "dev": [
            { icon: "🔗", page: "api-platform", label: "API 平台" },
            { icon: "🔌", page: "mcp",          label: "MCP 服务" }
        ],
        "market": [
            { icon: "🛍", page: "marketplace", label: "应用商店" }
        ]
    }

    // Which category is expanded (null = none)
    property string expandedCategory: ""

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // Logo
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 52
            color: "transparent"

            Image {
                anchors.centerIn: parent
                source: "qrc:/qt/qml/AIOS/resources/icons/app-icon.png"
                width: 32
                height: 32
                fillMode: Image.PreserveAspectFit
            }
        }

        // Category icons
        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: catColumn.height
            clip: true
            flickableDirection: Flickable.VerticalFlick

            ColumnLayout {
                id: catColumn
                width: parent.width
                spacing: 4

                Repeater {
                    model: categories

                    Rectangle {
                        required property var modelData
                        required property int index
                        property bool isExpanded: sidebar.expandedCategory === modelData.id
                        property bool isHovered: catMouse.containsMouse

                        Layout.fillWidth: true
                        Layout.preferredHeight: 44
                        Layout.leftMargin: 6
                        Layout.rightMargin: 6
                        radius: Theme.radiusMd
                        color: isExpanded ? Theme.accentColor + "20" : (isHovered ? Theme.bgHover : "transparent")
                        border.color: isExpanded ? Theme.accentColor : "transparent"
                        border.width: isExpanded ? 1 : 0

                        // Active indicator
                        Rectangle {
                            visible: isExpanded
                            width: 3
                            height: 20
                            radius: 1.5
                            color: Theme.accentColor
                            anchors.left: parent.left
                            anchors.leftMargin: 2
                            anchors.verticalCenter: parent.verticalCenter
                        }

                        Text {
                            anchors.centerIn: parent
                            text: modelData.icon
                            font.pixelSize: 20
                        }

                        MouseArea {
                            id: catMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (sidebar.expandedCategory === modelData.id) {
                                    sidebar.expandedCategory = ""
                                } else {
                                    sidebar.expandedCategory = modelData.id
                                }
                            }
                        }
                    }
                }
            }
        }

        // Bottom items
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 4

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 44
                Layout.leftMargin: 6
                Layout.rightMargin: 6
                radius: Theme.radiusMd
                color: usageMouse.containsMouse ? Theme.bgHover : "transparent"

                Text {
                    anchors.centerIn: parent
                    text: "📊"
                    font.pixelSize: 20
                }

                MouseArea {
                    id: usageMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: navigateTo("usage")
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 44
                Layout.leftMargin: 6
                Layout.rightMargin: 6
                radius: Theme.radiusMd
                color: creditsMouse.containsMouse ? Theme.bgHover : "transparent"

                Text {
                    anchors.centerIn: parent
                    text: "💰"
                    font.pixelSize: 20
                }

                MouseArea {
                    id: creditsMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: navigateTo("credits")
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 44
                Layout.leftMargin: 6
                Layout.rightMargin: 6
                radius: Theme.radiusMd
                color: settingsMouse.containsMouse ? Theme.bgHover : "transparent"

                Text {
                    anchors.centerIn: parent
                    text: "⚙"
                    font.pixelSize: 20
                }

                MouseArea {
                    id: settingsMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: navigateTo("settings")
                }
            }
        }
    }
}
