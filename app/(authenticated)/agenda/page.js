'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  Calendar as CalendarIcon, List, Filter, Plus, Trash2, 
  Clock, MapPin, User, Check, AlertCircle, ShieldAlert 
} from 'lucide-react';

export default function CalendarPage() {
  const { user, showToast } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Started in July 2026 for PRD compatibility
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('todos'); // 'todos', 'mentoria', 'atualizacao'
  
  // Modal creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('mentoria');
  const [newStartTime, setNewStartTime] = useState('19:00');
  const [newEndTime, setNewEndTime] = useState('20:30');
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorRole, setNewMentorRole] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newZoomLink, setNewZoomLink] = useState('');

  // Delete modal confirmation states
  const [eventToDelete, setEventToDelete] = useState(null);

  // Sync state
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/db?collection=events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isUserAuthorizedToManage = user?.member_type === 'admin' || user?.member_type === 'master';

  // Format date helper to YYYY-MM-DD
  const formatDateString = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Google Calendar link builder
  const getGoogleCalendarLink = (event) => {
    const cleanDate = event.event_date.replace(/-/g, '');
    const cleanStart = event.start_time.replace(/:/g, '').substring(0, 4) + '00';
    const cleanEnd = event.end_time.replace(/:/g, '').substring(0, 4) + '00';
    
    const dates = `${cleanDate}T${cleanStart}/${cleanDate}T${cleanEnd}`;
    
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.topic || ''}\n\nMentor: ${event.mentor_name || 'N/A'}\nPauta: ${event.topic || 'Reunião do Clube'}\nLink do Zoom: ${event.zoom_link || ''}`
    );
    const location = encodeURIComponent(event.zoom_link || 'Zoom Meeting');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=America/Sao_Paulo`;
  };

  const handleSimulateSync = () => {
    setIsSynced(true);
    showToast('Conta Google vinculada! Sincronizando agenda...', 'success');
  };

  const handleOpenCreateModal = (day) => {
    if (!isUserAuthorizedToManage) return;
    const formatted = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDayStr(formatted);
    
    // Autofill defaults
    setNewTitle('');
    setNewMentorName(user.name);
    setNewMentorRole(user.role || '');
    setNewTopic('');
    setNewZoomLink('https://zoom.us/j/999888777666');
    
    setShowCreateModal(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const newEvent = {
        title: newTitle,
        event_type: newType,
        event_date: selectedDayStr,
        start_time: newStartTime + ':00',
        end_time: newEndTime + ':00',
        mentor_name: newMentorName,
        mentor_role: newMentorRole,
        mentor_avatar: user.img || '',
        mentor_bio: '',
        topic: newTopic,
        zoom_link: newZoomLink
      };

      // 1. Save Event
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'events',
          document: newEvent
        })
      });

      if (res.ok) {
        const savedEvent = await res.json();
        setEvents(prev => [...prev, savedEvent]);
        showToast('Evento agendado com sucesso!', 'success');
        setShowCreateModal(false);

        // 2. Insere notificação global (user_id = null)
        const newNotif = {
          user_id: null,
          title: newType === 'mentoria' ? 'Nova Mentoria Coletiva' : 'Nova Reunião de Atualização',
          description: `${newTitle} no dia ${new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR')}`,
          type: newType,
          link: '/agenda',
          is_read: false
        };

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            collection: 'notifications',
            document: newNotif
          })
        });
      }
    } catch (err) {
      showToast('Falha ao registrar evento.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          collection: 'events',
          id: eventToDelete.id
        })
      });
      if (res.ok) {
        setEvents(prev => prev.filter(x => x.id !== eventToDelete.id));
        showToast('Evento removido do calendário.', 'success');
      }
    } catch (e) {
      showToast('Erro ao remover evento.', 'error');
    }
    setEventToDelete(null);
  };

  // Monthly logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  // Filters logic
  const filteredEvents = events.filter(e => {
    if (filterType !== 'todos' && e.event_type !== filterType) return false;
    return true;
  });

  return (
    <div className="calendar-wrapper">
      <div className="title-section fade-in">
        <div className="title-row">
          <div>
            <span className="welcome-tag">ENCONTROS DA COMUNIDADE</span>
            <h1>Calendário de Eventos</h1>
          </div>
          
          <div className="sync-block">
            <button 
              onClick={handleSimulateSync} 
              className={`btn-outline ${isSynced ? 'synced' : ''}`}
              disabled={isSynced}
            >
              {isSynced ? '✓ Sincronizado com Google' : 'Sincronizar Google Calendar'}
            </button>
          </div>
        </div>
      </div>

      {/* Control Filters and views */}
      <section className="control-bar glass-panel fade-in">
        <div className="filter-group">
          <button 
            onClick={() => setFilterType('todos')} 
            className={`filter-btn ${filterType === 'todos' ? 'active' : ''}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('mentoria')} 
            className={`filter-btn ${filterType === 'mentoria' ? 'active' : ''}`}
          >
            <span className="dot mentoria-dot"></span> Mentorias
          </button>
          <button 
            onClick={() => setFilterType('atualizacao')} 
            className={`filter-btn ${filterType === 'atualizacao' ? 'active' : ''}`}
          >
            <span className="dot atualizacao-dot"></span> Atualizações
          </button>
        </div>

        <div className="view-toggle-group">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <CalendarIcon size={16} /> Grid
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          >
            <List size={16} /> Lista
          </button>
        </div>
      </section>

      {/* Calendar body renderer */}
      {viewMode === 'grid' ? (
        <div className="grid-view glass-panel fade-in">
          {/* Month selector navigation header */}
          <div className="month-selector">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>« Anterior</button>
            <h2>{monthName.toUpperCase()}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>Próximo »</button>
          </div>

          <div className="calendar-grid">
            {/* Week labels */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(w => (
              <div key={w} className="week-label">{w}</div>
            ))}

            {/* Days block */}
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="day-cell empty"></div>;
              }

              const dateStr = formatDateString(year, month, day);
              const cellEvents = filteredEvents.filter(e => e.event_date === dateStr);

              return (
                <div 
                  key={`day-${day}`} 
                  className={`day-cell ${isUserAuthorizedToManage ? 'authorized' : ''}`}
                  onClick={() => handleOpenCreateModal(day)}
                >
                  <span className="day-number">{day}</span>
                  
                  <div className="day-events-list">
                    {cellEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        className={`mini-event-pill type-${ev.event_type}`}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent modal opening
                          // Trigger direct display or alert of details
                          showToast(`${ev.title} (${ev.start_time.substring(0, 5)})`, 'info');
                        }}
                      >
                        {ev.title.substring(0, 15)}...
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Mode View */
        <div className="list-view-container fade-in">
          {filteredEvents.length === 0 ? (
            <div className="glass-panel empty-list">Nenhum evento agendado correspondente.</div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
              .map(ev => (
                <div key={ev.id} className={`list-event-card glass-panel type-${ev.event_type}`}>
                  <div className="event-date-side">
                    <span className="day">{ev.event_date.split('-')[2]}</span>
                    <span className="month">
                      {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>

                  <div className="event-main-details">
                    <span className="type-badge">{ev.event_type === 'mentoria' ? 'Mentoria Prática' : 'Atualização de Obras'}</span>
                    <h2>{ev.title}</h2>
                    <p className="topic">{ev.topic}</p>
                    
                    <div className="event-meta-footer">
                      <span><Clock size={12} /> {ev.start_time.substring(0, 5)} - {ev.end_time.substring(0, 5)}</span>
                      <span><User size={12} /> Mentor: {ev.mentor_name}</span>
                      {ev.zoom_link && (
                        <span>
                          <MapPin size={12} /> <a href={ev.zoom_link} target="_blank" rel="noopener noreferrer">Acessar Sala Virtual</a>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="event-actions-side">
                    <a 
                      href={getGoogleCalendarLink(ev)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-gold add-to-calendar-btn"
                    >
                      Adicionar ao Google Calendar
                    </a>
                    {isUserAuthorizedToManage && (
                      <button onClick={() => setEventToDelete(ev)} className="btn-danger-icon" title="Excluir evento">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Creation Modal Form (Mentor / Admin) */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Criar Novo Encontro</h2>
            <p className="modal-sub">Agendando para: <strong>{new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></p>

            <form onSubmit={handleCreateEvent} className="modal-form">
              <div className="input-group">
                <label className="premium-label">Título do Encontro</label>
                <input 
                  type="text" 
                  className="premium-input" 
                  placeholder="Ex: Mentoria sobre captação de recursos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Tipo de Evento</label>
                  <select 
                    className="premium-input select-input" 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="mentoria">Mentoria Coletiva</option>
                    <option value="atualizacao">Atualização de Obras</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="premium-label">Sala Virtual (Zoom/Meet)</label>
                  <input 
                    type="url" 
                    className="premium-input" 
                    value={newZoomLink}
                    onChange={(e) => setNewZoomLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Hora Início</label>
                  <input 
                    type="time" 
                    className="premium-input" 
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="premium-label">Hora Fim</label>
                  <input 
                    type="time" 
                    className="premium-input" 
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Nome do Mentor</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    value={newMentorName}
                    onChange={(e) => setNewMentorName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="premium-label">Cargo do Mentor</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    value={newMentorRole}
                    onChange={(e) => setNewMentorRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="premium-label">Pauta / Tópico</label>
                <textarea 
                  className="premium-input textarea-input" 
                  placeholder="Descreva a pauta do encontro..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-gold">
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation custom delete modal */}
      {eventToDelete && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card confirmation-card fade-in">
            <div className="warning-icon"><ShieldAlert size={28} /></div>
            <h2>Remover Evento</h2>
            <p>Tem certeza que deseja excluir o evento <strong>{eventToDelete.title}</strong>?</p>
            <p className="alert-notice">Esta ação é permanente e irá remover o encontro da agenda de todos os membros.</p>

            <div className="modal-actions">
              <button onClick={() => setEventToDelete(null)} className="btn-outline">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="btn-danger">
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .welcome-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
        }
        .title-section h1 {
          font-size: 32px;
        }
        .synced {
          background: rgba(16, 185, 129, 0.08);
          border-color: #10B981;
          color: #10B981;
        }
        
        .control-bar {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        .filter-group {
          display: flex;
          gap: 10px;
        }
        .filter-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }
        .filter-btn.active {
          background: rgba(237, 192, 102, 0.08);
          border-color: var(--gold);
          color: var(--gold);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .mentoria-dot { background: var(--gold); }
        .atualizacao-dot { background: #3B82F6; }

        .view-toggle-group {
          display: flex;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition-smooth);
        }
        .toggle-btn.active {
          background: var(--gold);
          color: #010105;
          font-weight: 600;
        }

        .grid-view {
          padding: 24px;
        }
        .month-selector {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .month-selector button {
          background: transparent;
          border: none;
          color: var(--gold);
          font-family: var(--font-title);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .month-selector h2 {
          font-size: 18px;
          letter-spacing: 0.1em;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .week-label {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          padding: 8px 0;
        }
        .day-cell {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-light);
          min-height: 100px;
          border-radius: var(--radius-sm);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: var(--transition-smooth);
        }
        .day-cell.empty {
          background: transparent;
          border-color: transparent;
        }
        .day-cell.authorized {
          cursor: pointer;
        }
        .day-cell.authorized:hover {
          border-color: rgba(237, 192, 102, 0.2);
          background: rgba(237, 192, 102, 0.02);
        }
        .day-number {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .day-events-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          overflow: hidden;
        }
        .mini-event-pill {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          border-left: 2px solid;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mini-event-pill.type-mentoria {
          background: rgba(237, 192, 102, 0.1);
          border-left-color: var(--gold);
          color: var(--gold);
        }
        .mini-event-pill.type-atualizacao {
          background: rgba(59, 130, 246, 0.1);
          border-left-color: #3B82F6;
          color: #93c5fd;
        }

        .list-view-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .list-event-card {
          padding: 24px;
          display: flex;
          gap: 24px;
          border-left: 4px solid;
        }
        .list-event-card.type-mentoria { border-left-color: var(--gold); }
        .list-event-card.type-atualizacao { border-left-color: #3B82F6; }
        
        .event-date-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .event-date-side .day {
          font-size: 20px;
          font-weight: 700;
        }
        .event-date-side .month {
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .event-main-details {
          flex: 1;
        }
        .type-badge {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
          display: block;
        }
        .list-event-card.type-atualizacao .type-badge {
          color: #3B82F6;
        }
        .event-main-details h2 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .topic {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .event-meta-footer {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .event-meta-footer span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .event-actions-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
        }
        .btn-danger-icon {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: var(--transition-smooth);
        }
        .btn-danger-icon:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(1, 1, 5, 0.8);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          width: 100%;
          max-width: 580px;
          padding: 30px;
          background: #080811;
        }
        .modal-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
          margin-bottom: 20px;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .select-input, .textarea-input {
          width: 100%;
        }
        .select-input option {
          background: #080811;
          color: white;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .confirmation-card {
          max-width: 420px;
          text-align: center;
        }
        .warning-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          margin-bottom: 16px;
        }
        .alert-notice {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .empty-list {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
