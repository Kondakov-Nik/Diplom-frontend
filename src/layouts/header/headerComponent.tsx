import { FaUser, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { IoHome } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import s from './header.module.scss';
import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePageOrLogin = location.pathname === '/' || location.pathname === '/Login';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={s.headerContainer}>
      <div className={s.header}>
        <h1 className={s.zagolovok}>Health Tracker</h1>

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
                    backgroundColor: '#7eb2b8',
                    color: '#edf1c0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    width: '200px',
                  },
                }}
              >
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/report"
                  sx={{
                    fontSize: { xs: '16px', md: '18px' },
                    padding: { xs: '10px 16px', md: '12px 20px' },
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
                    fontSize: { xs: '16px', md: '18px' },
                    padding: { xs: '10px 16px', md: '12px 20px' },
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
            <Link to="/personalPage" className={s.buttonHeader}>
              <FaUser size={26} className={s.iconShift} />
              <span className={s.personalCabinetText}>ЛИЧНЫЙ КАБИНЕТ</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;