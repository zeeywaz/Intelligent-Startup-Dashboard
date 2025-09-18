import React, { useState } from "react";
import "../styles/Contact.css";
import Header from "../components/Header";
import Footer from "../components/footer";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <div className="contact-wrapper">
        <div className="contact-card">
          <h1>Contact Us</h1>
          <p>
            Have questions, suggestions, or want to collaborate? Fill out the
            form below and our team will get back to you shortly.
          </p>

          {!submitted ? (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name">Your Name</label>
                <input type="text" id="name" name="name" required />
              </div>

              <div>
                <label htmlFor="email">Your Email</label>
                <input type="email" id="email" name="email" required />
              </div>

              <div>
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>

              <button type="submit">Send Message</button>
            </form>
          ) : (
            <div className="contact-success">
              <h2>Thank you!</h2>
              <p>
                Your message has been submitted successfully. Our team will get
                back to you soon.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
