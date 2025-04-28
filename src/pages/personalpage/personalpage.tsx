import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { getUserData } from './personalpageSlice';
import { logout } from '../../features/authForm/authSlice';
import { useNavigate } from 'react-router-dom';
import styles from './personalpage.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FaUser, FaBirthdayCake, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';

const PersonalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { username, birthDate, age, loading, error } = useAppSelector((state) => state.personalpageSlice);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;
      dispatch(getUserData(userId));
    }
  }, []);

  const formatDate = (date: string) => {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('ru-RU');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Разделяем username на имя и фамилию
  const [firstName, lastName] = username ? username.split(' ') : ['Не указано', ''];

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.profileSection}>
        <h1 className={styles.heading}>Личный Кабинет</h1>
        <div className={styles.userInfo}>
          {/* Поле для имени */}
          <div className={styles.infoItem}>
            <FaUser className={styles.icon} />
            <div>
              <p className={styles.label}>Имя:</p>
              <p className={styles.value}>{firstName}</p>
            </div>
          </div>
          {/* Поле для фамилии */}
          {lastName && (
            <div className={styles.infoItem}>
              <FaUser className={styles.icon} />
              <div>
                <p className={styles.label}>Фамилия:</p>
                <p className={styles.value}>{lastName}</p>
              </div>
            </div>
          )}
          <div className={styles.infoItem}>
            <FaBirthdayCake className={styles.icon} />
            <div>
              <p className={styles.label}>Дата Рождения:</p>
              <p className={styles.value}>{birthDate ? formatDate(birthDate) : 'Не указано'}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <FaCalendarAlt className={styles.icon} />
            <div>
              <p className={styles.label}>Возраст:</p>
              <p className={styles.value}>{age || 'Не указано'}</p>
            </div>
          </div>
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <FaSignOutAlt className={styles.buttonIcon} />
          Выход
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default PersonalPage;