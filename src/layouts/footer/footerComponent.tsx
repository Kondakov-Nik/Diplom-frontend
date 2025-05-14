import s from './footer.module.scss';

const Footer: React.FC = () => {
  return (
    <div className={s.footerContainer}>
      <div className={s.footer}>
        <div className={s.info}>
          <p>&copy; 2025 Health Tracker</p>
        </div>
        <div className={s.links}>
{/*           <a href="/about">О нас</a>
          <a href="/contact">Контакты</a>
          <a href="/privacy">Политика конфиденциальности</a> */}
        </div>
      </div>
    </div>
  );
};

export default Footer;
