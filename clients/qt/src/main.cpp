#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QIcon>
#include <QSettings>
#include <QNetworkProxy>
#include <QSslSocket>

#ifdef Q_OS_ANDROID
#include <QLibrary>
#endif

#include "apimanager.h"
#include "authmanager.h"
#include "storemanager.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    app.setOrganizationName("AIOS");
    app.setOrganizationDomain("aios.vios.top");
    app.setApplicationName("AI超级工作台");
    app.setApplicationVersion("0.1.2");

    QQuickStyle::setStyle("Basic");

#ifdef Q_OS_ANDROID
    // Pre-load system OpenSSL libraries on Android
    QLibrary sslLib("ssl");
    sslLib.setLoadHints(QLibrary::ExportExternalSymbolsHint);
    sslLib.load();

    QLibrary cryptoLib("crypto");
    cryptoLib.setLoadHints(QLibrary::ExportExternalSymbolsHint);
    cryptoLib.load();
#endif

    QQmlApplicationEngine engine;

    ApiManager apiManager;
    AuthManager authManager;
    StoreManager storeManager;

    apiManager.setBaseUrl("https://aios.vios.top");
    authManager.setApiManager(&apiManager);

    engine.rootContext()->setContextProperty("apiManager", &apiManager);
    engine.rootContext()->setContextProperty("authManager", &authManager);
    engine.rootContext()->setContextProperty("storeManager", &storeManager);

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, []() { QCoreApplication::exit(-1); },
                     Qt::QueuedConnection);

    engine.loadFromModule("AIOS", "Main");

    authManager.autoLogin();

    return app.exec();
}
