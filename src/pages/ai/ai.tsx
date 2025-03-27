import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { fetchHealthData, sendPrompt, resetChat, addMessage, Message } from './aiSlice';
import styles from './ai.module.scss';
import { jwtDecode } from 'jwt-decode';

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

// Раздел "Общий анализ"
const analysisPrompts = [
  {
    text: 'Общий анализ за месяц',
    startDaysAgo: 30,
    prompt: (symptomsText: string, medicationsText: string) => ({
      displayText: `Общий анализ за месяц.\nУ вас за период наблюдения были зафиксированы следующие симптомы: ${symptomsText}. За тот же период вы принимали следующие лекарства: ${medicationsText}.`,
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
      displayText: `Общий анализ за две недели.\nУ вас за последние две недели были зафиксированы следующие симптомы: ${symptomsText}. За тот же период вы принимали следующие лекарства: ${medicationsText}.`,
      fullPrompt: `Ты врач с высшей категорией. У пользователя за последние две недели были зафиксированы следующие симптомы: ${symptomsText}.
      За тот же период он принимал следующие лекарства: ${medicationsText}. Проанализируй эти данные и дай рекомендации.`,
    }),
  },
  {
    text: 'Общий анализ за неделю',
    startDaysAgo: 7,
    prompt: (symptomsText: string, medicationsText: string) => ({
      displayText: `Общий анализ за неделю.\nУ вас за последнюю неделю были зафиксированы следующие симптомы: ${symptomsText}. За тот же период вы принимали следующие лекарства: ${medicationsText}.`,
      fullPrompt: `Ты врач с высшей категорией. У пользователя за последнюю неделю были зафиксированы следующие симптомы: ${symptomsText}.
      За тот же период он принимал следующие лекарства: ${medicationsText}. Проанализируй эти данные и дай рекомендации.`,
    }),
  },
];

