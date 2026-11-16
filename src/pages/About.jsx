import { BRAND } from '../lib/constants'

export default function About() {
  return (
    <div>
      <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80"
          alt="Tanzanian craftsmanship"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white">Our Story</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-lg leading-loose text-ink mb-8">
            {BRAND.name} is a family name — and this label is built the way family
            things are built: carefully, locally, and to last. We began in a small
            {' '}{BRAND.city} workshop with a simple belief: Tanzanians deserve
            well-made clothing without importing it or overpaying for it.
          </p>

          <p className="text-[15px] leading-loose text-smoke mb-6">
            We started in 2022, buying kitenge fabric from traders in Kariakoo
            market and working with local tailors to cut it into modern shirts.
            The first run of forty shirts sold out in two weeks — mostly to
            friends, then to friends of friends, then to strangers who found us
            on Instagram.
          </p>

          <p className="text-[15px] leading-loose text-smoke mb-6">
            Today we work with makers across the country: leather craftsmen in
            Mwanza, weavers producing traditional shuka and kanga cloth, and a
            growing tailoring workshop in Dar es Salaam. Every product is designed
            for how Tanzanians actually live — breathable fabrics for the coast,
            layers for the highlands, and prints that carry our culture.
          </p>

          <p className="text-[15px] leading-loose text-smoke mb-12">
            And because we sell directly to you — online, with delivery to every
            region and Cash on Delivery — there are no middlemen. Just honest
            prices for honest work.
          </p>

          <div className="border-t border-linen pt-12">
            <h2 className="font-display text-2xl mb-8">What we stand for</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  title: 'Local First',
                  text: 'Kitenge from Kariakoo, leather from Mwanza, tailoring in Dar. We invest in Tanzanian makers.',
                },
                {
                  title: 'Honest Pricing',
                  text: 'Direct to you, with delivery nationwide. No inflated mall markups — prices in shillings, no surprises.',
                },
                {
                  title: 'Built to Last',
                  text: 'We would rather sell you one shirt that lasts five years than five that last one.',
                },
              ].map((item, i) => (
                <div key={i}>
                  <h3 className="font-sans text-sm font-semibold mb-2.5 tracking-wide">{item.title}</h3>
                  <p className="text-[13px] text-smoke leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"
            alt={`${BRAND.name} workshop`}
            className="w-full aspect-[21/9] object-cover"
          />
        </div>
      </section>
    </div>
  )
}
