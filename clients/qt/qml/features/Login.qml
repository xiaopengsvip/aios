import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import AIOS

Rectangle {
    id: root
    color: Theme.bgColor

    // Responsive scaling based on screen size
    readonly property real scaleRatio: Math.min(width / 412, height / 892)  // iQOO Neo 8 base
    readonly property int sp: Math.max(1, Math.round(14 * scaleRatio))
    property string errorMessage: ""
    property string successMessage: ""
    property bool isLoading: false

    Connections {
        target: authManager
        function onLoginSuccess() {
            errorMessage = ""
            successMessage = "登录成功"
            isLoading = false
            successToast.show("登录成功，正在进入...")
        }
        function onLoginFailed(error) {
            errorMessage = error
            isLoading = false
            errorToast.show(error)
        }
    }

    // Background image with gradient overlay
    Image {
        anchors.fill: parent
        source: "qrc:/qt/qml/AIOS/resources/icons/splash-pc.png"
        fillMode: Image.PreserveAspectCrop
        opacity: 0.12
    }

    // Gradient overlay
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: Theme.bgColor }
            GradientStop { position: 0.3; color: Qt.rgba(Theme.bgColor.r, Theme.bgColor.g, Theme.bgColor.b, 0.85) }
            GradientStop { position: 1.0; color: Qt.rgba(Theme.bgColor.r, Theme.bgColor.g, Theme.bgColor.b, 0.95) }
        }
    }

    // Toast notifications
    Item {
        id: toastContainer
        anchors.top: parent.top
        anchors.topMargin: 50 * scaleRatio
        anchors.horizontalCenter: parent.horizontalCenter
        z: 100

        Rectangle {
            id: errorToast
            width: errorToastText.implicitWidth + 40 * scaleRatio
            height: 44 * scaleRatio
            radius: 22 * scaleRatio
            color: Qt.rgba(0.94, 0.27, 0.27, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0
            y: -50

            function show(msg) {
                errorToastText.text = msg
                errorToastAnim.start()
            }

            Text {
                id: errorToastText
                anchors.centerIn: parent
                font.pixelSize: Math.round(13 * scaleRatio)
                color: "white"
            }

            SequentialAnimation {
                id: errorToastAnim
                ParallelAnimation {
                    NumberAnimation { target: errorToast; property: "opacity"; from: 0; to: 1; duration: 300; easing.type: Easing.OutCubic }
                    NumberAnimation { target: errorToast; property: "y"; from: -50; to: 0; duration: 300; easing.type: Easing.OutCubic }
                }
                PauseAnimation { duration: 3000 }
                ParallelAnimation {
                    NumberAnimation { target: errorToast; property: "opacity"; from: 1; to: 0; duration: 300; easing.type: Easing.InCubic }
                    NumberAnimation { target: errorToast; property: "y"; from: 0; to: -50; duration: 300; easing.type: Easing.InCubic }
                }
            }
        }

        Rectangle {
            id: successToast
            width: successToastText.implicitWidth + 40 * scaleRatio
            height: 44 * scaleRatio
            radius: 22 * scaleRatio
            color: Qt.rgba(0.13, 0.77, 0.35, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0
            y: -50

            function show(msg) {
                successToastText.text = msg
                successToastAnim.start()
            }

            Text {
                id: successToastText
                anchors.centerIn: parent
                font.pixelSize: Math.round(13 * scaleRatio)
                color: "white"
            }

            SequentialAnimation {
                id: successToastAnim
                ParallelAnimation {
                    NumberAnimation { target: successToast; property: "opacity"; from: 0; to: 1; duration: 300 }
                    NumberAnimation { target: successToast; property: "y"; from: -50; to: 0; duration: 300 }
                }
                PauseAnimation { duration: 2000 }
                ParallelAnimation {
                    NumberAnimation { target: successToast; property: "opacity"; from: 1; to: 0; duration: 300 }
                    NumberAnimation { target: successToast; property: "y"; from: 0; to: -50; duration: 300 }
                }
            }
        }
    }

    // Main scrollable content
    Flickable {
        anchors.fill: parent
        contentHeight: loginColumn.implicitHeight + 60 * scaleRatio
        clip: true
        boundsBehavior: Flickable.StopAtBounds

        ColumnLayout {
            id: loginColumn
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
            anchors.topMargin: Math.max(60, root.height * 0.08) * scaleRatio
            width: Math.min(380 * scaleRatio, root.width - 40 * scaleRatio)
            spacing: 0

            // App icon with glow
            Item {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredWidth: 80 * scaleRatio
                Layout.preferredHeight: 80 * scaleRatio

                // Glow effect
                Rectangle {
                    anchors.centerIn: parent
                    width: 90 * scaleRatio
                    height: 90 * scaleRatio
                    radius: 45 * scaleRatio
                    color: "transparent"
                    border.color: Qt.rgba(0.39, 0.4, 0.95, 0.3)
                    border.width: 2
                    visible: !Theme.isDark

                    SequentialAnimation on opacity {
                        loops: Animation.Infinite
                        NumberAnimation { from: 0.3; to: 0.8; duration: 2000; easing.type: Easing.InOutSine }
                        NumberAnimation { from: 0.8; to: 0.3; duration: 2000; easing.type: Easing.InOutSine }
                    }
                }

                Image {
                    anchors.centerIn: parent
                    width: 72 * scaleRatio
                    height: 72 * scaleRatio
                    source: "qrc:/qt/qml/AIOS/resources/icons/app-icon.png"
                    fillMode: Image.PreserveAspectFit
                }
            }

            // Title
            Text {
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: 20 * scaleRatio
                text: "AI 超级工作台"
                font.pixelSize: Math.round(26 * scaleRatio)
                font.bold: true
                font.weight: Font.DemiBold
                color: Theme.textPrimary
            }

            // Subtitle
            Text {
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: 8 * scaleRatio
                Layout.bottomMargin: 32 * scaleRatio
                text: "多模型对话 · 智能工作流 · 全平台覆盖"
                font.pixelSize: Math.round(12 * scaleRatio)
                color: Theme.textMuted
            }

            // Email field
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 6 * scaleRatio

                Text {
                    text: "邮箱 / AI 账号"
                    font.pixelSize: Math.round(13 * scaleRatio)
                    font.weight: Font.Medium
                    color: Theme.textSecondary
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: emailField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: emailField.activeFocus ? Theme.accentColor : (emailField.text.length > 0 ? Theme.borderColor : "transparent")
                    border.width: emailField.activeFocus ? 2 : 1

                    Behavior on border.color { ColorAnimation { duration: 200 } }
                    Behavior on color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 16 * scaleRatio
                        anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio

                        Text {
                            text: "✉"
                            font.pixelSize: 18 * scaleRatio
                            color: emailField.activeFocus ? Theme.accentColor : Theme.textMuted
                        }

                        TextField {
                            id: emailField
                            Layout.fillWidth: true
                            placeholderText: "请输入邮箱或 AI 数字账号"
                            color: Theme.textPrimary
                            placeholderTextColor: Theme.textMuted
                            font.pixelSize: Math.round(15 * scaleRatio)
                            background: Item {}
                            leftPadding: 0; rightPadding: 0
                            verticalAlignment: TextInput.AlignVCenter

                            Keys.onReturnPressed: doLogin()
                            Keys.onEnterPressed: doLogin()
                        }
                    }
                }
            }

            // Password field
            ColumnLayout {
                Layout.fillWidth: true
                Layout.topMargin: 16 * scaleRatio
                spacing: 6 * scaleRatio

                RowLayout {
                    Layout.fillWidth: true
                    Text {
                        text: "密码"
                        font.pixelSize: Math.round(13 * scaleRatio)
                        font.weight: Font.Medium
                        color: Theme.textSecondary
                    }
                    Item { Layout.fillWidth: true }
                    Text {
                        text: "忘记密码?"
                        font.pixelSize: Math.round(13 * scaleRatio)
                        color: Theme.accentColor
                        MouseArea {
                            anchors.fill: parent
                            anchors.margins: -8
                            cursorShape: Qt.PointingHandCursor
                            onClicked: navigateTo("forgot-password")
                        }
                    }
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: passwordField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: passwordField.activeFocus ? Theme.accentColor : (passwordField.text.length > 0 ? Theme.borderColor : "transparent")
                    border.width: passwordField.activeFocus ? 2 : 1

                    Behavior on border.color { ColorAnimation { duration: 200 } }
                    Behavior on color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 16 * scaleRatio
                        anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio

                        Text {
                            text: "🔒"
                            font.pixelSize: 18 * scaleRatio
                            color: passwordField.activeFocus ? Theme.accentColor : Theme.textMuted
                        }

                        TextField {
                            id: passwordField
                            Layout.fillWidth: true
                            placeholderText: "请输入密码"
                            echoMode: showPwdBtn.checked ? TextInput.Normal : TextInput.Password
                            color: Theme.textPrimary
                            placeholderTextColor: Theme.textMuted
                            font.pixelSize: Math.round(15 * scaleRatio)
                            background: Item {}
                            leftPadding: 0; rightPadding: 0
                            verticalAlignment: TextInput.AlignVCenter

                            Keys.onReturnPressed: doLogin()
                            Keys.onEnterPressed: doLogin()
                        }

                        // Show/hide password
                        Item {
                            Layout.preferredWidth: 24
                            Layout.preferredHeight: 24

                            Text {
                                anchors.centerIn: parent
                                text: showPwdBtn.checked ? "👁" : "👁‍🗨"
                                font.pixelSize: 16 * scaleRatio
                            }

                            MouseArea {
                                id: showPwdBtn
                                anchors.fill: parent
                                property bool checked: false
                                cursorShape: Qt.PointingHandCursor
                                onClicked: checked = !checked
                            }
                        }
                    }
                }
            }

            // Login button
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 52 * scaleRatio
                Layout.topMargin: 28 * scaleRatio
                radius: 12 * scaleRatio
                color: {
                    if (isLoading) return Theme.accentColor
                    if (!enabled) return Qt.rgba(0.39, 0.4, 0.95, 0.4)
                    return loginBtnMouse.containsMouse ? Theme.accentHover : Theme.accentColor
                }
                enabled: emailField.text.trim().length > 0 && passwordField.text.length > 0 && !isLoading
                opacity: enabled ? 1.0 : 0.6

                Behavior on color { ColorAnimation { duration: 200 } }

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 8

                    // Loading spinner
                    Item {
                        Layout.preferredWidth: 20
                        Layout.preferredHeight: 20
                        visible: isLoading

                        Rectangle {
                            id: spinner
                            anchors.centerIn: parent
                            width: 16; height: 16
                            radius: 8
                            color: "transparent"
                            border.color: "white"
                            border.width: 2
                            opacity: 0.8

                            RotationAnimation {
                                target: spinner
                                from: 0; to: 360
                                duration: 1000
                                loops: Animation.Infinite
                                running: isLoading
                            }
                        }
                    }

                    Text {
                        text: isLoading ? "登录中..." : "登 录"
                        font.pixelSize: Math.round(16 * scaleRatio)
                        font.weight: Font.DemiBold
                        color: "white"
                    }
                }

                MouseArea {
                    id: loginBtnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: doLogin()
                }

                // Press effect
                scale: loginBtnMouse.pressed ? 0.98 : 1.0
                Behavior on scale { NumberAnimation { duration: 100 } }
            }

            // Divider
            RowLayout {
                Layout.fillWidth: true
                Layout.topMargin: 28 * scaleRatio
                Layout.bottomMargin: 20 * scaleRatio
                spacing: 16 * scaleRatio

                Rectangle { Layout.fillWidth: true; height: 1; color: Theme.borderColor }

                Text {
                    text: "其他登录方式"
                    font.pixelSize: Math.round(12 * scaleRatio)
                    color: Theme.textMuted
                }

                Rectangle { Layout.fillWidth: true; height: 1; color: Theme.borderColor }
            }

            // OAuth buttons
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 52 * scaleRatio
                spacing: 12 * scaleRatio

                Repeater {
                    model: [
                        { label: "GitHub", icon: "⚙", color: Theme.textPrimary },
                        { label: "Google", icon: "G", color: "#4285F4" },
                        { label: "X", icon: "𝕏", color: Theme.textPrimary }
                    ]

                    delegate: Rectangle {
                        required property var modelData
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: 12 * scaleRatio
                        color: oauthMouse.containsMouse ? Theme.bgHover : Theme.bgCard
                        border.color: Theme.borderColor
                        border.width: 1

                        Behavior on color { ColorAnimation { duration: 200 } }

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 4

                            Text {
                                text: modelData.icon
                                font.pixelSize: 20 * scaleRatio
                                font.bold: modelData.icon === "G" || modelData.icon === "𝕏"
                                color: modelData.color
                                Layout.alignment: Qt.AlignHCenter
                            }

                            Text {
                                text: modelData.label
                                font.pixelSize: Math.round(11 * scaleRatio)
                                color: Theme.textSecondary
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }

                        MouseArea {
                            id: oauthMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: openOAuth(modelData.label.toLowerCase().replace("x", "twitter"))
                        }

                        scale: oauthMouse.pressed ? 0.95 : 1.0
                        Behavior on scale { NumberAnimation { duration: 100 } }
                    }
                }
            }

            // Register link
            RowLayout {
                Layout.fillWidth: true
                Layout.topMargin: 28 * scaleRatio
                Layout.alignment: Qt.AlignHCenter

                Text {
                    text: "还没有账号？"
                    font.pixelSize: Math.round(14 * scaleRatio)
                    color: Theme.textSecondary
                }

                Text {
                    text: "立即注册"
                    font.pixelSize: Math.round(14 * scaleRatio)
                    font.weight: Font.DemiBold
                    color: Theme.accentColor

                    MouseArea {
                        anchors.fill: parent
                        anchors.margins: -8
                        cursorShape: Qt.PointingHandCursor
                        onClicked: navigateTo("register")
                    }
                }
            }
        }
    }

    function doLogin() {
        if (emailField.text.trim().length === 0 || passwordField.text.length === 0) return
        errorMessage = ""
        isLoading = true
        authManager.login(emailField.text.trim(), passwordField.text)
    }

    function openOAuth(provider) {
        errorMessage = ""
        var url = "https://aios.vios.top/api/auth/oauth/" + provider + "?action=login"
        Qt.openUrlExternally(url)
    }
}
