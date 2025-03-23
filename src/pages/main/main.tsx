import React from 'react';
import styles from './main.module.scss';

const MainPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.heading}>Главная страница</h1>

      {/* Секция ключевых метрик */}
      <div className={styles.metricsSection}>
        {/* Текущий статус здоровья */}
        <div className={`${styles.metricCard} ${styles.healthStatus}`}>
          <h2 className={styles.metricTitle}>Текущий статус здоровья</h2>
          <p className={styles.metricValue}>Здоров</p>
          {/* Цвет фона будет зависеть от состояния: зелёный, жёлтый, красный */}
        </div>

        {/* Количество дней болезни */}
        <div className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Дней болезни</h2>
          <p className={styles.metricValue}>5</p>
          <p className={styles.metricSubtitle}>За последний месяц</p>
        </div>

        {/* Частота симптомов */}
        <div className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Симптомов за неделю</h2>
          <p className={styles.metricValue}>3</p>
          <p className={styles.metricSubtitle}>Зафиксировано</p>
        </div>

        {/* Текущие рекомендации */}
        <div className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Текущие рекомендации</h2>
          <p className={styles.metricValue}>Примите лекарство в 14:00</p>
        </div>
      </div>

      {/* Футер (если он нужен на этой странице) */}
      <div className={styles.footerContainer}>
        <div className={styles.footer}>
          <div className={styles.info}>
            <p>Информация</p>
          </div>
          <div className={styles.links}>
            <a href="#">Ссылка 1</a>
            <a href="#">Ссылка 2</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;