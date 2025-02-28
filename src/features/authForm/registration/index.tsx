import { useForm } from 'react-hook-form';
import { registrationFormSchema, registrationFormData } from '../schemas';
import s from '../form.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { registerUser } from '../authSlice';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const RegistrationForm = () => {
  const dispatch = useAppDispatch();

  const formErr = useAppSelector((state) => state.authSlice.error);
  const isAuthenticated = useAppSelector((state) => state.authSlice.isAuthenticated);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<registrationFormData>({
    resolver: yupResolver(registrationFormSchema),
  });
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/PersonalPage')
    }
  }, [isAuthenticated])

  const onSubmit = async (dto: registrationFormData) => {
  // Объединяем имя и фамилию в одно поле username
  const username = `${dto.firstName} ${dto.lastName}`.trim();  // Убираем лишние пробелы, если что-то пустое
  dispatch(registerUser({username, email: dto.email, birthDate: dto.birthDate, password: dto.password1}))
     
  };

  return (
    <div className={s.formWrapper}>
      <form className={s.form} onSubmit={handleSubmit(onSubmit)}>
        <p>Имя:</p>
        <input className={s.input} {...register('firstName')} />
        <b className={s.error}>{errors.firstName?.message}</b>
        <p>Фамилия:</p>
        <input className={s.input} {...register('lastName')} />
        <b className={s.error}>{errors.lastName?.message}</b>
        <p>Дата Рождения:</p>
        <input 
          className={s.input} 
          type="date"  // Тип date для отображения календаря
          {...register('birthDate')} 
        />
        <b className={s.error}>{errors.birthDate?.message}</b>
        <p>Электронная почта:</p>
        <input className={s.input} {...register('email')} />
        <b className={s.error}>{errors.email?.message}</b>
        <p>Пароль:</p>
        <input className={s.input} {...register('password1')} />
        <b className={s.error}>{errors.password1?.message}</b>
        <p>Повторите пароль:</p>
        <input className={s.input} {...register('password2')} />
        <b className={s.error}>{errors.password2?.message}</b>
        <b className={s.error}>{formErr}</b>
        <input
          className={s.submitBtn}
          type="submit"
          disabled={isSubmitting}
          value="Зарегистрироваться"
        />
      </form>
    </div>
  );
};

export default RegistrationForm;
