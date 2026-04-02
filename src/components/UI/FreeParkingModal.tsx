import React, { useEffect, useRef, useState } from 'react'
import type { GameState, Player, Property } from '../../../shared/types'

const CELL_NAMES: Record<number, string> = {
  1:'Reynerie', 3:'Bellefontaine', 6:'Basso Cambo', 8:'Mirail-Université', 9:'Bagatelle',
  11:'Trois Cocus', 13:'Faculté de Pharmacie', 14:'Borderouge', 16:'Roseraie',
  18:'Jolimont', 19:'Marengo-SNCF', 21:"Patte d'Oie", 23:'St-Cyprien', 24:'Arènes',
  26:"Jeanne d'Arc", 27:'Compans-Caffarelli', 29:'Palais de Justice',
  31:'François-Verdier', 32:'Esquirol', 34:'Carmes', 37:'Capitole', 39:'Jean-Jaurès',
  5:'Nine', 15:'Café Pop', 25:"O'club", 35:'Magma Club',
  12:'Tisséo Pastel', 28:'Facture Fibre',
}

const GROUP_HEX: Record<string, string> = {
  brown:'#8B5E3C', 'light-blue':'#81D4FA', pink:'#F06292', orange:'#FF8A65',
  red:'#E53935', yellow:'#FDD835', green:'#43A047', 'dark-blue':'#1565C0',
}
const GROUP_OF: Record<number, string> = {
  1:'brown',3:'brown', 6:'light-blue',8:'light-blue',9:'light-blue',
  11:'pink',13:'pink',14:'pink', 16:'orange',18:'orange',19:'orange',
  21:'red',23:'red',24:'red', 26:'yellow',27:'yellow',29:'yellow',
  31:'green',32:'green',34:'green', 37:'dark-blue',39:'dark-blue',
}

const TIMEOUT = 20

interface Props {
  gameState: GameState
  me: Player
  onChoose: (propertyId: number) => void
  onDecline: () => void
}

export default function FreeParkingModal({ gameState, me, onChoose, onDecline }: Props) {
  const [selected, setSelected]   = useState<number | null>(null)
  const [timeLeft, setTimeLeft]   = useState(TIMEOUT)
  const [pulse, setPulse]         = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const alreadyOwnsBoost = gameState.freeParkingBoost?.playerId === me.id
  const currentBoostId   = alreadyOwnsBoost ? gameState.freeParkingBoost!.propertyId : null

  // Propriétés possédées non hypothéquées
  const myProps = gameState.properties.filter(
    p => p.ownerId === me.id && !p.mortgaged
  )

  // Timer 20s → auto decline
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          onDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleSelect(id: number) {
    setSelected(id)
    setPulse(id)
    setTimeout(() => setPulse(null), 600)
  }

  function handleConfirm() {
    if (selected === null) return
    if (timerRef.current) clearInterval(timerRef.current)
    onChoose(selected)
  }

  function handleDecline() {
    if (timerRef.current) clearInterval(timerRef.current)
    onDecline()
  }

  const urgent = timeLeft <= 8
  const progress = timeLeft / TIMEOUT
  const R = 20
  const C = 2 * Math.PI * R
  const arc = C * progress

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#0f131b',
        border: '2px solid rgba(74,222,128,0.35)',
        borderRadius: '24px',
        padding: '28px 28px 24px',
        width: 'min(440px, 92vw)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(74,222,128,0.12)',
        animation: 'parking-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes parking-in {
            from { opacity:0; transform:scale(0.8); }
            to   { opacity:1; transform:scale(1); }
          }
          @keyframes prop-pulse {
            0%   { transform:scale(1); }
            50%  { transform:scale(1.06); }
            100% { transform:scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.15rem', margin:0 }}>
              Jardin Japonais
            </h2>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.8rem', margin:'4px 0 0' }}>
              {alreadyOwnsBoost
                ? 'Changer votre propriété boostée (200 €) ou conserver (0 €)'
                : 'Payez 200 € pour booster le loyer d\'une propriété x3'
              }
            </p>
          </div>

          {/* Timer circulaire */}
          <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
              <circle cx="26" cy="26" r={R} fill="none"
                stroke={urgent ? '#ef4444' : '#10b981'} strokeWidth="3"
                strokeDasharray={`${arc} ${C}`} strokeLinecap="round"
                style={{ transition:'stroke-dasharray 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <span style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.85rem', fontWeight:700,
              color: urgent ? '#ef4444' : '#10b981',
            }}>{timeLeft}</span>
          </div>
        </div>

        {/* Propriétés */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:240, overflowY:'auto', marginBottom:20 }}>
          {myProps.map(prop => {
            const name  = CELL_NAMES[prop.id] ?? `Case ${prop.id}`
            const color = GROUP_HEX[GROUP_OF[prop.id]] ?? '#555'
            const isSel = selected === prop.id
            const isCur = prop.id === currentBoostId
            const isPulse = pulse === prop.id
            const rentBonus = prop.id === currentBoostId ? 'x3 actif' : null

            return (
              <button
                key={prop.id}
                onClick={() => handleSelect(prop.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  background: isSel ? `${color}22` : 'rgba(255,255,255,0.04)',
                  border: isSel ? `2px solid ${color}` : `1.5px solid ${isCur ? color+'88' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:12, padding:'10px 14px',
                  cursor:'pointer', transition:'all 0.15s',
                  animation: isPulse ? 'prop-pulse 0.6s ease' : 'none',
                  textAlign:'left',
                }}
              >
                <div style={{
                  width:12, height:36, borderRadius:3,
                  background:color, flexShrink:0,
                  boxShadow: isSel ? `0 0 12px ${color}88` : 'none',
                }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#fff', fontWeight:600, fontSize:'0.88rem' }}>{name}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', marginTop:2 }}>
                    {prop.hotel ? 'Hôtel' : prop.houses > 0 ? `${prop.houses} maison(s)` : 'Terrain nu'}
                    {isCur && <span style={{ color:'#facc15', marginLeft:8, fontWeight:700 }}>Boost actif</span>}
                  </div>
                </div>
                {rentBonus && (
                  <div style={{
                    background:'rgba(250,204,21,0.15)', border:'1px solid #facc1566',
                    borderRadius:8, padding:'3px 8px',
                    color:'#facc15', fontSize:'0.72rem', fontWeight:700, flexShrink:0,
                  }}>x3</div>
                )}
                {isSel && (
                  <div style={{
                    width:20, height:20, borderRadius:'50%',
                    background:color, display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                  }}>
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={handleDecline}
            style={{
              flex:1, background:'rgba(255,255,255,0.06)',
              border:'1.5px solid rgba(255,255,255,0.12)',
              borderRadius:12, padding:'11px 0',
              color:'rgba(255,255,255,0.6)', fontWeight:600, fontSize:'0.88rem',
              cursor:'pointer', transition:'background 0.15s',
            }}
          >
            {alreadyOwnsBoost ? 'Conserver (0 €)' : 'Passer (0 €)'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            style={{
              flex:2,
              background: selected !== null
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${selected !== null ? '#10b98188' : 'rgba(255,255,255,0.08)'}`,
              borderRadius:12, padding:'11px 0',
              color: selected !== null ? '#fff' : 'rgba(255,255,255,0.25)',
              fontWeight:700, fontSize:'0.88rem',
              cursor: selected !== null ? 'pointer' : 'default',
              transition:'all 0.2s',
            }}
          >
            Booster (200 €)
          </button>
        </div>
      </div>
    </div>
  )
}
