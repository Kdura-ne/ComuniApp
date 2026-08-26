"use client";

import { useEffect, useId, useRef } from "react";

export default function AdminModal({
  title,
  description,
  onClose,
  children,
  size = "large",
}) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onCloseRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const widthClass = size === "small" ? "max-w-md" : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`max-h-[92dvh] w-full ${widthClass} overflow-y-auto rounded-t-[20px] bg-white shadow-2xl sm:rounded-[20px]`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-[#1a2e23] px-4 py-4 text-white">
          <div>
            <h2 id={titleId} className="font-display text-lg font-black">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-xs text-white/65">
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-lg font-bold transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
