import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    color: Theme.bgColor

    ColumnLayout {
        anchors.centerIn: parent
        spacing: Theme.spacingLg

        Text {
            text: "📧"
            font.pixelSize: 48
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "邮箱"
            font.pixelSize: Theme.fontXl
            font.bold: true
            color: Theme.textPrimary
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "统一管理多个邮箱账户"
            font.pixelSize: Theme.fontMd
            color: Theme.textSecondary
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "功能即将上线，敬请期待"
            font.pixelSize: Theme.fontMd
            color: Theme.textSecondary
            Layout.alignment: Qt.AlignHCenter
        }
    }
}
