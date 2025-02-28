import { useState } from 'react';
import LoginForm from './login';
import RegistrationForm from './registration';
import s from './form.module.scss';
const AuthForm = () => {
  const [formSection, setFormSection] = useState('login');

  return (
    <div className={s.wrapper}>
      <div className={s.window}>
        <div>
          {formSection === 'login' && <LoginForm />}
          {formSection === 'registration' && <RegistrationForm />}
        </div>
        <div>
          {formSection === 'login' && (
            <p className={s.biba}>Нет аккаунта? <a href="#" onClick={(e) => {
              e.preventDefault(); 
              setFormSection('registration');
            }}>Создать аккаунт</a></p>  
            )}
          {formSection === 'registration' && (
            <p className={s.biba}>Уже есть аккаунт? <a href="#" onClick={(e) => {
              e.preventDefault(); 
              setFormSection('login');
            }}>Войти</a></p>
            )}
        </div>
      </div>
    </div>
  );
};
export default AuthForm;
