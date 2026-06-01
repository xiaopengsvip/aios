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
    property int step: 1  // 1: enter email, 2: enter new password

    Connections {
        target: apiManager
        function onResponseReceived(requestId, data) {
            if (requestId === "reset-password") {
                isLoading = false
                if (data["status"] === "ok") {
                    step = 2
                    successToast.show("验证码已发送到邮箱")
                } else {
                    errorToast.show(data["error"] || "发送失败")
                }
            }
            if (requestId === "confirm-reset") {
                isLoading = false
                if (data["status"] === "ok") {
                    successToast.show("密码重置成功，请登录")
                    navigateTo("login")
                } else {
                    errorToast.show(data["error"] || "重置失败")
                }
            }
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
        anchors.top: parent.top; anchors.topMargin: 50 * scaleRatio; anchors.horizontalCenter: parent.horizontalCenter; z: 100

        Rectangle {
            id: errorToast
            width: errText.implicitWidth + 40 * scaleRatio; height: 44 * scaleRatio; radius: 22 * scaleRatio
            color: Qt.rgba(0.94, 0.27, 0.27, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter; opacity: 0; y: -50
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
            width: sucText.implicitWidth + 40 * scaleRatio; height: 44 * scaleRatio; radius: 22 * scaleRatio
            color: Qt.rgba(0.13, 0.77, 0.35, 0.9)
            anchors.horizontalCenter: parent.horizontalCenter; opacity: 0; y: -50
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
        contentHeight: resetCol.implicitHeight + 60 * scaleRatio
        clip: true; boundsBehavior: Flickable.StopAtBounds

        ColumnLayout {
            id: resetCol
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top; anchors.topMargin: Math.max(40, root.height * 0.05) * scaleRatio
            width: Math.min(380 * scaleRatio, root.width - 40 * scaleRatio)
            spacing: 0

            // Back
            RowLayout {
                Layout.fillWidth: true; Layout.bottomMargin: 24 * scaleRatio
                Rectangle {
                    Layout.preferredWidth: 36 * scaleRatio; Layout.preferredHeight: 36 * scaleRatio
                    radius: 18 * scaleRatio; color: backMouse.containsMouse ? Theme.bgHover : "transparent"
                    Text { anchors.centerIn: parent; text: "←"; font.pixelSize: 20 * scaleRatio; color: Theme.textPrimary }
                    MouseArea { id: backMouse; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: navigateTo("login") }
                }
                Item { Layout.fillWidth: true }
            }

            // Icon
            Text {
                Layout.alignment: Qt.AlignHCenter; Layout.bottomMargin: 16 * scaleRatio
                text: "🔑"; font.pixelSize: 48 * scaleRatio
            }

            // Title
            Text {
                text: step === 1 ? "忘记密码" : "设置新密码"
                font.pixelSize: Math.round(28 * scaleRatio); font.bold: true; font.weight: Font.Bold
                color: Theme.textPrimary; Layout.alignment: Qt.AlignHCenter
            }

            Text {
                Layout.topMargin: 8 * scaleRatio; Layout.bottomMargin: 32 * scaleRatio
                text: step === 1 ? "输入注册邮箱，我们将发送验证码" : "请输入收到的验证码和新密码"
                font.pixelSize: Math.round(14 * scaleRatio); color: Theme.textMuted
                Layout.alignment: Qt.AlignHCenter; wrapMode: Text.WordWrap; Layout.fillWidth: true
                horizontalAlignment: Text.AlignHCenter
            }

            // Step 1: Email
            ColumnLayout {
                Layout.fillWidth: true; spacing: 6 * scaleRatio
                visible: step === 1

                Text { text: "邮箱"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                    radius: 12 * scaleRatio
                    color: emailField.activeFocus ? Theme.bgCard : Theme.bgHover
                    border.color: emailField.activeFocus ? Theme.accentColor : "transparent"
                    border.width: 2

                    RowLayout {
                        anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                        spacing: 10 * scaleRatio
                        Text { text: "✉"; font.pixelSize: 18 * scaleRatio; color: emailField.activeFocus ? Theme.accentColor : Theme.textMuted }
                        TextField {
                            id: emailField; Layout.fillWidth: true
                            placeholderText: "请输入注册邮箱"
                            color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                            font.pixelSize: 15 * scaleRatio; background: Item {}
                            leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                            Keys.onReturnPressed: doReset()
                        }
                    }
                }
            }

            // Step 2: Code + New password
            ColumnLayout {
                Layout.fillWidth: true; spacing: 16 * scaleRatio; visible: step === 2

                // Verification code
                ColumnLayout {
                    Layout.fillWidth: true; spacing: 6 * scaleRatio
                    Text { text: "验证码"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                    Rectangle {
                        Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                        radius: 12 * scaleRatio; color: codeField.activeFocus ? Theme.bgCard : Theme.bgHover
                        border.color: codeField.activeFocus ? Theme.accentColor : "transparent"; border.width: 2

                        RowLayout {
                            anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                            spacing: 10 * scaleRatio
                            Text { text: "🔑"; font.pixelSize: 18 * scaleRatio; color: codeField.activeFocus ? Theme.accentColor : Theme.textMuted }
                            TextField {
                                id: codeField; Layout.fillWidth: true
                                placeholderText: "请输入验证码"
                                color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                                font.pixelSize: 15 * scaleRatio; maximumLength: 6; background: Item {}
                                leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                            }
                        }
                    }
                }

                // New password
                ColumnLayout {
                    Layout.fillWidth: true; spacing: 6 * scaleRatio
                    Text { text: "新密码 (至少8位)"; font.pixelSize: 13 * scaleRatio; font.weight: Font.Medium; color: Theme.textSecondary }

                    Rectangle {
                        Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio
                        radius: 12 * scaleRatio; color: newPwdField.activeFocus ? Theme.bgCard : Theme.bgHover
                        border.color: newPwdField.activeFocus ? Theme.accentColor : "transparent"; border.width: 2

                        RowLayout {
                            anchors.fill: parent; anchors.leftMargin: 16 * scaleRatio; anchors.rightMargin: 16 * scaleRatio
                            spacing: 10 * scaleRatio
                            Text { text: "🔒"; font.pixelSize: 18 * scaleRatio; color: newPwdField.activeFocus ? Theme.accentColor : Theme.textMuted }
                            TextField {
                                id: newPwdField; Layout.fillWidth: true
                                placeholderText: "请输入新密码"
                                echoMode: showNewPwd.checked ? TextInput.Normal : TextInput.Password
                                color: Theme.textPrimary; placeholderTextColor: Theme.textMuted
                                font.pixelSize: 15 * scaleRatio; background: Item {}
                                leftPadding: 0; rightPadding: 0; verticalAlignment: TextInput.AlignVCenter
                                Keys.onReturnPressed: doConfirm()
                            }
                            Item {
                                Layout.preferredWidth: 24; Layout.preferredHeight: 24
                                Text { anchors.centerIn: parent; text: showNewPwd.checked ? "👁" : "👁‍🗨"; font.pixelSize: 16 * scaleRatio }
                                MouseArea { id: showNewPwd; anchors.fill: parent; property bool checked: false; cursorShape: Qt.PointingHandCursor; onClicked: checked = !checked }
                            }
                        }
                    }

                    // Strength indicator
                    RowLayout {
                        Layout.fillWidth: true; spacing: 8
                        Repeater {
                            model: 4
                            Rectangle {
                                Layout.fillWidth: true; Layout.preferredHeight: 3; radius: 2
                                color: index < pwdStrength() ? (pwdStrength() <= 1 ? Theme.errorColor : pwdStrength() <= 2 ? Theme.warningColor : Theme.successColor) : Theme.borderColor
                            }
                        }
                    }
                }
            }

            // Action button
            Rectangle {
                Layout.fillWidth: true; Layout.preferredHeight: 52 * scaleRatio; Layout.topMargin: 28 * scaleRatio
                radius: 12 * scaleRatio
                color: isLoading ? Theme.accentColor : (actionBtnMouse.containsMouse ? Theme.accentHover : Theme.accentColor)
                enabled: {
                    if (step === 1) return emailField.text.trim().length > 0 && !isLoading
                    return codeField.text.length > 0 && newPwdField.text.length >= 8 && !isLoading
                }
                opacity: enabled ? 1.0 : 0.5

                RowLayout {
                    anchors.centerIn: parent; spacing: 8
                    Item { Layout.preferredWidth: 20; Layout.preferredHeight: 20; visible: isLoading
                        Rectangle { id: btnSpinner; anchors.centerIn: parent; width: 16; height: 16; radius: 8; color: "transparent"; border.color: "white"; border.width: 2
                            RotationAnimation { target: btnSpinner; from: 0; to: 360; duration: 1000; loops: Animation.Infinite; running: isLoading }
                        }
                    }
                    Text {
                        text: isLoading ? "处理中..." : (step === 1 ? "发送验证码" : "重置密码")
                        font.pixelSize: 16 * scaleRatio; font.weight: Font.DemiBold; color: "white"
                    }
                }

                MouseArea {
                    id: actionBtnMouse; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor
                    onClicked: step === 1 ? doReset() : doConfirm()
                }
                scale: actionBtnMouse.pressed ? 0.98 : 1.0
                Behavior on scale { NumberAnimation { duration: 100 } }
            }

            // Back to login
            RowLayout {
                Layout.fillWidth: true; Layout.topMargin: 24 * scaleRatio; Layout.alignment: Qt.AlignHCenter
                Text { text: "记起密码了？"; font.pixelSize: 14 * scaleRatio; color: Theme.textSecondary }
                Text {
                    text: "去登录"; font.pixelSize: 14 * scaleRatio; font.weight: Font.DemiBold; color: Theme.accentColor
                    MouseArea { anchors.fill: parent; anchors.margins: -8; cursorShape: Qt.PointingHandCursor; onClicked: navigateTo("login") }
                }
            }
        }
    }

    function doReset() {
        if (emailField.text.trim().length === 0) return
        errorMessage = ""; isLoading = true
        apiManager.post("/api/auth/send-code", {"email": emailField.text.trim(), "type": "reset"}, "reset-password")
    }

    function doConfirm() {
        if (codeField.text.length === 0 || newPwdField.text.length < 8) return
        errorMessage = ""; isLoading = true
        apiManager.post("/api/auth/reset-password", {
            "email": emailField.text.trim(),
            "code": codeField.text,
            "newPassword": newPwdField.text
        }, "confirm-reset")
    }

    function pwdStrength() {
        var p = newPwdField.text
        if (p.length < 8) return 1
        var hasNum = /\d/.test(p), hasUpper = /[A-Z]/.test(p), hasSpecial = /[!@#$%^&*]/.test(p)
        if (hasNum && hasUpper && hasSpecial) return 4
        if (hasNum && (hasUpper || hasSpecial)) return 3
        return 2
    }
}
