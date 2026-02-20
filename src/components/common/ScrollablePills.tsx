'use client'

import { useRef, useState, useEffect } from 'react'

interface ScrollablePillsProps {
  children: React.ReactNode
  className?: string
}

export function ScrollablePills({ children, className }: ScrollablePillsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [left, setLeft] = useState(false)
  const [right, setRight] = useState(false)

  function update() {
    const el = ref.current
    if (!el) return
    setLeft(el.scrollLeft > 0)
    setRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    update()
    const el = ref.current
    el?.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    if (el) ro.observe(el)
    return () => {
      el?.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className={`relative ${className ?? ''}`}>
      <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-10">
        {children}
      </div>
      {left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-white to-transparent" />
      )}
      {right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-white to-transparent" />
      )}
    </div>
  )
}
