import "./FeaturesSection.css";

export default function FeaturesSection() {
  const features = [
    {
      title: "Track Expenses Easily",
      description: "Add shared expenses in seconds with clean and simple inputs.",
    },
    {
      title: "Fair Split Options",
      description: "Split equally, custom, or percentage based — whatever works for your group.",
    },
    {
      title: "Real-time Balances",
      description: "See who owes whom with automatic balance updates.",
    },
    {
      title: "Clear Activity Logs",
      description: "Stay transparent with full history and bill breakdowns.",
    },
  ];

  return (
    <section className="features-section" id="features">
      <h2 className="section-title">Why Choose SettleUp?</h2>
      <p className="section-subtitle">
        Simple, fair, and designed to keep group expenses stress-free.
      </p>

      <div className="features-grid">
        {features.map((f, index) => (
          <div className="feature-card" key={index}>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
