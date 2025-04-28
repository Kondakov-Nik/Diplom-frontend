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
      navigate('/PersonalPage');
    }
  }, [isAuthenticated]);

  const onSubmit = async (dto: registrationFormData) => {
    const username = `${dto.firstName} ${dto.lastName}`.trim();
    dispatch(
      registerUser({
        username,
        email: dto.email,
        birthDate: dto.birthDate,
        password: dto.password1,
      })
    );
  };

  return (
    <form className={s.form} onSubmit={handleSubmit(onSubmit)}>
      <h3>Создать аккаунт</h3>
      <input className={s.input} placeholder="Имя" {...register('firstName')} />
      <b className={s.error}>{errors.firstName?.message}</b>
      <input className={s.input} placeholder="Фамилия" {...register('lastName')} />
      <b className={s.error}>{errors.lastName?.message}</b>
      <input className={s.input} type="date" {...register('birthDate')} />
      <b className={s.error}>{errors.birthDate?.message}</b>
      <input className={s.input} placeholder="Email" {...register('email')} />
      <b className={s.error}>{errors.email?.message}</b>
      <input className={s.input} type="password" placeholder="Пароль" {...register('password1')} />
      <b className={s.error}>{errors.password1?.message}</b>
      <input
        className={s.input}
        type="password"
        placeholder="Повторите пароль"
        {...register('password2')}
      />
      <b className={s.error}>{errors.password2?.message}</b>
      <b className={s.error}>{formErr}</b>
      <input
        className={s.submitBtn}
        type="submit"
        disabled={isSubmitting}
        value="Регистрация"
      />
    </form>
  );
};

export default RegistrationForm;