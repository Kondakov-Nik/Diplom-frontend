import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import s from "./home.module.scss"; // Подключаем стили для страницы
import { useAppSelector } from "../../hooks/hooks";

// Импортируем изображения
import calendarScreenshot from "../../assets/11.png";
import reportScreenshot from "../../assets/12.png";
import aiScreenshot from "../../assets/13.png";

const Home: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.authSlice.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/Personalpage");
    }
  }, [isAuthenticated]);

  return (
    <div className={s.homeContainer}>
      {/* Hero Section */}
      <div className={s.heroSection}>
        <h1 className={s.heroTitle}>Добро пожаловать в Health Tracker!</h1>
        <p className={s.heroSubtitle}>
          Ваш персональный помощник по мониторингу здоровья. Отслеживайте симптомы, лекарства и получайте отчеты, которые помогут вам быть в курсе своего состояния.
        </p>
        <div className={s.heroButtons}>
          {/* Кнопка Войти, растянутая и размещенная в центре */}
          <Link to="/Login" className={s.loginButton}>
            Зарегистрироваться / Войти
          </Link>
        </div>
      </div>

      {/* Преимущества */}
      <div className={s.featuresSection}>
        <h2 className={s.featuresTitle}>Почему вы должны выбрать Health Tracker?</h2>
        <div className={s.featuresList}>
          <div className={s.featureItem}>
            <img src={calendarScreenshot} alt="Интерактивный календарь" className={s.featureIcon} />
            <h3>Интерактивный календарь</h3>
            <p>Легко отслеживайте симптомы и лекарства прямо в календаре.</p>
          </div>
          <div className={s.featureItem}>
            <img src={reportScreenshot} alt="Генерация отчетов" className={s.featureIcon} />
            <h3>Генерация отчетов</h3>
            <p>Создавайте подробные отчеты в разных форматах и показывайте их врачу.</p>
          </div>
          <div className={s.featureItem}>
            <img src={aiScreenshot} alt="Личный ИИ помощник" className={s.featureIcon} />
            <h3>Личный ИИ помощник</h3>
            <p>Проведёт консультацию по всем интересующим вас вопросам связаным со здоровьем.</p>
          </div>
        </div>
      </div>

      {/* Как это работает */}
      <div className={s.howItWorksSection}>
        <h2 className={s.howItWorksTitle}>Как это работает?</h2>
        <div className={s.howItWorksSteps}>
          <div className={s.howItWorksStep}>
            <h3>Шаг 1</h3>
            <p>Создайте аккаунт и настройте профиль.</p>
          </div>
          <div className={s.howItWorksStep}>
            <h3>Шаг 2</h3>
            <p>Записывайте симптомы и лекарства каждый день в календаре.</p>
          </div>
          <div className={s.howItWorksStep}>
            <h3>Шаг 3</h3>
            <p>Генерируйте отчет по данным за выбранный период или получайте рекомендации от ИИ помощника.</p>
          </div>
          <div className={s.howItWorksStep}>
            <h3>Шаг 4</h3>
            <p>Покажите отчет своему врачу или используйте его для личных наблюдений.</p>
          </div>
        </div>
      </div>

      {/* Отзывы пользователей */}
      <div className={s.testimonialsSection}>
        <h2 className={s.testimonialsTitle}>Что говорят наши пользователи?</h2>
        <div className={s.testimonialsList}>
          <div className={s.testimonialItem}>
            <p>"Теперь я всегда знаю, что происходит с моим здоровьем. Отличный инструмент для отслеживания!"</p>
            <h4>- Мария, 32 года</h4>
          </div>
          <div className={s.testimonialItem}>
            <p>"Это приложение помогло мне не забывать про лекарства и контролировать их прием."</p>
            <h4>- Алексей, 45 лет</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;