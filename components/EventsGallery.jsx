import Image from "next/image";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsGallery({ events = [] }) {
  const list = events.length ? events : PLACEHOLDER_EVENTS;

  return (
    <section id="activities" className="bg-ivory">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="font-display text-sm italic text-brass-600">School life</p>
        <h2 className="mt-1 font-display text-3xl text-navy sm:text-4xl">Activities &amp; Events</h2>

        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {list.map((ev, idx) => {
            const cover = ev.media?.[0];
            return (
              <article
                key={ev._id || idx}
                className="w-[280px] shrink-0 snap-start rounded-sm border border-navy-100 bg-white sm:w-[340px]"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-navy-50">
                  {cover?.isEmbed ? (
                    <iframe
                      src={cover.url}
                      title={ev.heading}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  ) : cover?.url ? (
                    <Image src={cover.url} alt={ev.heading} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-sm text-navy-400">
                      {ev.category}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] uppercase tracking-wide text-brass-600">
                    {formatDate(ev.eventDate)}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-navy">{ev.heading}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm text-navy-600">{ev.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const PLACEHOLDER_EVENTS = [
  {
    heading: "Annual Sports Day",
    description: "Track and field events across all houses, capped with the inter-house relay final.",
    eventDate: new Date(),
    category: "sports",
    media: [],
  },
  {
    heading: "Science Exhibition",
    description: "Student-built working models on show for parents, from Class 6 through Class 10.",
    eventDate: new Date(),
    category: "academic",
    media: [],
  },
  {
    heading: "Founders' Day",
    description: "A cultural evening marking another year since the school's founding in 1987.",
    eventDate: new Date(),
    category: "celebration",
    media: [],
  },
];
