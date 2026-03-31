import React from 'react'
import type { Property } from '../../../shared/types'

interface CellDef {
  index: number
  name: string
  price?: number
  colorGroup?: string
  mortgage?: number
  houseCost?: number
  rents?: number[]
}

// Import partiel des données (dupliqué depuis gameEngine pour l'affichage client)
const CELL_DATA: Partial<CellDef>[] = [
  {},{index:1,name:'Méditerranée',price:60,colorGroup:'brown',mortgage:30,houseCost:50,rents:[2,10,30,90,160,250]},
  {},{index:3,name:'Bd de Belleville',price:60,colorGroup:'brown',mortgage:30,houseCost:50,rents:[4,20,60,180,320,450]},
  {},{index:5,name:'Gare Montparnasse',price:200,mortgage:100,rents:[25,50,100,200]},
  {},{index:6,name:'Rue de Vaugirard',price:100,colorGroup:'light-blue',mortgage:50,houseCost:50,rents:[6,30,90,270,400,550]},
  {},{index:8,name:'Rue de Courcelles',price:100,colorGroup:'light-blue',mortgage:50,houseCost:50,rents:[6,30,90,270,400,550]},
  {index:9,name:'Av. de la République',price:120,colorGroup:'light-blue',mortgage:60,houseCost:50,rents:[8,40,100,300,450,600]},
  {},{index:11,name:'Bd de la Villette',price:140,colorGroup:'pink',mortgage:70,houseCost:100,rents:[10,50,150,450,625,750]},
  {index:12,name:'Cie Électrique',price:150,mortgage:75},
  {index:13,name:'Av. de Neuilly',price:140,colorGroup:'pink',mortgage:70,houseCost:100,rents:[10,50,150,450,625,750]},
  {index:14,name:'Rue de Paradis',price:160,colorGroup:'pink',mortgage:80,houseCost:100,rents:[12,60,180,500,700,900]},
  {index:15,name:'Gare de Lyon',price:200,mortgage:100,rents:[25,50,100,200]},
  {index:16,name:'Av. Mozart',price:180,colorGroup:'orange',mortgage:90,houseCost:100,rents:[14,70,200,550,750,950]},
  {},{index:18,name:'Bd Saint-Michel',price:180,colorGroup:'orange',mortgage:90,houseCost:100,rents:[14,70,200,550,750,950]},
  {index:19,name:'Place Pigalle',price:200,colorGroup:'orange',mortgage:100,houseCost:100,rents:[16,80,220,600,800,1000]},
  {},{index:21,name:'Av. Matignon',price:220,colorGroup:'red',mortgage:110,houseCost:150,rents:[18,90,250,700,875,1050]},
  {},{index:23,name:'Bd Malesherbes',price:220,colorGroup:'red',mortgage:110,houseCost:150,rents:[18,90,250,700,875,1050]},
  {index:24,name:'Av. Henri-Martin',price:240,colorGroup:'red',mortgage:120,houseCost:150,rents:[20,100,300,750,925,1100]},
  {index:25,name:'Gare du Nord',price:200,mortgage:100,rents:[25,50,100,200]},
  {index:26,name:'Fg Saint-Honoré',price:260,colorGroup:'yellow',mortgage:130,houseCost:150,rents:[22,110,330,800,975,1150]},
  {index:27,name:'Place de la Bourse',price:260,colorGroup:'yellow',mortgage:130,houseCost:150,rents:[22,110,330,800,975,1150]},
  {index:28,name:'Cie des Eaux',price:150,mortgage:75},
  {index:29,name:'Rue La Fayette',price:280,colorGroup:'yellow',mortgage:140,houseCost:150,rents:[24,120,360,850,1025,1200]},
  {},{index:31,name:'Av. de Breteuil',price:300,colorGroup:'green',mortgage:150,houseCost:200,rents:[26,130,390,900,1100,1275]},
  {index:32,name:'Avenue Foch',price:300,colorGroup:'green',mortgage:150,houseCost:200,rents:[26,130,390,900,1100,1275]},
  {},{index:34,name:'Bd des Capucines',price:320,colorGroup:'green',mortgage:160,houseCost:200,rents:[28,150,450,1000,1200,1400]},
  {index:35,name:'Gare St-Lazare',price:200,mortgage:100,rents:[25,50,100,200]},
  {},{index:37,name:'Av. des Champs-Élysées',price:350,colorGroup:'dark-blue',mortgage:175,houseCost:200,rents:[35,175,500,1100,1300,1500]},
  {},{index:39,name:'Rue de la Paix',price:400,colorGroup:'dark-blue',mortgage:200,houseCost:200,rents:[50,200,600,1400,1700,2000]},
]

