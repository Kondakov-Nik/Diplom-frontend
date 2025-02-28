import s from './upperHeader.module.scss'

const UpperHeader: React.FC = () => {

  return <div className={s.headerContainer}>
    <div className={s.header}>
      <h3>условия доставки</h3>
      <h3>войти</h3>
    </div>


  </div>;
};

export default UpperHeader