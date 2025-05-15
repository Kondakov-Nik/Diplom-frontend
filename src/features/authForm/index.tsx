import { useState } from 'react';
import LoginForm from './login';
import RegistrationForm from './registration';
import s from './form.module.scss';

const AuthForm = () => {
  const [formSection, setFormSection] = useState('login');

  return (
    <div className={`${s.container} ${formSection === 'registration' ? s.rightPanelActive : ''}`}>
      {/* Контейнер для формы входа */}
      <div className={`${s.formContainer} ${s.signInContainer}`}>
        {formSection === 'login' && <LoginForm />}
      </div>
      {/* Контейнер для формы регистрации */}
      <div className={`${s.formContainer} ${s.signUpContainer}`}>
        {formSection === 'registration' && <RegistrationForm />}
      </div>
      {/* Оверлей с панелями */}
      <div className={s.overlayContainer}>
        <div className={s.overlay}>
          <div className={`${s.overlayPanel} ${s.overlayLeft}`}>
          <h1>Добро пожаловать в HealthRecord!</h1>
          <p>Зарегистрируйтесь, чтобы начать отслеживать своё здоровье и самочувствие</p>
                      <button className={s.ghost} onClick={() => setFormSection('login')}>
              Вход
            </button>
          </div>
          <div className={`${s.overlayPanel} ${s.overlayRight}`}>
          <h1>С возвращением в HealthRecord!</h1>
            <p>Войдите, чтобы продолжить следить за своим здоровьем</p>
            <button className={s.ghost} onClick={() => setFormSection('registration')}>
              Регистрация
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;