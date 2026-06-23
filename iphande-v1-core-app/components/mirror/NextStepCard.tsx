"use client";
import { useRouter } from "next/navigation";

export function NextStepCard({ event_id }: { event_id: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() =>
        router.push(
          `http://localhost:3000/events/${event_id}?source=iphande`
        )
      }
    >
      Inspect in AXIONYX
    </button>
  );
}
