"use client";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { api, track } from "@/lib/client";

declare global {
  interface Window {
    Calendly?: { initInlineWidget: (o: Record<string, unknown>) => void };
  }
}

export default function BookingPanel({
  session, contact,
}: { session: { leadId: string; token: string }; contact: { fullName: string; email: string; phone: string } }) {
  const [open, setOpen] = useState(false);
  const [booked, setBooked] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !host.current) return;
    const init = () =>
      window.Calendly?.initInlineWidget({
        url: site.calendlyUrl,
        parentElement: host.current,
        prefill: { name: contact.fullName, email: contact.email, customAnswers: { a1: contact.phone } },
        // utm_content carries the lead id so the webhook can match the booking.
        utm: { utmSource: "breeze-review", utmContent: session.leadId },
      });
    if (window.Calendly) return init();
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [open, contact, session.leadId]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://calendly.com") return;
      if (e.data?.event === "calendly.event_scheduled") {
        setBooked(true);
        track("booking_completed", session);
        void api("/api/booking", "POST", { ...session, status: "scheduled" });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [session]);

  return (
    <section id="book" className="card scroll-mt-6" aria-labelledby="book-h">
      <h2 id="book-h" className="text-2xl">{booked ? "You're booked. Talk soon!" : "Ready to talk it through?"}</h2>
      {booked ? (
        <p className="mt-2 text-breeze-navy-text">You'll get a confirmation email with the details. Your results are saved so your agent can start where you left off.</p>
      ) : (
        <>
          <p className="mt-2 text-breeze-navy-text">A licensed agent can go over your results with you. It's free, and there's no obligation.</p>
          {!open && (
            <button
              className="btn-primary mt-6"
              onClick={() => { setOpen(true); track("booking_clicked", session, { from: "panel" }); void api("/api/booking", "POST", { ...session, status: "clicked" }); }}
            >
              {site.bookingCta} <span aria-hidden>&rarr;</span>
            </button>
          )}
          {open && <div ref={host} className="mt-6 min-h-[700px] w-full" />}
        </>
      )}
    </section>
  );
}
