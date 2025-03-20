import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventApi, DatesSetArg } from '@fullcalendar/core';
import Modal from 'react-modal';
import ruLocale from '@fullcalendar/core/locales/ru';
import Select, { MultiValue, ActionMeta } from 'react-select';
import { getAllHealthRecords, getAllSymptoms, getAllMedications, createSymptomRecord, createMedicationRecord, updateRecord, createCustomSymptom, createCustomMedication, getHistoricalKpData, getForecastKpData, CalendarState, Symptom, Medication } from './calendarSlice';
import { createEventId } from './event-utils';
import './calendar.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

Modal.setAppElement('#root');

interface Option {
  label: string;
  value: number;
}

const Calendar: React.FC = () => {
  const dispatch = useAppDispatch();
  // Указываем тип состояния для useAppSelector
  const events = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.events);
  const symptoms = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.symptoms);
  const medications = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.medications);
  const kpData = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.kpData);

  const [addingType, setAddingType] = React.useState<'symptom' | 'medication' | null>(null);
  const [weekendsVisible] = React.useState(true);
  const [, setCurrentEvents] = React.useState<EventApi[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAddNewModalOpen, setIsAddNewModalOpen] = React.useState(false);
  const [newSymptomName, setNewSymptomName] = React.useState<string>('');
  const [isSymptomModalOpen, setIsSymptomModalOpen] = React.useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = React.useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = React.useState(false);
  const [isUpdateSymptomEventModalOpen, setIsUpdateSymptomEventModalOpen] = React.useState(false);
  const [isUpdateMedicalEventModalOpen, setIsUpdateMedicalEventModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<DateSelectArg | null>(null);
  const [selectedKpIndex, setSelectedKpIndex] = React.useState<number | null>(null);
  const [, setSelectedType] = React.useState<'symptom' | 'medication' | null>(null);
  const [selectedSymptom, setSelectedSymptom] = React.useState<number | null>(null);
  const [selectedMedication, setSelectedMedication] = React.useState<number | null>(null);
  const [severity, setSeverity] = React.useState<number | null>(null);
  const [quantity, setQuantity] = React.useState<number | null>(null);
  const [dosage, setDosage] = React.useState<number | null>(null);
  const [symptomTime, setSymptomTime] = React.useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [medicationTime, setMedicationTime] = React.useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [filterType, setFilterType] = useState({ symptoms: false, medications: false });
  const [selectedSymptoms, setSelectedSymptoms] = useState<Option[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<Option[]>([]);
  const [filteredEvents, setFilteredEvents] = useState(events);

  const [tempFilterType, setTempFilterType] = useState({ symptoms: false, medications: false });
  const [tempSelectedSymptoms, setTempSelectedSymptoms] = useState<Option[]>([]);
  const [tempSelectedMedications, setTempSelectedMedications] = useState<Option[]>([]);

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

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const historicalStart = formatDate(monthAgo);
    const historicalEnd = formatDate(yesterday);

    dispatch(getHistoricalKpData({ start: historicalStart, end: historicalEnd }));
    dispatch(getForecastKpData());
  };

  const token = Cookies.get('authToken');
  const decoded: any = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const symptomOptions: Option[] = symptoms.map((symptom: Symptom) => ({
    label: symptom.name,
    value: symptom.id,
  }));

  const medicationOptions: Option[] = medications.map((medication: Medication) => ({
    label: medication.name,
    value: medication.id,
  }));

  const filterEvents = (allEvents: any[], type: { symptoms: boolean; medications: boolean }, symptoms: Option[], medications: Option[]) => {
    let filtered = [...allEvents];
    const isTypeFilterActive = type.symptoms || type.medications;
    const isSymptomFilterActive = symptoms.length > 0;
    const isMedicationFilterActive = medications.length > 0;
    const isAnyFilterActive = isTypeFilterActive || isSymptomFilterActive || isMedicationFilterActive;

    if (!isAnyFilterActive) {
      return allEvents;
    }

    if (isTypeFilterActive && !(type.symptoms && type.medications)) {
      filtered = filtered.filter((event) => {
        if (type.symptoms && !type.medications) {
          return event.extendedProps.type === 'symptom';
        }
        if (!type.symptoms && type.medications) {
          return event.extendedProps.type === 'medication';
        }
        return true;
      });
    }

    if (isSymptomFilterActive || isMedicationFilterActive) {
      const symptomIds = symptoms.map((symptom) => symptom.value);
      const medicationIds = medications.map((medication) => medication.value);

      filtered = filtered.filter((event) => {
        const matchesSymptom =
          event.extendedProps.type === 'symptom' &&
          isSymptomFilterActive &&
          event.extendedProps.symptomId !== undefined &&
          symptomIds.includes(event.extendedProps.symptomId);

        const matchesMedication =
          event.extendedProps.type === 'medication' &&
          isMedicationFilterActive &&
          event.extendedProps.medicationId !== undefined &&
          medicationIds.includes(event.extendedProps.medicationId);

        return matchesSymptom || matchesMedication;
      });
    }

    return filtered;
  };

  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const handleFiltersClick = () => {
    setTempFilterType(filterType);
    setTempSelectedSymptoms(selectedSymptoms);
    setTempSelectedMedications(selectedMedications);
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const handleFilterTypeChange = (type: 'symptoms' | 'medications') => {
    setTempFilterType((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSymptomFilterChange = (newValue: MultiValue<Option>, _actionMeta: ActionMeta<Option>) => {
    setTempSelectedSymptoms(newValue as Option[]);
  };

  const handleMedicationFilterChange = (newValue: MultiValue<Option>, _actionMeta: ActionMeta<Option>) => {
    setTempSelectedMedications(newValue as Option[]);
  };

  const handleResetFilters = () => {
    setTempFilterType({ symptoms: false, medications: false });
    setTempSelectedSymptoms([]);
    setTempSelectedMedications([]);
    setFilterType({ symptoms: false, medications: false });
    setSelectedSymptoms([]);
    setSelectedMedications([]);
    setFilteredEvents(events);
    setIsFilterPanelOpen(false);
  };

  const handleShowFilters = () => {
    setFilterType(tempFilterType);
    setSelectedSymptoms(tempSelectedSymptoms);
    setSelectedMedications(tempSelectedMedications);
    const filtered = filterEvents(events, tempFilterType, tempSelectedSymptoms, tempSelectedMedications);
    setFilteredEvents(filtered);
    setIsFilterPanelOpen(false);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo);

    const selectedDateStr = selectInfo.startStr.split('T')[0];
    // Теперь TypeScript знает, что kpData — это KpIndexData[], и entry имеет тип KpIndexData
    const kpEntry = kpData.find((entry) => entry.date === selectedDateStr);
    const kpIndex = kpEntry ? kpEntry.kpIndex : null;
    setSelectedKpIndex(kpIndex);

    setIsModalOpen(true);
  };

  const handleTypeSelect = (type: 'symptom' | 'medication') => {
    setSelectedType(type);
    setIsModalOpen(false);
    setIsSymptomModalOpen(type === 'symptom');
    setIsMedicationModalOpen(type === 'medication');
  };

  const openAddNewModal = (type: 'symptom' | 'medication') => {
    setAddingType(type);
    setIsAddNewModalOpen(true);
  };

  const closeAddNewModal = () => {
    setIsAddNewModalOpen(false);
    setNewSymptomName('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedKpIndex(null);
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

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const closeUpdateSymptomEventModal = () => {
    setIsUpdateSymptomEventModalOpen(false);
    setSelectedEvent(null);
    setSelectedSymptom(null);
    setSeverity(null);
    setSymptomTime(new Date().toTimeString().slice(0, 5));
  };

  const closeUpdateMedicalEventModal = () => {
    setIsUpdateMedicalEventModalOpen(false);
    setSelectedEvent(null);
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
    const value = event.target.value;
    const numValue = value ? Number(value) : null;
    setQuantity(numValue !== null && numValue >= 0 ? numValue : null);
  };

  const handleDosageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = value ? Number(value) : null;
    setDosage(numValue !== null && numValue >= 0 ? numValue : null);
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
      const recordDateWithTime = `${selectedDate.startStr.split('T')[0]}T${symptomTime}:00`;
      const newEvent = {
        id: createEventId(),
        title: `Симптом: ${selectedSymptomName} - ${symptomTime} - Тяжесть: ${severity}`,
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
    if (selectedDate && selectedMedication !== null && userId) {
      const selectedMedicationName = medications.find((m: Medication) => m.id === selectedMedication)?.name || '';
      const calendarApi = selectedDate.view.calendar;
      const recordDateWithTime = `${selectedDate.startStr.split('T')[0]}T${medicationTime}:00`;
      const quantityText = quantity !== null ? ` - Количество: ${quantity}` : '';
      const dosageText = dosage !== null ? ` - Дозировка: ${dosage} мг` : '';
      const newEvent = {
        id: createEventId(),
        title: `Лекарство: ${selectedMedicationName} - ${medicationTime}${quantityText}${dosageText}`,
        start: recordDateWithTime,
        end: selectedDate.endStr,
        allDay: false,
        extendedProps: {
          type: 'medication',
          medicationId: selectedMedication,
          notes: quantity !== null ? quantity.toString() : null,
          dosage: dosage,
        },
      };
      calendarApi.addEvent(newEvent);

      const newRecord = {
        recordDate: recordDateWithTime,
        dosage: dosage !== null ? dosage : null,
        notes: quantity !== null ? quantity.toString() : null,
        userId,
        medicationId: selectedMedication,
      };
      await dispatch(createMedicationRecord(newRecord)).unwrap();
      dispatch(getAllHealthRecords(userId));
      closeMedicationModal();
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event);
    if (event.extendedProps.type === 'symptom') {
      setSelectedSymptom(event.extendedProps.symptomId || null);
      setSeverity(event.extendedProps.weight || null);
      setSymptomTime(new Date(event.start!).toTimeString().slice(0, 5));
    } else if (event.extendedProps.type === 'medication') {
      setSelectedMedication(event.extendedProps.medicationId || null);
      setQuantity(event.extendedProps.notes ? Number(event.extendedProps.notes) : null);
      setDosage(event.extendedProps.dosage || null);
      setMedicationTime(new Date(event.start!).toTimeString().slice(0, 5));
    }
    setIsEventModalOpen(true);
  };

  const handleEvents = (events: EventApi[]) => {
    setCurrentEvents(events);
  };

  const handleEditEvent = () => {
    setIsEventModalOpen(false);
    if (selectedEvent.extendedProps.type === 'symptom') {
      setIsUpdateSymptomEventModalOpen(true);
    } else if (selectedEvent.extendedProps.type === 'medication') {
      setIsUpdateMedicalEventModalOpen(true);
    }
  };

  const handleSaveSymptomEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedEvent && selectedSymptom !== null && severity !== null && userId) {
      const recordDateWithTime = `${selectedEvent.start!.toISOString().split('T')[0]}T${symptomTime}:00`;
      const updatedRecord = {
        id: selectedEvent.id,
        recordDate: recordDateWithTime,
        weight: severity,
        notes: null,
        userId,
        symptomId: selectedSymptom,
        medicationId: undefined,
      };
      await dispatch(updateRecord(updatedRecord)).unwrap();
      dispatch(getAllHealthRecords(userId));
      closeUpdateSymptomEventModal();
    }
  };

  const handleCreateItem = async () => {
    if (newSymptomName && userId && addingType) {
      const newItem = {
        name: newSymptomName,
        description: '',
        isCustom: true,
        userId,
      };
      try {
        if (addingType === 'symptom') {
          await dispatch(createCustomSymptom(newItem)).unwrap();
          dispatch(getAllSymptoms(userId));
        } else if (addingType === 'medication') {
          await dispatch(createCustomMedication(newItem)).unwrap();
          dispatch(getAllMedications(userId));
        }
        closeAddNewModal();
      } catch (error) {
        console.error(`Ошибка при создании ${addingType === 'symptom' ? 'симптома' : 'лекарства'}:`, error);
      }
    }
  };

  const handleSaveMedicalEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedEvent && selectedMedication !== null && userId) {
      const recordDateWithTime = `${selectedEvent.start!.toISOString().split('T')[0]}T${medicationTime}:00`;
      const updatedRecord = {
        id: selectedEvent.id,
        recordDate: recordDateWithTime,
        dosage: dosage !== null ? dosage : null,
        notes: quantity !== null ? quantity.toString() : null,
        userId,
        symptomId: undefined,
        medicationId: selectedMedication,
      };
      await dispatch(updateRecord(updatedRecord)).unwrap();
      dispatch(getAllHealthRecords(userId));
      closeUpdateMedicalEventModal();
    }
  };

  const getKpColor = (kpIndex: number | null) => {
    if (kpIndex === null) return '#000000';
    if (kpIndex <= 2) return '#00FF00'; // Зеленый
    if (kpIndex <= 4) return '#FFFF00'; // Желтый
    if (kpIndex <= 6) return '#FFA500'; // Оранжевый
    return '#FF0000'; // Красный
  };

  const getRandomKpIndex = () => {
    return Math.floor(Math.random() * 4) + 1;
  };

  return (
    <div className="demo-app">
      <div className="demo-app-main">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'filters dayGridMonth,timeGridWeek,timeGridDay',
          }}
          customButtons={{
            filters: {
              text: 'Фильтры',
              click: handleFiltersClick,
            },
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          events={filteredEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
          locale={ruLocale}
          contentHeight={800}
          firstDay={1}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          datesSet={handleDatesSet}
        />

        {isFilterPanelOpen && (
          <div
            className="filter-modal"
            style={{
              position: 'absolute',
              top: '60px',
              right: '150px',
              width: '300px',
              backgroundColor: '#FFFFFF',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              zIndex: 10000,
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Фильтры</h4>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Тип</label>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={tempFilterType.symptoms}
                  onChange={() => handleFilterTypeChange('symptoms')}
                  style={{ marginRight: '5px' }}
                />
                <span>Симптомы</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={tempFilterType.medications}
                  onChange={() => handleFilterTypeChange('medications')}
                  style={{ marginRight: '5px' }}
                />
                <span>Лекарства</span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Симптом</label>
              <Select
                isMulti
                value={tempSelectedSymptoms}
                onChange={(newValue, actionMeta) => handleSymptomFilterChange(newValue, actionMeta)}
                options={symptomOptions}
                placeholder="Выберите симптомы"
                isSearchable
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Лекарство</label>
              <Select
                isMulti
                value={tempSelectedMedications}
                onChange={(newValue, actionMeta) => handleMedicationFilterChange(newValue, actionMeta)}
                options={medicationOptions}
                placeholder="Выберите лекарства"
                isSearchable
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: '#007BFF',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Сбросить
              </button>
              <button
                onClick={handleShowFilters}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007BFF',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Показать
              </button>
            </div>
          </div>
        )}
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
        {selectedDate && (
          <p>
            <strong>Дата:</strong> {new Date(selectedDate.startStr).toLocaleDateString('ru-RU')}
            <br />
            <strong>KP-индекс:</strong>{' '}
            <span style={{ color: getKpColor(selectedKpIndex !== null ? selectedKpIndex : getRandomKpIndex()) }}>
              {selectedKpIndex !== null ? selectedKpIndex : getRandomKpIndex()}
            </span>
          </p>
        )}
        <div>
          <button onClick={() => handleTypeSelect('symptom')}>Симптом</button>
          <button onClick={() => handleTypeSelect('medication')}>Лекарство</button>
        </div>
        <div>
          <button type="button" onClick={closeModal}>Закрыть</button>
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
            right: '0',
            bottom: '0',
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
              value={symptomOptions.find((option: Option) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
            />
            <p
              style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}
              onClick={() => openAddNewModal('symptom')}
            >
              Не нашли нужного? Добавить свой
            </p>
          </div>
          <div>
            <label>Время симптома:</label>
            <input type="time" value={symptomTime} onChange={handleSymptomTimeChange} />
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
            <button type="button" onClick={closeSecondModal}>Закрыть</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAddNewModalOpen}
        onRequestClose={closeAddNewModal}
        contentLabel="Add New Symptom Modal"
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
            zIndex: 10000,
          },
        }}
      >
        <h2>Введите название {addingType === 'symptom' ? 'симптома' : 'лекарства'}</h2>
        <input
          type="text"
          value={newSymptomName}
          onChange={(e) => setNewSymptomName(e.target.value)}
          placeholder={`Название ${addingType === 'symptom' ? 'симптома' : 'лекарства'}`}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={closeAddNewModal}>Выйти</button>
          <button type="button" onClick={handleCreateItem}>Сохранить</button>
        </div>
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
              value={medicationOptions.find((option: Option) => option.value === selectedMedication)}
              onChange={handleMedicationChange}
              options={medicationOptions}
              placeholder="Выберите лекарство"
              isSearchable
            />
            <p
              style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}
              onClick={() => openAddNewModal('medication')}
            >
              Не нашли нужного? Добавить своё
            </p>
          </div>
          <div>
            <label>Время приема:</label>
            <input type="time" value={medicationTime} onChange={handleMedicationTimeChange} />
          </div>
          <div>
            <label>Количество (шт) (необязательно):</label>
            <input
              type="number"
              value={quantity ?? ''} // Используем ?? вместо ||, чтобы корректно отображать 0
              onChange={handleQuantityChange}
              placeholder="Количество"
              min="0"
            />
          </div>
          <div>
            <label>Дозировка (мг) (необязательно):</label>
            <input
              type="number"
              value={dosage ?? ''} // Используем ?? вместо ||, чтобы корректно отображать 0
              onChange={handleDosageChange}
              placeholder="Дозировка"
              min="0"
            />
          </div>
          <div>
            <button type="button" onClick={closeMedicationModal}>Закрыть</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEventModalOpen}
        onRequestClose={closeEventModal}
        contentLabel="Event Details Modal"
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
        <h2>Информация о событии</h2>
        {selectedEvent && (
          <div>
            <p><strong>Название:</strong> {selectedEvent.title}</p>
            <p><strong>Дата и время:</strong> {new Date(selectedEvent.start!).toLocaleString('ru-RU')}</p>
            {selectedEvent.extendedProps.type === 'symptom' && (
              <>
                <p><strong>Тяжесть:</strong> {selectedEvent.extendedProps.weight}</p>
              </>
            )}
            {selectedEvent.extendedProps.type === 'medication' && (
              <>
                <p><strong>Количество:</strong> {selectedEvent.extendedProps.notes ?? 'Не указано'}</p>
                <p><strong>Дозировка:</strong> {selectedEvent.extendedProps.dosage ? `${selectedEvent.extendedProps.dosage} мг` : 'Не указано'}</p>
              </>
            )}
          </div>
        )}
        <div>
          <button type="button" onClick={closeEventModal}>Закрыть</button>
          <button type="button" onClick={handleEditEvent}>Изменить</button>
        </div>
      </Modal>

      <Modal
        isOpen={isUpdateSymptomEventModalOpen}
        onRequestClose={closeUpdateSymptomEventModal}
        contentLabel="Update Symptom Event Modal"
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
        <h2>Редактирование симптома</h2>
        <form onSubmit={handleSaveSymptomEdit}>
          <div>
            <label>Название симптома:</label>
            <Select
              value={symptomOptions.find((option: Option) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
            />
          </div>
          <div>
            <label>Время симптома:</label>
            <input type="time" value={symptomTime} onChange={handleSymptomTimeChange} />
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
            <button type="button" onClick={closeUpdateSymptomEventModal}>Закрыть</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUpdateMedicalEventModalOpen}
        onRequestClose={closeUpdateMedicalEventModal}
        contentLabel="Update Medical Event Modal"
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
        <h2>Редактирование лекарства</h2>
        <form onSubmit={handleSaveMedicalEdit}>
          <div>
            <label>Название лекарства:</label>
            <Select
              value={medicationOptions.find((option: Option) => option.value === selectedMedication)}
              onChange={handleMedicationChange}
              options={medicationOptions}
              placeholder="Выберите лекарство"
              isSearchable
            />
          </div>
          <div>
            <label>Время приема:</label>
            <input type="time" value={medicationTime} onChange={handleMedicationTimeChange} />
          </div>
          <div>
            <label>Количество (шт) (необязательно):</label>
            <input
              type="number"
              value={quantity ?? ''} // Используем ?? вместо ||, чтобы корректно отображать 0
              onChange={handleQuantityChange}
              placeholder="Количество"
              min="0"
            />
          </div>
          <div>
            <label>Дозировка (мг) (необязательно):</label>
            <input
              type="number"
              value={dosage ?? ''} // Используем ?? вместо ||, чтобы корректно отображать 0
              onChange={handleDosageChange}
              placeholder="Дозировка"
              min="0"
            />
          </div>
          <div>
            <button type="button" onClick={closeUpdateMedicalEventModal}>Закрыть</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Calendar;