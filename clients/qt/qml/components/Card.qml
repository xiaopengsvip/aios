import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

// Reusable card component
Rectangle {
    property string title: ""
    property string description: ""
    property string icon: ""

    color: Theme.bgCard
    radius: Theme.radiusLg
    border.color: Theme.borderColor
    border.width: 1

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: Theme.spacingLg
        spacing: Theme.spacingSm

        Text {
            text: icon
            font.pixelSize: 28
        }
        Text {
            text: title
            font.pixelSize: Theme.fontMd
            font.bold: true
            color: Theme.textPrimary
        }
        Text {
            text: description
            font.pixelSize: Theme.fontSm
            color: Theme.textSecondary
        }
    }
}
