import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { getUserData } from '../personalpage/personalpageSlice';
import { fetchHealthRecords, fetchKpIndexForThreeDays } from './mainSlice';
import styles from './main.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Функция для вычисления метрик (без изменений)
const calculateMetrics = (healthRecords: any[]) => {
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

  const symptomDates = healthRecords
    .filter((record) => record.symptomId !== null)
    .map((record) => new Date(record.recordDate))
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
    );
  }

  const symptomsThisMonth = healthRecords.filter((record) => {
    const recordDate = new Date(record.recordDate);
    return record.symptomId !== null && recordDate >= oneMonthAgo;
  }).length;

  const medicationsThisMonth = healthRecords.filter((record) => {
    const recordDate = new Date(record.recordDate);
    return record.medicationId !== null && recordDate >= oneMonthAgo;
  }).length;

  const symptomFrequency: { [key: string]: number } = {};
  healthRecords.forEach((record) => {
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

// Функция для вычисления дней болезни по месяцам (без изменений)
const calculateSickDaysByMonth = (healthRecords: any[]) => {
  if (!Array.isArray(healthRecords)) {
    return { labels: [], datasets: [] };
  }

  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  const sickRecords = healthRecords.filter((record) => {
    const recordDate = new Date(record.recordDate);
    return record.symptomId !== null && recordDate >= oneYearAgo && recordDate <= today;
  });

  const sickDaysByMonth: { [key: string]: Set<string> } = {};
  sickRecords.forEach((record) => {
    const date = new Date(record.recordDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!sickDaysByMonth[monthKey]) {
      sickDaysByMonth[monthKey] = new Set();
    }
    sickDaysByMonth[monthKey].add(date.toISOString().split('T')[0]);
  });

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
  }

  const labels = months.map((month) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`;
  });

  const data = months.map((month) => (sickDaysByMonth[month] ? sickDaysByMonth[month].size : 0));

  return {
    labels,
    datasets: [
      {
        label: 'Дни болезни',
        data,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx } = chart;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, '#A3E4D7');
          gradient.addColorStop(1, '#48C9B0');
          return gradient;
        },
        borderWidth: 0,
      },
    ],
  };
};

// Функция для определения цвета KP-индекса (без изменений)
const getKpColor = (kpIndex: number | null | undefined) => {
  if (kpIndex == null) return '#000000';
  if (kpIndex <= 2) return '#00FF00';
  if (kpIndex <= 4) return '#FFFF00';
  if (kpIndex <= 6) return '#FFA500';
  return '#FF0000';
};

// Функция для рекомендаций на основе KP-индекса
const getKpRecommendation = (kpIndex: number | null) => {
  if (kpIndex === null) return 'Данные о KP-индексе отсутствуют.';
  if (kpIndex <= 2) return 'Геомагнитная активность низкая. Отличный день для прогулок и активного отдыха! 🌞';
  if (kpIndex <= 4) return 'Геомагнитная активность умеренная. Будьте внимательны к своему самочувствию. 😊';
  if (kpIndex <= 6) return 'Геомагнитная активность повышена. Избегайте переутомления и пейте больше воды. 💧';
  return 'Геомагнитная буря! Рекомендуем отдыхать и избегать стрессов. ⚡';
};

const MainPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { username, loading: userLoading, error: userError } = useAppSelector(
    (state) => state.personalpageSlice
  );
  const { healthRecords, kpIndexData, loading: recordsLoading, error: recordsError } = useAppSelector(
    (state) => state.mainSlice
  );

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;
      dispatch(getUserData(userId));
      dispatch(fetchHealthRecords(userId));
      dispatch(fetchKpIndexForThreeDays());
    }
  }, [dispatch]);

  const metrics = calculateMetrics(healthRecords);
  const sickDaysData = calculateSickDaysByMonth(healthRecords);

  const firstName = username ? username.split(' ')[0] : 'Пользователь';

  if (userLoading || recordsLoading) return <div>Загрузка...</div>;
  if (userError) return <div className={styles.error}>Ошибка: {userError}</div>;
  if (recordsError) return <div className={styles.error}>Ошибка: {recordsError}</div>;

  const kpChartData = {
    labels: kpIndexData.map((entry) => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'KP-индекс',
        data: kpIndexData.map((entry) => entry.kpIndex ?? 0),
        backgroundColor: kpIndexData.map((entry) => getKpColor(entry.kpIndex)),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className={styles.pageContainer}>
      {/* Приветственная надпись */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeText}>С возвращением, {firstName} 👋</h1>
        <p className={styles.welcomeSubtitle}>
          Отслеживайте своё здоровье и получайте полезные рекомендации
        </p>
      </div>

      {/* Метрики */}
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

      {/* Контейнеры для гистограммы и KP-индекса */}
      <div className={styles.chartAndKpContainer}>
        <div className={styles.chartContainer}>
          <h2 className={styles.chartTitle}>ДНИ БОЛЕЗНИ ЗА ГОД</h2>
          <Bar
            data={sickDaysData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => `${context.parsed.y} дней болезни`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#666', font: { size: 12 } },
                  border: { display: false },
                },
                y: { display: false },
              },
              elements: { bar: { borderRadius: 4 } },
            }}
          />
        </div>

        <div className={styles.kpIndexContainer}>
          <h3 className={styles.kpIndexTitle}>KP-индекс на 3 дня</h3>
          <Bar
            data={kpChartData}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => `KP: ${context.parsed.x}`,
                  },
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 9,
                  ticks: { stepSize: 1, color: '#666', font: { size: 12 } },
                  grid: { display: false },
                  border: { display: false },
                },
                y: {
                  grid: { display: false },
                  ticks: { color: '#666', font: { size: 12 } },
                  border: { display: false },
                },
              },
              elements: { bar: { borderRadius: 4 } },
            }}
          />
        </div>

        {/* Рекомендации на основе KP-индекса */}
      <div className={styles.kpRecommendation}>
        <h3 className={styles.recommendationTitle}>Рекомендации на сегодня</h3>
        <p className={styles.recommendationText}>{getKpRecommendation(kpIndexData[0]?.kpIndex)}</p>
      </div>
      </div>
    </div>
  );
};

export default MainPage;