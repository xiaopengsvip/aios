cmake_minimum_required(VERSION 3.20)
project(AIOS VERSION 0.1.2 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

# Find Qt packages
find_package(Qt6 REQUIRED COMPONENTS
    Quick QuickControls2 Svg Network Widgets
)

qt_standard_project_setup(REQUIRES 6.8)

qt_add_executable(aios WIN32
    src/main.cpp
    src/apimanager.h src/apimanager.cpp
    src/authmanager.h src/authmanager.cpp
    src/storemanager.h src/storemanager.cpp
    app.rc
)

# Declare Theme.qml as a singleton
set_source_files_properties(qml/styles/Theme.qml PROPERTIES
    QT_QML_SINGLETON_TYPE TRUE
)

qt_add_qml_module(aios
    URI AIOS
    VERSION 1.0
    QML_FILES
        qml/Main.qml
        qml/styles/Theme.qml
        qml/components/Sidebar.qml
        qml/components/SubSidebar.qml
        qml/components/TopBar.qml
        qml/components/ChatInput.qml
        qml/components/ChatMessage.qml
        qml/components/ModelSelector.qml
        qml/components/Card.qml
        qml/components/Loading.qml
        qml/features/Login.qml
        qml/features/Register.qml
        qml/features/ForgotPassword.qml
        qml/features/Chat.qml
        qml/features/ImagePage.qml
        qml/features/Video.qml
        qml/features/Audio.qml
        qml/features/Code.qml
        qml/features/Files.qml
        qml/features/Knowledge.qml
        qml/features/Workflow.qml
        qml/features/Marketplace.qml
        qml/features/Prompts.qml
        qml/features/Search.qml
        qml/features/Agent.qml
        qml/features/Settings.qml
        qml/features/Usage.qml
        qml/features/Credits.qml
        qml/features/ApiPlatform.qml
        qml/features/Welcome.qml
        qml/features/AiSearch.qml
        qml/features/AiPpt.qml
        qml/features/AiPodcast.qml
        qml/features/AiWriting.qml
        qml/features/AiTranslate.qml
        qml/features/AiCode.qml
        qml/features/LocalModel.qml
        qml/features/Contacts.qml
        qml/features/Sheet.qml
        qml/features/Favorites.qml
        qml/features/Notes.qml
        qml/features/Calendar.qml
        qml/features/Email.qml
        qml/features/Todo.qml
        qml/features/Kanban.qml
        qml/features/LocalFiles.qml
        qml/features/TeamKnowledge.qml
        qml/features/Cron.qml
        qml/features/Mcp.qml
    RESOURCES
        resources/icons.svg
        resources/icons/app-icon.png
        resources/icons/splash-pc.png
        resources/icons/splash-mobile.png
)

# Android specific
if(ANDROID)
    set_target_properties(aios PROPERTIES
        QT_ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/android"
    )
endif()

target_link_libraries(aios PRIVATE
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Svg
    Qt6::Network
    Qt6::Widgets
)

install(TARGETS aios
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
