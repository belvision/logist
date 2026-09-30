"use client"

import { Truck, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Car } from "@/shared/api/cars"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

interface FleetGridCardProps {
  car: Car
  carType?: string
  loadType?: string
  onEdit?: (car: Car) => void
  onDelete?: (car: Car) => void
  onFindCargo?: (carId: number) => void
}

export function FleetGridCard({ car, carType, loadType, onEdit, onDelete, onFindCargo }: FleetGridCardProps) {
  const router = useRouter()
  const params = useParams()
  const companyId = params?.['company_id'] as string

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Не переходим при клике на кнопки
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    router.push(`/company/${companyId}/fleet/${car.id_cars}`)
  }

  return (
    <div 
      className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Vehicle Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{car.title}</h3>
            <p className="text-sm text-muted-foreground">{carType} • {loadType}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Грузоподъемность</span>
          <span className="font-medium">{car.tonn_min} - {car.tonn_max} т</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Объем</span>
          <span className="font-medium">{car.m3_min} - {car.m3_max} м³</span>
        </div>
        {car.price !== undefined && car.price !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Цена</span>
            <span className="font-medium">{car.price} ₽</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Год выпуска</span>
          <span className="font-medium">{car.year ?? '—'}</span>
        </div>
      </div>

      {/* Cities */}
      {car.places && Object.keys(car.places).length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Города доступности</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(car.places).map(([pid, p]) => (
              <span 
                key={pid} 
                className={`text-xs px-2 py-1 rounded ${
                  p.active !== false 
                    ? 'bg-accent/10 text-accent' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {p.label || pid}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 space-y-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
        {onFindCargo && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onFindCargo(car.id_cars)}
          >
            Найти грузы по радиусу
          </Button>
        )}
        <div className="flex gap-2">
          {onEdit && (
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                onEdit(car)
              }} 
              variant="outline" 
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(car)
              }}
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

