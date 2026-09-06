import { connectDB } from "@/lib/mongodb";
import Topper from "@/models/Topper";
import Event from "@/models/Event";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ToppersCorner from "@/components/ToppersCorner";
import EventsGallery from "@/components/EventsGallery";
import Footer from "@/components/Footer";

export const revalidate = 60; // refresh public data every minute

async function getPublicData() {
  try {
    await connectDB();
    const [toppers, events] = await Promise.all([
      Topper.find({ featured: true }).sort({ rank: 1 }).limit(8).lean(),
      Event.find({ published: true }).sort({ eventDate: -1 }).limit(6).lean(),
    ]);
    return {
      toppers: JSON.parse(JSON.stringify(toppers)),
      events: JSON.parse(JSON.stringify(events)),
    };
  } catch (err) {
    // If MONGODB_URI isn't configured yet, fall back to placeholders so the
    // page still renders during initial setup.
    console.warn("[home] Falling back to placeholder content:", err.message);
    return { toppers: [], events: [] };
  }
}

export default async function HomePage() {
  const { toppers, events } = await getPublicData();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <ToppersCorner toppers={toppers} />
        <EventsGallery events={events} />
      </main>
      <Footer />
    </>
  );
}
