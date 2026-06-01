import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    color: Theme.bgColor

    ColumnLayout {
        anchors.centerIn: parent
        spacing: Theme.spacingXl

        // Hero - app icon
        Image {
            source: "qrc:/qt/qml/AIOS/resources/icons/app-icon.png"
            sourceSize.width: 48
            sourceSize.height: 48
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: Theme.t("欢迎使用 AI 超级工作台", "Welcome to AI Workspace")
            font.pixelSize: Theme.fontXxl
            font.bold: true
            color: Theme.textPrimary
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: Theme.t("企业级 AI 超级工作台，让工作更智能", "Enterprise AI workspace, work smarter")
            font.pixelSize: Theme.fontLg
            color: Theme.textSecondary
            Layout.alignment: Qt.AlignHCenter
        }

        // Feature cards grid
        GridLayout {
            columns: 4
            rowSpacing: Theme.spacingMd
            columnSpacing: Theme.spacingMd
            Layout.topMargin: Theme.spacingXl

            Repeater {
                model: [
                    { icon: "💬", label: Theme.t("智能聊天", "Chat"), desc: Theme.t("多模型对话", "Multi-model chat"), page: "chat" },
                    { icon: "🖼", label: Theme.t("图片生成", "Image Gen"), desc: Theme.t("AI 创作图片", "AI image creation"), page: "image" },
                    { icon: "🎬", label: Theme.t("视频生成", "Video Gen"), desc: Theme.t("AI 生成视频", "AI video creation"), page: "video" },
                    { icon: "🎵", label: Theme.t("音频处理", "Audio"), desc: "TTS / STT", page: "audio" },
                    { icon: "💻", label: Theme.t("代码执行", "Code"), desc: Theme.t("在线运行代码", "Run code online"), page: "code" },
                    { icon: "📁", label: Theme.t("文件管理", "Files"), desc: Theme.t("智能文件管理", "Smart file management"), page: "files" },
                    { icon: "📚", label: Theme.t("知识库", "Knowledge"), desc: Theme.t("RAG 知识检索", "RAG knowledge search"), page: "knowledge" },
                    { icon: "⚡", label: Theme.t("工作流", "Workflow"), desc: Theme.t("自动化流程", "Automation"), page: "workflow" }
                ]

                Rectangle {
                    required property var modelData
                    Layout.fillWidth: true
                    Layout.preferredHeight: 120
                    radius: Theme.radiusLg
                    color: featureCardMouse.containsMouse ? Theme.bgHover : Theme.bgCard
                    border.color: featureCardMouse.containsMouse ? Theme.accentColor : Theme.borderColor
                    border.width: featureCardMouse.containsMouse ? 1 : 0

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: Theme.spacingSm

                        Text {
                            text: modelData.icon
                            font.pixelSize: 28
                            Layout.alignment: Qt.AlignHCenter
                        }

                        Text {
                            text: modelData.label
                            font.pixelSize: Theme.fontMd
                            font.bold: true
                            color: Theme.textPrimary
                            Layout.alignment: Qt.AlignHCenter
                        }

                        Text {
                            text: modelData.desc
                            font.pixelSize: Theme.fontSm
                            color: Theme.textSecondary
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }

                    MouseArea {
                        id: featureCardMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: navigateTo(modelData.page)
                    }
                }
            }
        }
    }
}
