import { useForm } from 'react-hook-form';
import { loginFormSchema, loginFormData } from '../schemas';
import s from '../form.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginDto } from '../../../types/types';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { loginUser } from '../authSlice';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import logo from '../../../assets/logo.svg';

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formErr = useAppSelector((state) => state.authSlice.error);
  const isAuthenticated = useAppSelector((state) => state.authSlice.isAuthenticated);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginFormData>({
    resolver: yupResolver(loginFormSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/Personalpage');
    }
  }, [isAuthenticated]);

  const onSubmit = async (dto: loginDto) => {
    dispatch(loginUser(dto));
  };

  return (
    <form className={s.form} onSubmit={handleSubmit(onSubmit)}>
      <img src={logo} alt="Health Tracker Logo" className={s.logo} />
      <h3>Вход</h3>
      <input className={s.input} placeholder="Email" {...register('email')} />
      <b className={s.error}>{errors.email?.message}</b>
      <input className={s.input} type="password" placeholder="Пароль" {...register('password')} />
      <b className={s.error}>{errors.password?.message}</b>
      <b className={s.error}>{formErr}</b>
      <input
        className={s.toggleButton}
        disabled={isSubmitting}
        type="submit"
        value="Войти"
      />
    </form>
  );
};

export default LoginForm;