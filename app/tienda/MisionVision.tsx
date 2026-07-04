export default function MisionVision() {
  return (
    <section className="border-y border-white/15 py-20 md:py-32 overflow-hidden bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* Misión */}
        <div className="order-2 md:order-1">
          <h2
            className="text-4xl sm:text-5xl uppercase tracking-tighter mb-6 leading-none"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            Nuestra Misión
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Elevar el streetwear a una forma de arte estructural. Fusionamos la utilidad urbana con la
            alta costura para crear prendas que funcionen como una extensión de la identidad individual.
          </p>
        </div>
        <div className="order-1 md:order-2 relative">
          <div className="aspect-[4/5] bg-white/5 border border-white/10 relative flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-white/20">Terra Urban Systems</span>
            <div className="absolute -bottom-6 -left-6 bg-black border border-white/30 p-6 hidden md:block">
              <span className="text-3xl uppercase" style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}>01</span>
            </div>
          </div>
        </div>

        {/* Visión */}
        <div className="order-3 relative">
          <div className="aspect-[4/5] bg-white/5 border border-white/10 relative flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-white/20">Terra Urban Systems</span>
            <div className="absolute -top-6 -right-6 bg-black border border-white/30 p-6 hidden md:block">
              <span className="text-3xl uppercase" style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}>02</span>
            </div>
          </div>
        </div>
        <div className="order-4">
          <h2
            className="text-4xl sm:text-5xl uppercase tracking-tighter mb-6 leading-none"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            Nuestra Visión
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Convertirnos en el epicentro de la disrupción visual. Visualizamos un mundo donde la ropa no
            sea solo cobertura, sino un sistema de expresión personal que desafíe el status quo.
          </p>
        </div>
      </div>
    </section>
  )
}
