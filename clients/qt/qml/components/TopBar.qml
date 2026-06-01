import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    color: Theme.bgCard
    height: 48

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: Theme.spacingLg
        anchors.rightMargin: Theme.spacingLg

        Text {
            text: {
                var names = {
                    "welcome": "欢迎", "chat": "聊天", "image": "图片生成",
                    "video": "视频生成", "audio": "音频", "code": "代码执行",
                    "files": "文件管理", "knowledge": "知识库", "workflow": "工作流",
                    "marketplace": "市场", "prompts": "提示词库", "search": "搜索",
                    "agent": "Agent", "settings": "设置", "usage": "用量统计",
                    "credits": "积分余额", "api-platform": "API 平台"
                }
                return names[storeManager.currentPage] || "AIOS"
            }
            font.pixelSize: Theme.fontXl
            font.bold: true
            color: Theme.textPrimary
        }

        Item { Layout.fillWidth: true }

        // Model selector
        Rectangle {
            Layout.preferredWidth: 180
            Layout.preferredHeight: 32
            radius: Theme.radiusSm
            color: Theme.bgHover
            border.color: Theme.borderColor
            border.width: 1

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 10
                anchors.rightMargin: 10

                Text {
                    text: storeManager.currentModel
                    font.pixelSize: Theme.fontSm
                    color: Theme.textPrimary
                    Layout.fillWidth: true
                    elide: Text.ElideRight
                }

                Text {
                    text: "▼"
                    font.pixelSize: 10
                    color: Theme.textMuted
                }
            }
        }

        // User avatar
        Rectangle {
            Layout.preferredWidth: 32
            Layout.preferredHeight: 32
            radius: 16
            color: Theme.accentColor

            Text {
                anchors.centerIn: parent
                text: authManager.userName ? authManager.userName.charAt(0).toUpperCase() : "U"
                font.pixelSize: Theme.fontMd
                font.bold: true
                color: "white"
            }
        }
    }
}
