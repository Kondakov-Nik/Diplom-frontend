import { FaUser, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { IoHome } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import s from './header.module.scss';
import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description'; // Иконка для PDF отчета
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Иконка для ИИ помощника

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePageOrLogin = location.pathname === '/' || location.pathname === '/Login';

  // Состояние для управления открытием/закрытием меню
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Открытие меню при клике на кнопку "ОТЧЕТЫ"
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Закрытие меню
  const handleClose = () => {
    setAnchorEl(null);
  };

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
            <div>
              <div className={s.buttonHeader} onClick={handleClick}>
                <FaFileAlt size={29} className={s.iconShift} /> ОТЧЕТЫ
              </div>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  style: {
                    backgroundColor: '#7eb2b8', // Цвет фона меню (как у хедера)
                    color: '#edf1c0', // Цвет текста
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/report"
                  sx={{
                    fontSize: '18px',
                    padding: '12px 20px',
                    color: '#edf1c0',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                    },
                  }}
                >
                  <DescriptionIcon sx={{ marginRight: '10px', color: '#edf1c0' }} />
                  PDF отчет
                </MenuItem>
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/ai-helper"
                  sx={{
                    fontSize: '18px',
                    padding: '12px 20px',
                    color: '#edf1c0',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                    },
                  }}
                >
                  <SmartToyIcon sx={{ marginRight: '10px', color: '#edf1c0' }} />
                  ИИ помощник
                </MenuItem>
              </Menu>
            </div>
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