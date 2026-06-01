import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import AIOS

Rectangle {
    id: root
    color: Theme.bgColor

    readonly property real scaleRatio: Math.min(width / 412, height / 892)
    property string errorMessage: ""
    property string successMessage: ""
    property bool isLoading: false
    property int codeCooldown: 0

    Connections {
        target: authManager
        function onRegisterSuccess() {
            isLoading = false
            successMessage = "注册成功！请登录"
            successToast.show("注册成功，请登录")
        }
        function onRegisterFailed(error) {
            isLoading = false
            errorMessage = error
            errorToast.show(error)
        }
    }

    // Background
    Image {
        anchors.fill: parent
        source: "qrc:/qt/qml/AIOS/resources/icons/splash-pc.png"
        fillMode: Image.PreserveAspectCrop
        opacity: 0.12
    }
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: Theme.bgColor }
            GradientStop { position: 1.0; color: Qt.rgba(Theme.bgColor.r, Theme.bgColor.g, Theme.bgColor.b, 0.95) }
        }
    }

    // Toasts
    Item {
        anchors.top: parent.top
        anchors.topMargin: 50 * scaleRatio
        anchors.horizontalCenter: parent.horizontalCenter
        z: 100

        Rectangle {
            id: errorToast
            width: errText.implicitWidth + 40 * scaleRatio
            height: 44 * scaleRatio
            radius: 22 * scaleRatio
            color: Qt.rgba(0.94, 0.27, 0.27, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0; y: -50
            function show(msg) { errText.text = msg; errAnim.start() }
            Text { id: errText; anchors.centerIn: parent; font.pixelSize: 13 * scaleRatio; color: "white" }
            SequentialAnimation { id: errAnim
                ParallelAnimation {
                    NumberAnimation { target: errorToast; property: "opacity"; to: 1; duration: 300 }
                    NumberAnimation { target: errorToast; property: "y"; to: 0; duration: 300 }
                }
                PauseAnimation { duration: 3000 }
                ParallelAnimation {
                    NumberAnimation { target: errorToast; property: "opacity"; to: 0; duration: 300 }
                    NumberAnimation { target: errorToast; property: "y"; to: -50; duration: 300 }
                }
            }
        }

        Rectangle {
            id: successToast
            width: sucText.implicitWidth + 40 * scaleRatio
            height: 44 * scaleRatio
            radius: 22 * scaleRatio
            color: Qt.rgba(0.13, 0.77, 0.35, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0; y: -50
            function show(msg) { sucText.text = msg; sucAnim.start() }
            Text { id: sucText; anchors.centerIn: parent; font.pixelSize: 13 * scaleRatio; color: "white" }
            SequentialAnimation { id: sucAnim
                ParallelAnimation {
                    NumberAnimation { target: successToast; property: "opacity"; to: 1; duration: 300 }
                    NumberAnimation { target: successToast; property: "y"; to: 0; duration: 300 }
                }
                PauseAnimation { duration: 2000 }
                ParallelAnimation {
                    NumberAnimation { target: successToast; property: "opacity"; to: 0; duration: 300 }
                    NumberAnimation { target: successToast; property: "y"; to: -50; duration: 300 }
                }
            }
        }
    }

    Flickable {
        anchors.fill: parent
        contentHeight: regCol.implicitHeight + 60 * scaleRatio
        clip: true
        boundsBehavior: Flickable.StopAtBounds

        ColumnLayout {
            id: regCol
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
            anchors.topMargin: Math.max(40, root.height * 0.05) * scaleRatio
            width: Math.min(380 * scaleRatio, root.width - 40 * scaleRatio)
            spacing: 0

            // Back button
            RowLayout {
                Layout.fillWidth: true
                Layout.bottomMargin: 24 * scaleRatio

                Rectangle {
                    Layout.preferredWidth: 36 * scaleRatio
                    Layout.preferredHeight: 36 * scaleRatio
                    radius: 18 * scaleRatio
                    color: backMouse.containsMouse ? Theme.bgHover : "transparent"

                    Text {
                        anchors.centerIn: parent
                        text: "←"
                        font.pixelSize: 20 * scaleRatio
                        color: Theme.textPrimary
                    }

                    MouseArea {
                        id: backMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: navigateTo("login")
                    }
                }

                Item { Layout.fillWidth: true }
            }

            // Title
            Text {
                text: "创建账号"
                font.pixelSize: Math.round(28 * scaleRatio)
                font.bold: true
                font.weight: Font.Bold
                color: Theme.textPrimary
            }

            Text {
                Layout.topMargin: 8 * scaleRatio
                Layout.bottomMargin: 28 * scaleRatio
                text: "注册后即可使用全部 AI 功能"
                font.pixelSize: Math.round(14 * scaleRatio)
                color: Theme.textMuted
            }

            // Username
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 6 * scaleRatio
                Text { text: "用户名"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: usernameField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: usernameField.activeFocus ? Theme.accentColor : "transparent"
                    border.width: 2
                    Behavior on border.color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio
                        Text { text: "👤"; font.pixelSize: 18 * scaleRatio; color: usernameField.activeFocus ? Theme.accentColor : Theme.textMuted }
                        TextField {
                            id: usernameField
                            Layout.fillWidth: true
                            placeholderText: "请输入用户名"
                            color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                            font.pixelSize: 15 * scaleRatio
                            background: Item {}
                            leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                        }
                    }
                }
            }

            // Email
            ColumnLayout {
                Layout.fillWidth: true; Layout.topMargin: 16 * scaleRatio; spacing: 6 * scaleRatio
                Text { text: "邮箱"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: emailField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: emailField.activeFocus ? Theme.accentColor : "transparent"
                    border.width: 2
                    Behavior on border.color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio
                        Text { text: "✉"; font.pixelSize: 18 * scaleRatio; color: emailField.activeFocus ? Theme.accentColor : Theme.textMuted }
                        TextField {
                            id: emailField
                            Layout.fillWidth: true
                            placeholderText: "请输入邮箱地址"
                            color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                            font.pixelSize: 15 * scaleRatio
                            background: Item {}
                            leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                        }
                    }
                }
            }

            // Verification code
            ColumnLayout {
                Layout.fillWidth: true; Layout.topMargin: 16 * scaleRatio; spacing: 6 * scaleRatio
                Text { text: "验证码"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                RowLayout {
                    spacing: 12 * scaleRatio

                    Rectangle {
                        Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                        radius: 12 * scaleRatio
                        color: codeField.activeFocus ? Theme.bgCard : Theme.bgHover
                        border.color: codeField.activeFocus ? Theme.accentColor : "transparent"
                        border.width: 2

                        RowLayout {
                            anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                            spacing: 10 * scaleRatio
                            Text { text: "🔑"; font.pixelSize: 18 * scaleRatio; color: codeField.activeFocus ? Theme.accentColor : Theme.textMuted }
                            TextField {
                                id: codeField
                                Layout.fillWidth: true
                                placeholderText: "6位验证码"
                                color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                                font.pixelSize: 15 * scaleRatio
                                maximumLength: 6
                                background: Item {}
                                leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                            }
                        }
                    }

                    Rectangle {
                        Layout.preferredWidth: 110 * scaleRatio; Layout.preferredHeight: 52 * scaleRatio
                        radius: 12 * scaleRatio
                        color: {
                            if (codeCooldown > 0) return Theme.bgHover
                            return codeBtnMouse.containsMouse ? Theme.accentHover : Theme.accentColor
                        }
                        enabled: emailField.text.trim().length > 0 && codeCooldown === 0 && !isLoading

                        Text {
                            anchors.centerIn: parent
                            text: codeCooldown > 0 ? codeCooldown + "s" : "发送验证码"
                            font.pixelSize: 13 * scaleRatio
                            font.weight: Font.Medium
                            color: parent.enabled ? "white" : Theme.textMuted
                        }

                        MouseArea {
                            id: codeBtnMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                apiManager.post("/api/auth/send-code", {"email": emailField.text.trim(), "type": "register"}, "send-code")
                                codeCooldown = 60
                                cooldownTimer.start()
                            }
                        }
                    }
                }
            }

            Timer {
                id: cooldownTimer
                interval: 1000; repeat: true
                onTriggered: { if (codeCooldown > 0) codeCooldown--; else stop() }
            }

            // Password
            ColumnLayout {
                Layout.fillWidth: true; Layout.topMargin: 16 * scaleRatio; spacing: 6 * scaleRatio
                Text { text: "密码 (至少8位)"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: passwordField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: passwordField.activeFocus ? Theme.accentColor : "transparent"
                    border.width: 2

                    RowLayout {
                        anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio
                        Text { text: "🔒"; font.pixelSize: 18 * scaleRatio; color: passwordField.activeFocus ? Theme.accentColor : Theme.textMuted }
                        TextField {
                            id: passwordField
                            Layout.fillWidth: true
                            placeholderText: "请输入密码"
                            echoMode: showPwd.checked ? TextInput.Normal : TextInput.Password
                            color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                            font.pixelSize: 15 * scaleRatio
                            background: Item {}
                            leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter

                            // Password strength indicator
                            onTextChanged: passwordStrength.text = getPasswordStrength()
                        }

                        Item {
                            Layout.preferredWidth: 24; Layout.preferredHeight: 24
                            Text { anchors.centerIn: parent; text: showPwd.checked ? "👁" : "👁‍🗨"; font.pixelSize: 16 * scaleRatio }
                            MouseArea { id: showPwd; anchors.fill: parent; property bool checked: false; cursorShape: Qt.PointingHandCursor; onClicked: checked = !checked }
                        }
                    }
                }

                // Password strength
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Repeater {
                        model: 4
                        Rectangle {
                            Layout.fillWidth: true; Layout.preferredHeight: 3; radius: 2
                            color: {
                                var strength = getPasswordStrengthLevel()
                                return index < strength ? (strength <= 1 ? Theme.errorColor : strength <= 2 ? Theme.warningColor : Theme.successColor) : Theme.borderColor
                            }
                        }
                    }
                }

                Text {
                    id: passwordStrength
                    font.pixelSize: 11 * scaleRatio
                    color: {
                        var l = getPasswordStrengthLevel()
                        return l <= 1 ? Theme.errorColor : l <= 2 ? Theme.warningColor : Theme.successColor
                    }
                }
            }

            // Register button
            Rectangle {
                Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio; Layout.topMargin: 28 * scaleRatio
                radius: 12 * scaleRatio
                color: isLoading ? Theme.accentColor : (regBtnMouse.containsMouse ? Theme.accentHover : Theme.accentColor)
                enabled: usernameField.text.trim().length > 0 && emailField.text.trim().length > 0 && codeField.text.length > 0 && passwordField.text.length >= 8 && !isLoading
                opacity: enabled ? 1.0 : 0.5

                RowLayout {
                    anchors.centerIn: parent; spacing: 8
                    Item { Layout.preferredWidth: 20; Layout.preferredHeight: 20; visible: isLoading
                        Rectangle { id: regSpinner; anchors.centerIn: parent; width: 16; height: 16; radius: 8; color: "transparent"; border.color: "white"; border.width: 2; opacity: 0.8
                            RotationAnimation { target: regSpinner; from: 0; to: 360; duration: 1000; loops: Animation.Infinite; running: isLoading }
                        }
                    }
                    Text { text: isLoading ? "注册中..." : "注 册"; font.pixelSize: 16 * scaleRatio; font.weight: Font.DemiBold; color: "white" }
                }

                MouseArea { id: regBtnMouse; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: doRegister() }
                scale: regBtnMouse.pressed ? 0.98 : 1.0
                Behavior on scale { NumberAnimation { duration: 100 } }
            }

            // Login link
            RowLayout {
                Layout.fillWidth: true; Layout.topMargin: 24 * scaleRatio; Layout.alignment: Qt.AlignHCenter
                Text { text: "已有账号？"; font.pixelSize: 14 * scaleRatio; color: Theme.textSecondary }
                Text {
                    text: "去登录"; font.pixelSize: 14 * scaleRatio; font.weight: Font.DemiBold; color: Theme.accentColor
                    MouseArea { anchors.fill: parent; anchors.margins: -8; cursorShape: Qt.PointingHandCursor; onClicked: navigateTo("login") }
                }
            }
        }
    }

    function doRegister() {
        if (isLoading) return
        errorMessage = ""; successMessage = ""; isLoading = true
        authManager.registerUser(usernameField.text.trim(), emailField.text.trim(), passwordField.text)
    }

    function getPasswordStrength() {
        var p = passwordField.text
        if (p.length === 0) return ""
        if (p.length < 8) return "密码太短"
        var hasNum = /\d/.test(p), hasUpper = /[A-Z]/.test(p), hasSpecial = /[!@#$%^&*]/.test(p)
        if (hasNum && hasUpper && hasSpecial) return "强"
        if (hasNum && (hasUpper || hasSpecial)) return "中"
        return "弱"
    }

    function getPasswordStrengthLevel() {
        var p = passwordField.text
        if (p.length < 8) return 1
        var hasNum = /\d/.test(p), hasUpper = /[A-Z]/.test(p), hasSpecial = /[!@#$%^&*]/.test(p)
        if (hasNum && hasUpper && hasSpecial) return 4
        if (hasNum && (hasUpper || hasSpecial)) return 3
        return 2
    }
}
