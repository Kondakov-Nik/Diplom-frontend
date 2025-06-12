import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventApi, DatesSetArg } from '@fullcalendar/core';
import Modal from 'react-modal';
import ruLocale from '@fullcalendar/core/locales/ru';
import Select, { MultiValue, ActionMeta } from 'react-select';
import { getAllHealthRecords, getAllSymptoms, getAllMedications, getUserAnalyses, createSymptomRecord, createMedicationRecord, updateRecord, createCustomSymptom, createCustomMedication, getHistoricalKpData, getForecastKpData, deleteRecord, createAnalysis, deleteAnalysis, CalendarState, Symptom, Medication } from './calendarSlice';
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
  const events = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.events);
  const symptoms = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.symptoms);
  const medications = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.medications);
  const kpData = useAppSelector((state: { calendarSlice: CalendarState }) => state.calendarSlice.kpData);

  const calendarRef = useRef<FullCalendar>(null);

  const [addingType, setAddingType] = useState<'symptom' | 'medication' | null>(null);
  const [weekendsVisible] = useState(true);
  const [, setCurrentEvents] = useState<EventApi[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddNewModalOpen, setIsAddNewModalOpen] = useState(false);
  const [newSymptomName, setNewSymptomName] = useState<string>('');
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isUpdateSymptomEventModalOpen, setIsUpdateSymptomEventModalOpen] = useState(false);
  const [isUpdateMedicalEventModalOpen, setIsUpdateMedicalEventModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [selectedKpIndex, setSelectedKpIndex] = useState<number | null>(null);
  const [, setSelectedType] = useState<'symptom' | 'medication' | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<number | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [dosage, setDosage] = useState<number | null>(null);
  const [symptomTime, setSymptomTime] = useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [medicationTime, setMedicationTime] = useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [analysisTitle, setAnalysisTitle] = useState<string>('');
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);

  const [filterType, setFilterType] = useState({ symptoms: false, medications: false, analyses: false });
  const [selectedSymptoms, setSelectedSymptoms] = useState<Option[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<Option[]>([]);
  const [filteredEvents, setFilteredEvents] = useState(events);

  const [tempFilterType, setTempFilterType] = useState({ symptoms: false, medications: false, analyses: false });
  const [tempSelectedSymptoms, setTempSelectedSymptoms] = useState<Option[]>([]);
  const [tempSelectedMedications, setTempSelectedMedications] = useState<Option[]>([]);

  const [isFuture, setIsFuture] = useState<boolean>(false); // Флаг "Будущее лекарство"
  const [repeatType, setRepeatType] = useState<string>(''); // Тип повторения
  const [repeatInterval, setRepeatInterval] = useState<number | null>(null); // Интервал повторения
  const [repeatEndDate, setRepeatEndDate] = useState<string>(''); // Дата окончания повторения

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;
  
      Promise.all([
        dispatch(getAllSymptoms(userId)).unwrap(),
        dispatch(getAllMedications(userId)).unwrap(),
      ])
        .then(() => {
          return dispatch(getAllHealthRecords(userId)).unwrap();
        })
        .then(() => {
          return dispatch(getUserAnalyses(userId)).unwrap();
        })
        .catch((error) => {
          console.error('Ошибка при загрузке данных:', error);
        });
    }
  }, [dispatch]);

  useEffect(() => {
    if (repeatType === 'daily') {
      setRepeatInterval(1); // Ежедневно
    } else if (repeatType === 'weekly') {
      setRepeatInterval(7); // Еженедельно
    } else if (repeatType === 'everyXdays') {
      setRepeatInterval(null); // Пользователь вводит интервал
    } else {
      setRepeatInterval(null); // Сброс при отсутствии выбора
    }
  }, [repeatType]);

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

  const filterEvents = (allEvents: any[], type: { symptoms: boolean; medications: boolean; analyses: boolean }, symptoms: Option[], medications: Option[]) => {
    let filtered = [...allEvents];
    const isTypeFilterActive = type.symptoms || type.medications || type.analyses;
    const isSymptomFilterActive = symptoms.length > 0;
    const isMedicationFilterActive = medications.length > 0;

    if (isTypeFilterActive) {
      filtered = filtered.filter((event) => {
        if (type.symptoms && event.extendedProps.type === 'symptom') return true;
        if (type.medications && event.extendedProps.type === 'medication') return true;
        if (type.analyses && event.extendedProps.type === 'analysis') return true;
        return false;
      });
    } else {
      return allEvents;
    }

    if (isSymptomFilterActive || isMedicationFilterActive) {
      const symptomIds = symptoms.map((symptom) => symptom.value);
      const medicationIds = medications.map((medication) => medication.value);

      filtered = filtered.filter((event) => {
        if (event.extendedProps.type === 'symptom' && isSymptomFilterActive) {
          return event.extendedProps.symptomId !== undefined && symptomIds.includes(event.extendedProps.symptomId);
        }
        if (event.extendedProps.type === 'medication' && isMedicationFilterActive) {
          return event.extendedProps.medicationId !== undefined && medicationIds.includes(event.extendedProps.medicationId);
        }
        return event.extendedProps.type === 'analysis';
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

  const handleFilterTypeChange = (type: 'symptoms' | 'medications' | 'analyses') => {
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
    setTempFilterType({ symptoms: false, medications: false, analyses: false });
    setTempSelectedSymptoms([]);
    setTempSelectedMedications([]);
    setFilterType({ symptoms: false, medications: false, analyses: false });
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
    const selectedDateObj = new Date(selectedDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const kpEntry = kpData.find((entry) => entry.date === selectedDateStr);
    const kpIndex = kpEntry ? kpEntry.kpIndex : null;
  
    if (selectedDateObj < today) {
      setSelectedKpIndex(kpIndex);
    } else if (selectedDateObj >= today) {
      setSelectedKpIndex(kpIndex);
    }
  
    setIsModalOpen(true);
  };

  const handleDateClick = (clickInfo: DateClickArg) => {
    const selectInfo: DateSelectArg = {
      start: clickInfo.date,
      end: new Date(clickInfo.date.getTime() + 24 * 60 * 60 * 1000),
      startStr: clickInfo.dateStr,
      endStr: new Date(clickInfo.date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      allDay: true,
      view: clickInfo.view,
      jsEvent: clickInfo.jsEvent,
    };
    handleDateSelect(selectInfo);
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

  const closeAnalysisModal = () => {
    setIsAnalysisModalOpen(false);
    setAnalysisTitle('');
    setAnalysisFile(null);
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

  const handleAnalysisTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisTitle(event.target.value);
  };

  const handleAnalysisFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAnalysisFile(file);
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
      await Promise.all([
        dispatch(getAllHealthRecords(userId)).unwrap(),
        dispatch(getUserAnalyses(userId)).unwrap(),
      ]);
      closeSecondModal();
    }
  };

  const handleSaveMedication = async (event: React.FormEvent) => {
  event.preventDefault();
  if (selectedDate && selectedMedication !== null && userId) {
    const selectedMedicationName = medications.find((m: Medication) => m.id === selectedMedication)?.name || '';
    const calendarApi = selectedDate.view.calendar;
    const recordDate = new Date(selectedDate.startStr); // Берем дату из selectedDate
    const [hours, minutes] = medicationTime.split(':').map(Number); // Разбираем время
    recordDate.setHours(hours, minutes, 0, 0); // Устанавливаем точное время
    const recordDateWithTime = recordDate.toISOString(); // Получаем ISO строку с временем

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
      dosage: dosage !== null ? String(dosage) : null,
      notes: quantity !== null ? quantity.toString() : null,
      userId,
      medicationId: selectedMedication,
      ...(isFuture && {
        isFuture: true,
        repeatType: repeatType || undefined,
        repeatInterval: repeatInterval || undefined,
        repeatEndDate: repeatEndDate || undefined,
      }),
    };
    await dispatch(createMedicationRecord(newRecord)).unwrap();
    await Promise.all([
      dispatch(getAllHealthRecords(userId)).unwrap(),
      dispatch(getUserAnalyses(userId)).unwrap(),
    ]);
    closeMedicationModal();
  }
};

  const handleSaveAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDate && analysisTitle && analysisFile && userId) {
      const formData = new FormData();
      formData.append('title', analysisTitle);
      formData.append('recordDate', selectedDate.startStr.split('T')[0]);
      formData.append('userId', userId);
      formData.append('file', analysisFile);

      const calendarApi = selectedDate.view.calendar;
      const newEvent = {
        id: createEventId(),
        title: `Анализ: ${analysisTitle}`,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: true,
        extendedProps: {
          type: 'analysis',
        },
      };
      calendarApi.addEvent(newEvent);

      await dispatch(createAnalysis(formData)).unwrap();
      await dispatch(getUserAnalyses(userId)).unwrap();
      closeAnalysisModal();
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
    if (selectedEvent?.extendedProps.type === 'symptom') {
      setIsUpdateSymptomEventModalOpen(true);
    } else if (selectedEvent?.extendedProps.type === 'medication') {
      setIsUpdateMedicalEventModalOpen(true);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && userId) {
      try {
        if (selectedEvent.extendedProps.type === 'analysis') {
          await dispatch(deleteAnalysis(selectedEvent.id)).unwrap();
        } else {
          await dispatch(deleteRecord(selectedEvent.id)).unwrap();
        }
        const calendarApi = calendarRef.current?.getApi();
        const eventToRemove = calendarApi?.getEventById(selectedEvent.id);
        if (eventToRemove) {
          eventToRemove.remove();
        }
        setFilteredEvents((prevEvents) => prevEvents.filter((event) => event.id !== selectedEvent.id));
        closeEventModal();
      } catch (error) {
        console.error('Ошибка при удалении события:', error);
      }
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
      dosage: dosage !== null ? String(dosage) : null, // Convert to string
      notes: quantity !== null ? quantity.toString() : null,
      userId: String(userId), // Ensure string
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
    if (kpIndex <= 2) return '#FF0000';
    if (kpIndex <= 4) return '#FF0000';
    if (kpIndex <= 6) return '#FF0000';
    return '#FF0000';
  };

  return (
    <div className="demo-app">
      <div className="demo-app-main">
        <FullCalendar
  ref={calendarRef}
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
  dateClick={handleDateClick}
  eventContent={(arg) => {
  const eventType = arg.event.extendedProps.type;
  const eventStart = arg.event.start ? new Date(arg.event.start) : new Date();
  const now = new Date(); // Точное текущее время

  // Проверяем, является ли событие будущим изначально и истекло ли его время
  const isOriginallyFuture = arg.event.extendedProps.isFuture || false;
  const isPastNow = eventStart <= now;

  let backgroundColor = 'rgba(80, 150, 71, 0.78)'; // Стандартный цвет по умолчанию для анализов
  
  if (eventType === 'medication') {
    if (isOriginallyFuture && isPastNow) {
      backgroundColor = 'rgba(246, 50, 50, 0.91)'; // Перекрашиваем в прошедшее/текущее после истечения времени
    } else if (isOriginallyFuture && !isPastNow) {
      backgroundColor = 'rgba(170, 81, 68, 0.77)'; // Остается будущим, если время не истекло
    } else if (!isOriginallyFuture && isPastNow) {
      backgroundColor = 'rgba(246, 50, 50, 0.91)'; // Прошедшее/текущее без флага isFuture
    }
  } else if (eventType === 'symptom') {
    if (isPastNow) {
      backgroundColor = 'rgba(81, 167, 180, 0.77)'; // Светло-красный для прошедших/текущих симптомов
    }
    if (!isPastNow) {
      backgroundColor = 'rgba(81, 167, 180, 0.77)'; // Светло-красный для прошедших/текущих симптомов
    }
  }

  // Форматируем отображение в зависимости от типа события
  const content = eventType === 'analysis' 
    ? `<div style="background-color: ${backgroundColor}; padding: 2px 4px; border-radius: 0px; color: #fff;">${arg.event.title}</div>`
    : `<div style="background-color: ${backgroundColor}; padding: 2px 4px; border-radius: 3px; color: #fff;">${eventStart.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })} ${arg.event.title}</div>`;

  return {
    html: content,
  };
}}
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={tempFilterType.medications}
                  onChange={() => handleFilterTypeChange('medications')}
                  style={{ marginRight: '5px' }}
                />
                <span>Лекарства</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={tempFilterType.analyses}
                  onChange={() => handleFilterTypeChange('analyses')}
                  style={{ marginRight: '5px' }}
                />
                <span>Анализы</span>
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
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Я хочу отметить:
        </h2>
        {selectedDate && (
          <p
            style={{
              fontSize: '16px',
              color: '#555',
              marginBottom: '15px',
            }}
          >
            <strong style={{ color: '#444', fontWeight: 600 }}>Дата:</strong>{' '}
            {new Date(selectedDate.startStr).toLocaleDateString('ru-RU')}
            <br />
            <strong style={{ color: '#444', fontWeight: 600 }}>KP-индекс:</strong>{' '}
            {selectedKpIndex !== null ? (
              <span style={{ color: getKpColor(selectedKpIndex) }}>{selectedKpIndex}</span>
            ) : (
              <span>Нет данных</span>
            )}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            marginBottom: '15px',
          }}
        >
          <button
            style={{
              borderRadius: '20px',
              border: '1px solid #6eb2bada',
              backgroundColor: '#0b7c89ae',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '12px 45px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 80ms ease-in',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89ae';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => handleTypeSelect('symptom')}
          >
            Симптом
          </button>
          <button
            style={{
              borderRadius: '20px',
              border: '1px solid #6eb2bada',
              backgroundColor: '#0b7c89ae',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '12px 45px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 80ms ease-in',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89ae';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => handleTypeSelect('medication')}
          >
            Лекарство
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            style={{
              borderRadius: '20px',
              border: '1px solid #6eb2bada',
              backgroundColor: '#0b7c89ae',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '12px 45px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 80ms ease-in',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0b7c89ae';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => setIsAnalysisModalOpen(true)}
          >
            Анализ
          </button>
          <button
            style={{
              borderRadius: '20px',
              border: '1px solid #ff4b2b',
              backgroundColor: '#ff4b2b',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '12px 45px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 80ms ease-in',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e6391a';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff4b2b';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={closeModal}
          >
            Закрыть
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isSymptomModalOpen}
        onRequestClose={closeSecondModal}
        contentLabel="Input Data Modal"
        style={{
          content: {
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Введите данные для симптома
        </h2>
        <form onSubmit={handleSaveSymptom}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Название симптома:
            </label>
            <Select
              value={symptomOptions.find((option: Option) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: '#eee',
                  padding: '5px',
                  fontSize: '16px',
                }),
                menu: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                }),
              }}
            />
            <p
              style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', fontSize: '14px' }}
              onClick={() => openAddNewModal('symptom')}
            >
              Не нашли нужного? Добавить свой
            </p>
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Время симптома:
            </label>
            <input
              type="time"
              value={symptomTime}
              onChange={handleSymptomTimeChange}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Тяжесть симптома:
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((sev) => (
                <button
                  type="button"
                  key={sev}
                  className={`severity-button ${severity === sev ? 'selected' : ''}`}
                  onClick={() => handleSeverityChange(sev)}
                  style={{
                    backgroundColor: severity === sev ? '#0b7c89ae' : '#eee',
                    color: severity === sev ? '#ffffff' : '#555',
                    border: '1px solid #6eb2bada',
                    borderRadius: '7px',
                    padding: '10px 15px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (severity !== sev) e.currentTarget.style.backgroundColor = '#ddd';
                  }}
                  onMouseLeave={(e) => {
                    if (severity !== sev) e.currentTarget.style.backgroundColor = '#eee';
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeSecondModal}
            >
              Закрыть
            </button>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #6eb2bada',
                backgroundColor: '#0b7c89ae',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89ae';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="submit"
            >
              Сохранить
            </button>
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
      fontFamily: "'Montserrat', sans-serif",
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      padding: '20px',
      width: '400px',
      maxWidth: '90%',
      minHeight: 'auto',
      textAlign: 'center',
      position: 'static',
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
  <h2
    style={{
      fontSize: '24px',
      fontWeight: 800,
      color: '#333',
      marginBottom: '15px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    }}
  >
    Введите данные для лекарства
  </h2>
  <form onSubmit={handleSaveMedication}>
    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
        Название лекарства:
      </label>
      <Select
        value={medicationOptions.find((option: Option) => option.value === selectedMedication)}
        onChange={handleMedicationChange}
        options={medicationOptions}
        placeholder="Выберите лекарство"
        isSearchable
        styles={{
          control: (provided) => ({
            ...provided,
            borderRadius: '7px',
            border: 'none',
            backgroundColor: '#eee',
            padding: '5px',
            fontSize: '16px',
          }),
          menu: (provided) => ({
            ...provided,
            borderRadius: '7px',
          }),
        }}
      />
      <p
        style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', fontSize: '14px' }}
        onClick={() => openAddNewModal('medication')}
      >
        Не нашли нужного? Добавить своё
      </p>
    </div>

    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
        Будущее лекарство:
      </label>
      <input
        type="checkbox"
        checked={isFuture}
        onChange={(e) => setIsFuture(e.target.checked)}
        style={{ marginRight: '10px' }}
      />
      <span>{isFuture ? 'Да' : 'Да'}</span>
    </div>

    {isFuture && (
  <div style={{ marginBottom: '15px', textAlign: 'left' }}>
    <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
      Тип повторения:
    </label>
    <select
      value={repeatType}
      onChange={(e) => setRepeatType(e.target.value)}
      style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
    >
      <option value="">Выберите тип</option>
      <option value="daily">Ежедневно</option>
      <option value="weekly">Еженедельно</option>
      <option value="everyXdays">Каждые X дней</option>
    </select>

    {repeatType === 'everyXdays' && (
      <div style={{ marginTop: '10px' }}>
        <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
          Интервал повторения (дни):
        </label>
        <input
          type="number"
          value={repeatInterval ?? ''}
          onChange={(e) => setRepeatInterval(e.target.value ? Number(e.target.value) : null)}
          placeholder="Введите интервал"
          min="1"
          style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
        />
      </div>
    )}

    <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginTop: '10px', marginBottom: '5px' }}>
      Дата окончания:
    </label>
    <input
      type="date"
      value={repeatEndDate}
      onChange={(e) => setRepeatEndDate(e.target.value)}
      style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
    />
  </div>
)}

    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
        Время приема:
      </label>
      <input
        type="time"
        value={medicationTime}
        onChange={handleMedicationTimeChange}
        style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
      />
    </div>
    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
        Количество (шт) (необязательно):
      </label>
      <input
        type="number"
        value={quantity ?? ''}
        onChange={handleQuantityChange}
        placeholder="Количество"
        min="0"
        style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
      />
    </div>
    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
        Дозировка (мг) (необязательно):
      </label>
      <input
        type="number"
        value={dosage ?? ''}
        onChange={handleDosageChange}
        placeholder="Дозировка"
        min="0"
        style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
      />
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
      <button
        style={{
          borderRadius: '20px',
          border: '1px solid #ff4b2b',
          backgroundColor: '#ff4b2b',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '12px 45px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'transform 80ms ease-in',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e6391a';
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ff4b2b';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        type="button"
        onClick={closeMedicationModal}
      >
        Закрыть
      </button>
      <button
        style={{
          borderRadius: '20px',
          border: '1px solid #6eb2bada',
          backgroundColor: '#0b7c89ae',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '12px 45px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'transform 80ms ease-in',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0b7c89';
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0b7c89ae';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        type="submit"
      >
        Сохранить
      </button>
    </div>
  </form>
</Modal>

      <Modal
        isOpen={isEventModalOpen}
        onRequestClose={closeEventModal}
        contentLabel="Event Details Modal"
        style={{
          content: {
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Информация о событии
        </h2>
        {selectedEvent && (
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
              <strong style={{ color: '#444', fontWeight: 600 }}>Название:</strong> {selectedEvent.title}
            </p>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
              <strong style={{ color: '#444', fontWeight: 600 }}>Дата и время:</strong>{' '}
              {new Date(selectedEvent.start!).toLocaleString('ru-RU')}
            </p>
            {selectedEvent.extendedProps.type === 'symptom' && (
              <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
                <strong style={{ color: '#444', fontWeight: 600 }}>Тяжесть:</strong> {selectedEvent.extendedProps.weight}
              </p>
            )}
            {selectedEvent.extendedProps.type === 'medication' && (
              <>
                <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
                  <strong style={{ color: '#444', fontWeight: 600 }}>Количество:</strong>{' '}
                  {selectedEvent.extendedProps.notes ?? 'Не указано'}
                </p>
                <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
                  <strong style={{ color: '#444', fontWeight: 600 }}>Дозировка:</strong>{' '}
                  {selectedEvent.extendedProps.dosage ? `${selectedEvent.extendedProps.dosage} мг` : 'Не указано'}
                </p>
              </>
            )}
            {selectedEvent.extendedProps.type === 'analysis' && (
              <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
                <strong style={{ color: '#444', fontWeight: 600 }}>Файл:</strong>{' '}
                {selectedEvent.extendedProps.filePath ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (selectedEvent && selectedEvent.id) {
                        const analysisId = selectedEvent.id;
                        const token = Cookies.get('authToken');
                        if (!token) {
                          console.error('Токен авторизации отсутствует');
                          return;
                        }
                        fetch(`http://localhost:5001/api/analysis/file/${analysisId}`, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        })
                          .then((response) => {
                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.blob();
                          })
                          .then((blob) => {
                            const url = window.URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          })
                          .catch((error) => {
                            console.error('Ошибка при загрузке файла:', error);
                            alert('Не удалось открыть файл. Проверьте авторизацию или обратитесь к администратору.');
                          });
                      }
                    }}
                    style={{ color: '#0b7c89', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Открыть файл
                  </a>
                ) : (
                  'Файл отсутствует'
                )}
              </p>
            )}
          </div>
        )}
        {selectedEvent?.extendedProps.type === 'analysis' ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', width: '100%' }}>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #dc3545',
                backgroundColor: '#dc3545',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
                flex: '1',
                maxWidth: '150px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c82333';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={handleDeleteEvent}
            >
              Удалить
            </button>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
                flex: '1',
                maxWidth: '150px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeEventModal}
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', width: '100%' }}>
              <button
                style={{
                  borderRadius: '20px',
                  border: '1px solid #6eb2bada',
                  backgroundColor: '#0b7c89ae',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '12px 0',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'transform 80ms ease-in',
                  flex: '1',
                  maxWidth: '150px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b7c89';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b7c89ae';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                type="button"
                onClick={handleEditEvent}
              >
                Изменить
              </button>
              <button
                style={{
                  borderRadius: '20px',
                  border: '1px solid #dc3545',
                  backgroundColor: '#dc3545',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '12px 0',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'transform 80ms ease-in',
                  flex: '1',
                  maxWidth: '150px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                type="button"
                onClick={handleDeleteEvent}
              >
                Удалить
              </button>
            </div>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
                width: '100%',
                maxWidth: '315px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeEventModal}
            >
              Закрыть
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isUpdateSymptomEventModalOpen}
        onRequestClose={closeUpdateSymptomEventModal}
        contentLabel="Update Symptom Event Modal"
        style={{
          content: {
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Редактирование симптома
        </h2>
        <form onSubmit={handleSaveSymptomEdit}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Название симптома:
            </label>
            <Select
              value={symptomOptions.find((option: Option) => option.value === selectedSymptom)}
              onChange={handleSymptomChange}
              options={symptomOptions}
              placeholder="Выберите симптом"
              isSearchable
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: '#eee',
                  padding: '5px',
                  fontSize: '16px',
                }),
                menu: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                }),
              }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Время симптома:
            </label>
            <input
              type="time"
              value={symptomTime}
              onChange={handleSymptomTimeChange}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Тяжесть симптома:
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((sev) => (
                <button
                  type="button"
                  key={sev}
                  className={`severity-button ${severity === sev ? 'selected' : ''}`}
                  onClick={() => handleSeverityChange(sev)}
                  style={{
                    backgroundColor: severity === sev ? '#0b7c89ae' : '#eee',
                    color: severity === sev ? '#ffffff' : '#555',
                    border: '1px solid #6eb2bada',
                    borderRadius: '7px',
                    padding: '10px 15px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (severity !== sev) e.currentTarget.style.backgroundColor = '#ddd';
                  }}
                  onMouseLeave={(e) => {
                    if (severity !== sev) e.currentTarget.style.backgroundColor = '#eee';
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeUpdateSymptomEventModal}
            >
              Закрыть
            </button>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #6eb2bada',
                backgroundColor: '#0b7c89ae',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89ae';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="submit"
            >
              Сохранить
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUpdateMedicalEventModalOpen}
        onRequestClose={closeUpdateMedicalEventModal}
        contentLabel="Update Medical Event Modal"
        style={{
          content: {
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Редактирование лекарства
        </h2>
        <form onSubmit={handleSaveMedicalEdit}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Название лекарства:
            </label>
            <Select
              value={medicationOptions.find((option: Option) => option.value === selectedMedication)}
              onChange={handleMedicationChange}
              options={medicationOptions}
              placeholder="Выберите лекарство"
              isSearchable
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: '#eee',
                  padding: '5px',
                  fontSize: '16px',
                }),
                menu: (provided) => ({
                  ...provided,
                  borderRadius: '7px',
                }),
              }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Время приема:
            </label>
            <input
              type="time"
              value={medicationTime}
              onChange={handleMedicationTimeChange}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Количество (шт) (необязательно):
            </label>
            <input
              type="number"
              value={quantity ?? ''}
              onChange={handleQuantityChange}
              placeholder="Количество"
              min="0"
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Дозировка (мг) (необязательно):
            </label>
            <input
              type="number"
              value={dosage ?? ''}
              onChange={handleDosageChange}
              placeholder="Дозировка"
              min="0"
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeUpdateMedicalEventModal}
            >
              Закрыть
            </button>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #6eb2bada',
                backgroundColor: '#0b7c89ae',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89ae';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="submit"
            >
              Сохранить
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAnalysisModalOpen}
        onRequestClose={closeAnalysisModal}
        contentLabel="Input Analysis Data Modal"
        style={{
          content: {
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            minHeight: 'auto',
            textAlign: 'center',
            position: 'static',
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#333',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Введите данные для анализа
        </h2>
        <form onSubmit={handleSaveAnalysis}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Название анализа:
            </label>
            <input
              type="text"
              value={analysisTitle}
              onChange={handleAnalysisTitleChange}
              placeholder="Введите название анализа"
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '16px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
              Выберите файл:
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleAnalysisFileChange}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '7px', border: 'none', backgroundColor: '#eee', fontSize: '16px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #ff4b2b',
                backgroundColor: '#ff4b2b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6391a';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff4b2b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="button"
              onClick={closeAnalysisModal}
            >
              Закрыть
            </button>
            <button
              style={{
                borderRadius: '20px',
                border: '1px solid #6eb2bada',
                backgroundColor: '#0b7c89ae',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '12px 45px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'transform 80ms ease-in',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0b7c89ae';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              type="submit"
            >
              Сохранить
            </button>
          </div>
        </form>
      </Modal>

      <style>
{`
  @media (max-width: 768px) {
    .demo-app {
      flex-direction: column;
      padding: 0;
      min-height: 100vh;
    }

    .demo-app-main {
      padding: 1em;
      width: 100%;
      box-sizing: border-box;
    }

    .fc {
      font-size: 12px;
    }

    .fc .fc-toolbar {
      flex-direction: column;
      gap: 10px;
      padding: 10px;
    }

    .fc .fc-toolbar-title {
      font-size: 16px;
    }

    .fc .fc-button {
      font-size: 12px;
      padding: 6px 10px;
    }

    .fc .fc-daygrid-day {
      padding: 2px;
      min-width: 48px;
    }

    .fc .fc-daygrid-body {
      width: 100%;
      min-width: 336px;
    }

    .fc .fc-daygrid-day-number {
      font-size: 10px;
    }

    .fc .fc-event {
      font-size: 10px;
      padding: 2px;
      line-height: 1.2;
    }

    .filter-modal {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: 100% !important;
      height: 100vh !important;
      border-radius: 0 !important;
      padding: 20px !important;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .filter-modal h4 {
      font-size: 18px;
    }

    .filter-modal label {
      font-size: 14px;
    }

    .filter-modal button {
      font-size: 12px;
      padding: 8px 12px;
    }

    .fc-daygrid-event-dot {
      display: none;
    }

    .modal-content {
      width: 90% !important;
      max-width: 320px !important;
      padding: 15px !important;
      min-height: unset !important;
    }

    .modal-content h2 {
      font-size: 18px !important;
      margin-bottom: 10px !important;
    }

    .modal-content p,
    .modal-content label {
      font-size: 14px !important;
    }

    .modal-content input,
    .modal-content select {
      font-size: 14px !important;
      padding: 8px !important;
    }

    .modal-content button {
      font-size: 10px !important;
      padding: 8px 20px !important;
      border-radius: 15px !important;
    }

    .modal-content .severity-button {
      padding: 6px 10px !important;
      font-size: 12px !important;
    }

    .modal-content > div[style*="display: flex"] {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .modal-content > div[style*="display: flex"] > button {
      width: 100% !important;
      max-width: unset !important;
    }

    .modal-content .react-select__control {
      font-size: 14px !important;
      padding: 4px !important;
    }

    .modal-content .react-select__menu {
      font-size: 14px !important;
    }

    .modal-content[aria-label="Add New Symptom Modal"] {
      width: 90% !important;
      max-width: 300px !important;
      padding: 15px !important;
    }

    .modal-content[aria-label="Add New Symptom Modal"] input {
      font-size: 14px !important;
      padding: 8px !important;
    }

    .modal-content[aria-label="Add New Symptom Modal"] button {
      font-size: 12px !important;
      padding: 8px 16px !important;
    }

    .fc .fc-daygrid-more-link {
      font-size: 10px;
    }

    .modal-content {
      max-height: 80vh !important;
      overflow-y: auto !important;
    }
  }

  @media (max-width: 480px) {
    .fc .fc-toolbar-title {
      font-size: 14px;
    }

    .fc .fc-button {
      font-size: 10px;
      padding: 5px 8px;
    }

    .modal-content h2 {
      font-size: 16px !important;
    }

    .modal-content p,
    .modal-content label {
      fontSize: '12px !important;
    }

    .modal-content button {
      font-size: 9px !important;
      padding: 6px 16px !important;
    }
  }
`}
      </style>
    </div>
  );
};

export default Calendar;