import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    color: Theme.bgCard
    radius: Theme.radiusMd

    Text {
        anchors.centerIn: parent
        text: "加载中"
        color: Theme.textSecondary
        font.pixelSize: Theme.fontMd
    }
}
