import { useLayoutEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { AiOutlineInfoCircle } from "react-icons/ai";
import "./CheckoutNote.css";

/**
 * Admin-managed checkout note (Admin > App Content > Checkout note).
 * Long notes are clamped to `maxLines`; "Show more" opens the full note in a
 * modal (full-screen on small phones, centred + scrollable elsewhere).
 */
const CheckoutNote = ({ note, title = "Note from Smitox", maxLines = 4 }) => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [show, setShow] = useState(false);
  const trimmed = (note || "").trim();

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;

    const measure = () => setIsOverflowing(el.scrollHeight - el.clientHeight > 1);
    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [trimmed, maxLines]);

  if (!trimmed) return null;

  return (
    <div className="checkout-note" role="note">
      <div className="checkout-note-header">
        <AiOutlineInfoCircle aria-hidden="true" />
        <strong>{title}</strong>
      </div>
      <p
        ref={textRef}
        className="checkout-note-text is-clamped"
        style={{ WebkitLineClamp: maxLines }}
      >
        {trimmed}
      </p>
      {isOverflowing && (
        <button type="button" className="checkout-note-more" onClick={() => setShow(true)}>
          Show more
        </button>
      )}

      <Modal
        show={show}
        onHide={() => setShow(false)}
        centered
        scrollable
        fullscreen="sm-down"
        className="checkout-note-modal"
        aria-labelledby="checkout-note-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="checkout-note-title">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="checkout-note-full">{trimmed}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShow(false)}>
            Got it
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CheckoutNote;
