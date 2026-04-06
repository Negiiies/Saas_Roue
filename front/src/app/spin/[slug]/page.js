import { Suspense } from 'react'
import SpinContent from './SpinContent'

export default async function SpinPage({ params }) {
  const { slug } = await params

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SpinContent slug={slug} />
    </Suspense>
  )
}