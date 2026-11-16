import axios from "axios";
import { useEffect, useState } from "react";

/**
 * Cart notes = the red lines under the cart total. The admin manages them as a
 * list in Admin > App Content > Cart page notes. Each note is
 * { text, showWhen } where text may use {amount} (minimum order) and
 * {percent} (advance %).
 */
export const NOTE_CONDITIONS = [
  { value: "always", label: "Always show" },
  { value: "below_minimum", label: "Only when the cart is below the minimum order" },
  { value: "advance_enabled", label: "Only when advance payment is enabled" },
];

// Used only if the settings request fails.
export const DEFAULT_CART_NOTES = [
  { text: "Order total is below the minimum order amount {amount}.", showWhen: "below_minimum" },
  { text: "Courier charge will be added (depends on weight and COD amount).", showWhen: "always" },
  { text: "{percent}% advance payment is available to confirm the order.", showWhen: "advance_enabled" },
];

const cleanNotes = (list) =>
  list
    .map((n) => ({
      text: String(n?.text ?? "").trim(),
      showWhen: NOTE_CONDITIONS.some((c) => c.value === n?.showWhen) ? n.showWhen : "always",
    }))
    .filter((n) => n.text);

/** Notes from a checkout-settings response (new list, or the 3 legacy fields). */
export const notesFromSettings = (data) => {
  if (Array.isArray(data?.cartNotes)) return cleanNotes(data.cartNotes);
  const legacy = [
    { text: data?.minimumOrderNotice, showWhen: "below_minimum" },
    { text: data?.courierChargeNotice, showWhen: "always" },
    { text: data?.advancePaymentNotice, showWhen: "advance_enabled" },
  ].filter((n) => typeof n.text === "string");
  return legacy.length ? cleanNotes(legacy) : DEFAULT_CART_NOTES;
};

/** Which notes apply to this cart right now. */
export const visibleNotes = (notes, { total, minimumOrder, advancePercentage }) =>
  (notes || []).filter((n) => {
    if (!n?.text?.trim()) return false;
    if (n.showWhen === "below_minimum") return minimumOrder > 0 && total < minimumOrder;
    if (n.showWhen === "advance_enabled") return advancePercentage > 0;
    return true;
  });

export const fillNote = (text, { minimumOrder, advancePercentage, currency = "INR" }) =>
  String(text || "")
    .replaceAll("{amount}", Number(minimumOrder || 0).toLocaleString("en-US", { style: "currency", currency }))
    .replaceAll("{percent}", String(advancePercentage ?? 0));

/**
 * For pages that show the notes (customer Orders view). `notes` is null until
 * loaded, so nothing static flashes before the admin's text arrives.
 */
const useCartNotices = () => {
  const [notes, setNotes] = useState(null);
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [advancePercentage, setAdvancePercentage] = useState(0);
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get("/api/v1/app-content/checkout-settings", {
          headers: { "Cache-Control": "no-cache" },
        });
        if (alive) setNotes(data?.success ? notesFromSettings(data) : DEFAULT_CART_NOTES);
      } catch (error) {
        if (alive) setNotes(DEFAULT_CART_NOTES);
      }
      try {
        const { data } = await axios.get("/api/v1/minimumOrder/getMinimumOrder");
        if (alive && data) {
          setMinimumOrder(Number(data.amount) || 0);
          setAdvancePercentage(Number(data.advancePercentage) || 0);
          setCurrency(data.currency === "rupees" ? "INR" : data.currency || "INR");
        }
      } catch (error) {
        // keep zeros: below-minimum / advance notes simply stay hidden
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fill = (text) => fillNote(text, { minimumOrder, advancePercentage, currency });
  const visible = (total) => visibleNotes(notes, { total, minimumOrder, advancePercentage });

  return { notes, minimumOrder, advancePercentage, currency, fill, visible };
};

export default useCartNotices;
