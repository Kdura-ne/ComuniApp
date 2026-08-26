import { useState } from 'react'

const CATEGORIES = [
  { id: 'buraco', label: 'Buraco na rua', icon: '🚧' },
  { id: 'iluminacao', label: 'Falta de iluminação', icon: '💡' },
  { id: 'poste', label: 'Poste quebrado', icon: '🔌' },
  { id: 'lixo', label: 'Lixo acumulado', icon: '🗑️' },
  { id: 'enchente', label: 'Enchente', icon: '🌊' },
  { id: 'transito', label: 'Trânsito perigoso', icon: '🚦' },
  { id: 'parque', label: 'Parque danificado', icon: '🌳' },
  { id: 'calcada', label: 'Calçada quebrada', icon: '🧱' },
  { id: 'assalto', label: 'Assalto / Roubo', icon: '🚨' },
  { id: 'animal', label: 'Maus-tratos animais', icon: '🐾' },
]

interface Props { onBack: () => void }

export default function ReportScreen({ onBack }: Props) {
  const [step, setStep] = useState<'category' | 'details' | 'success'>('category')
  const [category, setCategory] = useState('')
  const [desc, setDesc] = useState('')
  const [address, setAddress] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  const protocol = `#2026-${Math.floor(Math.random() * 9000) + 1000}`

  if (step === 'success') {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <span style={{ fontSize: 56 }}>✅</span>
        <p style={{ fontWeight: 900, fontSize: 20, margin: 0, color: '#111', fontFamily: 'Outfit, sans-serif' }}>Denúncia Registrada!</p>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Sua ocorrência foi enviada. Obrigado por contribuir com o bairro!</p>
        <div style={{ width: '100%', border: '2px solid #3a9e72', borderRadius: 12, padding: '16px', textAlign: 'left', backgroundColor: '#f0faf5' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#3a9e72', margin: '0 0 4px' }}>PROTOCOLO</p>
          <p style={{ fontWeight: 900, fontSize: 22, margin: '0 0 4px', color: '#111', fontFamily: 'Outfit, sans-serif' }}>{protocol}</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Status: Aberto · {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <button
          onClick={() => { setStep('category'); setCategory(''); setDesc(''); setAddress('') }}
          style={{ width: '100%', backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          Nova Denúncia
        </button>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          ← Voltar ao início
        </button>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Header strip */}
      <div style={{ backgroundColor: '#3a9e72', padding: '16px 16px 12px' }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Registrar Denúncia</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '4px 0 0' }}>
          Passo {step === 'category' ? '1' : '2'} de 2 — {step === 'category' ? 'Categoria' : 'Detalhes'}
        </p>
      </div>

      <div style={{ padding: '16px 14px' }}>

        {step === 'category' && (
          <>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#6b7280', margin: '0 0 12px' }}>Selecione a categoria:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 12,
                    border: `2px solid ${category === c.id ? '#3a9e72' : '#e5e7eb'}`,
                    backgroundColor: category === c.id ? '#f0faf5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{c.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => category && setStep('details')}
              disabled={!category}
              style={{
                width: '100%',
                marginTop: 14,
                backgroundColor: category ? '#3a9e72' : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontWeight: 700,
                fontSize: 14,
                cursor: category ? 'pointer' : 'not-allowed',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              Continuar →
            </button>
          </>
        )}

        {step === 'details' && (
          <>
            <button onClick={() => setStep('category')} style={{ background: 'none', border: 'none', color: '#3a9e72', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif' }}>
              ← Voltar
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>ENDEREÇO / LOCAL *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123"
                  style={{ width: '100%', border: `2px solid ${address ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>DESCRIÇÃO *</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Descreva o problema com detalhes..."
                  rows={4}
                  style={{ width: '100%', border: `2px solid ${desc ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              <div style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: 24, margin: '0 0 4px' }}>📷</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: 0 }}>Adicionar foto (opcional)</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #e5e7eb', borderRadius: 10, padding: '12px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111' }}>Denúncia anônima</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Seu nome não será exibido</p>
                </div>
                <button
                  onClick={() => setAnonymous(!anonymous)}
                  style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: anonymous ? '#3a9e72' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ position: 'absolute', top: 3, left: anonymous ? 23 : 3, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s' }} />
                </button>
              </div>

              <button
                onClick={() => desc && address && setStep('success')}
                disabled={!desc || !address}
                style={{
                  width: '100%',
                  backgroundColor: desc && address ? '#3a9e72' : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: desc && address ? 'pointer' : 'not-allowed',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                Enviar Denúncia
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
