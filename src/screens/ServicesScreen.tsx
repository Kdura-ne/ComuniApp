import { useState } from 'react'
import type { Service } from '../App'

const ngos = [
  { name: 'Instituto Caminho Novo', focus: 'Reforço escolar', desc: 'Apoio pedagógico para crianças de 6 a 14 anos.', icon: '📚', color: '#3a9e72', tags: ['Reforço escolar', 'Crianças'] },
  { name: 'ONG Trilha Esportiva', focus: 'Esportes', desc: 'Futebol, vôlei e atletismo para jovens de 10 a 18 anos.', icon: '⚽', color: '#1d4ed8', tags: ['Esportes', 'Jovens'] },
  { name: 'Projeto Música Viva', focus: 'Música', desc: 'Aulas gratuitas de violão, bateria e canto coral.', icon: '🎸', color: '#7c3aed', tags: ['Música', 'Gratuito'] },
  { name: 'CRAS — Assistência Social', focus: 'Assistência', desc: 'Apoio a famílias em situação de vulnerabilidade.', icon: '🤲', color: '#f97316', tags: ['Assistência', 'Famílias'] },
]

const FILTERS = ['Todos', 'Saúde', 'Segurança', 'Educação', 'Social', 'Serviços']

interface Props {
  services: Service[]
}

export default function ServicesScreen({ services }: Props) {
  const [tab, setTab] = useState<'public' | 'ngos'>('public')
  const [filter, setFilter] = useState('Todos')

  const filtered = filter === 'Todos' ? services : services.filter((s) => s.type === filter)

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ backgroundColor: '#3a9e72', padding: '16px 16px 12px' }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Serviços e ONGs</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '4px 0 0' }}>Serviços públicos e projetos sociais do bairro</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['public', 'ngos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px', border: 'none',
              borderBottom: `3px solid ${tab === t ? '#3a9e72' : 'transparent'}`,
              background: 'none', color: tab === t ? '#3a9e72' : '#9ca3af',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            {t === 'public' ? '🏛️ Serviços Públicos' : '🌱 ONGs e Projetos'}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px' }}>
        {tab === 'public' && (
          <>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 4 }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flexShrink: 0, padding: '5px 14px', borderRadius: 20,
                    border: `2px solid ${filter === f ? '#3a9e72' : '#e5e7eb'}`,
                    backgroundColor: filter === f ? '#3a9e72' : '#fff',
                    color: filter === f ? '#fff' : '#6b7280',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '30px 0' }}>
                Nenhum serviço encontrado nessa categoria.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((s) => (
                <div key={s.id} style={{ border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{s.name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.color, backgroundColor: s.color + '15', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>{s.type}</span>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>📍 {s.address}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>🕐 {s.hours}</p>
                      <a href={`tel:${s.phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: s.color, textDecoration: 'none' }}>
                        📞 {s.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'ngos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ngos.map((n) => (
              <div key={n.name} style={{ border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{n.name}</p>
                    <p style={{ margin: '3px 0 6px', fontSize: 12, color: '#6b7280' }}>{n.desc}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {n.tags.map((tag) => (
                        <span key={tag} style={{ fontSize: 11, fontWeight: 700, color: n.color, backgroundColor: n.color + '15', borderRadius: 10, padding: '2px 8px' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
