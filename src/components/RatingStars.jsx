import { Star } from 'lucide-react'

export default function RatingStars({ rating = 0, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(rating) ? 'fill-ink stroke-ink' : 'fill-none stroke-linen'}
        />
      ))}
    </div>
  )
}
