import React, { useState, useEffect } from 'react';

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    description: '',
  });
  const token = localStorage.getItem('token');

  // Load birthdays from API on component mount
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/all-employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const employees = data.employees || [];
          const birthdayEvents = [];

          console.log('Employees fetched:', employees);

          employees.forEach(person => {
            if (person.birthdate) {
              const birthDate = new Date(person.birthdate);
              birthdayEvents.push({
                id: `birthday-${person._id}`,
                date: birthDate.getDate(),
                month: birthDate.getMonth(),
                year: birthDate.getFullYear(),
                title: `🎂 ${person.firstName} ${person.lastName}'s Birthday`,
                time: '',
                description: `Birthday of ${person.firstName} ${person.lastName}`,
                isBirthday: true,
                isRecurring: true,
              });
            }
          });

          console.log('Birthday events:', birthdayEvents);
          setEvents(birthdayEvents);
        } else {
          console.error('Failed to fetch employees:', response.status);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching birthdays:', error);
        setEvents([]);
      }
    };

    if (token) {
      fetchBirthdays();
    }
  }, [token]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEvent = (day) => {
    setSelectedDate(day);
    setShowEventForm(true);
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    const newEvent = {
      id: Date.now(),
      date: selectedDate,
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
      ...formData,
    };
    setEvents([...events, newEvent]);
    setFormData({
      title: '',
      time: '',
      description: '',
    });
    setShowEventForm(false);
    setSelectedDate(null);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getEventsForDate = (day) => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    const dateEvents = events.filter(event => {
      const eventDay = event.date === day;
      const eventMonth = event.month === currentMonthIndex;
      
      // For recurring birthdays, check only month and day
      if (event.isRecurring) {
        return eventDay && eventMonth;
      }
      
      // For regular events, check year as well
      return eventDay && eventMonth && event.year === currentYear;
    });

    return dateEvents;
  };

  return (
    <div className="calendar-section">
      <div className="section-header">
        <h2>Calendar</h2>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={previousMonth} className="nav-btn">&lt;</button>
          <h3>{monthName}</h3>
          <button onClick={nextMonth} className="nav-btn">&gt;</button>
        </div>

        <div className="calendar-grid">
          <div className="weekdays">
            <div className="weekday">Sun</div>
            <div className="weekday">Mon</div>
            <div className="weekday">Tue</div>
            <div className="weekday">Wed</div>
            <div className="weekday">Thu</div>
            <div className="weekday">Fri</div>
            <div className="weekday">Sat</div>
          </div>

          <div className="days">
            {days.map((day, index) => (
              <div
                key={index}
                className={`day ${day ? 'active' : 'empty'}`}
                onClick={() => day && handleAddEvent(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    <div className="day-events">
                      {getEventsForDate(day).map(event => (
                        <div key={event.id} className="event-dot">•</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEventForm && (
        <div className="event-form-container">
          <form onSubmit={handleSubmitEvent} className="event-form">
            <h4>Add Event for {selectedDate}</h4>

            <div className="form-group">
              <label htmlFor="title">Event Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter event description"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">Add Event</button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowEventForm(false);
                  setSelectedDate(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="upcoming-events">
        <h3>Upcoming Events</h3>
        {events.length > 0 ? (
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-date">
                  {event.date}/{event.month + 1}
                </div>
                <div className="event-details">
                  <h5>{event.title}</h5>
                  {event.time && <p className="event-time">⏰ {event.time}</p>}
                  {event.description && <p className="event-desc">{event.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No events scheduled. Click on a date to add one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
