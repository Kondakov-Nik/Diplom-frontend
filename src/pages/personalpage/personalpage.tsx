import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { getUserData } from './personalpageSlice';
import { logout } from '../../features/authForm/authSlice';  // Импортируем экшн logout из authSlice
import { useNavigate } from 'react-router-dom';
import styles from './personalpage.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const PersonalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();  // Хук для перенаправления
  const { username, birthDate, age, loading, error } = useAppSelector((state) => state.personalpageSlice);

  const token = Cookies.get('authToken');  // Извлекаем токен из cookies


  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;

      dispatch(getUserData(userId));  // Получаем данные пользователя по userId
    }
  }, [token]);
  

  // Функция для форматирования даты в формат ДД.ММ.ГГГГ
  const formatDate = (date: string) => {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('ru-RU');  // Выводит дату в формате ДД.ММ.ГГГГ
  };

  const handleLogout = () => {
    dispatch(logout());  // Диспатчим действие для выхода
    navigate('/');   // Перенаправляем на главную страницу
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.profileSection}>
        <h1 className={styles.heading}>Личный Кабинет</h1>
        <div className={styles.userInfo}>
          <p className={styles.label}>Имя:</p>
          <p className={styles.value}>{username}</p>

          <p className={styles.label}>Дата Рождения:</p>
          <p className={styles.value}>{formatDate(birthDate)}</p>

          <p className={styles.label}>Возраст:</p>
          <p className={styles.value}>{age}</p>
        </div>

        {/* Кнопка выхода */}
        <button className={styles.logoutButton} onClick={handleLogout}>Выход</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default PersonalPage;
