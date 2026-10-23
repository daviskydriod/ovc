import type { QuoteField, QuoteRequest, QuoteValidation } from "@/types/quote";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateQuote(input: QuoteRequest): QuoteValidation {
  const values = {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    service: input.service.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
  };
  const errors: Partial<Record<QuoteField, string>> = {};
  if (values.fullName.length < 2 || values.fullName.length > 120) errors.fullName = "Enter your full name (2–120 characters).";
  if (values.phone.length < 7 || values.phone.length > 40) errors.phone = "Enter a phone number we can use to contact you.";
  if (!emailPattern.test(values.email) || values.email.length > 254) errors.email = "Enter a valid email address.";
  if (!values.service || values.service.length > 120) errors.service = "Choose the service you need.";
  if (values.location.length < 2 || values.location.length > 160) errors.location = "Enter the project location (2–160 characters).";
  if (values.description.length < 10 || values.description.length > 3000) errors.description = "Describe the project in 10–3,000 characters.";
  return { values, errors };
}
