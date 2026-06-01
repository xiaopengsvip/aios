#pragma once
#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkProxy>
#include <QJsonObject>
#include <QTimer>
#include <QUrl>
#include <QTcpServer>
#include <QTcpSocket>

class ApiManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString baseUrl READ baseUrl WRITE setBaseUrl NOTIFY baseUrlChanged)
    Q_PROPERTY(bool connected READ connected NOTIFY connectedChanged)
    Q_PROPERTY(bool networkOk READ networkOk NOTIFY networkOkChanged)
    Q_PROPERTY(QString proxyInfo READ proxyInfo NOTIFY proxyChanged)
    Q_PROPERTY(QString proxyMode READ proxyMode WRITE setProxyMode NOTIFY proxyChanged)

public:
    explicit ApiManager(QObject *parent = nullptr);

    QString baseUrl() const;
    void setBaseUrl(const QString &url);
    bool connected() const;
    bool networkOk() const;
    QString proxyInfo() const;
    QString proxyMode() const;
    void setProxyMode(const QString &mode);

    void setToken(const QString &token);
    QString token() const;

    Q_INVOKABLE void get(const QString &path, const QString &requestId = "");
    Q_INVOKABLE void post(const QString &path, const QJsonObject &body, const QString &requestId = "");
    Q_INVOKABLE void put(const QString &path, const QJsonObject &body, const QString &requestId = "");
    Q_INVOKABLE void del(const QString &path, const QString &requestId = "");
    Q_INVOKABLE void streamChat(const QString &message, const QString &model);
    Q_INVOKABLE void checkNetwork();
    Q_INVOKABLE void setCustomProxy(const QString &host, int port, const QString &type);

    // OAuth local callback server
    Q_INVOKABLE void startOAuthListener();
    Q_INVOKABLE void stopOAuthListener();
    Q_INVOKABLE int oAuthPort() const;

signals:
    void baseUrlChanged();
    void connectedChanged();
    void networkOkChanged();
    void proxyChanged();
    void responseReceived(const QString &requestId, const QJsonObject &data);
    void chatChunkReceived(const QString &chunk);
    void chatCompleted(const QJsonObject &result);
    void networkCheckResult(bool ok, const QString &message);
    void errorOccurred(const QString &error);
    void oauthCallbackReceived(const QString &provider, const QString &code);

private:
    QNetworkAccessManager m_nam;
    QString m_baseUrl;
    QString m_token;
    bool m_connected = false;
    bool m_networkOk = false;

    // Proxy
    QString m_proxyMode;
    QString m_customProxyHost;
    int m_customProxyPort = 0;
    QString m_customProxyType;

    // OAuth local server
    QTcpServer *m_oauthServer = nullptr;
    int m_oauthPort = 0;

    QNetworkProxy currentProxy() const;
    void detectSystemProxy();
    void applyProxy();
    QNetworkRequest buildRequest(const QString &path);
    void handleOAuthConnection();
};
