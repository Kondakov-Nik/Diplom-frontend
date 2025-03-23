import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { getUserData } from '../personalpage/personalpageSlice';
import { fetchHealthRecords } from './mainSlice';
import styles from './main.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Функция для вычисления метрик
const calculateMetrics = (healthRecords: any[]) => {
  // Проверяем, что healthRecords - это массив
  if (!Array.isArray(healthRecords)) {
    console.warn('healthRecords is not an array:', healthRecords);
    return {
      consecutiveDaysWithoutSymptoms: 0,
      symptomsThisMonth: 0,
      medicationsThisMonth: 0,
      mostFrequentSymptom: { name: 'Нет данных', count: 0 },
    };
  }

  const today = new Date();
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  // 1. Дней подряд без симптомов
  const symptomDates = healthRecords
    .filter(record => record.symptomId !== null)
    .map(record => new Date(record.recordDate))
    .sort((a, b) => b.getTime() - a.getTime());

  let consecutiveDaysWithoutSymptoms = 0;
  if (symptomDates.length > 0) {
    const lastSymptomDate = symptomDates[0];
    consecutiveDaysWithoutSymptoms = Math.floor(
      (today.getTime() - lastSymptomDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    consecutiveDaysWithoutSymptoms = Math.floor(
      (today.getTime() - oneMonthAgo.getTime()) / (1000 * 60 * 60 * 24)
    ); // Если симптомов нет, считаем от месяца назад
  }

  // 2. Симптомы за месяц
  const symptomsThisMonth = healthRecords.filter(record => {
    const recordDate = new Date(record.recordDate);
    return record.symptomId !== null && recordDate >= oneMonthAgo;
  }).length;

  // 3. Лекарства за месяц
  const medicationsThisMonth = healthRecords.filter(record => {
    const recordDate = new Date(record.recordDate);
    return record.medicationId !== null && recordDate >= oneMonthAgo;
  }).length;

  // 4. Самый частый симптом за месяц
  const symptomFrequency: { [key: string]: number } = {};
  healthRecords.forEach(record => {
    const recordDate = new Date(record.recordDate);
    if (record.symptomId !== null && recordDate >= oneMonthAgo) {
      const symptomName = record.symptom?.name || 'Неизвестный симптом';
      symptomFrequency[symptomName] = (symptomFrequency[symptomName] || 0) + 1;
    }
  });

  let mostFrequentSymptom = { name: 'Нет данных', count: 0 };
  if (Object.entries(symptomFrequency).length > 0) {
    const [name, count] = Object.entries(symptomFrequency).reduce((a, b) => (a[1] > b[1] ? a : b));
    mostFrequentSymptom = { name, count };
  }

  return {
    consecutiveDaysWithoutSymptoms,
    symptomsThisMonth,
    medicationsThisMonth,
    mostFrequentSymptom,
  };
};

const MainPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { username, loading: userLoading, error: userError } = useAppSelector(
    (state) => state.personalpageSlice
  );
  const { healthRecords, loading: recordsLoading, error: recordsError } = useAppSelector(
    (state) => state.mainSlice
  );

  // Загружаем данные пользователя и записи здоровья при монтировании
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;

      dispatch(getUserData(userId)); // Получаем данные пользователя
      dispatch(fetchHealthRecords(userId)); // Получаем записи здоровья
    }
  }, [dispatch]);

  // Логирование для отладки
  console.log('healthRecords:', healthRecords);

  // Вычисляем метрики на основе записей здоровья
  const metrics = calculateMetrics(healthRecords);

  // Извлекаем только первое слово из username (имя)
  const firstName = username ? username.split(' ')[0] : 'Пользователь';

  if (userLoading || recordsLoading) return <div>Загрузка...</div>;
  if (userError) return <div className={styles.error}>Ошибка: {userError}</div>;
  if (recordsError) return <div className={styles.error}>Ошибка: {recordsError}</div>;

  return (
    <div className={styles.pageContainer}>
      {/* Приветственная надпись */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeText}>С возвращением, {firstName} 👋</h1>
        <p className={styles.welcomeSubtitle}>
          Отслеживайте своё здоровье и получайте полезные рекомендации
        </p>
      </div>

      {/* Новые цветные карточки с метриками */}
      <div className={styles.topMetrics}>
        <div className={`${styles.topMetricCard} ${styles.consecutiveDaysWithoutSymptoms}`}>
          <h3 className={styles.topMetricLabel}>Дней подряд без симптомов</h3>
          <p className={styles.topMetricValue}>{metrics.consecutiveDaysWithoutSymptoms}</p>
        </div>
        <div className={`${styles.topMetricCard} ${styles.symptomsThisMonth}`}>
          <h3 className={styles.topMetricLabel}>Отмечено симптомов за месяц</h3>
          <p className={styles.topMetricValue}>{metrics.symptomsThisMonth}</p>
        </div>
        <div className={`${styles.topMetricCard} ${styles.medicationsThisMonth}`}>
          <h3 className={styles.topMetricLabel}>Отмечено лекарств за месяц</h3>
          <p className={styles.topMetricValue}>{metrics.medicationsThisMonth}</p>
        </div>
        <div className={`${styles.topMetricCard} ${styles.mostFrequentSymptom}`}>
          <h3 className={styles.topMetricLabel}>Самый частый симптом</h3>
          <p className={styles.topMetricValue}>
            {metrics.mostFrequentSymptom.name} ({metrics.mostFrequentSymptom.count})
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;