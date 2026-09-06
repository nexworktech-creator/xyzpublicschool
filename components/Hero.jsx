import AdmissionInquiryModal from "./AdmissionInquiryModal";
import BannerSlider from "./BannerSlider";

const NOTICE_STRIP = [
  { label: "Founded", value: "1987" },
  { label: "Students", value: "2,400+" },
  { label: "Board", value: "CBSE Affiliated" },
  { label: "Class 12 Result", value: "98.6%" },
];

export default function Hero() {
  return (
    <section id="about" className="border-b border-navy-100 bg-ivory bg-rule-lines">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:py-20 md:grid-cols-2 md:items-center md:gap-14">
        <div>
          <p className="font-display text-sm italic text-brass-600">Admissions open for 2026&ndash;27</p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1.1] text-navy sm:text-5xl">
            Where curiosity is taken as seriously as the curriculum.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-navy-600">
            XYZ Public School has spent nearly four decades building a place where children from
            Nursery to Class 12 learn to think clearly, ask better questions, and grow into the kind
            of people their community can rely on.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AdmissionInquiryModal />
            <a href="#activities" className="text-sm text-navy underline decoration-brass decoration-2 underline-offset-4">
              See school life
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-navy-100 pt-6 sm:grid-cols-4">
            {NOTICE_STRIP.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] uppercase tracking-wide text-navy-400">{item.label}</dt>
                <dd className="mt-1 font-display text-lg text-navy">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <BannerSlider />
      </div>
    </section>
  );
}
