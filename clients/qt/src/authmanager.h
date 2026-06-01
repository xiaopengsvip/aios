#pragma once
#include <QObject>
#include <QJsonObject>

class ApiManager;

class AuthManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool isLoggedIn READ isLoggedIn NOTIFY authChanged)
    Q_PROPERTY(QString userName READ userName NOTIFY authChanged)
    Q_PROPERTY(QString userEmail READ userEmail NOTIFY authChanged)
    Q_PROPERTY(QString avatarUrl READ avatarUrl NOTIFY authChanged)
    Q_PROPERTY(QString displayName READ displayName NOTIFY authChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY authChanged)

public:
    explicit AuthManager(QObject *parent = nullptr);

    void setApiManager(ApiManager *api);

    bool isLoggedIn() const;
    QString userName() const;
    QString userEmail() const;
    QString avatarUrl() const;
    QString displayName() const;
    QString errorMessage() const;

    Q_INVOKABLE void login(const QString &email, const QString &password);
    Q_INVOKABLE void registerUser(const QString &name, const QString &email, const QString &password);
    Q_INVOKABLE void logout();
    Q_INVOKABLE void fetchProfile();
    Q_INVOKABLE void forgotPassword(const QString &email);
    Q_INVOKABLE void autoLogin();

signals:
    void authChanged();
    void loginSuccess();
    void loginFailed(const QString &error);
    void registerSuccess();
    void registerFailed(const QString &error);
    void forgotPasswordSuccess();
    void forgotPasswordFailed(const QString &error);

private:
    ApiManager *m_api = nullptr;
    QJsonObject m_user;
    QString m_token;
    QString m_errorMessage;

    void setUser(const QJsonObject &user);
    void setToken(const QString &token);
    void loadSavedAuth();
    void saveAuth();
    void clearAuth();
};
