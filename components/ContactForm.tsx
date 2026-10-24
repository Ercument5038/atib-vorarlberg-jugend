"use client";

import { ArrowUpRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useSiteSettings } from "@/components/SiteSettings";
import { translations } from "@/lib/translations";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const { language } = useSiteSettings();
  const copy = translations[language].form;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const email = String(data.get("email"));
    const subject = String(data.get("subject"));
    const body = String(data.get("message"));
    const mailSubject = subject === copy.options[0] ? copy.joinSubject : `${subject}: ${copy.subjectSuffix}`;
    const mailBody = `${copy.greeting}\n\n${body}\n\n${copy.regards}\n${name}\n${email}`;
    const mailto = `mailto:vlbg.jugend@atib.at?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

    setMessage(copy.status);
    window.location.href = mailto;
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          <span>{copy.name}</span>
          <input name="name" type="text" autoComplete="name" placeholder={copy.namePlaceholder} required />
        </label>
        <label>
          <span>{copy.email}</span>
          <input name="email" type="email" autoComplete="email" placeholder="name@beispiel.at" required />
        </label>
      </div>
      <label>
        <span>{copy.subject}</span>
        <select name="subject" key={language} defaultValue={copy.options[0]}>
          {copy.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        <span>{copy.message}</span>
        <textarea name="message" rows={5} placeholder={copy.messagePlaceholder} required />
      </label>
      <div className="form-footer">
        <p>{copy.privacy}</p>
        <button className="button button-dark" type="submit">
          {copy.submit} <ArrowUpRight size={19} />
        </button>
      </div>
      <p className="form-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
