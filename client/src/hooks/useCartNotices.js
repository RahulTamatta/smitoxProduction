import axios from "axios";
import { useEffect, useState } from "react";

// Used only if the settings request fails. Normal text comes from
// Admin > App Content (checkout-settings endpoint).
export const DEFAULT_CART_NOTICES = {
  minimumOrderNotice: "Order total is below the minimum order amount {amount}.",
  courierChargeNotice: "Courier charge will be added (depends on weight and COD amount).",
  advancePaymentNotice: "{percent}% advance payment is available to confirm the order.",
};

/**
 * Cart notices + minimum order + advance % for pages that show them.
 * `notices` is null until loaded, so nothing static flashes before the
 * admin's text arrives. Empty text from the admin hides that line.
 */
const useCartNotices = () => {
  const [notices, setNotices] = useState(null);
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
        const next = { ...DEFAULT_CART_NOTICES };
        if (data?.success) {
          for (const key of Object.keys(next)) {
            if (typeof data[key] === "string") next[key] = data[key];
          }
        }
        if (alive) setNotices(next);
      } catch (error) {
        if (alive) setNotices(DEFAULT_CART_NOTICES);
      }
      try {
        const { data } = await axios.get("/api/v1/minimumOrder/getMinimumOrder");
        if (alive && data) {
          setMinimumOrder(Number(data.amount) || 0);
          setAdvancePercentage(Number(data.advancePercentage) || 0);
          setCurrency(data.currency === "rupees" ? "INR" : data.currency || "INR");
        }
      } catch (error) {
        // keep zeros: the minimum-order line simply stays hidden
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fill = (text) =>
    (text || "")
      .replaceAll(
        "{amount}",
        minimumOrder.toLocaleString("en-US", { style: "currency", currency })
      )
      .replaceAll("{percent}", String(advancePercentage));

  return { notices, minimumOrder, advancePercentage, currency, fill };
};

export default useCartNotices;
