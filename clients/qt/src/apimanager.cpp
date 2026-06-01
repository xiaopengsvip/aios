#include "apimanager.h"
#include <QNetworkRequest>
#include <QJsonDocument>
#include <QNetworkProxy>
#include <QSettings>
#include <QUrlQuery>

ApiManager::ApiManager(QObject *parent) : QObject(parent)
{
    // Load saved proxy mode
    QSettings s;
    m_proxyMode = s.value("proxy/mode", "system").toString();
    m_customProxyHost = s.value("proxy/host").toString();
    m_customProxyPort = s.value("proxy/port", 0).toInt();
    m_customProxyType = s.value("proxy/type", "http").toString();

    detectSystemProxy();
    applyProxy();

    // Auto network check on startup
    QTimer::singleShot(500, this, &ApiManager::checkNetwork);
}

QString ApiManager::baseUrl() const { return m_baseUrl; }

void ApiManager::setBaseUrl(const QString &url)
{
    if (m_baseUrl != url) {
        m_baseUrl = url;
        emit baseUrlChanged();
    }
}

bool ApiManager::connected() const { return m_connected; }
bool ApiManager::networkOk() const { return m_networkOk; }

QString ApiManager::proxyInfo() const
{
    QNetworkProxy proxy = currentProxy();
    if (proxy.type() == QNetworkProxy::NoProxy) return "直连";
    return QString("%1://%2:%3")
        .arg(proxy.type() == QNetworkProxy::Socks5Proxy ? "socks5" : "http")
        .arg(proxy.hostName())
        .arg(proxy.port());
}

QString ApiManager::proxyMode() const { return m_proxyMode; }

void ApiManager::setProxyMode(const QString &mode)
{
    if (m_proxyMode != mode) {
        m_proxyMode = mode;
        QSettings s;
        s.setValue("proxy/mode", mode);
        applyProxy();
        emit proxyChanged();
        checkNetwork();
    }
}

void ApiManager::setToken(const QString &token) { m_token = token; }
QString ApiManager::token() const { return m_token; }

QNetworkProxy ApiManager::currentProxy() const
{
    if (m_proxyMode == "direct") {
        return QNetworkProxy(QNetworkProxy::NoProxy);
    }
    if (m_proxyMode == "custom" && !m_customProxyHost.isEmpty()) {
        QNetworkProxy::ProxyType t = m_customProxyType == "socks5"
            ? QNetworkProxy::Socks5Proxy
            : QNetworkProxy::HttpProxy;
        return QNetworkProxy(t, m_customProxyHost, static_cast<quint16>(m_customProxyPort));
    }
    // system mode: detect from env
    QList<QNetworkProxy> proxies = QNetworkProxyFactory::systemProxyForQuery(
        QNetworkProxyQuery(QUrl(m_baseUrl)));
    if (!proxies.isEmpty() && proxies.first().type() != QNetworkProxy::NoProxy) {
        return proxies.first();
    }
    return QNetworkProxy(QNetworkProxy::NoProxy);
}

void ApiManager::detectSystemProxy()
{
    QNetworkProxy proxy = currentProxy();
    emit proxyChanged();
}

void ApiManager::applyProxy()
{
    QNetworkProxy proxy = currentProxy();
    if (proxy.type() == QNetworkProxy::NoProxy) {
        m_nam.setProxy(QNetworkProxy(QNetworkProxy::NoProxy));
    } else {
        m_nam.setProxy(proxy);
    }
}

void ApiManager::setCustomProxy(const QString &host, int port, const QString &type)
{
    m_customProxyHost = host;
    m_customProxyPort = port;
    m_customProxyType = type;

    QSettings s;
    s.setValue("proxy/host", host);
    s.setValue("proxy/port", port);
    s.setValue("proxy/type", type);

    if (m_proxyMode == "custom") {
        applyProxy();
        emit proxyChanged();
        checkNetwork();
    }
}

void ApiManager::checkNetwork()
{
    QNetworkRequest req(QUrl(m_baseUrl + "/api/health"));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    auto *reply = m_nam.get(req);

    // Timeout: 10 seconds
    QTimer::singleShot(10000, reply, [reply]() {
        if (reply->isRunning()) {
            reply->abort();
        }
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        bool ok = (reply->error() == QNetworkReply::NoError);
        QString msg;

        if (ok) {
            m_networkOk = true;
            m_connected = true;
            msg = "网络正常";
        } else {
            m_networkOk = false;
            m_connected = false;
            msg = reply->errorString();
            if (reply->error() == QNetworkReply::TimeoutError) {
                msg = "连接超时";
            }
            if (m_proxyMode == "system") {
                msg += " (代理可能有问题)";
            }
            emit errorOccurred(msg);
        }

        emit networkOkChanged();
        emit connectedChanged();
        emit networkCheckResult(ok, msg);
        reply->deleteLater();
    });
}

QNetworkRequest ApiManager::buildRequest(const QString &path)
{
    QNetworkRequest req(QUrl(m_baseUrl + path));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    if (!m_token.isEmpty()) {
        req.setRawHeader("Authorization", ("Bearer " + m_token).toUtf8());
    }
    return req;
}

void ApiManager::get(const QString &path, const QString &requestId)
{
    auto *reply = m_nam.get(buildRequest(path));

    // Timeout: 30 seconds
    QTimer::singleShot(30000, reply, [reply]() {
        if (reply->isRunning()) reply->abort();
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply, requestId]() {
        QJsonObject result;
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            result = doc.object();
            result["status"] = "ok";
        } else {
            result["status"] = "error";
            result["error"] = reply->errorString();
            emit errorOccurred(reply->errorString());
        }
        result["statusCode"] = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        emit responseReceived(requestId, result);
        reply->deleteLater();
    });
}

