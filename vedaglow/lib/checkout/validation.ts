import type { Address, CustomerInformation } from "@/types";
import { stateCode } from "@/lib/shipping/rules";
export type Errors = Record<string, string>;
/** Shipping labels and rates are set up for the United States only (international needs customs forms). */
export const COUNTRIES = ["United States"];
export const emptyAddress = (): Address => ({ first_name: "", last_name: "", address1: "", address2: "", city: "", state: "", zip: "", country: "United States" });
export function validateContact(c: CustomerInformation): Errors {
  const e: Errors = {};
  if (!c.email.trim()) e.email = "Please enter your email address."; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Please enter a valid email address.";
  const digits = c.phone.replace(/\D/g, "");
  if (!c.phone.trim()) e.phone = "Please enter your phone number."; else if (!/^[+\d\s().-]+$/.test(c.phone) || digits.length < 7 || digits.length > 15) e.phone = "Please enter a valid phone number.";
  return e;
}
export function validateAddress(a: Address): Errors {
  const e: Errors = {};
  if (!a.first_name.trim()) e.first_name = "Please enter your first name.";
  if (!a.last_name.trim()) e.last_name = "Please enter your last name.";
  if (!a.address1.trim()) e.address1 = "Please enter your street address.";
  if (!a.city.trim()) e.city = "Please enter your city.";
  if (!a.state.trim()) e.state = "Please select your state."; else if (a.country === "United States" && !stateCode(a.state)) e.state = "Please select a valid US state.";
  if (!a.zip.trim()) e.zip = "Please enter your ZIP code."; else if (a.country === "United States" && !/^\d{5}(-\d{4})?$/.test(a.zip.trim())) e.zip = "Please enter a valid 5-digit ZIP code.";
  if (!a.country.trim()) e.country = "Please select your country.";
  return e;
}
