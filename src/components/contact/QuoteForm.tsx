"use client";

import { FormEvent, useId, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { services } from "@/data/services";
import { validateQuote } from "@/lib/quote-validation";
import type { QuoteField, QuoteRequest } from "@/types/quote";

const initialValues: QuoteRequest = { fullName: "", phone: "", email: "", service: "", location: "", description: "" };

export default function QuoteForm({ initialService = "" }: { initialService?: string }) {
  const formId = useId();
  const [values, setValues] = useState<QuoteRequest>({ ...initialValues, service: initialService });
  const [errors, setErrors] = useState<Partial<Record<QuoteField, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  function update(field: QuoteField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
    setMessage("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateQuote(values);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) {
      setSubmitted(false);
      setMessage("Please correct the fields shown below.");
      const firstInvalid = Object.keys(result.errors)[0];
      document.getElementById(`${formId}-${firstInvalid}`)?.focus();
      return;
    }
    setValues({ ...initialValues, service: initialService });
    setSubmitted(true);
    setMessage("Preview only: your enquiry has not been sent or stored. Contact OVC directly using the phone numbers on this page.");
  }

  function fieldError(field: QuoteField) {
    return errors[field] ? <span className="field-error" id={`${formId}-${field}-error`}>{errors[field]}</span> : null;
  }
  const describedBy = (field: QuoteField) => errors[field] ? `${formId}-${field}-error` : undefined;

  if (submitted) {
    return <div className="form-result form-result-success" role="status" aria-live="polite"><span className="form-result-icon"><Check size={22} aria-hidden="true" /></span><p className="eyebrow">Preview enquiry</p><h3>Thanks — the preview form works.</h3><p>{message}</p><button className="button button-outline-dark" type="button" onClick={() => { setSubmitted(false); setMessage(""); }}>Send another preview enquiry</button></div>;
  }

  return (
    <form className="quote-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="form-field"><label htmlFor={`${formId}-fullName`}>Full name <span aria-hidden="true">*</span></label><input id={`${formId}-fullName`} name="fullName" autoComplete="name" required maxLength={120} value={values.fullName} onChange={(event) => update("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={describedBy("fullName")} />{fieldError("fullName")}</div>
        <div className="form-field"><label htmlFor={`${formId}-phone`}>Phone number <span aria-hidden="true">*</span></label><input id={`${formId}-phone`} name="phone" type="tel" autoComplete="tel" required maxLength={40} value={values.phone} onChange={(event) => update("phone", event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone")} />{fieldError("phone")}</div>
        <div className="form-field"><label htmlFor={`${formId}-email`}>Email address <span aria-hidden="true">*</span></label><input id={`${formId}-email`} name="email" type="email" autoComplete="email" required maxLength={254} value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} />{fieldError("email")}</div>
        <div className="form-field"><label htmlFor={`${formId}-service`}>Service required <span aria-hidden="true">*</span></label><select id={`${formId}-service`} name="service" required value={values.service} onChange={(event) => update("service", event.target.value)} aria-invalid={Boolean(errors.service)} aria-describedby={describedBy("service")}><option value="">Select a service</option>{services.map((service) => <option key={service.id} value={service.title}>{service.title}</option>)}</select>{fieldError("service")}</div>
        <div className="form-field form-field-wide"><label htmlFor={`${formId}-location`}>Project location <span aria-hidden="true">*</span></label><input id={`${formId}-location`} name="location" autoComplete="address-level2" required maxLength={160} value={values.location} onChange={(event) => update("location", event.target.value)} aria-invalid={Boolean(errors.location)} aria-describedby={describedBy("location")} />{fieldError("location")}</div>
        <div className="form-field form-field-wide"><label htmlFor={`${formId}-description`}>Project description <span aria-hidden="true">*</span></label><textarea id={`${formId}-description`} name="description" required minLength={10} maxLength={3000} rows={5} value={values.description} onChange={(event) => update("description", event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={describedBy("description")} placeholder="Tell us about the work you have in mind." />{fieldError("description")}</div>
      </div>
      <p className="form-required-note"><span aria-hidden="true">*</span> Required fields</p>
      <div className="form-submit-row"><button className="button button-gold" type="submit">Submit preview enquiry <ArrowRight size={17} aria-hidden="true" /></button><p>Preview only — details are not sent or saved.</p></div>
      {message && <p className="form-message form-message-error" role="alert" aria-live="polite">{message}</p>}
    </form>
  );
}
