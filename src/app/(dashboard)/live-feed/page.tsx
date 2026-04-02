import { LiveFeed } from '@/components/feed/LiveFeed'

export const metadata = { title: 'Live Feed — shakystonks' }

export default function LiveFeedPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Live Feed</h1>
        <p className="mt-1 text-sm text-gray-500">
          Event-driven signals detected during market hours · Updated every 15 minutes
        </p>
      </div>
      <LiveFeed />
    </div>
  )
}
