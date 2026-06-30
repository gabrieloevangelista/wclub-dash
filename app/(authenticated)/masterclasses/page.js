'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { Play, BookOpen, Layers, Award } from 'lucide-react';
import Link from 'next/link';

export default function MasterclassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, mRes, lRes] = await Promise.all([
          fetch('/api/db?collection=courses'),
          fetch('/api/db?collection=modules'),
          fetch('/api/db?collection=lessons')
        ]);
        if (cRes.ok && mRes.ok && lRes.ok) {
          const coursesData = await cRes.ok ? await cRes.json() : [];
          const modulesData = await mRes.ok ? await mRes.json() : [];
          const lessonsData = await lRes.ok ? await lRes.json() : [];
          
          const nowStr = new Date().toISOString();
          
          // Filtering logic: admins see everything, non-admins only see published/visible items
          if (user?.member_type === 'admin') {
            setCourses(coursesData);
            setModules(modulesData);
            setLessons(lessonsData);
          } else {
            // Non-admin visible modules (PRD 7.1 Visibilidade Temporal)
            const visibleModules = modulesData.filter(m => 
              m.status === 'published' && (!m.scheduled_at || m.scheduled_at <= nowStr)
            );
            // Non-admin visible lessons (PRD 7.1 Visibilidade Temporal)
            const visibleLessons = lessonsData.filter(l => 
              l.status === 'published' && (!l.scheduled_at || l.scheduled_at <= nowStr)
            );

            // Filter courses which are published
            setCourses(coursesData.filter(c => c.status === 'publicado'));
            setModules(visibleModules);
            setLessons(visibleLessons);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [user]);

  // Counts sub-items helper
  const getCourseStats = (courseId) => {
    const courseModules = modules.filter(m => m.course_id === courseId);
    const moduleIds = courseModules.map(m => m.id);
    const courseLessons = lessons.filter(l => moduleIds.includes(l.module_id));
    return {
      modulesCount: courseModules.length,
      lessonsCount: courseLessons.length
    };
  };

  return (
    <div className="masterclasses-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">ESTUDO DE ALTO NÍVEL</span>
        <h1>Masterclasses</h1>
        <p className="subtitle">Explore os conteúdos exclusivos de Engenharia, Incorporação e Funding do WHITECLUB</p>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="glass-panel empty-courses fade-in">
            Nenhum curso disponível no momento.
          </div>
        ) : (
          courses.map(course => {
            const stats = getCourseStats(course.id);
            const isDraft = course.status === 'rascunho';
            return (
              <div key={course.id} className="course-card glass-panel glass-panel-hover fade-in">
                <div className="course-cover">
                  <img src={course.cover_image_url} alt={course.title} />
                  {isDraft && <span className="draft-badge">RASCUNHO (ADMIN)</span>}
                </div>
                <div className="course-body">
                  <div className="course-meta">
                    <span className="meta-item"><Layers size={14} /> {stats.modulesCount} Módulos</span>
                    <span className="meta-item"><BookOpen size={14} /> {stats.lessonsCount} Aulas</span>
                  </div>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                  
                  <div className="course-footer">
                    <Link href={`/masterclasses/curso/${course.slug}`} className="btn-gold play-btn">
                      Acessar Aulas <Play size={12} fill="currentColor" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .masterclasses-wrapper {
          display: flex;
          flex-direction: column;
          gap: 40px;
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
          margin-bottom: 8px;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }
        .courses-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        @media (min-width: 768px) {
          .courses-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1200px) {
          .courses-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .course-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          border-color: var(--gold-border);
        }
        .course-cover {
          height: 180px;
          position: relative;
        }
        .course-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .draft-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .course-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .course-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .course-body h2 {
          font-size: 18px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .course-body p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 20px;
          flex: 1;
        }
        .course-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
        }
        .play-btn {
          width: 100%;
        }
        .empty-courses {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
