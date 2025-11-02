"use client";
import React, { useState } from "react";

const BookEvent = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 rounded-[5px] mt-3 bg-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>
          <button
            type="submit"
            className="button-submit mt-3 w-full p-3 rounded-[5px] font-semibold text-black bg-cyan-400 hover:bg-indigo-600"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};
export default BookEvent;
