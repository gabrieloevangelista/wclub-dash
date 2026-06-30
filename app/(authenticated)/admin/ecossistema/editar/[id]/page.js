'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientWrapper';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarBannerPage({ params }) {
  const id = params?.id;
  const { showToast } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [image, setImage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [sequenceOrder, setSequenceOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/db?collection=banners');
        if (res.ok) {
          const list = await res.json();
          const found = list.find(x => x.id === id);
          if (found) {
            setTitle(found.title || '');
            setSubtitle(found.subtitle || '');
            setDescription(found.description || '');
            setTag(found.tag || '');
            setImage(found.image || '');
            setCtaText(found.cta_text || '');
            setCtaLink(found.cta_link || '');
            setDisabled(found.disabled ?? false);
            setSequenceOrder(found.sequence_order ?? 0);
          } else {
            showToast('Banner não encontrado.', 'error');
            router.push('/admin/ecossistema');
          }
        }
      } catch (e) {
        showToast('Erro ao carregar dados do banner.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image || !ctaText || !ctaLink) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'banners',
          id: id,
          updates: {
            title,
            subtitle,
            description,
            tag,
            image,
            cta_text: ctaText,
            cta_link: ctaLink,
            disabled,
            sequence_order: sequenceOrder
          }
        })
      });

      if (res.ok) {
        showToast('Banner atualizado com sucesso!', 'success');
        router.push('/admin/ecossistema');
      } else {
        showToast('Falha ao salvar as alterações do banner.', 'error');
      }
    } catch (err) {
      showToast('Erro ao atualizar o banner.', 'error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="loader-box glass-panel">
        <div className="premium-loader"></div>
      </div>
    );
  }

  return (
    <div className="new-banner-wrapper">
      <div className="back-nav fade-in">
        <Link href="/admin/ecossistema" className="back-link">
          <ArrowLeft size={14} /> Voltar para Gerenciamento
        </Link>
      </div>

      <div className="glass-panel form-card fade-in">
        <h2>Editar Banner Destaque</h2>
        <p className="card-sub">Edite as informações abaixo. As alterações serão exibidas no ecossistema imediatamente.</p>

        <form onSubmit={handleSubmit} className="banner-form">
          <div className="input-group">
            <label className="premium-label">Título Principal (Foco chamativo)</label>
            <input 
              type="text" 
              className="premium-input" 
              placeholder="Ex: CO-INVESTIMENTO CONSTRUTECH"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="premium-label">Subtítulo</label>
              <input 
                type="text" 
                className="premium-input" 
                placeholder="Ex: Condomínio Chalés Gramado"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label className="premium-label">Tag / Badge Flutuante</label>
              <input 
                type="text" 
                className="premium-input" 
                placeholder="Ex: DESTAQUE, NOVO, OPORTUNIDADE"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="premium-label">Descrição curta (Apoio textual)</label>
            <textarea 
              className="premium-input textarea-input" 
              placeholder="Fale um pouco sobre o produto ou evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          <div className="input-group">
            <label className="premium-label">URL da imagem de fundo (1200x500 recomendado)</label>
            <input 
              type="url" 
              className="premium-input" 
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="premium-label">Texto do Botão (CTA)</label>
              <input 
                type="text" 
                className="premium-input" 
                placeholder="Ex: Ver Detalhes"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label className="premium-label">Link do Botão (CTA Link)</label>
              <input 
                type="text" 
                className="premium-input" 
                placeholder="Ex: /oportunidades ou link externo"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn-gold" disabled={submitting}>
              <Save size={14} /> {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .new-banner-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 14px;
          text-decoration: none;
        }
        .back-link:hover {
          color: var(--gold);
        }
        .form-card {
          padding: 35px;
          border-color: var(--gold-border);
        }
        .card-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
          margin-bottom: 25px;
        }
        .banner-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .textarea-input {
          width: 100%;
        }
        .form-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
