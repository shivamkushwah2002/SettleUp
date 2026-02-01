import "./AboutSection.css";

export default function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="about-grid">
        <div className="about-text">
          <h2 className="section-title">About SettleUp</h2>
          <p>
            SettleUp helps groups track shared expenses with transparency and fairness.
            Built for students, travelers, roommates, and anyone who shares costs.
          </p>
        </div>

        <div className="about-card">
          <h3>Our Mission</h3>
          <p>
            To remove awkward money conversations and make splitting bills effortless,
            fair, and organized.
          </p>
          
        </div>
      </div>
    </section>
  );
}
