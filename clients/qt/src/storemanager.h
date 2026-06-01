#pragma once
#include <QObject>
#include <QJsonArray>
#include <QJsonObject>

class StoreManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString currentPage READ currentPage WRITE setCurrentPage NOTIFY pageChanged)
    Q_PROPERTY(QString currentModel READ currentModel WRITE setCurrentModel NOTIFY modelChanged)
    Q_PROPERTY(QString language READ language WRITE setLanguage NOTIFY languageChanged)
    Q_PROPERTY(QString themeMode READ themeMode WRITE setThemeMode NOTIFY themeModeChanged)

public:
    explicit StoreManager(QObject *parent = nullptr);

    QString currentPage() const;
    void setCurrentPage(const QString &page);
    QString currentModel() const;
    void setCurrentModel(const QString &model);
    QString language() const;
    void setLanguage(const QString &lang);
    QString themeMode() const;  // "system", "light", "dark"
    void setThemeMode(const QString &mode);

    Q_INVOKABLE QJsonArray conversations() const;
    Q_INVOKABLE void addConversation(const QJsonObject &conv);
    Q_INVOKABLE void removeConversation(const QString &id);

signals:
    void pageChanged();
    void modelChanged();
    void languageChanged();
    void themeModeChanged();
    void conversationsChanged();

private:
    QString m_currentPage = "welcome";
    QString m_currentModel = "mimo-v2.5-pro";
    QString m_language = "zh-CN";
    QString m_themeMode = "system";
    QJsonArray m_conversations;
};
