import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    color: Theme.bgCard
    radius: Theme.radiusMd

    Text {
        anchors.centerIn: parent
        text: "模型选择器"
        color: Theme.textSecondary
        font.pixelSize: Theme.fontMd
    }
}
