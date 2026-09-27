"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function FooterUpdates() {
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState("");

  function subscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setNotice("Enter a valid email address.");
      return;
    }
    /* No backend yet: honest pending state, never a fake success. */
    setNotice("Mavent updates are not open yet. Check back soon.");
  }

  return (
    <div className="footer-updates">
      <form className="footer-updates-form" onSubmit={subscribe} noValidate>
        <label htmlFor="footer-email" className="sr-only">
          Email for Mavent product updates
        </label>
        <input
          id="footer-email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setNotice("");
          }}
        />
        <button type="submit" aria-label="Request Mavent product updates">
          <ArrowRight aria-hidden="true" />
        </button>
      </form>
      {notice ? (
        <p className="footer-updates-notice" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
