#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QIcon>
#include <QSettings>
#include <QNetworkProxy>

#include "apimanager.h"
#include "authmanager.h"
#include "storemanager.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    app.setOrganizationName("AIOS");
    app.setOrganizationDomain("aios.vios.top");
    app.setApplicationName("AI超级工作台");
    app.setApplicationVersion("0.1.1");

    QQuickStyle::setStyle("Basic");

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
