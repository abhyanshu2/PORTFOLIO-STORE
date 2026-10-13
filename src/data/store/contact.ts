export const WHATSAPP_NUMBER = "916206358342"; // +91 6206358342, wa.me format

export const STORE_CONTACT = [
  { label: "WhatsApp", value: "+91 6206358342", href: `https://wa.me/${WHATSAPP_NUMBER}` },
  { label: "Email", value: "abhyanshu2@gmail.com", href: "mailto:abhyanshu2@gmail.com" },
  { label: "GitHub", value: "github.com/abhyanshu2", href: "https://github.com/abhyanshu2" },
  { label: "LinkedIn", value: "linkedin.com/in/abhyanshu", href: "https://linkedin.com/in/abhyanshu" },
];

export function buildWhatsAppUrl(productName: string): string {
  const message = `Hello Abhyanshu,\n\nI want to purchase:\n\nProduct Name: ${productName}\n\nPlease share the payment details.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildHireMeUrl(serviceName: string): string {
  const message = `Hello Abhyanshu,\n\nI want to hire you for:\n\nService: ${serviceName}\n\nCan we discuss?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
