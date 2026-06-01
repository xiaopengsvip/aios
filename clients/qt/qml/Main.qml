import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import AIOS

ApplicationWindow {
    id: root
    visible: true
    width: 1280
    height: 800
    title: "AI超级工作台"
    color: Theme.bgColor

    property bool isLoggedIn: authManager.isLoggedIn
    property string currentPage: storeManager.currentPage
    property string authPage: "login"

    // Auth screens
    Loader {
        active: !root.isLoggedIn
        anchors.fill: parent
        sourceComponent: Item {
            anchors.fill: parent

            Loader {
                anchors.fill: parent
                active: root.authPage === "login"
                sourceComponent: Login {}
            }
            Loader {
                anchors.fill: parent
                active: root.authPage === "register"
                sourceComponent: Register {}
            }
            Loader {
                anchors.fill: parent
                active: root.authPage === "forgot-password"
                sourceComponent: ForgotPassword {}
            }
        }
    }

    // Main layout
    RowLayout {
        anchors.fill: parent
        spacing: 0
        visible: root.isLoggedIn

        Sidebar {
            id: sidebar
            Layout.fillHeight: true
            Layout.preferredWidth: 56
        }

        SubSidebar {
            id: subSidebar
            Layout.fillHeight: true
            expandedCategory: sidebar.expandedCategory
            categoryItems: sidebar.categoryItems
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            // Offline banner
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: visible ? 32 : 0
                visible: !apiManager.networkOk
                color: Theme.errorColor

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 6

                    Text {
                        text: "⚠"
                        font.pixelSize: 14
                        color: "white"
                    }

                    Text {
                        text: Theme.t("网络连接已断开", "Network disconnected")
                        font.pixelSize: Theme.fontSm
                        color: "white"
                    }

                    Rectangle {
                        Layout.preferredWidth: 60
                        Layout.preferredHeight: 24
                        radius: Theme.radiusSm
                        color: "white"

                        Text {
                            anchors.centerIn: parent
                            text: Theme.t("重试", "Retry")
                            font.pixelSize: Theme.fontXs
                            font.bold: true
                            color: Theme.errorColor
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: apiManager.checkNetwork()
                        }
                    }
                }

                Behavior on Layout.preferredHeight {
                    NumberAnimation { duration: 200 }
                }
            }

            TopBar {
                Layout.fillWidth: true
                Layout.preferredHeight: 48
            }

            Loader {
                id: pageLoader
                Layout.fillWidth: true
                Layout.fillHeight: true

                sourceComponent: {
                    var map = {
                        "welcome": welcomePage,
                        "chat": chatPage,
                        "image": imagePage,
                        "video": videoPage,
                        "audio": audioPage,
                        "code": codePage,
                        "files": filesPage,
                        "knowledge": knowledgePage,
                        "workflow": workflowPage,
                        "marketplace": marketplacePage,
                        "prompts": promptsPage,
                        "search": searchPage,
                        "agent": agentPage,
                        "settings": settingsPage,
                        "usage": usagePage,
                        "credits": creditsPage,
                        "api-platform": apiPlatformPage
                    }
                    return map[root.currentPage] || welcomePage
                }
            }

            Component { id: welcomePage; Welcome {} }
            Component { id: chatPage; Chat {} }
            Component { id: imagePage; ImagePage {} }
            Component { id: videoPage; Video {} }
            Component { id: audioPage; Audio {} }
            Component { id: codePage; Code {} }
            Component { id: filesPage; Files {} }
            Component { id: knowledgePage; Knowledge {} }
            Component { id: workflowPage; Workflow {} }
            Component { id: marketplacePage; Marketplace {} }
            Component { id: promptsPage; Prompts {} }
            Component { id: searchPage; Search {} }
            Component { id: agentPage; Agent {} }
            Component { id: settingsPage; Settings {} }
            Component { id: usagePage; Usage {} }
            Component { id: creditsPage; Credits {} }
            Component { id: apiPlatformPage; ApiPlatform {} }
        }
    }

    function navigateTo(page) {
        if (page === "login" || page === "register" || page === "forgot-password") {
            authPage = page
            return
        }
        storeManager.currentPage = page
    }

    onIsLoggedInChanged: {
        if (isLoggedIn) {
            console.log("User logged in:", authManager.userName)
        }
    }
}