// Раздел "Рекомендации"
const recommendationPrompts = [
    {
      text: 'Рекомендации по образу жизни',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Рекомендации по образу жизни.`,
        fullPrompt: `Ты врач с высшей категорией. Дай рекомендации по улучшению образа жизни для общего здоровья на основе его симптомов за последние 30 дней. У пользователя за период наблюдения были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}.`,
      }),
    },
    {
      text: 'Рекомендации по питанию',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Рекомендации по питанию.`,
        fullPrompt: `Ты врач с высшей категорией. У пользователя за последние 30 дней были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}. Дай рекомендации по питанию, которые помогут улучшить его состояние. Укажи, какие продукты стоит добавить в рацион, каких избегать, и как питание может повлиять на его симптомы и здоровье.`,
      }),
    },
    {
      text: 'Рекомендации по управлению стрессом',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Рекомендации по управлению стрессом.`,
        fullPrompt: `Ты врач с высшей категорией. У пользователя за последние 30 дней были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}. Дай рекомендации по управлению стрессом, которые помогут улучшить его состояние. Укажи, какие техники (например, дыхательные упражнения, медитация, йога) подойдут, как их применять, и как это может повлиять на его симптомы.`,
      }),
    },
  ];

  // Раздел "Профилактика"
const preventionPrompts = [
    {
      text: 'Профилактика обострений симптомов',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Профилактика обострений симптомов.`,
        fullPrompt: `Ты врач с высшей категорией. У пользователя за последние 30 дней были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}. Дай рекомендации по профилактике обострений этих симптомов. Укажи, какие триггеры или привычки стоит избегать, какие меры помогут снизить риск обострений, и на что обратить внимание в повседневной жизни.`,
      }),
    },
    {
      text: 'Профилактика побочных эффектов лекарств',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Профилактика побочных эффектов лекарств.`,
        fullPrompt: `Ты врач с высшей категорией. У пользователя за последние 30 дней были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}. Дай рекомендации по профилактике побочных эффектов этих лекарств. Укажи, какие побочные эффекты могут быть связаны с этими лекарствами, как их минимизировать (например, режим приёма, питание, гидратация), и когда стоит обратиться к врачу.`,
      }),
    },
    {
      text: 'Укрепление иммунитета',
      startDaysAgo: 30,
      prompt: (symptomsText: string, medicationsText: string) => ({
        displayText: `Укрепление иммунитета.`,
        fullPrompt: `Ты врач с высшей категорией. У пользователя за последние 30 дней были зафиксированы следующие симптомы: ${symptomsText}. За тот же период он принимал следующие лекарства: ${medicationsText}. Дай рекомендации по укреплению иммунитета, чтобы снизить риск заболеваний. Укажи, какие меры (питание, добавки, режим дня) помогут укрепить иммунитет, и как это может повлиять на его текущее состояние.`,
      }),
    },
  ];

  const AiChat: React.FC = () => {
    const dispatch = useAppDispatch();
    const { conversation, loading, error } = useAppSelector((state) => state.aiSlice);
    const token = useAppSelector((state) => state.authSlice.token);
  
    let userId: number | null = null;
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        userId = decoded.id;
      } catch (error) {}
    }
  
    const [message, setMessage] = useState('');
    const [isInputEnabled, setIsInputEnabled] = useState(false);
  
    useEffect(() => {
      const hasAssistantResponse = conversation.some((msg: Message) => msg.role === 'assistant');
      setIsInputEnabled(hasAssistantResponse);
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
        console.log('Отправляемый промпт в GPT:', fullPrompt);
        dispatch(sendPrompt([{ role: 'user' as const, content: fullPrompt }]));
        return;
      }
  
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDaysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];
  
      const result = await dispatch(fetchHealthData({ userId, startDate: startDateStr, endDate }));
  
      if (result.meta.requestStatus === 'fulfilled') {
        const records = result.payload as any[];
  
        const { symptomsText, medicationsText } = calculateHealthSummary(records);
  
        if (symptomsText === 'отсутствуют' && medicationsText === 'отсутствуют') {
          let periodText = '';
          if (startDaysAgo === 7) periodText = 'неделю';
          else if (startDaysAgo === 14) periodText = 'две недели';
          else if (startDaysAgo === 30) periodText = 'месяц';
  
          const errorMessage: Message = {
            role: 'user',
            content: `У вас недостаточно симптомов или лекарств за ${periodText}, чтобы составить анализ вашего здоровья за ${periodText}.`,
          };
          dispatch(addMessage(errorMessage));
          return;
        }
  
        const { displayText, fullPrompt } = promptFn(symptomsText, medicationsText);
        const userMessage: Message = { role: 'user', content: displayText };
        dispatch(addMessage(userMessage));
        console.log('Отправляемый промпт в GPT:', fullPrompt);
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
      console.log('Отправляемый промпт в GPT:', message);
      dispatch(sendPrompt([{ role: 'user' as const, content: message }]));
      setMessage('');
    };
  
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSendMessage();
    };
  
    return (
      <div className={styles.chatContainer}>
        <div className={styles.sidebar}>
          <button onClick={() => dispatch(resetChat())} className={styles.newChatButton}>
            Новый чат
          </button>
          <h3 className={styles.sidebarHeader}>Шаблонные запросы</h3>
  
          <div className={styles.sectionTitle}>Общий анализ</div>
          {analysisPrompts.map((prompt, index) => (
            <button
              key={index}
              className={styles.promptButton}
              onClick={() => handleSelectPrompt(prompt.startDaysAgo, prompt.prompt)}
              disabled={loading}
            >
              {prompt.text}
            </button>
          ))}
  
          <div className={styles.divider}></div>
  
          <div className={styles.sectionTitle}>Рекомендации</div>
          {recommendationPrompts.map((prompt, index) => (
            <button
              key={index}
              className={styles.promptButton}
              onClick={() => handleSelectPrompt(prompt.startDaysAgo, prompt.prompt)}
              disabled={loading}
            >
              {prompt.text}
            </button>
          ))}
  
          <div className={styles.divider}></div>
  
          <div className={styles.sectionTitle}>Профилактика</div>
          {preventionPrompts.map((prompt, index) => (
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
  
        <div className={styles.chatArea}>
  <div className={styles.headerContainer}>
    <h2 className={styles.header}>Чат с ИИ</h2>
    <div className={styles.divider}></div>
    <p className={styles.disclaimer}>
      Медицинская информация предоставляется в рекомендательном формате, точный диагноз может поставить только врач.
    </p>
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
              <span className={styles.messageContent}>{msg.content}</span>
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

  <div className={styles.footer}>
    {loading && <p className={styles.loading}>Загрузка...</p>}
    {error && <p className={styles.error}>{error}</p>}
  </div>
</div>
</div>
    );
  };
  
  export default AiChat;