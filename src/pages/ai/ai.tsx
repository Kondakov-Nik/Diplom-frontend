import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { fetchHealthData, sendPrompt, resetChat, addMessage, Message } from './aiSlice';
import styles from './ai.module.scss';
import { jwtDecode } from 'jwt-decode';

// Функция для подсчёта симптомов и лекарств
const calculateHealthSummary = (records: any[]) => {
  const symptomsCount: { [key: string]: number } = {};
  const medicationsCount: { [key: string]: number } = {};

  records.forEach((record) => {
    if (record.symptom) {
      symptomsCount[record.symptom.name] = (symptomsCount[record.symptom.name] || 0) + 1;
    }
    if (record.medication) {
      medicationsCount[record.medication.name] = (medicationsCount[record.medication.name] || 0) + 1;
    }
  });

  const symptomsText =
    Object.entries(symptomsCount)
      .map(([name, count]) => `${name}: ${count} раз`)
      .join(', ') || 'отсутствуют';
  const medicationsText =
    Object.entries(medicationsCount)
      .map(([name, count]) => `${name}: ${count} раз`)
      .join(', ') || 'отсутствуют';

  return { symptomsText, medicationsText };
};

// Предопределённые запросы
const predefinedPrompts = [
  {
    text: 'Общий анализ за месяц',
    startDaysAgo: 30,
    prompt: (symptomsText: string, medicationsText: string) => ({
      displayText: `Общий анализ за месяц\nУ пользователя за период наблюдения были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}.`,
      fullPrompt: `Ты врач с высшей категорией. У пользователя за период наблюдения были зафиксированы следующие симптомы: ${symptomsText}.
      За тот же период он принимал следующие лекарства: ${medicationsText}. Проанализируй эти данные и дай развернутые рекомендации по лечению. Укажи:
      1. Объясни, что могут значить симптомы.
      2. Расскажи, как лекарства влияют на ситуацию.
      3. Рекомендации по дальнейшему лечению, включая возможные изменения в приеме лекарств или дополнительные препараты.
      4. Изменения в образе жизни для улучшения состояния.
      5. Когда стоит обратиться к врачу.
      Не ставь точный диагноз, а предоставь общие рекомендации на основе симптомов и медикаментов.`,
    }),
  },
  {
    text: 'Общий анализ за две недели',
    startDaysAgo: 14,
    prompt: (symptomsText: string, medicationsText: string) => ({
      displayText: `Общий анализ за две недели\nУ пользователя за последние две недели были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}.`,
      fullPrompt: `Ты врач с высшей категорией. У пользователя за последние две недели были зафиксированы следующие симптомы: ${symptomsText}.
      За тот же период он принимал следующие лекарства: ${medicationsText}. Проанализируй эти данные и дай рекомендации.`,
    }),
  },
  {
    text: 'Рекомендации по образу жизни',
    startDaysAgo: 0,
    prompt: () => ({
      displayText: 'Рекомендации по образу жизни',
      fullPrompt: 'Дай рекомендации по улучшению образа жизни для общего здоровья.',
    }),
  },
];

const AiChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const { conversation, healthRecords, isInitial, loading, error } = useAppSelector((state) => state.aiSlice);
  const token = useAppSelector((state) => state.authSlice.token);

  let userId: number | null = null;
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userId = decoded.id;
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
    }
  }

  const [message, setMessage] = useState('');
  const [isInputEnabled, setIsInputEnabled] = useState(false);

  useEffect(() => {
    console.log('Обновлённые healthRecords:', healthRecords);
  }, [healthRecords]);

  useEffect(() => {
    const hasAssistantResponse = conversation.some((msg: Message) => msg.role === 'assistant');
    if (hasAssistantResponse) {
      setIsInputEnabled(true);
    }
  }, [conversation]);

  if (!userId) {
    return <div className={styles.chatContainer}>Пожалуйста, авторизуйтесь, чтобы использовать чат с ИИ.</div>;
  }

  const endDate = new Date().toISOString().split('T')[0];

  const handleSelectPrompt = async (
    startDaysAgo: number,
    promptFn: (symptomsText: string, medicationsText: string) => { displayText: string; fullPrompt: string }
  ) => {
    if (startDaysAgo === 0) {
      const { displayText, fullPrompt } = promptFn('', '');
      const userMessage: Message = { role: 'user', content: displayText };
      dispatch(addMessage(userMessage));
      dispatch(sendPrompt([{ role: 'user' as const, content: fullPrompt }]));
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDaysAgo);
    const startDateStr = startDate.toISOString().split('T')[0];

    const result = await dispatch(fetchHealthData({ userId, startDate: startDateStr, endDate }));

    if (result.meta.requestStatus === 'fulfilled') {
      const records = result.payload as any[];
      if (records.length === 0) {
        const errorMessage: Message = { role: 'user', content: 'Нет данных за указанный период.' };
        dispatch(addMessage(errorMessage));
        dispatch(sendPrompt([{ role: 'user' as const, content: 'Нет данных за указанный период.' }]));
        return;
      }

      const { symptomsText, medicationsText } = calculateHealthSummary(records);
      const { displayText, fullPrompt } = promptFn(symptomsText, medicationsText);
      const userMessage: Message = { role: 'user', content: displayText };
      dispatch(addMessage(userMessage));
      dispatch(sendPrompt([{ role: 'user' as const, content: fullPrompt }]));
    } else {
      const errorMessage: Message = { role: 'user', content: 'Ошибка при получении данных о здоровье.' };
      dispatch(addMessage(errorMessage));
      dispatch(sendPrompt([{ role: 'user' as const, content: 'Ошибка при получении данных о здоровье.' }]));
    }
  };

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    const userMessage: Message = { role: 'user', content: message };
    dispatch(addMessage(userMessage));
    dispatch(sendPrompt([{ role: 'user' as const, content: message }]));
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className={styles.chatContainer}>
      {/* Левая панель с шаблонными запросами */}
      <div className={styles.sidebar}>
        <button onClick={() => dispatch(resetChat())} className={styles.newChatButton}>
          Новый чат
        </button>
        <h3 className={styles.sidebarHeader}>Шаблонные запросы</h3>
        {predefinedPrompts.map((prompt, index) => (
          <button
            key={index}
            className={styles.promptButton}
            onClick={() => handleSelectPrompt(prompt.startDaysAgo, prompt.prompt)}
            disabled={loading}
          >
            {prompt.text}
          </button>
        ))}
      </div>

      {/* Правая область чата */}
      <div className={styles.chatArea}>
        <div className={styles.headerContainer}>
          <h2 className={styles.header}>Чат с ИИ</h2>
        </div>

        <div className={styles.conversationContainer}>
          <div className={styles.messages}>
            {conversation.map((msg: Message, index: number) => (
              <div
                key={index}
                className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
              >
                {msg.role === 'user' ? (
                  <>
                    <span className={styles.messageContent}>{msg.content}</span>
                    <span className={styles.userIcon}>👤</span>
                  </>
                ) : (
                  <>
                    <span className={styles.botIcon}>🤖</span>
                    <span className={styles.messageContent}>
                      {msg.content || 'Ответ от GPT отсутствует'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите ваш вопрос..."
              className={styles.input}
              disabled={loading || !isInputEnabled}
            />
            <button
              onClick={handleSendMessage}
              className={styles.sendButton}
              disabled={loading || !isInputEnabled}
            >
              Отправить
            </button>
          </div>
        </div>

        {loading && <p className={styles.loading}>Загрузка...</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default AiChat;