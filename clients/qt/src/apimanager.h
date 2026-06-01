#pragma once

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkProxy>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>

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
    QString proxyMode() const;  // "system", "direct", "custom"
    void setProxyMode(const QString &mode);

    // Auth token
    Q_INVOKABLE void setToken(const QString &token);
    Q_INVOKABLE QString token() const;

    // API methods
    Q_INVOKABLE void get(const QString &path, const QString &requestId = "");
    Q_INVOKABLE void post(const QString &path, const QJsonObject &body, const QString &requestId = "");
    Q_INVOKABLE void put(const QString &path, const QJsonObject &body, const QString &requestId = "");
    Q_INVOKABLE void del(const QString &path, const QString &requestId = "");

    // Chat
    Q_INVOKABLE void streamChat(const QString &message, const QString &model);

    // Network check
    Q_INVOKABLE void checkNetwork();

    // Custom proxy
    Q_INVOKABLE void setCustomProxy(const QString &host, int port, const QString &type);

signals:
    void baseUrlChanged();
    void connectedChanged();
    void networkOkChanged();
    void proxyChanged();
    void errorOccurred(const QString &error);
    void responseReceived(const QString &requestId, const QJsonObject &data);
    void chatChunkReceived(const QString &chunk);
    void chatCompleted(const QJsonObject &result);
    void networkCheckResult(bool ok, const QString &message);

private:
    QNetworkAccessManager m_nam;
    QString m_baseUrl = "https://aios.vios.top";
    QString m_token;
    bool m_connected = false;
    bool m_networkOk = false;
    QString m_proxyMode = "system";
    QString m_customProxyHost;
    int m_customProxyPort = 0;
    QString m_customProxyType = "http";

    QNetworkRequest buildRequest(const QString &path);
    void detectSystemProxy();
    void applyProxy();
    QNetworkProxy currentProxy() const;
};
