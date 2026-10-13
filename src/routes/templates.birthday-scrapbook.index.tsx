import { createFileRoute } from "@tanstack/react-router";
import { EditableText } from "@/components/templates/birthday-scrapbook/EditableText";
import { PhotoFrame } from "@/components/templates/birthday-scrapbook/PhotoFrame";
import { FilmEdge, Hint, SiteNav } from "@/components/templates/birthday-scrapbook/Chrome";
import { useDesktopPinning } from "@/lib/scrapbook-store";

export const Route = createFileRoute("/templates/birthday-scrapbook/")({
  head: () => ({
    meta: [
      { title: "Birthday Scrapbook Template — Live Demo" },
      {
        name: "description",
        content:
          "A red film-photo birthday collage you can fill with your own pictures and words — add photos, edit every caption, arrange it your way.",
      },
      { property: "og:title", content: "Birthday Scrapbook Template — Live Demo" },
      {
        property: "og:description",
        content: "Add your photos, edit the notes, and make this birthday collage yours.",
      },
    ],
  }),
  component: CollagePage,
});




function CollagePage() {
  const desktop = useDesktopPinning();

  return (
    <main className="maroon-bg grain relative min-h-screen overflow-hidden px-5 pb-24 pt-16 sm:px-8 lg:px-12">
      <SiteNav />
      <FilmEdge />

      <div className="relative z-10 mx-auto max-w-md lg:max-w-6xl">
        <header>
          <h1 className="font-script text-5xl leading-[0.95] text-[var(--paper)] sm:text-6xl lg:text-7xl">
            Happy
            <br />
            <span className="ml-8 block sm:ml-14">Birthday</span>
          </h1>

          <div className="mt-6 max-w-xs text-[10px] sm:text-[11px]">
            <EditableText
              className="tag-red"
              id="collage.wish"
              multiline
              defaultValue={
                "Hope you always healthy and happy, a new chapter begins, cheers to 23!\nI love you ♡"
              }
            />
          </div>
        </header>

        {/* Collage */}
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-2 lg:grid-cols-12 lg:gap-x-4 lg:gap-y-3">
          <div className="lg:col-span-4 lg:col-start-9 lg:-mt-44">
            <PhotoFrame id="c1" ratio="4 / 3" polaroid={false} pin pinnable rotate={0.6} />
          </div>

          <div className="lg:col-span-3 lg:col-start-5 lg:mt-2">
            <PhotoFrame id="c2" ratio="3 / 4" pin pinnable rotate={-2.5} />
          </div>

          <div className="relative lg:col-span-4 lg:col-start-9 lg:-mt-10">
            <PhotoFrame id="c3" ratio="4 / 3" polaroid={false} pin pinnable rotate={1.2} />
            <span className="absolute -left-4 bottom-5 z-20 bg-[var(--paper-shade)] px-2 py-0.5 font-note text-[11px] italic text-[var(--ink)] shadow">
              <EditableText id="collage.note" defaultValue="happier than ever" />
            </span>
          </div>

          <div className="lg:col-span-3 lg:col-start-1 lg:-mt-64">
            <PhotoFrame id="c4" ratio="3 / 4" pin pinnable rotate={-1.4} />
          </div>

          <div className="lg:col-span-3 lg:col-start-4 lg:mt-0">
            <PhotoFrame id="c5" ratio="4 / 3" pin pinnable rotate={1.8} />
          </div>

          <div className="lg:col-span-3 lg:col-start-10 lg:-mt-4">
            <PhotoFrame id="c6" ratio="3 / 4" polaroid={false} pin pinnable rotate={-0.8} />
          </div>

          <div className="lg:col-span-3 lg:col-start-2 lg:-mt-6">
            <PhotoFrame id="c7" ratio="3 / 4" pin pinnable rotate={2.2} />
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:mt-2">
            <div className="mb-3 max-w-[15rem] text-[10px]">
              <EditableText
                className="tag-red"
                id="collage.wish2"
                multiline
                defaultValue={
                  "Semangat terus sayangku, terima kasih sudah selalu bercerita, ditunggu cerita menarik lainnya sayang"
                }
              />
            </div>
            <PhotoFrame id="c8" ratio="4 / 3" polaroid={false} pin pinnable rotate={0.4} />
          </div>

          <div className="max-w-[15rem] text-[10px] lg:col-span-3 lg:col-start-2 lg:self-end">
            <EditableText
              className="tag-red"
              id="collage.wish3"
              multiline
              defaultValue={"Jaga kesehatan na, semoga bisa segera berhenti merokok"}
            />
          </div>
        </div>

        <footer className="mt-14 text-center">
          <Hint>
            {desktop
              ? "Click any text to edit · + to add a photo · scroll to zoom, drag to move inside a frame · drag the red pin to place a photo anywhere"
              : "Tap any text to edit · + to add a photo · one finger to move, two fingers to zoom inside a frame"}
          </Hint>
        </footer>
      </div>
    </main>
  );
}