const GROUP_COLORS: Record<string, string> = {
  brown: '#8B5E3C',
  'light-blue': '#81D4FA',
  pink: '#F06292',
  orange: '#FF8A65',
  red: '#E53935',
  yellow: '#FDD835',
  green: '#43A047',
  'dark-blue': '#1565C0',
}

interface PropertyCardProps {
  property: Property
  ownerName?: string
  canBuy?: boolean
  onBuy?: () => void
  onDecline?: () => void
  onClose?: () => void
}

export default function PropertyCard({ property, ownerName, canBuy, onBuy, onDecline, onClose }: PropertyCardProps) {
  const cell = CELL_DATA.find(c => c.index === property.id)
  if (!cell) return null

  const bandColor = cell.colorGroup ? GROUP_COLORS[cell.colorGroup] : '#666'

  return (
    <div className="bg-white text-gray-900 rounded-lg overflow-hidden w-56 shadow-2xl">
      {cell.colorGroup && (
        <div className="h-12 flex items-center justify-center text-white font-bold text-center px-2 text-sm"
          style={{ backgroundColor: bandColor }}>
          {cell.name}
        </div>
      )}
      {!cell.colorGroup && (
        <div className="bg-gray-200 h-12 flex items-center justify-center font-bold text-center px-2 text-sm">
          {cell.name}
        </div>
      )}

      <div className="p-3">
        <div className="text-center text-xl font-bold mb-2">{cell.price} F</div>

        {cell.rents && (
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between"><span>Loyer nu</span><span>{cell.rents[0]} F</span></div>
            {cell.rents.length > 2 && <>
              <div className="flex justify-between"><span>1 maison</span><span>{cell.rents[1]} F</span></div>
              <div className="flex justify-between"><span>2 maisons</span><span>{cell.rents[2]} F</span></div>
              <div className="flex justify-between"><span>3 maisons</span><span>{cell.rents[3]} F</span></div>
              <div className="flex justify-between"><span>4 maisons</span><span>{cell.rents[4]} F</span></div>
              <div className="flex justify-between font-semibold"><span>Hôtel</span><span>{cell.rents[5]} F</span></div>
            </>}
            {cell.houseCost && (
              <div className="flex justify-between border-t pt-1 mt-1">
                <span>Maison</span><span>{cell.houseCost} F</span>
              </div>
            )}
            {cell.mortgage && (
              <div className="flex justify-between"><span>Hypothèque</span><span>{cell.mortgage} F</span></div>
            )}
          </div>
        )}

        {ownerName && (
          <div className="text-xs text-center mt-2 text-gray-500">Propriété de {ownerName}</div>
        )}
        {property.mortgaged && (
          <div className="text-xs text-center mt-1 text-orange-600 font-semibold">HYPOTHÉQUÉE</div>
        )}
      </div>

      {(canBuy || onClose) && (
        <div className="flex gap-2 p-2 border-t">
          {canBuy && onBuy && (
            <button onClick={onBuy}
              className="flex-1 bg-green-600 text-white text-sm py-1 rounded hover:bg-green-700">
              Acheter
            </button>
          )}
          {canBuy && onDecline && (
            <button onClick={onDecline}
              className="flex-1 bg-gray-400 text-white text-sm py-1 rounded hover:bg-gray-500">
              Enchères
            </button>
          )}
          {!canBuy && onClose && (
            <button onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 text-sm py-1 rounded hover:bg-gray-300">
              Fermer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
