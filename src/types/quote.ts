export type QuoteField = "fullName" | "phone" | "email" | "service" | "location" | "description";

export type QuoteRequest = {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  description: string;
};

export type QuoteValidation = {
  values: QuoteRequest;
  errors: Partial<Record<QuoteField, string>>;
};
