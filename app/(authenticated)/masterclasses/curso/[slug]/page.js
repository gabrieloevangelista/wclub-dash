'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { Play, ChevronDown, ChevronUp, Layers, Calendar, Lock } from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailsPage({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

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
          
          const matchedCourse = coursesData.find(c => c.slug === slug);
          if (matchedCourse) {
            setCourse(matchedCourse);
            
            // Filter modules belonging to this course
            const courseModules = modulesData.filter(m => m.course_id === matchedCourse.id);
            // Filter lessons belonging to these modules
            const moduleIds = courseModules.map(m => m.id);
            const courseLessons = lessonsData.filter(l => moduleIds.includes(l.module_id));

            const nowStr = new Date().toISOString();

            if (user?.member_type === 'admin') {
              // Admin sees everything
              courseModules.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
              courseLessons.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
              
              setModules(courseModules);
              setLessons(courseLessons);
              
              // Expand all modules by default for admin
              const expanded = {};
              courseModules.forEach(m => { expanded[m.id] = true; });
              setExpandedModules(expanded);
            } else {
              // Mentor/Master temporal restrictions
              const visibleModules = courseModules.filter(m => 
                m.status === 'published' && (!m.scheduled_at || m.scheduled_at <= nowStr)
              ).sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));

              const visibleModuleIds = visibleModules.map(m => m.id);

              const visibleLessons = courseLessons.filter(l => 
                l.status === 'published' && 
                visibleModuleIds.includes(l.module_id) && 
                (!l.scheduled_at || l.scheduled_at <= nowStr)
              ).sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));

              setModules(visibleModules);
              setLessons(visibleLessons);

              // Expand the first module by default
              if (visibleModules.length > 0) {
                setExpandedModules({ [visibleModules[0].id]: true });
              }
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load course details', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="premium-loader"></div>
        <style jsx>{`
          .loader-box { display: flex; align-items: center; justify-content: center; height: 50vh; }
          .premium-loader { width: 35px; height: 35px; border: 2px solid rgba(237, 192, 102, 0.1); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-panel error-panel fade-in">
        <h2>Curso não encontrado</h2>
        <p>O curso solicitado pode ter sido removido ou o slug está incorreto.</p>
        <Link href="/masterclasses" className="btn-gold" style={{ marginTop: '20px' }}>
          Voltar a Masterclasses
        </Link>
      </div>
    );
  }

  return (
    <div className="course-wrapper">
      <div className="back-nav">
        <Link href="/masterclasses" className="back-link">← Voltar para Masterclasses</Link>
      </div>

      {/* Course Hero Banner */}
      <section className="course-hero glass-panel fade-in" style={{ backgroundImage: `linear-gradient(rgba(1, 1, 5, 0.8), rgba(1, 1, 5, 0.95)), url(${course.cover_image_url})` }}>
        <div className="hero-content">
          <span className="welcome-tag">MASTERCLASS</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
      </section>

      {/* Modules List Accordion */}
      <section className="modules-section fade-in">
        <h2>Grade do Curso ({modules.length} Módulos)</h2>

        <div className="modules-list">
          {modules.length === 0 ? (
            <div className="glass-panel empty-modules">
              Este curso ainda não possui módulos disponíveis.
            </div>
          ) : (
            modules.map((mod, index) => {
              const modLessons = lessons.filter(l => l.module_id === mod.id);
              const isOpen = expandedModules[mod.id];
              const isScheduled = mod.scheduled_at && new Date(mod.scheduled_at) > new Date();

              return (
                <div key={mod.id} className="module-item glass-panel">
                  {/* Module Header */}
                  <div className="module-header" onClick={() => toggleModule(mod.id)}>
                    <div className="module-title-group">
                      <span className="module-index">Módulo {index + 1}</span>
                      <h3>{mod.title}</h3>
                      {isScheduled && (
                        <span className="scheduled-badge">
                          <Calendar size={10} /> Agendado: {new Date(mod.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="module-toggle">
                      <span className="lessons-count">{modLessons.length} aulas</span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Lessons Inside (Accordion content) */}
                  {isOpen && (
                    <div className="lessons-list">
                      {mod.description && <p className="module-description">{mod.description}</p>}
                      
                      {modLessons.length === 0 ? (
                        <div className="empty-lessons">Nenhuma aula publicada neste módulo ainda.</div>
                      ) : (
                        modLessons.map((les, lIndex) => {
                          const isLessonScheduled = les.scheduled_at && new Date(les.scheduled_at) > new Date();
                          return (
                            <div key={les.id} className="lesson-row">
                              <div className="lesson-thumbnail-mini">
                                <img src={les.thumbnail_url || les.cover_image_url} alt={les.title} />
                                <div className="duration-tag">{les.duration}</div>
                              </div>
                              <div className="lesson-details">
                                <div className="lesson-title-row">
                                  <h4>{lIndex + 1}. {les.title}</h4>
                                  {isLessonScheduled && (
                                    <span className="scheduled-badge">
                                      <Lock size={10} /> Agendado ({new Date(les.scheduled_at).toLocaleDateString('pt-BR')})
                                    </span>
                                  )}
                                </div>
                                <p className="lesson-desc">{les.description}</p>
                              </div>
                              <Link href={`/masterclasses/aula/${les.slug}`} className="btn-gold play-lesson-btn">
                                <Play size={12} fill="currentColor" /> Assistir
                              </Link>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <style jsx>{`
        .course-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .back-nav {
          margin-bottom: -10px;
        }
        .back-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
        }
        .back-link:hover {
          color: var(--gold);
        }
        .course-hero {
          padding: 60px 40px;
          background-size: cover;
          background-position: center;
          border-color: var(--gold-border);
        }
        .hero-content {
          max-width: 800px;
        }
        .welcome-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.15em;
          margin-bottom: 12px;
          display: block;
        }
        .hero-content h1 {
          font-size: 36px;
          margin-bottom: 12px;
          letter-spacing: 0.02em;
        }
        .hero-content p {
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.6;
        }
        
        .modules-section h2 {
          font-size: 20px;
          margin-bottom: 20px;
        }
        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .module-item {
          border-color: var(--gold-border);
          overflow: hidden;
        }
        .module-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .module-header:hover {
          background: rgba(255, 255, 255, 0.01);
        }
        .module-title-group {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        .module-index {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          background: rgba(237, 192, 102, 0.1);
          padding: 4px 10px;
          border-radius: 4px;
        }
        .module-title-group h3 {
          font-size: 16px;
          font-weight: 600;
        }
        .module-toggle {
          display: flex;
          align-items: center;
          gap: 15px;
          color: var(--text-secondary);
        }
        .lessons-count {
          font-size: 13px;
        }
        .scheduled-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .lessons-list {
          border-top: 1px solid var(--border-light);
          padding: 24px;
          background: rgba(1, 1, 5, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .module-description {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .lesson-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          transition: var(--transition-smooth);
        }
        .lesson-row:hover {
          border-color: rgba(237, 192, 102, 0.2);
          background: rgba(255, 255, 255, 0.04);
        }
        .lesson-thumbnail-mini {
          width: 100px;
          height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }
        .lesson-thumbnail-mini img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .duration-tag {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0,0,0,0.8);
          color: white;
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 2px;
        }
        .lesson-details {
          flex: 1;
        }
        .lesson-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .lesson-details h4 {
          font-size: 14px;
          font-weight: 600;
        }
        .lesson-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .play-lesson-btn {
          height: 36px;
          padding: 0 16px;
          font-size: 13px;
          border-radius: var(--radius-sm);
        }
        .empty-modules, .empty-lessons {
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
        .error-panel {
          padding: 40px;
          text-align: center;
        }
        .error-panel h2 {
          color: #EF4444;
          margin-bottom: 12px;
        }
        .error-panel p {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
