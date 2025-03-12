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
import { getAllHealthRecords } from './calendarSlice';
import { createEventId } from './event-utils';
import './calendar.module.scss';
import Cookies from 'js-cookie'; // Import js-cookie
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

Modal.setAppElement('#root');


const Calendar: React.FC = () => {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state: any) => state.calendarSlice.events); // Get events from Redux


  

  const [weekendsVisible, setWeekendsVisible] = React.useState(true);
  const [currentEvents, setCurrentEvents] = React.useState<EventApi[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSecondModalOpen, setIsSecondModalOpen] = React.useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<DateSelectArg | null>(null);
  const [selectedType, setSelectedType] = React.useState<'symptom' | 'medication' | null>(null);
  const [selectedSymptom, setSelectedSymptom] = React.useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = React.useState<string | null>(null);
  const [severity, setSeverity] = React.useState<number | null>(null);
  const [quantity, setQuantity] = React.useState<number | null>(null);
  const [dosage, setDosage] = React.useState<number | null>(null);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;
      
      dispatch(getAllHealthRecords(userId));

    }
  }, [dispatch]);


  // Options for symptoms and medications (could be fetched from a database later)
  const symptomOptions = [
    { label: 'Головная боль', value: 'headache' },
    { label: 'Кашель', value: 'cough' },
    { label: 'Тошнота', value: 'nausea' },
  ];

  const medicationOptions = [
    { label: 'Парацетамол', value: 'paracetamol' },
    { label: 'Аспирин', value: 'aspirin' },
    { label: 'Ибупрофен', value: 'ibuprofen' },
  ];

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo);
    setIsModalOpen(true);
  };

  const handleTypeSelect = (type: 'symptom' | 'medication') => {
    setSelectedType(type);
    setIsModalOpen(false);
    setIsSecondModalOpen(type === 'symptom');
    setIsMedicationModalOpen(type === 'medication');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const closeSecondModal = () => {
    setIsSecondModalOpen(false);
    setSelectedSymptom(null);
    setSeverity(null);
  };

  const closeMedicationModal = () => {
    setIsMedicationModalOpen(false);
    setSelectedMedication(null);
    setQuantity(null);
    setDosage(null);
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

  const handleSaveEvent = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && selectedSymptom && severity !== null) {
      const calendarApi = selectedDate.view.calendar;
      calendarApi.addEvent({
        id: createEventId(),
        title: `Симптом: ${selectedSymptom} - Тяжесть: ${severity}`,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: selectedDate.allDay,
      });
      closeSecondModal();
    }
  };

  const handleSaveMedication = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && selectedMedication && quantity && dosage !== null) {
      const calendarApi = selectedDate.view.calendar;
      calendarApi.addEvent({
        id: createEventId(),
        title: `Лекарство: ${selectedMedication} - Количество: ${quantity} - Дозировка: ${dosage} мг`,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: selectedDate.allDay,
      });
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
{/*       {events && console.log("События для календаря:", events)} {/* Логируем данные перед рендером */}
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
          events={events} // Use events from Redux
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
          locale={ruLocale}
          contentHeight={800} // Увеличивает высоту клеток чисел
          //aspectRatio={1.5} // Увеличивает ширину относительно высоты
          firstDay={1}
        />
      </div>

      {/* First modal: Choose symptom or medication */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Type Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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

      {/* Modal for symptom input */}
      <Modal
        isOpen={isSecondModalOpen}
        onRequestClose={closeSecondModal}
        contentLabel="Input Data Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          },
        }}
      >
        <h2>Введите данные для симптома</h2>
        <form onSubmit={handleSaveEvent}>
          <div>
            <label>Название симптома:</label>
            <Select
              value={symptomOptions.find((option) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
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

      {/* Modal for medication input */}
      <Modal
        isOpen={isMedicationModalOpen}
        onRequestClose={closeMedicationModal}
        contentLabel="Input Medication Data Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90%',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              value={medicationOptions.find((option) => option.value === selectedMedication)}
              onChange={handleMedicationChange}
              options={medicationOptions}
              placeholder="Выберите лекарство"
              isSearchable
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
