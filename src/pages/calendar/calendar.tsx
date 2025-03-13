// src/components/calendar.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import Modal from 'react-modal';
import ruLocale from '@fullcalendar/core/locales/ru';
import Select from 'react-select';
import { getAllHealthRecords, getAllSymptoms, getAllMedications, createSymptomRecord, createMedicationRecord } from './calendarSlice';
import { createEventId } from './event-utils';
import './calendar.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Symptom, Medication } from './calendarSlice';

Modal.setAppElement('#root');

const Calendar: React.FC = () => {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state: any) => state.calendarSlice.events);
  const symptoms = useAppSelector((state: any) => state.calendarSlice.symptoms);
  const medications = useAppSelector((state: any) => state.calendarSlice.medications);

  const [weekendsVisible, setWeekendsVisible] = React.useState(true);
  const [currentEvents, setCurrentEvents] = React.useState<EventApi[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = React.useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<DateSelectArg | null>(null);
  const [selectedType, setSelectedType] = React.useState<'symptom' | 'medication' | null>(null);
  const [selectedSymptom, setSelectedSymptom] = React.useState<number | null>(null);
  const [selectedMedication, setSelectedMedication] = React.useState<number | null>(null);
  const [severity, setSeverity] = React.useState<number | null>(null);
  const [quantity, setQuantity] = React.useState<number | null>(null);
  const [dosage, setDosage] = React.useState<number | null>(null);
  const [symptomTime, setSymptomTime] = React.useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Текущие часы и минуты в формате HH:mm
  });
  const [medicationTime, setMedicationTime] = React.useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Текущие часы и минуты в формате HH:mm
  });

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;
      dispatch(getAllHealthRecords(userId));
      dispatch(getAllSymptoms(userId));
      dispatch(getAllMedications(userId));
    }
  }, [dispatch]);

  const token = Cookies.get('authToken');
  const decoded: any = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const symptomOptions = symptoms.map((symptom: Symptom) => ({
    label: symptom.name,
    value: symptom.id,
  }));

  const medicationOptions = medications.map((medication: Medication) => ({
    label: medication.name,
    value: medication.id,
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo);
    setIsModalOpen(true);
  };

  const handleTypeSelect = (type: 'symptom' | 'medication') => {
    setSelectedType(type);
    setIsModalOpen(false);
    setIsSymptomModalOpen(type === 'symptom');
    setIsMedicationModalOpen(type === 'medication');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const closeSecondModal = () => {
    setIsSymptomModalOpen(false);
    setSelectedSymptom(null);
    setSeverity(null);
    setSymptomTime(new Date().toTimeString().slice(0, 5));
  };

  const closeMedicationModal = () => {
    setIsMedicationModalOpen(false);
    setSelectedMedication(null);
    setQuantity(null);
    setDosage(null);
    setMedicationTime(new Date().toTimeString().slice(0, 5));
  };

  const handleSymptomChange = (selectedOption: any) => {
    setSelectedSymptom(selectedOption ? selectedOption.value : null);
  };

  const handleMedicationChange = (selectedOption: any) => {
    setSelectedMedication(selectedOption ? selectedOption.value : null);
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(event.target.value));
  };

  const handleDosageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDosage(Number(event.target.value));
  };

  const handleSeverityChange = (severity: number) => {
    setSeverity(severity);
  };

  const handleSymptomTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymptomTime(event.target.value);
  };

  const handleMedicationTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMedicationTime(event.target.value);
  };

  const handleSaveSymptom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && selectedSymptom !== null && severity !== null && userId) {
      const selectedSymptomName = symptoms.find((s: Symptom) => s.id === selectedSymptom)?.name || '';
      const calendarApi = selectedDate.view.calendar;
      const recordDateWithTime = `${selectedDate.startStr.split('T')[0]}T${symptomTime}:00`; // Убираем Z для локального времени
      const newEvent = {
        id: createEventId(),
        title: `Симптом: ${selectedSymptomName} - Тяжесть: ${severity}`,
        start: recordDateWithTime,
        end: selectedDate.endStr,
        allDay: false,
      };
      calendarApi.addEvent(newEvent);

      const newRecord = {
        recordDate: recordDateWithTime,
        weight: severity,
        notes: null,
        userId,
        symptomId: selectedSymptom,
      };
      await dispatch(createSymptomRecord(newRecord)).unwrap();
      dispatch(getAllHealthRecords(userId));

      closeSecondModal();
    }
  };

  const handleSaveMedication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && selectedMedication !== null && quantity && dosage !== null && userId) {
      const selectedMedicationName = medications.find((m: Medication) => m.id === selectedMedication)?.name || '';
      const calendarApi = selectedDate.view.calendar;
      const recordDateWithTime = `${selectedDate.startStr.split('T')[0]}T${medicationTime}:00`; // Убираем Z для локального времени
      const newEvent = {
        id: createEventId(),
        title: `Лекарство: ${selectedMedicationName} - Количество: ${quantity} - Дозировка: ${dosage} мг`,
        start: recordDateWithTime,
        end: selectedDate.endStr,
        allDay: false,
      };
      calendarApi.addEvent(newEvent);

      const newRecord = {
        recordDate: recordDateWithTime,
        dosage,
        notes: quantity.toString(),
        userId,
        medicationId: selectedMedication,
      };
      await dispatch(createMedicationRecord(newRecord)).unwrap();
      dispatch(getAllHealthRecords(userId));

      closeMedicationModal();
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Вы уверены, что хотите удалить событие '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  };

  const handleEvents = (events: EventApi[]) => {
    setCurrentEvents(events);
  };

  return (
    <div className="demo-app">
      <div className="demo-app-main">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
          locale={ruLocale}
          contentHeight={800}
          firstDay={1}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Type Modal"
        style={{
          content: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          },
        }}
      >
        <h2>Я хочу отметить:</h2>
        <div>
          <button onClick={() => handleTypeSelect('symptom')}>Симптом</button>
          <button onClick={() => handleTypeSelect('medication')}>Лекарство</button>
        </div>
      </Modal>

      <Modal
        isOpen={isSymptomModalOpen}
        onRequestClose={closeSecondModal}
        contentLabel="Input Data Modal"
        style={{
          content: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          },
        }}
      >
        <h2>Введите данные для симптома</h2>
        <form onSubmit={handleSaveSymptom}>
          <div>
            <label>Название симптома:</label>
            <Select
              value={symptomOptions.find((option: { label: string; value: number }) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
            />
          </div>
          <div>
            <label>Время симптома:</label>
            <input
              type="time"
              value={symptomTime}
              onChange={handleSymptomTimeChange}
            />
          </div>
          <div>
            <label>Тяжесть симптома:</label>
            <div>
              {[1, 2, 3, 4, 5].map((sev) => (
                <button
                  type="button"
                  key={sev}
                  className={`severity-button ${severity === sev ? 'selected' : ''}`}
                  onClick={() => handleSeverityChange(sev)}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button type="button" onClick={closeSecondModal}>
              Закрыть
            </button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isMedicationModalOpen}
        onRequestClose={closeMedicationModal}
        contentLabel="Input Medication Data Modal"
        style={{
          content: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          },
        }}
      >
        <h2>Введите данные для лекарства</h2>
        <form onSubmit={handleSaveMedication}>
          <div>
            <label>Название лекарства:</label>
            <Select
              value={medicationOptions.find((option: { label: string; value: number }) => option.value === selectedMedication)}
              onChange={handleMedicationChange}
              options={medicationOptions}
              placeholder="Выберите лекарство"
              isSearchable
            />
          </div>
          <div>
            <label>Время приема:</label>
            <input
              type="time"
              value={medicationTime}
              onChange={handleMedicationTimeChange}
            />
          </div>
          <div>
            <label>Количество (шт):</label>
            <input
              type="number"
              value={quantity || ''}
              onChange={handleQuantityChange}
              placeholder="Количество"
              min="1"
            />
          </div>
          <div>
            <label>Дозировка (мг):</label>
            <input
              type="number"
              value={dosage || ''}
              onChange={handleDosageChange}
              placeholder="Дозировка"
              min="1"
            />
          </div>
          <div>
            <button type="button" onClick={closeMedicationModal}>
              Закрыть
            </button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Calendar;