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
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.07),rgba(0,0,0,0))]" />
      <main className="relative z-10 mx-auto max-w-md px-4 pb-24 pt-4 min-h-screen">
        {children}
      </main>
      <TabBar />
    </>
  )
}
