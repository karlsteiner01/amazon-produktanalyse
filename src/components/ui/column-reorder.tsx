'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { GripVertical, Settings2 } from 'lucide-react'

interface SortableItemProps {
  id: string
  label: string
}

function SortableItem({ id, label }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-default hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span>{label}</span>
    </div>
  )
}

interface ColumnReorderProps {
  columns: { id: string; label: string }[]
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  onReset?: () => void
}

export function ColumnReorder({ columns, order, onOrderChange, onReset }: ColumnReorderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(active.id as string)
    const newIndex = order.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    onOrderChange(arrayMove(order, oldIndex, newIndex))
  }, [order, onOrderChange])

  const labelMap = new Map(columns.map(c => [c.id, c.label]))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="text-xs font-medium text-zinc-500 px-3 pb-1.5">Spalten anpassen</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {order.map((id) => (
                <SortableItem key={id} id={id} label={labelMap.get(id) || id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-zinc-500 mt-1"
            onClick={onReset}
          >
            Zurücksetzen
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
