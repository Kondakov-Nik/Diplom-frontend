import { FaUser, FaCalendar, FaFileAlt} from 'react-icons/fa';
import { IoHome } from "react-icons/io5";

import { Link, useLocation } from 'react-router-dom';
import s from './header.module.scss';

const Header: React.FC = () => {
  const location = useLocation(); // Получаем текущий путь
  const isHomePageOrLogin = location.pathname === '/' || location.pathname === '/Login'; // Проверка для главной и страницы входа

  return (
    <div className={s.headerContainer}>
      <div className={s.header}>
        <h1 className={s.zagolovok}>Health Tracker</h1>

        {/* Показываем кнопки, если не на главной странице */}
        {!isHomePageOrLogin && (
          <div className={s.buttons}>
            <Link to="/home" className={s.buttonHeader}>
              <IoHome size={28} className={s.iconShift} /> ЛЕНТА
            </Link>
            <Link to="/calendar" className={s.buttonHeader}>
              <FaCalendar size={26} className={s.iconShift} /> КАЛЕНДАРЬ
            </Link>
            <Link to="/report" className={s.buttonHeader}>
              <FaFileAlt size={29} className={s.iconShift} /> ОТЧЕТЫ
            </Link>
            
          </div>
        )}

        {/* Показываем иконку личного кабинета, если не на главной странице */}
        {!isHomePageOrLogin && (
          <Link to="/personalPage" className={s.icon}>
            <FaUser size={26} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;
