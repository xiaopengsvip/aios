import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import AIOS

Rectangle {
    color: Theme.bgColor

    Flickable {
        anchors.fill: parent
        contentHeight: settingsCol.implicitHeight + 40
        clip: true

        ColumnLayout {
            id: settingsCol
            anchors.horizontalCenter: parent.horizontalCenter
            width: Math.min(600, parent.width - 48)
            spacing: Theme.spacingXl

            Text {
                text: Theme.t("设置", "Settings")
                font.pixelSize: Theme.fontXxl
                font.bold: true
                color: Theme.textPrimary
            }

            // ====== 外观 ======
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: appearanceCol.implicitHeight + 32
                radius: Theme.radiusLg
                color: Theme.bgCard
                border.color: Theme.borderColor
                border.width: 1

                ColumnLayout {
                    id: appearanceCol
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLg
                    spacing: Theme.spacingMd

                    Text {
                        text: Theme.t("外观", "Appearance")
                        font.pixelSize: Theme.fontLg
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    // Theme mode
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: Theme.spacingSm

                        Text {
                            text: Theme.t("主题模式", "Theme Mode")
                            font.pixelSize: Theme.fontSm
                            color: Theme.textSecondary
                        }

                        RowLayout {
                            spacing: Theme.spacingSm

                            Repeater {
                                model: [
                                    { label: Theme.t("跟随系统", "System"), value: "system", icon: "💻" },
                                    { label: Theme.t("浅色模式", "Light"), value: "light", icon: "☀" },
                                    { label: Theme.t("深色模式", "Dark"), value: "dark", icon: "🌙" }
                                ]

                                delegate: Rectangle {
                                    required property var modelData
                                    Layout.fillWidth: true
                                    Layout.preferredHeight: 44
                                    radius: Theme.radiusMd
                                    color: storeManager.themeMode === modelData.value
                                        ? Theme.accentColor
                                        : (themeBtnMouse.containsMouse ? Theme.bgHover : "transparent")
                                    border.color: storeManager.themeMode === modelData.value
                                        ? "transparent" : Theme.borderColor
                                    border.width: 1

                                    RowLayout {
                                        anchors.centerIn: parent
                                        spacing: 6

                                        Text {
                                            text: modelData.icon
                                            font.pixelSize: 16
                                        }

                                        Text {
                                            text: modelData.label
                                            font.pixelSize: Theme.fontSm
                                            font.bold: storeManager.themeMode === modelData.value
                                            color: storeManager.themeMode === modelData.value
                                                ? "white" : Theme.textPrimary
                                        }
                                    }

                                    MouseArea {
                                        id: themeBtnMouse
                                        anchors.fill: parent
                                        hoverEnabled: true
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            storeManager.themeMode = modelData.value
                                            Theme.mode = modelData.value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ====== 网络 ======
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: networkCol.implicitHeight + 32
                radius: Theme.radiusLg
                color: Theme.bgCard
                border.color: Theme.borderColor
                border.width: 1

                ColumnLayout {
                    id: networkCol
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLg
                    spacing: Theme.spacingMd

                    Text {
                        text: Theme.t("网络", "Network")
                        font.pixelSize: Theme.fontLg
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    // Network status
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: Theme.spacingSm

                        Rectangle {
                            width: 8; height: 8; radius: 4
                            color: apiManager.networkOk ? Theme.successColor : Theme.errorColor
                        }

                        Text {
                            text: apiManager.networkOk ? Theme.t("网络正常", "Connected") : Theme.t("网络异常", "Disconnected")
                            font.pixelSize: Theme.fontSm
                            color: apiManager.networkOk ? Theme.successColor : Theme.errorColor
                        }

                        Item { Layout.fillWidth: true }

                        Text {
                            text: Theme.t("重新检测", "Recheck")
                            font.pixelSize: Theme.fontXs
                            color: Theme.accentColor
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: apiManager.checkNetwork()
                            }
                        }
                    }

                    // Proxy mode
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: Theme.spacingSm

                        Text {
                            text: Theme.t("代理模式", "Proxy Mode")
                            font.pixelSize: Theme.fontSm
                            color: Theme.textSecondary
                        }

                        RowLayout {
                            spacing: Theme.spacingSm

                            Repeater {
                                model: [
                                    { label: Theme.t("系统代理", "System"), value: "system" },
                                    { label: Theme.t("直连", "Direct"), value: "direct" },
                                    { label: Theme.t("自定义", "Custom"), value: "custom" }
                                ]

                                delegate: Rectangle {
                                    required property var modelData
                                    Layout.fillWidth: true
                                    Layout.preferredHeight: 36
                                    radius: Theme.radiusSm
                                    color: apiManager.proxyMode === modelData.value
                                        ? Theme.accentColor
                                        : (proxyBtnMouse.containsMouse ? Theme.bgHover : "transparent")
                                    border.color: apiManager.proxyMode === modelData.value
                                        ? "transparent" : Theme.borderColor
                                    border.width: 1

                                    Text {
                                        anchors.centerIn: parent
                                        text: modelData.label
                                        font.pixelSize: Theme.fontXs
                                        color: apiManager.proxyMode === modelData.value
                                            ? "white" : Theme.textPrimary
                                    }

                                    MouseArea {
                                        id: proxyBtnMouse
                                        anchors.fill: parent
                                        hoverEnabled: true
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: apiManager.proxyMode = modelData.value
                                    }
                                }
                            }
                        }
                    }

                    // Custom proxy fields
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: Theme.spacingXs
                        visible: apiManager.proxyMode === "custom"

                        RowLayout {
                            spacing: Theme.spacingSm

                            TextField {
                                id: proxyHostField
                                Layout.fillWidth: true
                                placeholderText: "127.0.0.1"
                                color: Theme.textPrimary
                                placeholderTextColor: Theme.textMuted
                                background: Rectangle {
                                    radius: Theme.radiusSm
                                    color: Theme.bgHover
                                    border.color: proxyHostField.activeFocus ? Theme.accentColor : Theme.borderColor
                                    border.width: 1
                                }
                                leftPadding: 10; height: 36
                            }

                            TextField {
                                id: proxyPortField
                                Layout.preferredWidth: 80
                                placeholderText: "7890"
                                color: Theme.textPrimary
                                placeholderTextColor: Theme.textMuted
                                background: Rectangle {
                                    radius: Theme.radiusSm
                                    color: Theme.bgHover
                                    border.color: proxyPortField.activeFocus ? Theme.accentColor : Theme.borderColor
                                    border.width: 1
                                }
                                leftPadding: 10; height: 36
                            }
                        }

                        Rectangle {
                            Layout.preferredWidth: 80
                            Layout.preferredHeight: 32
                            radius: Theme.radiusSm
                            color: Theme.accentColor
                            Layout.alignment: Qt.AlignRight

                            Text {
                                anchors.centerIn: parent
                                text: Theme.t("应用", "Apply")
                                font.pixelSize: Theme.fontXs
                                color: "white"
                            }

                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    var port = parseInt(proxyPortField.text)
                                    if (proxyHostField.text && port > 0) {
                                        apiManager.setCustomProxy(proxyHostField.text, port, "http")
                                    }
                                }
                            }
                        }
                    }

                    // Current proxy info
                    Text {
                        text: Theme.t("当前代理: ", "Proxy: ") + apiManager.proxyInfo
                        font.pixelSize: Theme.fontXs
                        color: Theme.textMuted
                    }
                }
            }

            // ====== 语言 ======
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: langCol.implicitHeight + 32
                radius: Theme.radiusLg
                color: Theme.bgCard
                border.color: Theme.borderColor
                border.width: 1

                ColumnLayout {
                    id: langCol
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLg
                    spacing: Theme.spacingMd

                    Text {
                        text: Theme.t("语言", "Language")
                        font.pixelSize: Theme.fontLg
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    RowLayout {
                        spacing: Theme.spacingSm

                        Repeater {
                            model: [
                                { label: "简体中文", value: "zh-CN", icon: "🇨🇳" },
                                { label: "English", value: "en", icon: "🇺🇸" }
                            ]

                            delegate: Rectangle {
                                required property var modelData
                                Layout.fillWidth: true
                                Layout.preferredHeight: 44
                                radius: Theme.radiusMd
                                color: storeManager.language === modelData.value
                                    ? Theme.accentColor
                                    : (langBtnMouse.containsMouse ? Theme.bgHover : "transparent")
                                border.color: storeManager.language === modelData.value
                                    ? "transparent" : Theme.borderColor
                                border.width: 1

                                RowLayout {
                                    anchors.centerIn: parent
                                    spacing: 6

                                    Text {
                                        text: modelData.icon
                                        font.pixelSize: 16
                                    }

                                    Text {
                                        text: modelData.label
                                        font.pixelSize: Theme.fontSm
                                        font.bold: storeManager.language === modelData.value
                                        color: storeManager.language === modelData.value
                                            ? "white" : Theme.textPrimary
                                    }
                                }

                                MouseArea {
                                    id: langBtnMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: storeManager.language = modelData.value
                                }
                            }
                        }
                    }
                }
            }

            // ====== 模型 ======
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: modelCol.implicitHeight + 32
                radius: Theme.radiusLg
                color: Theme.bgCard
                border.color: Theme.borderColor
                border.width: 1

                ColumnLayout {
                    id: modelCol
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLg
                    spacing: Theme.spacingMd

                    Text {
                        text: Theme.t("默认模型", "Default Model")
                        font.pixelSize: Theme.fontLg
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    Text {
                        text: Theme.t("当前: ", "Current: ") + storeManager.currentModel
                        font.pixelSize: Theme.fontSm
                        color: Theme.textSecondary
                    }
                }
            }

            // ====== 账号 ======
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: accountCol.implicitHeight + 32
                radius: Theme.radiusLg
                color: Theme.bgCard
                border.color: Theme.borderColor
                border.width: 1

                ColumnLayout {
                    id: accountCol
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLg
                    spacing: Theme.spacingMd

                    Text {
                        text: Theme.t("账号", "Account")
                        font.pixelSize: Theme.fontLg
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    Text {
                        text: Theme.t("用户名: ", "Username: ") + authManager.userName
                        font.pixelSize: Theme.fontSm
                        color: Theme.textSecondary
                    }

                    Text {
                        text: Theme.t("邮箱: ", "Email: ") + authManager.userEmail
                        font.pixelSize: Theme.fontSm
                        color: Theme.textSecondary
                    }

                    Rectangle {
                        Layout.preferredWidth: 100
                        Layout.preferredHeight: 36
                        radius: Theme.radiusSm
                        color: logoutMouse.containsMouse ? Theme.errorColor : "transparent"
                        border.color: Theme.errorColor
                        border.width: 1

                        Text {
                            anchors.centerIn: parent
                            text: Theme.t("退出登录", "Sign Out")
                            font.pixelSize: Theme.fontSm
                            color: logoutMouse.containsMouse ? "white" : Theme.errorColor
                        }

                        MouseArea {
                            id: logoutMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: authManager.logout()
                        }
                    }
                }
            }
        }
    }

    // Sync theme on load
    Component.onCompleted: {
        Theme.mode = storeManager.themeMode
    }
}
