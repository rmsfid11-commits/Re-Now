import Starfield from '@/components/Starfield'
import TabBar from '@/components/TabBar'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Starfield />
      <main className="relative z-10 min-h-screen pb-20 px-4 pt-6 max-w-lg mx-auto">
        {children}
      </main>
      <TabBar />
    </>
  )
}