void ApiManager::post(const QString &path, const QJsonObject &body, const QString &requestId)
{
    auto *reply = m_nam.post(buildRequest(path), QJsonDocument(body).toJson());

    // Timeout: 30 seconds
    QTimer::singleShot(30000, reply, [reply]() {
        if (reply->isRunning()) reply->abort();
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply, requestId]() {
        QJsonObject result;
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            result = doc.object();
            result["status"] = "ok";
        } else {
            result["status"] = "error";
            result["error"] = reply->errorString();
            emit errorOccurred(reply->errorString());
        }
        emit responseReceived(requestId, result);
        reply->deleteLater();
    });
}

void ApiManager::put(const QString &path, const QJsonObject &body, const QString &requestId)
{
    auto *reply = m_nam.put(buildRequest(path), QJsonDocument(body).toJson());

    QTimer::singleShot(30000, reply, [reply]() {
        if (reply->isRunning()) reply->abort();
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply, requestId]() {
        QJsonObject result;
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            result = doc.object();
            result["status"] = "ok";
        } else {
            result["status"] = "error";
            result["error"] = reply->errorString();
            emit errorOccurred(reply->errorString());
        }
        emit responseReceived(requestId, result);
        reply->deleteLater();
    });
}

void ApiManager::del(const QString &path, const QString &requestId)
{
    auto *reply = m_nam.deleteResource(buildRequest(path));

    QTimer::singleShot(30000, reply, [reply]() {
        if (reply->isRunning()) reply->abort();
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply, requestId]() {
        QJsonObject result;
        if (reply->error() == QNetworkReply::NoError) {
            result["status"] = "ok";
        } else {
            result["status"] = "error";
            result["error"] = reply->errorString();
            emit errorOccurred(reply->errorString());
        }
        emit responseReceived(requestId, result);
        reply->deleteLater();
    });
}

void ApiManager::streamChat(const QString &message, const QString &model)
{
    QJsonObject body;
    body["message"] = message;
    if (!model.isEmpty()) body["model"] = model;

    auto *reply = m_nam.post(buildRequest("/api/chat/stream"), QJsonDocument(body).toJson());

    // Timeout: 120 seconds for streaming
    QTimer::singleShot(120000, reply, [reply]() {
        if (reply->isRunning()) reply->abort();
    });

    connect(reply, &QNetworkReply::readyRead, this, [this, reply]() {
        QByteArray data = reply->readAll();
        emit chatChunkReceived(QString::fromUtf8(data));
    });

    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        QJsonObject result;
        if (reply->error() == QNetworkReply::NoError) {
            result["status"] = "ok";
        } else {
            result["status"] = "error";
            result["error"] = reply->errorString();
            emit errorOccurred(reply->errorString());
        }
        emit chatCompleted(result);
        reply->deleteLater();
    });
}

// === OAuth Local Callback Server ===

void ApiManager::startOAuthListener()
{
    if (m_oauthServer && m_oauthServer->isListening()) return;

    m_oauthServer = new QTcpServer(this);

    // Try ports 18000-18100
    for (int port = 18000; port < 18100; ++port) {
        if (m_oauthServer->listen(QHostAddress::LocalHost, port)) {
            m_oauthPort = port;
            break;
        }
    }

    if (!m_oauthServer->isListening()) {
        emit errorOccurred("无法启动 OAuth 回调服务");
        return;
    }

    connect(m_oauthServer, &QTcpServer::newConnection, this, &ApiManager::handleOAuthConnection);
    qDebug() << "OAuth callback server listening on port" << m_oauthPort;
}

void ApiManager::stopOAuthListener()
{
    if (m_oauthServer) {
        m_oauthServer->close();
        m_oauthServer->deleteLater();
        m_oauthServer = nullptr;
        m_oauthPort = 0;
    }
}

int ApiManager::oAuthPort() const { return m_oauthPort; }

void ApiManager::handleOAuthConnection()
{
    while (m_oauthServer->hasPendingConnections()) {
        QTcpSocket *socket = m_oauthServer->nextPendingConnection();
        connect(socket, &QTcpSocket::readyRead, this, [this, socket]() {
            QByteArray request = socket->readAll();
            QString reqStr = QString::fromUtf8(request);

            // Parse GET /callback?code=xxx&provider=xxx HTTP/1.1
            QString path;
            int pathStart = reqStr.indexOf("GET ");
            int pathEnd = reqStr.indexOf(" HTTP/", pathStart);
            if (pathStart >= 0 && pathEnd > pathStart) {
                path = reqStr.mid(pathStart + 4, pathEnd - pathStart - 4);
            }

            // Extract code and provider from query
            QString code, provider;
            if (path.contains("code=")) {
                QUrl url("http://localhost" + path);
                QUrlQuery query(url.query());
                code = query.queryItemValue("code");
                provider = query.queryItemValue("provider");
            }

            // Send response to browser
            QString html = "<html><body><h2>授权成功！</h2><p>请返回应用。</p><script>setTimeout(()=>window.close(),2000)</script></body></html>";
            QString response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: "
                + QString::number(html.toUtf8().size()) + "\r\nConnection: close\r\n\r\n" + html;
            socket->write(response.toUtf8());
            socket->flush();
            socket->disconnectFromHost();

            if (!code.isEmpty()) {
                emit oauthCallbackReceived(provider, code);
            }
        });
    }
}
