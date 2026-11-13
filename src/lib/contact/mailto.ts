export interface ContactFormInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(
  input: ContactFormInput
): { valid: true; cleaned: ContactFormInput } | { valid: false; errors: ContactFormErrors } {
  const errors: ContactFormErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length > 100) {
    errors.name = "Name must be 100 characters or fewer.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(email) || email.length > 160) {
    errors.email = "Please enter a valid email address (for example, name@example.com).";
  }

  if (!subject) {
    errors.subject = "Please enter a subject line.";
  } else if (subject.length > 140) {
    errors.subject = "Subject must be 140 characters or fewer.";
  }

  if (!message) {
    errors.message = "Please enter a short message.";
  } else if (message.length < 10) {
    errors.message = "Message should be at least 10 characters long.";
  } else if (message.length > 3000) {
    errors.message = "Message must be 3000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    cleaned: { name, email, subject, message },
  };
}

export function buildMailtoHref(
  recipientEmail: string,
  values: ContactFormInput
): string {
  const cleanRecipient = recipientEmail.trim();
  const bodyLines = [
    values.message.trim(),
    "",
    "---",
    `From: ${values.name.trim()} (${values.email.trim()})`,
  ];
  const encodedSubject = encodeURIComponent(values.subject.trim());
  const encodedBody = encodeURIComponent(bodyLines.join("\r\n"));
  return `mailto:${cleanRecipient}?subject=${encodedSubject}&body=${encodedBody}`;
}
