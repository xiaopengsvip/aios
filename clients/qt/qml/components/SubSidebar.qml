import AIOS
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: subSidebar
    color: Theme.bgCard
    width: visible ? (collapsed ? 48 : 180) : 0
    visible: expandedCategory !== ""

    property string expandedCategory: ""
    property var categoryItems: ({})
    property string categoryLabel: ""
    property bool collapsed: false

    property var categoryLabels: {
        "ai": "AI 工具",
        "office": "办公协作",
        "files": "文件管理",
        "knowledge": "知识库",
        "flow": "流程自动化",
        "dev": "开发工具",
        "market": "应用市场"
    }

    property var currentItems: {
        if (expandedCategory === "" || !categoryItems[expandedCategory]) return []
        return categoryItems[expandedCategory]
    }

    onExpandedCategoryChanged: {
        categoryLabel = categoryLabels[expandedCategory] || ""
    }

    Behavior on width {
        NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // Header with collapse button
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 52
            color: "transparent"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: collapsed ? 0 : 16
                anchors.rightMargin: 8
                spacing: 4

                // Category label (hidden when collapsed)
                Text {
                    visible: !collapsed
                    text: categoryLabel
                    font.pixelSize: Theme.fontMd
                    font.bold: true
                    color: Theme.textPrimary
                    Layout.fillWidth: true
                    elide: Text.ElideRight
                }

                // Collapse/expand toggle
                Rectangle {
                    Layout.preferredWidth: 28
                    Layout.preferredHeight: 28
                    Layout.alignment: Qt.AlignHCenter
                    radius: Theme.radiusSm
                    color: toggleMouse.containsMouse ? Theme.bgHover : "transparent"

                    Text {
                        anchors.centerIn: parent
                        text: collapsed ? "»" : "«"
                        font.pixelSize: 14
                        color: Theme.textSecondary
                    }

                    MouseArea {
                        id: toggleMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: subSidebar.collapsed = !subSidebar.collapsed
                    }
                }
            }
        }

        // Divider
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 1
            Layout.leftMargin: 8
            Layout.rightMargin: 8
            color: Theme.borderColor
        }

        // Items list
        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: itemsColumn.height
            clip: true
            flickableDirection: Flickable.VerticalFlick

            ColumnLayout {
                id: itemsColumn
                width: parent.width
                spacing: 2

                Repeater {
                    model: currentItems

                    Rectangle {
                        required property var modelData
                        property bool isHovered: itemMouse.containsMouse
                        property bool isActive: typeof currentPage !== "undefined" && currentPage === modelData.page

                        Layout.fillWidth: true
                        Layout.preferredHeight: 38
                        Layout.leftMargin: 6
                        Layout.rightMargin: 6
                        radius: Theme.radiusMd
                        color: isActive ? Theme.accentColor + "20" : (isHovered ? Theme.bgHover : "transparent")
                        border.color: isActive ? Theme.accentColor : "transparent"
                        border.width: isActive ? 1 : 0

                        // Collapsed: icon centered
                        Text {
                            visible: collapsed
                            anchors.centerIn: parent
                            text: modelData.icon
                            font.pixelSize: 18
                        }

                        // Expanded: icon + text
                        RowLayout {
                            visible: !collapsed
                            anchors.fill: parent
                            anchors.leftMargin: 12
                            anchors.rightMargin: 12
                            spacing: 10

                            Text {
                                text: modelData.icon
                                font.pixelSize: 16
                            }

                            Text {
                                text: modelData.label
                                font.pixelSize: Theme.fontMd
                                color: isActive ? Theme.accentColor : Theme.textPrimary
                                Layout.fillWidth: true
                                elide: Text.ElideRight
                            }

                            Rectangle {
                                visible: isActive
                                width: 6
                                height: 6
                                radius: 3
                                color: Theme.accentColor
                            }
                        }

                        // Hover tooltip when collapsed
                        Rectangle {
                            visible: collapsed && isHovered
                            x: parent.width + 6
                            anchors.verticalCenter: parent.verticalCenter
                            width: tipLabel.implicitWidth + 16
                            height: tipLabel.implicitHeight + 10
                            radius: Theme.radiusMd
                            color: Theme.bgCard
                            border.color: Theme.borderColor
                            border.width: 1
                            z: 100

                            opacity: visible ? 1 : 0
                            scale: visible ? 1 : 0.92
                            Behavior on opacity { NumberAnimation { duration: 150 } }
                            Behavior on scale { NumberAnimation { duration: 150 } }
                            transformOrigin: Item.Left

                            Text {
                                id: tipLabel
                                anchors.centerIn: parent
                                text: modelData.label
                                font.pixelSize: 13
                                color: Theme.textPrimary
                            }
                        }

                        MouseArea {
                            id: itemMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: navigateTo(modelData.page)
                        }
                    }
                }
            }
        }
    }
}
