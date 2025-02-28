import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { generateReport } from './reportSlice';
import styles from './report.module.scss';

const Report: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.reportSlice);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportType, setReportType] = useState<string>('symptoms'); // Тип отчета (симптомы или лекарства)

  // Функция для преобразования даты в формат ГГГГ.ММ.ДД
  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = () => {
    if (startDate && endDate) {
      const formattedStartDate = formatDateToYYYYMMDD(startDate);
      const formattedEndDate = formatDateToYYYYMMDD(endDate);

      dispatch(generateReport({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reportType
      }));
    }
  };

  return (
  <div className={styles.containerReport}>
    <h1 className={styles.zagolovokReport}>Создать отчет</h1>

    <div className={styles.inputReportStartDate}>
      <label htmlFor="startDate">Начальная дата:</label>
      <input
        id="startDate"
        type="date"
        value={startDate ? startDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setStartDate(new Date(e.target.value))}
      />
    </div>

    <div className={styles.inputReportEndDate}>
      <label htmlFor="endDate">Конечная дата:</label>
      <input
        id="endDate"
        type="date"
        value={endDate ? endDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setEndDate(new Date(e.target.value))}
      />
    </div>

    <div className={styles.inputReportType}>
      <label htmlFor="reportType">Тип отчета:</label>
      <select
        id="reportType"
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
      >
        <option value="symptoms">Симптомы</option>
        <option value="medications">Лекарства</option>
      </select>
    </div>

    <button 
      className={styles.buttonCreateReport} 
      onClick={handleDateChange} 
      disabled={loading}
    >
      Создать
    </button>

    {loading && <p className={styles.loadingText}>Загрузка...</p>}
    {error && <p className={styles.errorText}>{error}</p>}
  </div>

  );
};

export default Report;
