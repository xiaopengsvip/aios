#include "storemanager.h"
#include <QSettings>
#include <QJsonDocument>

StoreManager::StoreManager(QObject *parent) : QObject(parent)
{
    QSettings s;
    m_currentModel = s.value("store/model", "mimo-v2.5-pro").toString();
    m_language = s.value("store/language", "zh-CN").toString();
    m_themeMode = s.value("store/themeMode", "system").toString();

    // Load persisted conversations
    QJsonDocument doc = QJsonDocument::fromJson(s.value("store/conversations").toByteArray());
    if (doc.isArray()) {
        m_conversations = doc.array();
    }
}

QString StoreManager::currentPage() const { return m_currentPage; }
void StoreManager::setCurrentPage(const QString &page)
{
    if (m_currentPage != page) { m_currentPage = page; emit pageChanged(); }
}

QString StoreManager::currentModel() const { return m_currentModel; }
void StoreManager::setCurrentModel(const QString &model)
{
    if (m_currentModel != model) {
        m_currentModel = model;
        QSettings s; s.setValue("store/model", model);
        emit modelChanged();
    }
}

QString StoreManager::language() const { return m_language; }
void StoreManager::setLanguage(const QString &lang)
{
    if (m_language != lang) {
        m_language = lang;
        QSettings s; s.setValue("store/language", lang);
        emit languageChanged();
    }
}

QString StoreManager::themeMode() const { return m_themeMode; }
void StoreManager::setThemeMode(const QString &mode)
{
    if (m_themeMode != mode) {
        m_themeMode = mode;
        QSettings s; s.setValue("store/themeMode", mode);
        emit themeModeChanged();
    }
}

QJsonArray StoreManager::conversations() const { return m_conversations; }

void StoreManager::addConversation(const QJsonObject &conv)
{
    m_conversations.prepend(conv);

    // Keep max 200 conversations
    while (m_conversations.size() > 200) {
        m_conversations.removeLast();
    }

    // Persist
    QSettings s;
    s.setValue("store/conversations", QJsonDocument(m_conversations).toJson());

    emit conversationsChanged();
}

void StoreManager::removeConversation(const QString &id)
{
    for (int i = 0; i < m_conversations.size(); ++i) {
        if (m_conversations[i].toObject()["id"].toString() == id) {
            m_conversations.removeAt(i);

            // Persist
            QSettings s;
            s.setValue("store/conversations", QJsonDocument(m_conversations).toJson());

            emit conversationsChanged();
            return;
        }
    }
}
