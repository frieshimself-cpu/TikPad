import Image from "next/image";
import logo from "../../public/logo.png";

/** The mascot, with the two possible outcomes scribbled around it. */
export function HeroArt() {
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[460px]" aria-hidden>
      <div className="float-a absolute left-1/2 top-6 w-[340px] -translate-x-1/2">
        <Image src={logo} alt="" width={340} height={340} priority className="mix-blend-multiply" />
      </div>

      {/* "this guy is fine" */}
      <div className="float-b absolute -left-2 top-2 rotate-[-8deg]">
        <div className="card card-yellow px-4 py-2 font-display text-sm">
          drawn by a person
          <br />
          <span className="text-green">→ can deploy</span>
        </div>
      </div>

      {/* "this one is NOT fine" */}
      <div className="float-a absolute -right-2 bottom-24 rotate-[6deg]">
        <div className="card px-4 py-2 font-display text-sm">
          made by midjourney
          <br />
          <span className="text-rose">→ NO!!!</span>
        </div>
      </div>

      {/* arrow */}
      <svg className="absolute bottom-6 left-10 h-24 w-40" viewBox="0 0 160 100" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 85c30-10 60-50 110-55" />
        <path d="M100 20l22 8-10 20" />
      </svg>
      <div className="absolute bottom-0 left-2 rotate-[-4deg] font-display text-lg">this is the gate btw</div>
    </div>
  );
}
