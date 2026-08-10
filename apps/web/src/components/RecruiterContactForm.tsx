"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/lib/site";

const MAX_MESSAGE_CHARS = 1200;

export function RecruiterContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return;
    }

    const subject = encodeURIComponent(`DocuMind inquiry from ${trimmedName}`);
    const body = encodeURIComponent(
      `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    router.push("/thank-you");
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-ink/65">
        Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-teal underline-offset-2 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        {" · "}
        Phone{" "}
        <a
          href={`tel:${CONTACT_PHONE_E164}`}
          className="font-medium text-teal underline-offset-2 hover:underline"
        >
          {CONTACT_PHONE_DISPLAY}
        </a>
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block text-sm text-ink/80">
          Name
          <input
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white/80 px-3 py-2.5 text-ink outline-none ring-teal/40 focus:ring-2"
          />
        </label>
        <label className="block text-sm text-ink/80">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white/80 px-3 py-2.5 text-ink outline-none ring-teal/40 focus:ring-2"
          />
        </label>
        <label className="block text-sm text-ink/80">
          Message
          <textarea
            required
            name="message"
            rows={5}
            maxLength={MAX_MESSAGE_CHARS}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-xl border border-ink/15 bg-white/80 px-3 py-2.5 text-ink outline-none ring-teal/40 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal/90"
        >
          Send inquiry
        </button>
      </form>
    </div>
  );
}
