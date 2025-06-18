import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { generateReport, fetchUserReports, fetchReportFile, setSelectedReport, clearSelectedReportUrl, deleteReport } from './reportSlice';
import Cookies from 'js-cookie';
import { FaTrash } from 'react-icons/fa';
import Select from 'react-select';
import styles from './report.module.scss';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Report: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, reports, selectedReportId, selectedReportUrl } = useAppSelector((state) => state.reportSlice);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportType, setReportType] = useState<string>('symptoms');
  const [fileFormat, setFileFormat] = useState<string>('pdf');
  const [selectedSymptoms, setSelectedSymptoms] = useState<number[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<number[]>([]);
  const [symptoms, setSymptoms] = useState<{ id: number; name: string }[]>([]);
  const [medications, setMedications] = useState<{ id: number; name: string }[]>([]);

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  useEffect(() => {
  const token = Cookies.get('authToken');
  if (token) {
    const decoded: { id: string } = jwtDecode(token);
    const userId = decoded.id;

    Promise.all([
      axios
        .get(`http://localhost:5001/api/symptom/all/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setSymptoms(res.data);
        })
        .catch((err) => console.error('Symptoms fetch error:', err)),
      axios
        .get(`http://localhost:5001/api/medication/all/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setMedications(res.data);
        })
        .catch((err) => console.error('Medications fetch error:', err)),
    ]).then(() => dispatch(fetchUserReports()));

    return () => {
      dispatch(clearSelectedReportUrl());
    };
  }
}, [dispatch]);

  useEffect(() => {
    if (selectedReportId && !isMobile()) {
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

    dispatch(
      generateReport({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reportType,
        fileFormat,
        symptomIds: reportType === 'symptoms' ? selectedSymptoms : undefined,
        medicationIds: reportType === 'medications' ? selectedMedications : undefined,
      })
    ).then(() => dispatch(fetchUserReports()));
  };

  const handleSelectReport = (reportId: number) => {
    dispatch(clearSelectedReportUrl());
    dispatch(setSelectedReport(reportId));
    if (isMobile()) {
      dispatch(fetchReportFile(reportId)).then((action) => {
        if (fetchReportFile.fulfilled.match(action)) {
          const url = action.payload as string;
          window.open(url, '_blank');
        }
      });
    }
  };

  const handleDeleteReport = (reportId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      dispatch(deleteReport(reportId));
    }
  };

  const symptomOptions = symptoms.map((symptom) => ({ value: symptom.id, label: symptom.name }));
  const medicationOptions = medications.map((medication) => ({ value: medication.id, label: medication.name }));

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
          <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="symptoms">Симптомы</option>
            <option value="medications">Лекарства</option>
          </select>
        </div>

        <div className={styles.inputReportFormat}>
          <label htmlFor="fileFormat">Формат:</label>
          <select id="fileFormat" value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {reportType === 'symptoms' && (
          <div className={styles.inputReportSymptoms}>
            <label>Выберите симптомы:</label>
            <Select
              isMulti
              options={symptomOptions}
              value={symptomOptions.filter((option) => selectedSymptoms.includes(option.value))}
              onChange={(selected) => setSelectedSymptoms(selected.map((option) => option.value))}
              placeholder="Можно не выбирать"
            />
          </div>
        )}

        {reportType === 'medications' && (
          <div className={styles.inputReportMedications}>
            <label>Выберите лекарства:</label>
            <Select
              isMulti
              options={medicationOptions}
              value={medicationOptions.filter((option) => selectedMedications.includes(option.value))}
              onChange={(selected) => setSelectedMedications(selected.map((option) => option.value))}
              placeholder="Можно не выбирать"
            />
          </div>
        )}

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
                {report.type === 'symptoms' || report.type === 'symptoms_excel' ? 'Симптомы' : 'Лекарства'} (
                {report.startDate} - {report.endDate})
                {report.type === 'symptoms_excel' || report.type === 'medications_excel' ? ' (Excel)' : ' (PDF)'}
              </span>
              <FaTrash className={styles.deleteIcon} onClick={() => handleDeleteReport(report.id)} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.rightPanel}>
        {!isMobile() && selectedReportId && selectedReportUrl ? (
          <iframe src={selectedReportUrl} title="Report Viewer" className={styles.reportViewer} />
        ) : (
          <p className={styles.placeholderText}>Выберите PDF отчет для просмотра</p>
        )}
      </div>
    </div>
  );
};

export default Report;