import * as yup from 'yup';

export type loginFormData = yup.InferType<typeof loginFormSchema>;
export type registrationFormData = yup.InferType<typeof registrationFormSchema>;

// Функция для преобразования даты из формата "DD.MM.YYYY" в объект Date
function parseDate(dateStr:any) {
  const [day, month, year] = dateStr.split('.'); // разделяем строку по точке
  const date = new Date(`${year}-${month}-${day}`);
  return date;
}

// Функция для преобразования объекта Date обратно в строку "DD.MM.YYYY"
function formatDateToString(date:any) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export const loginFormSchema = yup.object().shape({
  email: yup
  .string()
  .email('Неправильно указана почта').required('Поле обязательно'),
  password: yup
    .string()
    .min(6, 'Длина пароля должна быть более 6 символов')
    .required('Поле обязательно'),
});

export const registrationFormSchema = yup.object().shape({
  firstName: yup.string().required('Поле обязательно'),
  lastName: yup.string().required('Поле обязательно'),
  email: yup.string().email('Неправильно указана почта').required('Поле обязательно'),
  password1: yup
    .string()
    .min(6, 'Длина пароля должна быть более 6 символов')
    .required('Поле обязательно')
    .matches(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву.')
    .matches(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву.'),
  password2: yup
    .string()
    .oneOf([yup.ref('password1'), undefined], 'Пароли не совпадают')
    .min(6, 'Длина пароля должна быть более 6 символов')
    .required('Поле обязательно')
    .matches(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву.')
    .matches(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву.'),
  birthDate: yup
    .string()
    .required('Поле обязательно')
    .test('is-valid-date', 'Поле обязательно', value => {
      const date = parseDate(value);
      return !isNaN(date.getTime()); // проверяем, является ли дата валидной
    })
    .transform((value) => formatDateToString(parseDate(value))) // преобразуем в строку формата "DD.MM.YYYY"
});

