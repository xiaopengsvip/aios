#include "authmanager.h"
#include "apimanager.h"
#include <QSettings>
#include <QJsonDocument>

AuthManager::AuthManager(QObject *parent) : QObject(parent)
{
    loadSavedAuth();
}

void AuthManager::setApiManager(ApiManager *api)
{
    m_api = api;
    if (!m_token.isEmpty() && m_api) {
        m_api->setToken(m_token);
    }

    // Single persistent connection - filter by requestId
    connect(m_api, &ApiManager::responseReceived, this,
        [this](const QString &requestId, const QJsonObject &data) {
            if (requestId == "login") {
                if (data["status"].toString() == "ok" && data["success"].toBool()) {
                    setToken(data["token"].toString());
                    setUser(data["user"].toObject());
                    saveAuth();
                    emit loginSuccess();
                } else {
                    m_errorMessage = data["error"].toString();
                    if (m_errorMessage.isEmpty()) m_errorMessage = "登录失败，请稍后再试";
                    emit loginFailed(m_errorMessage);
                }
                emit authChanged();
            }
            else if (requestId == "register") {
                if (data["status"].toString() == "ok" && data["success"].toBool()) {
                    emit registerSuccess();
                } else {
                    m_errorMessage = data["error"].toString();
                    emit registerFailed(m_errorMessage);
                }
            }
            else if (requestId == "profile") {
                if (data["status"].toString() == "ok") {
                    setUser(data);
                    saveAuth();
                }
            }
            else if (requestId == "forgot-password") {
                if (data["status"].toString() == "ok") {
                    emit forgotPasswordSuccess();
                } else {
                    m_errorMessage = data["error"].toString();
                    emit forgotPasswordFailed(m_errorMessage);
                }
            }
            else if (requestId.startsWith("oauth-exchange")) {
                if (data["status"].toString() == "ok" && data["success"].toBool()) {
                    setToken(data["token"].toString());
                    setUser(data["user"].toObject());
                    saveAuth();
                    emit loginSuccess();
                } else {
                    m_errorMessage = data["error"].toString();
                    emit loginFailed(m_errorMessage);
                }
                emit authChanged();
            }
        }
    );

    // OAuth callback from local server
    connect(m_api, &ApiManager::oauthCallbackReceived, this,
        [this](const QString &provider, const QString &code) {
            // Exchange code for token
            QJsonObject body;
            body["code"] = code;
            body["provider"] = provider;
            body["redirect_uri"] = QString("http://localhost:%1/callback").arg(m_api->oAuthPort());
            m_api->post("/api/auth/oauth/exchange", body, "oauth-exchange");
        }
    );
}

bool AuthManager::isLoggedIn() const { return !m_token.isEmpty(); }
QString AuthManager::userName() const { return m_user["username"].toString(); }
QString AuthManager::userEmail() const { return m_user["email"].toString(); }
QString AuthManager::avatarUrl() const { return m_user["avatar"].toString(); }
QString AuthManager::displayName() const { return m_user["displayName"].toString(); }
QString AuthManager::errorMessage() const { return m_errorMessage; }

void AuthManager::setUser(const QJsonObject &user)
{
    m_user = user;
    emit authChanged();
}

void AuthManager::setToken(const QString &token)
{
    m_token = token;
    if (m_api) {
        m_api->setToken(token);
    }
}

void AuthManager::loadSavedAuth()
{
    QSettings s;
    m_token = s.value("auth/token").toString();
    if (!m_token.isEmpty()) {
        QJsonDocument doc = QJsonDocument::fromJson(s.value("auth/user").toByteArray());
        m_user = doc.object();
    }
}

void AuthManager::saveAuth()
{
    QSettings s;
    s.setValue("auth/token", m_token);
    s.setValue("auth/user", QJsonDocument(m_user).toJson());
}

void AuthManager::clearAuth()
{
    m_token.clear();
    m_user = {};
    m_errorMessage.clear();
    QSettings s;
    s.remove("auth/token");
    s.remove("auth/user");
    if (m_api) {
        m_api->setToken("");
    }
    emit authChanged();
}

void AuthManager::login(const QString &email, const QString &password)
{
    if (!m_api) {
        m_errorMessage = "API 未初始化";
        emit loginFailed(m_errorMessage);
        emit authChanged();
        return;
    }

    m_errorMessage.clear();

    QJsonObject body;
    body["email"] = email;
    body["password"] = password;
    m_api->post("/api/auth/login", body, "login");
}

void AuthManager::registerUser(const QString &name, const QString &email, const QString &password)
{
    if (!m_api) return;

    QJsonObject body;
    body["username"] = name;
    body["email"] = email;
    body["password"] = password;
    m_api->post("/api/auth/register", body, "register");
}

void AuthManager::logout()
{
    if (m_api) {
        m_api->post("/api/auth/logout", QJsonObject(), "logout");
    }
    clearAuth();
}

void AuthManager::fetchProfile()
{
    if (!m_api || m_token.isEmpty()) return;
    m_api->get("/api/auth/me", "profile");
}

void AuthManager::forgotPassword(const QString &email)
{
    if (!m_api) return;

    QJsonObject body;
    body["email"] = email;
    m_api->post("/api/auth/reset-password", body, "forgot-password");
}

void AuthManager::autoLogin()
{
    if (!m_token.isEmpty() && m_api) {
        m_api->setToken(m_token);
        fetchProfile();
    }
}
