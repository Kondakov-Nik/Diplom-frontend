import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { generateReport, fetchUserReports, fetchReportFile, setSelectedReport, clearSelectedReportUrl, deleteReport } from './reportSlice';
import { FaTrash } from 'react-icons/fa'; // Импорт иконки урны
import styles from './report.module.scss';

const Report: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, reports, selectedReportId, selectedReportUrl } = useAppSelector((state) => state.reportSlice);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportType, setReportType] = useState<string>('symptoms');

  useEffect(() => {
    dispatch(fetchUserReports());
    return () => {
      dispatch(clearSelectedReportUrl());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedReportId) {
      dispatch(fetchReportFile(selectedReportId));
    }
  }, [selectedReportId, dispatch]);

  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = () => {
    if (!startDate || !endDate) {
      alert('Пожалуйста, выберите начальную и конечную даты');
      return;
    }

    const formattedStartDate = formatDateToYYYYMMDD(startDate);
    const formattedEndDate = formatDateToYYYYMMDD(endDate);

    dispatch(generateReport({ startDate: formattedStartDate, endDate: formattedEndDate, reportType }))
      .then(() => dispatch(fetchUserReports()));
  };

  const handleSelectReport = (reportId: number) => {
    dispatch(clearSelectedReportUrl());
    dispatch(setSelectedReport(reportId));
  };

  const handleDeleteReport = (reportId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      dispatch(deleteReport(reportId));
    }
  };

  return (
    <div className={styles.containerReport}>
      <div className={styles.leftPanel}>
        <h1 className={styles.zagolovokReport}>Создать отчет</h1>

        <div className={styles.inputReportStartDate}>
          <label htmlFor="startDate">Начальная дата:</label>
          <input
            id="startDate"
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
          />
        </div>

        <div className={styles.inputReportEndDate}>
          <label htmlFor="endDate">Конечная дата:</label>
          <input
            id="endDate"
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
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
          disabled={loading || !startDate || !endDate}
        >
          Создать
        </button>

        {loading && <p className={styles.loadingText}>Загрузка...</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <h2 className={styles.zagolovokReportsList}>Последние отчеты</h2>
        <ul className={styles.reportsList}>
          {reports.map((report) => (
            <li
              key={report.id}
              className={selectedReportId === report.id ? styles.selectedReport : ''}
            >
              <span onClick={() => handleSelectReport(report.id)}>
                {report.type === 'symptoms' ? 'Симптомы' : 'Лекарства'} ({report.startDate} - {report.endDate})
              </span>
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleDeleteReport(report.id)}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.rightPanel}>
        {selectedReportId && selectedReportUrl ? (
          <iframe
            src={selectedReportUrl}
            title="Report Viewer"
            className={styles.reportViewer}
          />
        ) : (
          <p>Выберите отчет для просмотра</p>
        )}
      </div>
    </div>
  );
};

export default Report;