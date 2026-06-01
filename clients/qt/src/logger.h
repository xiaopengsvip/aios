#pragma once
#include <QObject>
#include <QList>
#include <QJsonObject>

class Logger : public QObject
{
    Q_OBJECT
    Q_PROPERTY(int count READ count NOTIFY logAdded)

public:
    static Logger *instance();

    enum Level { Debug, Info, Warning, Error };
    Q_ENUM(Level)

    void log(Level level, const QString &category, const QString &message);

    Q_INVOKABLE QVariantList getLogs(int maxCount = 500) const;
    Q_INVOKABLE void clear();
    int count() const { return m_logs.size(); }

signals:
    void logAdded(const QString &level, const QString &category, const QString &message, const QString &timestamp);
    void countChanged();

private:
    explicit Logger(QObject *parent = nullptr);

    struct LogEntry {
        Level level;
        QString category;
        QString message;
        QString timestamp;
    };

    QList<LogEntry> m_logs;
    static Logger *s_instance;
    static void qtMessageHandler(QtMsgType type, const QMessageLogContext &ctx, const QString &msg);
};
