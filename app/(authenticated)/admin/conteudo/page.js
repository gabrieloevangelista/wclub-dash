'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  Plus, Edit, Trash2, GripVertical, ChevronDown, 
  ChevronUp, Eye, EyeOff, Save, X, Layers, BookOpen, FilePlus 
} from 'lucide-react';

export default function AdminContentPage() {
  const { showToast } = useAuth();
  
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Expanded state for modules in admin list
  const [expandedModules, setExpandedModules] = useState({});

  // Inline renaming states
  const [editingId, setEditingId] = useState(null); // ID of module or lesson being renamed
  const [editingText, setEditingText] = useState('');

  // Drag and Drop states
  const [isDraggingLesson, setIsDraggingLesson] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null); // { id, type, parentId }

  // Creation Modals states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // Forms states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCover, setCourseCover] = useState('');
  
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleCover, setModuleCover] = useState('');
  const [moduleSchedule, setModuleSchedule] = useState('');

  const [lessTitle, setLessTitle] = useState('');
  const [lessDesc, setLessDesc] = useState('');
  const [lessLongDesc, setLessLongDesc] = useState('');
  const [lessDuration, setLessDuration] = useState('15 min');
  const [lessVideo, setLessVideo] = useState('');
  const [lessCover, setLessCover] = useState('');
  const [lessInstructor, setLessInstructor] = useState('');
  const [lessInstructorRole, setLessInstructorRole] = useState('');
  const [lessSchedule, setLessSchedule] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, mRes, lRes] = await Promise.all([
        fetch('/api/db?collection=courses'),
        fetch('/api/db?collection=modules'),
        fetch('/api/db?collection=lessons')
      ]);

      if (cRes.ok && mRes.ok && lRes.ok) {
        const coursesData = await cRes.json();
        const modulesData = await mRes.json();
        const lessonsData = await lRes.json();

        setCourses(coursesData);
        setModules(modulesData);
        setLessons(lessonsData);

        if (coursesData.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesData[0].id);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // Expand / Collapse modules helper
  const toggleModule = (id) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Inline Rename trigger
  const handleStartRename = (id, currentTitle) => {
    setEditingId(id);
    setEditingText(currentTitle);
  };

  const handleSaveRename = async (id, type) => {
    if (!editingText.trim()) return;
    setEditingId(null);

    const collection = type === 'module' ? 'modules' : 'lessons';
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection,
          id,
          updates: { title: editingText.trim() }
        })
      });

      if (res.ok) {
        showToast('Título atualizado inline.', 'success');
        if (type === 'module') {
          setModules(prev => prev.map(m => m.id === id ? { ...m, title: editingText.trim() } : m));
        } else {
          setLessons(prev => prev.map(l => l.id === id ? { ...l, title: editingText.trim() } : l));
        }
      }
    } catch (e) {
      showToast('Erro ao renomear item.', 'error');
    }
  };

  // CRUD Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle) return;

    try {
      const newCourse = {
        title: courseTitle,
        description: courseDesc,
        cover_image_url: courseCover || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
        status: 'rascunho',
        sequence_order: courses.length + 1,
        slug: courseTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'courses',
          document: newCourse
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setCourses(prev => [...prev, saved]);
        setSelectedCourseId(saved.id);
        showToast('Masterclass criada em rascunho!', 'success');
        setShowCourseModal(false);
      }
    } catch (err) {
      showToast('Erro ao criar curso.', 'error');
    }
  };

  // CRUD Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle || !selectedCourseId) return;

    try {
      const newMod = {
        course_id: selectedCourseId,
        title: moduleTitle,
        description: moduleDesc,
        cover_image_url: moduleCover || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600',
        status: 'published',
        sequence_order: modules.filter(m => m.course_id === selectedCourseId).length + 1,
        slug: moduleTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        scheduled_at: moduleSchedule ? new Date(moduleSchedule).toISOString() : null
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'modules',
          document: newMod
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setModules(prev => [...prev, saved]);
        showToast('Módulo adicionado ao curso.', 'success');
        setShowModuleModal(false);
      }
    } catch (e) {
      showToast('Erro ao criar módulo.', 'error');
    }
  };

  // CRUD Lesson
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!lessTitle || !selectedModuleId) return;

    try {
      const newLes = {
        module_id: selectedModuleId,
        title: lessTitle,
        description: lessDesc,
        long_description: lessLongDesc,
        duration: lessDuration,
        video_url: lessVideo || 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: lessCover || 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=600',
        cover_image_url: lessCover || 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80&w=600',
        instructor_name: lessInstructor || 'Dr. Carlos Lima',
        instructor_role: lessInstructorRole || 'Mentor WHITECLUB',
        instructor_avatar: '',
        status: 'published',
        sequence_order: lessons.filter(l => l.module_id === selectedModuleId).length + 1,
        slug: lessTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        scheduled_at: lessSchedule ? new Date(lessSchedule).toISOString() : null
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'lessons',
          document: newLes
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setLessons(prev => [...prev, saved]);
        showToast('Aula cadastrada com sucesso!', 'success');
        setShowLessonModal(false);
      }
    } catch (e) {
      showToast('Erro ao criar aula.', 'error');
    }
  };

  const handleDeleteItem = async (id, collection) => {
    if (!confirm('Deseja realmente excluir este item?')) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          collection,
          id
        })
      });

      if (res.ok) {
        showToast('Item excluído com sucesso.', 'success');
        if (collection === 'courses') {
          setCourses(prev => prev.filter(x => x.id !== id));
        } else if (collection === 'modules') {
          setModules(prev => prev.filter(x => x.id !== id));
        } else {
          setLessons(prev => prev.filter(x => x.id !== id));
        }
      }
    } catch (err) {
      showToast('Erro ao excluir item.', 'error');
    }
  };

  // NATIVE DRAG AND DROP
  const handleDragStart = (e, item, type) => {
    if (type === 'lesson') {
      setIsDraggingLesson(true); // Desativa pointer-events / draggable do módulo
    }
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragEnd = () => {
    setIsDraggingLesson(false);
    setDraggedItem(null);
  };

  const handleDropModule = async (e, targetModule) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'module') return;
    if (draggedItem.id === targetModule.id) return;

    // Filter modules of active course
    const courseMods = [...modules].filter(m => m.course_id === selectedCourseId);
    
    const dragIdx = courseMods.findIndex(x => x.id === draggedItem.id);
    const targetIdx = courseMods.findIndex(x => x.id === targetModule.id);

    // Swap sequence orders
    const dragOrder = courseMods[dragIdx].sequence_order;
    const targetOrder = courseMods[targetIdx].sequence_order;

    courseMods[dragIdx].sequence_order = targetOrder;
    courseMods[targetIdx].sequence_order = dragOrder;

    // Mutate state locally first
    setModules(prev => prev.map(m => {
      if (m.id === draggedItem.id) return { ...m, sequence_order: targetOrder };
      if (m.id === targetModule.id) return { ...m, sequence_order: dragOrder };
      return m;
    }));

    // Update orders in DB
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          collection: 'modules',
          items: [
            { id: draggedItem.id, sequence_order: targetOrder },
            { id: targetModule.id, sequence_order: dragOrder }
          ]
        })
      });
      showToast('Ordenação de módulos atualizada.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropLesson = async (e, targetLesson, targetModuleId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'lesson') return;

    // If drop onto a blank module space targetLesson is null
    const destModuleId = targetModuleId;
    const isSameModule = draggedItem.module_id === destModuleId;

    if (isSameModule && targetLesson && draggedItem.id === targetLesson.id) return;

    let updatedLessons = [...lessons];

    if (isSameModule && targetLesson) {
      // Reorder within the same module
      const moduleLessons = updatedLessons.filter(l => l.module_id === destModuleId);
      const dragIdx = moduleLessons.findIndex(x => x.id === draggedItem.id);
      const targetIdx = moduleLessons.findIndex(x => x.id === targetLesson.id);

      const dragOrder = moduleLessons[dragIdx].sequence_order;
      const targetOrder = moduleLessons[targetIdx].sequence_order;

      updatedLessons = updatedLessons.map(l => {
        if (l.id === draggedItem.id) return { ...l, sequence_order: targetOrder };
        if (l.id === targetLesson.id) return { ...l, sequence_order: dragOrder };
        return l;
      });
      
      setLessons(updatedLessons);
      
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorderLessons',
          lessons: [
            { id: draggedItem.id, module_id: destModuleId, sequence_order: targetOrder },
            { id: targetLesson.id, module_id: destModuleId, sequence_order: dragOrder }
          ]
        })
      });

    } else {
      // Move to a different module, or to the end of a module list
      const targetModLessons = updatedLessons.filter(l => l.module_id === destModuleId);
      const newOrder = targetModLessons.length + 1;

      updatedLessons = updatedLessons.map(l => {
        if (l.id === draggedItem.id) {
          return { ...l, module_id: destModuleId, sequence_order: newOrder };
        }
        return l;
      });

      setLessons(updatedLessons);
      
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorderLessons',
          lessons: [
            { id: draggedItem.id, module_id: destModuleId, sequence_order: newOrder }
          ]
        })
      });
      showToast('Aula remanejada de módulo.', 'success');
    }
  };

  const handleToggleCourseStatus = async (course) => {
    const nextStatus = course.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'courses',
          id: course.id,
          updates: { status: nextStatus }
        })
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: nextStatus } : c));
        showToast(`Curso marcado como ${nextStatus}.`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter modules of selected course
  const activeCourseModules = modules
    .filter(m => m.course_id === selectedCourseId)
    .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));

  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="manager-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">PAINEL ADMINISTRATIVO</span>
        <h1>Gestão de Conteúdo</h1>
        <p className="subtitle">Crie novos módulos, arraste aulas para reorganização de grades ou renomeie elementos inline</p>
      </div>

      {/* Select course header */}
      <section className="course-select-bar glass-panel fade-in">
        <div className="select-left">
          <label className="premium-label">Selecione a Masterclass</label>
          <select 
            value={selectedCourseId} 
            onChange={(e) => setSelectedCourseId(e.target.value)} 
            className="premium-input select-box"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="actions-right">
          {activeCourse && (
            <button 
              onClick={() => handleToggleCourseStatus(activeCourse)} 
              className={`btn-outline ${activeCourse.status === 'publicado' ? 'pub-active' : ''}`}
            >
              {activeCourse.status === 'publicado' ? <Eye size={14} /> : <EyeOff size={14} />}
              {activeCourse.status === 'publicado' ? 'Publicado (Membros Enxergam)' : 'Rascunho (Privado)'}
            </button>
          )}

          <button onClick={() => setShowCourseModal(true)} className="btn-gold">
            <Plus size={16} /> Criar Curso
          </button>
        </div>
      </section>

      {/* Main Drag & Drop Zone */}
      <section className="drag-drop-zone fade-in">
        <div className="zone-header">
          <h2>Módulos e Grades ({activeCourseModules.length})</h2>
          <button onClick={() => setShowModuleModal(true)} className="btn-outline">
            <Plus size={14} /> Novo Módulo
          </button>
        </div>

        <div className="modules-draggable-list">
          {activeCourseModules.length === 0 ? (
            <div className="glass-panel empty-zone">Selecione ou crie um módulo para começar a organizar as pranchas.</div>
          ) : (
            activeCourseModules.map((mod, index) => {
              const modLessons = lessons
                .filter(l => l.module_id === mod.id)
                .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
              const isOpen = expandedModules[mod.id];

              return (
                <div 
                  key={mod.id} 
                  className="admin-module-card glass-panel"
                  draggable={!isDraggingLesson} // Resolve conflito de drag vertical (PRD 4.1)
                  onDragStart={(e) => handleDragStart(e, { ...mod, type: 'module' }, 'module')}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropModule(e, mod)}
                >
                  {/* Module Header Bar */}
                  <div className="module-header-row">
                    <div className="header-drag-info">
                      <GripVertical size={16} className="drag-handle-icon" />
                      
                      {/* Inline renaming check */}
                      {editingId === mod.id ? (
                        <input 
                          type="text" 
                          className="premium-input inline-input"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleSaveRename(mod.id, 'module')}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(mod.id, 'module') }}
                          autoFocus
                        />
                      ) : (
                        <h3 onDoubleClick={() => handleStartRename(mod.id, mod.title)}>
                          {mod.title} <span className="double-tip">(Clique duplo para renomear)</span>
                        </h3>
                      )}
                    </div>

                    <div className="header-controls">
                      <button 
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setShowLessonModal(true);
                        }} 
                        className="btn-link-action"
                        title="Adicionar Aula"
                      >
                        <FilePlus size={14} /> Aula
                      </button>
                      <button onClick={() => handleDeleteItem(mod.id, 'modules')} className="btn-link-action text-red" title="Excluir Módulo">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => toggleModule(mod.id)} className="btn-link-action">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Lessons Drag & Drop Nested Container */}
                  {isOpen && (
                    <div 
                      className="nested-lessons-container"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropLesson(e, null, mod.id)}
                    >
                      {modLessons.length === 0 ? (
                        <div className="empty-nested-lessons">Nenhuma aula. Arraste uma aula aqui ou clique em Adicionar.</div>
                      ) : (
                        modLessons.map((les) => (
                          <div 
                            key={les.id} 
                            className="admin-lesson-row glass-panel"
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...les, type: 'lesson' }, 'lesson')}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropLesson(e, les, mod.id)}
                          >
                            <GripVertical size={14} className="drag-handle-icon-small" />
                            
                            {editingId === les.id ? (
                              <input 
                                type="text" 
                                className="premium-input inline-input inline-lesson-input"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onBlur={() => handleSaveRename(les.id, 'lesson')}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(les.id, 'lesson') }}
                                autoFocus
                              />
                            ) : (
                              <span className="lesson-title" onDoubleClick={() => handleStartRename(les.id, les.title)}>
                                {les.title} <span className="double-tip">(Double-click rename)</span>
                              </span>
                            )}

                            <span className="lesson-dur">{les.duration}</span>
                            
                            <button onClick={() => handleDeleteItem(les.id, 'lessons')} className="btn-lesson-delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Creation Modal: Course */}
      {showCourseModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Criar Nova Masterclass</h2>
            <form onSubmit={handleCreateCourse} className="modal-form">
              <div className="input-group">
                <label className="premium-label">Título da Masterclass</label>
                <input type="text" className="premium-input" placeholder="Ex: Engenharia Avançada" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="premium-label">Descrição</label>
                <textarea className="premium-input textarea-input" placeholder="Fale sobre o conteúdo da masterclass..." value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} rows="3" />
              </div>
              <div className="input-group">
                <label className="premium-label">URL da imagem de capa</label>
                <input type="url" className="premium-input" placeholder="https://..." value={courseCover} onChange={(e) => setCourseCover(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCourseModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-gold">Criar Curso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Modal: Module */}
      {showModuleModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Adicionar Novo Módulo</h2>
            <form onSubmit={handleCreateModule} className="modal-form">
              <div className="input-group">
                <label className="premium-label">Título do Módulo</label>
                <input type="text" className="premium-input" placeholder="Ex: Fundações e Muros de Contenção" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="premium-label">Descrição</label>
                <textarea className="premium-input textarea-input" placeholder="Metodologia e tópicos abordados..." value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} rows="3" />
              </div>
              <div className="input-group">
                <label className="premium-label">Data de Liberação Temporal (Agendado)</label>
                <input type="datetime-local" className="premium-input" value={moduleSchedule} onChange={(e) => setModuleSchedule(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModuleModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Módulo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Modal: Lesson */}
      {showLessonModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Cadastrar Nova Aula</h2>
            <form onSubmit={handleCreateLesson} className="modal-form">
              <div className="input-group">
                <label className="premium-label">Título da Aula</label>
                <input type="text" className="premium-input" value={lessTitle} onChange={(e) => setLessTitle(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Duração (Ex: 25 min)</label>
                  <input type="text" className="premium-input" value={lessDuration} onChange={(e) => setLessDuration(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="premium-label">Fuso / Data Agendada</label>
                  <input type="datetime-local" className="premium-input" value={lessSchedule} onChange={(e) => setLessSchedule(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="premium-label">Link do Vídeo</label>
                <input type="url" className="premium-input" placeholder="https://..." value={lessVideo} onChange={(e) => setLessVideo(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="premium-label">Descrição Curta</label>
                <input type="text" className="premium-input" value={lessDesc} onChange={(e) => setLessDesc(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="premium-label">Conteúdo Longo (Pauta da Aula)</label>
                <textarea className="premium-input textarea-input" value={lessLongDesc} onChange={(e) => setLessLongDesc(e.target.value)} rows="3" />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Instrutor</label>
                  <input type="text" className="premium-input" value={lessInstructor} onChange={(e) => setLessInstructor(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="premium-label">Cargo do Instrutor</label>
                  <input type="text" className="premium-input" value={lessInstructorRole} onChange={(e) => setLessInstructorRole(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-gold">Cadastrar Aula</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .manager-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
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
        .subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .course-select-bar {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 20px;
        }
        .select-left {
          flex: 1;
          min-width: 250px;
          max-width: 400px;
        }
        .select-box {
          background: #FFFFFF;
          color: var(--text-primary);
          border: 1px solid var(--border-light);
        }
        .actions-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pub-active {
          border-color: #10B981;
          color: #10B981;
        }

        .drag-drop-zone {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .zone-header h2 {
          font-size: 20px;
        }

        .modules-draggable-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-module-card {
          border-color: var(--gold-border);
          transition: background-color 0.2s ease;
        }
        .admin-module-card:hover {
          background: var(--bg-card-hover);
        }
        .module-header-row {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-drag-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .drag-handle-icon {
          color: var(--text-muted);
          cursor: grab;
        }
        .header-drag-info h3 {
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .double-tip {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: normal;
          margin-left: 8px;
        }
        .inline-input {
          height: 32px;
          font-size: 14px;
          max-width: 400px;
          padding: 4px 8px;
          background: #FFFFFF;
          border: 1px solid var(--gold);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .btn-link-action {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: var(--transition-smooth);
        }
        .btn-link-action:hover {
          color: var(--gold);
        }
        .btn-link-action.text-red:hover {
          color: #EF4444;
        }

        .nested-lessons-container {
          border-top: 1px solid var(--border-light);
          padding: 16px 20px;
          background: var(--bg-deep);
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 40px; /* target spacing for empty drags */
        }
        .admin-lesson-row {
          padding: 10px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: var(--transition-smooth);
        }
        .admin-lesson-row:hover {
          border-color: var(--gold);
          background: var(--bg-card-hover);
        }
        .drag-handle-icon-small {
          color: var(--text-muted);
          cursor: grab;
        }
        .lesson-title {
          font-size: 13px;
          flex: 1;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .lesson-title:hover {
          color: var(--text-primary);
        }
        .lesson-dur {
          font-size: 11px;
          color: var(--text-muted);
        }
        .btn-lesson-delete {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
        }
        .btn-lesson-delete:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-overlay);
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
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .textarea-input {
          width: 100%;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .empty-zone, .empty-nested-lessons {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
