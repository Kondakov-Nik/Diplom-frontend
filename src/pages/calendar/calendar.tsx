import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { formatDate } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventApi, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import Modal from 'react-modal'; // Подключаем react-modal
import { INITIAL_EVENTS, createEventId } from './event-utils';
import './calendar.module.scss'; // Для стилей календаря
import ruLocale from '@fullcalendar/core/locales/ru';
import Select from 'react-select'; // Импортируем react-select

interface DemoAppState {
  weekendsVisible: boolean;
  currentEvents: EventApi[];
  isModalOpen: boolean;
  isSecondModalOpen: boolean;
  isMedicationModalOpen: boolean; // Состояние для модального окна лекарства
  selectedDate: DateSelectArg | null;
  selectedType: 'symptom' | 'medication' | null;
  selectedSymptom: string | null;
  selectedMedication: string | null; // Для хранения выбранного лекарства
  severity: number | null; // Для хранения тяжести симптома
  quantity: number | null; // Для хранения количества лекарства
  dosage: number | null; // Для хранения дозировки лекарства
}

export default class DemoApp extends React.Component<{}, DemoAppState> {
  state: DemoAppState = {
    weekendsVisible: true,
    currentEvents: [],
    isModalOpen: false,
    isSecondModalOpen: false,
    isMedicationModalOpen: false, // Изначально окно для лекарства скрыто
    selectedDate: null,
    selectedType: null,
    selectedSymptom: null,
    selectedMedication: null,
    severity: null,
    quantity: null,
    dosage: null,
  };

  // Настройка контейнера для модального окна
  componentDidMount() {
    Modal.setAppElement('#root');
  }

  render() {
    // Пример симптомов и лекарств, которые можно потом подтянуть из БД
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
            weekends={this.state.weekendsVisible}
            initialEvents={INITIAL_EVENTS}
            select={this.handleDateSelect}
            eventClick={this.handleEventClick}
            eventsSet={this.handleEvents}
            locale={ruLocale}
            firstDay={1}
          />
        </div>

        {/* Первое модальное окно: выбор симптома или лекарства */}
        <Modal
          isOpen={this.state.isModalOpen}
          onRequestClose={this.closeModal}
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
            <button onClick={() => this.handleTypeSelect('symptom')}>Симптом</button>
            <button onClick={() => this.handleTypeSelect('medication')}>Лекарство</button>
          </div>
        </Modal>

        {/* Модальное окно для симптома */}
        <Modal
          isOpen={this.state.isSecondModalOpen}
          onRequestClose={this.closeSecondModal}
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
          <form onSubmit={this.handleSaveEvent}>
            <div>
              <label>Название симптома:</label>
              <Select
                value={symptomOptions.find(option => option.value === this.state.selectedSymptom)}
                onChange={this.handleSymptomChange}
                options={symptomOptions}
                placeholder="Выберите симптом"
                isSearchable
              />
            </div>

            <div>
              <label>Тяжесть симптома:</label>
              <div>
                {[1, 2, 3, 4, 5].map((severity) => (
                  <button
                    type="button"
                    key={severity}
                    className={`severity-button ${this.state.severity === severity ? 'selected' : ''}`}
                    onClick={() => this.handleSeverityChange(severity)}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button type="button" onClick={this.closeSecondModal}>
                Закрыть
              </button>
              <button type="submit">Сохранить</button>
            </div>
          </form>
        </Modal>

        {/* Модальное окно для лекарства */}
        <Modal
          isOpen={this.state.isMedicationModalOpen}
          onRequestClose={this.closeMedicationModal}
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
          <form onSubmit={this.handleSaveMedication}>
            <div>
              <label>Название лекарства:</label>
              <Select
                value={medicationOptions.find(option => option.value === this.state.selectedMedication)}
                onChange={this.handleMedicationChange}
                options={medicationOptions}
                placeholder="Выберите лекарство"
                isSearchable
              />
            </div>

            <div>
              <label>Количество (шт):</label>
              <input
                type="number"
                value={this.state.quantity || ''}
                onChange={this.handleQuantityChange}
                placeholder="Количество"
                min="1"
              />
            </div>

            <div>
              <label>Дозировка (мг):</label>
              <input
                type="number"
                value={this.state.dosage || ''}
                onChange={this.handleDosageChange}
                placeholder="Дозировка"
                min="1"
              />
            </div>

            <div>
              <button type="button" onClick={this.closeMedicationModal}>
                Закрыть
              </button>
              <button type="submit">Сохранить</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  handleDateSelect = (selectInfo: DateSelectArg) => {
    this.setState({
      isModalOpen: true,
      selectedDate: selectInfo,
    });
  };

  handleTypeSelect = (type: 'symptom' | 'medication') => {
    this.setState({
      selectedType: type,
      isModalOpen: false,
      isMedicationModalOpen: type === 'medication',
      isSecondModalOpen: type === 'symptom',
    });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false, selectedDate: null });
  };

  closeSecondModal = () => {
    this.setState({ isSecondModalOpen: false, selectedSymptom: null, severity: null });
  };

  closeMedicationModal = () => {
    this.setState({
      isMedicationModalOpen: false,
      selectedMedication: null,
      quantity: null,
      dosage: null,
    });
  };

  handleSymptomChange = (selectedOption: any) => {
    this.setState({ selectedSymptom: selectedOption.value });
  };

  handleMedicationChange = (selectedOption: any) => {
    this.setState({ selectedMedication: selectedOption.value });
  };

  handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ quantity: Number(event.target.value) });
  };

  handleDosageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ dosage: Number(event.target.value) });
  };

  handleSeverityChange = (severity: number) => {
    this.setState({ severity });
  };

  handleSaveEvent = (event: React.FormEvent) => {
    event.preventDefault();
    const { selectedDate, selectedSymptom, severity } = this.state;
    if (selectedDate && selectedSymptom && severity !== null) {
      let calendarApi = selectedDate.view.calendar;
      calendarApi.addEvent({
        id: createEventId(),
        title: `Симптом: ${selectedSymptom} - Тяжесть: ${severity}`,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: selectedDate.allDay,
      });
      this.closeSecondModal();
    }
  };

  handleSaveMedication = (event: React.FormEvent) => {
    event.preventDefault();
    const { selectedDate, selectedMedication, quantity, dosage } = this.state;
    if (selectedDate && selectedMedication && quantity && dosage !== null) {
      let calendarApi = selectedDate.view.calendar;
      calendarApi.addEvent({
        id: createEventId(),
        title: `Лекарство: ${selectedMedication} - Количество: ${quantity} - Дозировка: ${dosage} мг`,
        start: selectedDate.startStr,
        end: selectedDate.endStr,
        allDay: selectedDate.allDay,
      });
      this.closeMedicationModal();
    }
  };

  handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Вы уверены, что хотите удалить событие '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  };

  handleEvents = (events: EventApi[]) => {
    this.setState({
      currentEvents: events,
    });
  };
}
