import { useMemo, useState } from 'react'
import { Search, Plus, Trash2, Send, Package, Building2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { fetchCompanies, loadSession, type Company } from '../lib/auth'
import { useEffect, useCallback } from 'react'

interface VariantRow {
  color: string
  size: string
  quantity: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Disponível': { bg: 'rgba(16,185,129,0.1)', text: '#4ADE80' },
  'Estoque Baixo': { bg: 'rgba(245,158,11,0.1)', text: '#FCD34D' },
  'Crítico': { bg: 'rgba(244,63,94,0.1)', text: '#F87171' },
}

export default function Distribution() {
  const { epis, loading, distributeToCompany } = useSupabaseData()
  const session = loadSession()
  const isMatriz = session?.role === 'matriz'

  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>([{ color: '', size: '', quantity: '' }])
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchCompanies().then(setCompanies).catch((e) => setErrorMsg((e as Error).message))
  }, [])

  const selected = epis.find((e) => e.id === selectedId) ?? null

  const filtered = useMemo(
    () =>
      epis.filter((e) => {
        const q = search.toLowerCase()
        return !q || (e.name ?? "").toLowerCase().includes(q) || (e.category ?? "").toLowerCase().includes(q)
      }),
    [epis, search],
  )

  const targets = companies.filter((c) => !c.is_matriz && c.supabase_url && c.anon_key)

  const setVariant = (idx: number, key: 'color' | 'size' | 'quantity', val: string) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: val } : v)))

  const total = variants.reduce((s, v) => s + (parseInt(v.quantity) || 0), 0)

  const canSend = selected != null && targetId != null && total > 0 && (selected.totalQuantity - total) >= 0 && !sending

  const handleSend = async () => {
    if (!selected || !targetId) return
    const target = companies.find((c) => c.id === targetId)
    if (!target) return
    const cleanVariants = variants
      .map((v) => ({ color: v.color.trim(), size: v.size.trim(), quantity: parseInt(v.quantity) || 0 }))
      .filter((v) => v.quantity > 0)
    if (cleanVariants.length === 0) {
      setErrorMsg('Informe ao menos uma quantidade.')
      return
    }

    setSending(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await distributeToCompany({
        targetUrl: target.supabase_url,
        targetKey: target.anon_key,
        targetName: target.name,
        matrizName: session?.companyName || 'Matriz Central',
        epi: selected.name,
        variants: cleanVariants,
        note: note.trim() || undefined,
      })
      setSuccessMsg(`${total} unidade(s) de "${selected.name}" enviadas para ${target.name}.`)
      setVariants([{ color: '', size: '', quantity: '' }])
      setNote('')
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (!isMatriz) {
    return (
      <div className="page-enter" style={{ padding: '24px 28px' }}>
        <div className="glass-strong" style={{ maxWidth: 480, borderRadius: 16, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚫</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: '0 0 6px' }}>Acesso restrito</h3>
          <p style={{ fontSize: 13.5, color: '#5C6388', lineHeight: 1.6, margin: 0 }}>
            Apenas a matriz pode distribuir EPIs para outras empresas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Distribuição de EPIs</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Envie estoque da matriz para as empresas da rede</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10 }}>
          <Package size={14} color="#D8B4FE" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#D8B4FE' }}>{epis.reduce((s, e) => s + e.totalQuantity, 0)} un. em estoque</span>
        </div>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16, animation: 'fade-up 0.3s ease',
        }}>
          <CheckCircle2 size={16} color="#4ADE80" />
          <span style={{ fontSize: 13, color: '#4ADE80' }}>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
        }}>
          <AlertCircle size={16} color="#F87171" />
          <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Step 1: choose EPI */}
        <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
              <span style={{ color: '#818CF8', marginRight: 8 }}>1.</span>Produto
            </h3>
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257' }} />
            <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar EPI..." style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#3D4257', fontSize: 13 }}>Carregando EPIs...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#3D4257', fontSize: 13 }}>Nenhum EPI encontrado.</div>
            ) : filtered.map((e) => {
              const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS['Disponível']
              const active = selectedId === e.id
              return (
                <button key={e.id} onClick={() => setSelectedId(e.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={(el) => { if (!active) el.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(el) => { if (!active) el.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Package size={15} color="#818CF8" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C4C9E2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: '#3D4257' }}>{e.category || 'Sem categoria'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#E8EAF6' }}>{e.totalQuantity}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: sc.text, background: sc.bg, padding: '2px 6px', borderRadius: 5, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{e.status}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: quantities + target */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
                <span style={{ color: '#818CF8', marginRight: 8 }}>2.</span>Quantidades
              </h3>
              <span style={{ fontSize: 11.5, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
                {selected ? `Disponível: ${selected.totalQuantity}` : 'Selecione um produto'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variants.map((v, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input-field" value={v.color} onChange={(e) => setVariant(idx, 'color', e.target.value)} placeholder="Cor (opcional)" style={{ flex: 1 }} />
                  <input className="input-field" value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} placeholder="Tamanho (ex: M, 42)" style={{ flex: 1 }} />
                  <input className="input-field" type="number" min={0} value={v.quantity} onChange={(e) => setVariant(idx, 'quantity', e.target.value)} placeholder="Qtd" style={{ flex: 0.6, fontFamily: 'var(--font-mono)' }} />
                  <button onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))} disabled={variants.length === 1} title="Remover linha" style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: variants.length === 1 ? 'not-allowed' : 'pointer', color: '#F87171', opacity: variants.length === 1 ? 0.35 : 1,
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button onClick={() => setVariants((prev) => [...prev, { color: '', size: '', quantity: '' }])} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11.5, fontWeight: 600, color: '#A5B4FC',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>
                <Plus size={11} /> Adicionar linha
              </button>
              <span style={{ fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
                Total: <strong style={{ color: total > 0 ? (selected && total > selected.totalQuantity ? '#F87171' : '#4ADE80') : '#5C6388' }}>{total}</strong>
                {selected && total > selected.totalQuantity && <span style={{ color: '#F87171', marginLeft: 6 }}>excede o estoque!</span>}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: '0 0 12px' }}>
              <span style={{ color: '#818CF8', marginRight: 8 }}>3.</span>Empresa de destino
            </h3>
            {targets.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#FCD34D', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 14px', lineHeight: 1.5 }}>
                Nenhuma filial com banco conectado. Cadastre uma empresa na página <strong>Empresas</strong> e vincule o banco de dados dela.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {targets.map((t) => (
                  <button key={t.id} onClick={() => setTargetId(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: targetId === t.id ? `${t.color}14` : 'rgba(255,255,255,0.02)',
                    border: targetId === t.id ? `1px solid ${t.color}50` : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={(el) => { if (targetId !== t.id) el.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(el) => { if (targetId !== t.id) el.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `${t.color}18`, border: `1px solid ${t.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={15} color={t.color} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#C4C9E2' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>{t.supabase_url.replace('https://', '').replace('.supabase.co', '')}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input className="input-field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação da distribuição (opcional)" style={{ marginTop: 12 }} />

            <button onClick={handleSend} disabled={!canSend} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', marginTop: 12, padding: '12px', borderRadius: 10,
              background: canSend ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.04)',
              border: canSend ? 'none' : '1px solid rgba(255,255,255,0.07)',
              color: canSend ? 'white' : '#3D4257',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
              cursor: canSend ? 'pointer' : 'not-allowed',
              boxShadow: canSend ? '0 4px 16px rgba(139,92,246,0.35)' : 'none',
              transition: 'all 0.15s',
            }}>
              {sending ? (
                'Enviando...'
              ) : (
                <><Send size={15} /> {selected && targetId && total > 0 ? `Enviar ${total} un. para ${companies.find((c) => c.id === targetId)?.name ?? ''}` : 'Selecione produto, quantidades e destino'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
