export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0a0c_0%,#030303_45%,#000000_100%)]" />
      <div
        className="blob-a absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(94,234,212,0.1) 0%, rgba(94,234,212,0.03) 42%, transparent 70%)',
          animation: 'blob-drift-a 18s ease-in-out infinite',
        }}
      />
      <div
        className="blob-b absolute -right-16 top-10 h-[32rem] w-[32rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(237,237,239,0.07) 0%, rgba(161,161,170,0.03) 46%, transparent 70%)',
          animation: 'blob-drift-b 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full blur-3xl opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(232,195,122,0.05) 0%, transparent 68%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse at 50% -10%, black 18%, transparent 72%)',
        }}
      />
    </div>
  )
}
