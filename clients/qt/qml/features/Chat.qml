import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs

Rectangle {
    color: Theme.bgColor

    property var messages: []
    property bool isStreaming: false
    property var attachments: []  // attached files: [{name, path}]

    // Connect to API signals
    Connections {
        target: apiManager

        function onChatChunkReceived(chunk) {
            if (messages.length > 0) {
                var last = messages[messages.length - 1]
                if (last.role === "assistant") {
                    if (last.content === "思考中...") last.content = ""
                    last.content += chunk
                    messages = messages.slice()
                }
            }
        }

        function onChatCompleted(result) {
            isStreaming = false
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // Messages area
        ListView {
            id: chatList
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            spacing: Theme.spacingMd
            model: messages

            onCountChanged: positionViewAtEnd()

            delegate: Rectangle {
                required property var modelData
                width: chatList.width
                height: msgContent.implicitHeight + 32
                color: "transparent"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: Theme.spacingLg
                    anchors.rightMargin: Theme.spacingLg

                    // Avatar
                    Rectangle {
                        Layout.preferredWidth: 32
                        Layout.preferredHeight: 32
                        radius: 16
                        color: modelData.role === "user" ? Theme.accentColor : Theme.successColor

                        Text {
                            anchors.centerIn: parent
                            text: modelData.role === "user" ? "U" : "A"
                            font.pixelSize: Theme.fontMd
                            font.bold: true
                            color: "white"
                        }
                    }

                    // Message content
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.maximumWidth: 600
                        implicitHeight: msgContent.implicitHeight + 24
                        radius: Theme.radiusMd
                        color: modelData.role === "user" ? Theme.accentColor : Theme.bgCard
                        border.color: modelData.role === "user" ? "transparent" : Theme.borderColor
                        border.width: modelData.role === "user" ? 0 : 1

                        Text {
                            id: msgContent
                            anchors.fill: parent
                            anchors.margins: Theme.spacingMd
                            text: modelData.content
                            font.pixelSize: Theme.fontMd
                            color: modelData.role === "user" ? "white" : Theme.textPrimary
                            wrapMode: Text.WordWrap
                        }
                    }

                    Item { Layout.fillWidth: modelData.role !== "user" }
                }
            }

            // Empty state
            ColumnLayout {
                anchors.centerIn: parent
                visible: messages.length === 0
                spacing: Theme.spacingMd

                Text {
                    text: "💬"
                    font.pixelSize: 48
                    Layout.alignment: Qt.AlignHCenter
                }
                Text {
                    text: Theme.t("开始新的对话", "Start a new conversation")
                    font.pixelSize: Theme.fontXl
                    color: Theme.textPrimary
                    Layout.alignment: Qt.AlignHCenter
                }
                Text {
                    text: Theme.t("选择一个模型，发送消息开始聊天", "Select a model and send a message")
                    font.pixelSize: Theme.fontMd
                    color: Theme.textSecondary
                    Layout.alignment: Qt.AlignHCenter
                }
            }
        }

        // Input area
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: attachments.length > 0 ? 120 : 80
            color: Theme.bgCard
            border.color: Theme.borderColor
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingMd
                spacing: 6

                // Attached files bar
                RowLayout {
                    visible: attachments.length > 0
                    Layout.fillWidth: true
                    Layout.preferredHeight: 28
                    spacing: 6

                    Repeater {
                        model: attachments

                        Rectangle {
                            required property var modelData
                            required property int index
                            Layout.preferredHeight: 24
                            width: attachLabel.implicitWidth + 28
                            radius: Theme.radiusSm
                            color: Theme.bgHover

                            Row {
                                anchors.centerIn: parent
                                spacing: 4

                                Text {
                                    text: "📎"
                                    font.pixelSize: 12
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                Text {
                                    id: attachLabel
                                    text: modelData.name
                                    font.pixelSize: Theme.fontSm
                                    color: Theme.textPrimary
                                    anchors.verticalCenter: parent.verticalCenter
                                }
                            }

                            // Remove button
                            Text {
                                text: "✕"
                                font.pixelSize: 10
                                color: Theme.textMuted
                                anchors.right: parent.right
                                anchors.rightMargin: 6
                                anchors.verticalCenter: parent.verticalCenter

                                MouseArea {
                                    anchors.fill: parent
                                    anchors.margins: -4
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        var arr = attachments.slice()
                                        arr.splice(index, 1)
                                        attachments = arr
                                    }
                                }
                            }
                        }
                    }

                    Item { Layout.fillWidth: true }
                }

                // Input row
                RowLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    spacing: 8

                    // Attachment button
                    Rectangle {
                        Layout.preferredWidth: 36
                        Layout.preferredHeight: 36
                        radius: Theme.radiusSm
                        color: attachMouse.containsMouse ? Theme.bgHover : "transparent"

                        Text {
                            anchors.centerIn: parent
                            text: "📎"
                            font.pixelSize: 18
                        }

                        MouseArea {
                            id: attachMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: fileDialog.open()
                        }
                    }

                    TextField {
                        id: chatInput
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        placeholderText: Theme.t("输入消息...", "Type a message...")
                        color: Theme.textPrimary
                        placeholderTextColor: Theme.textMuted
                        font.pixelSize: Theme.fontMd
                        background: Rectangle {
                            radius: Theme.radiusMd
                            color: Theme.bgHover
                        }
                        leftPadding: 14
                        rightPadding: 14

                        Keys.onReturnPressed: sendMessage()
                        Keys.onEnterPressed: sendMessage()
                    }

                    // Send button
                    Rectangle {
                        Layout.preferredWidth: 64
                        Layout.preferredHeight: 36
                        radius: Theme.radiusSm
                        color: sendMouse.containsMouse ? Theme.accentHover : Theme.accentColor
                        enabled: !isStreaming && chatInput.text.trim().length > 0
                        opacity: enabled ? 1.0 : 0.5

                        Text {
                            anchors.centerIn: parent
                            text: Theme.t("发送", "Send")
                            font.pixelSize: 14
                            font.bold: true
                            color: "white"
                        }

                        MouseArea {
                            id: sendMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: sendMessage()
                        }
                    }
                }
            }
        }
    }

    // File dialog for attachments
    FileDialog {
        id: fileDialog
        title: "选择附件"
        fileMode: FileDialog.OpenFiles
        onAccepted: {
            var newAttachments = attachments.slice()
            for (var i = 0; i < fileDialog.selectedFiles.length; i++) {
                var filePath = fileDialog.selectedFiles[i]
                var fileName = filePath.toString().split("/").pop()
                newAttachments.push({ name: fileName, path: filePath })
            }
            attachments = newAttachments
        }
    }

    function sendMessage() {
        var text = chatInput.text.trim()
        if (text.length === 0 || isStreaming) return

        // Build message with attachment info
        var displayText = text
        if (attachments.length > 0) {
            var fileNames = attachments.map(function(a) { return a.name }).join(", ")
            displayText = text + "\n[附件: " + fileNames + "]"
        }

        messages.push({role: "user", content: displayText})
        messages.push({role: "assistant", content: "思考中..."})
        messages = messages.slice()
        chatInput.text = ""
        attachments = []
        isStreaming = true

        apiManager.streamChat(text, storeManager.currentModel)
    }
}
