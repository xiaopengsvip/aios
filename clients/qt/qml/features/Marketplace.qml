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
            text: "市场"
            font.pixelSize: Theme.fontXxl
            font.bold: true
            color: Theme.textPrimary
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "功能开发中..."
            font.pixelSize: Theme.fontMd
            color: Theme.textSecondary
            Layout.alignment: Qt.AlignHCenter
        }
    }
}
