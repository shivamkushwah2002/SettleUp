import "./HowItWorks.css";

export default function HowItWorks() {
  const steps = [
    { title: "Create a Group", desc: "Add your friends, roommates, or travel buddies." },
    { title: "Add Expenses", desc: "Record who paid and how the cost should be shared." },
    { title: "Settle Up", desc: "View balances and settle payments easily." },
  ];

  return (
    <section className="how-section" id="how">
      <h2 className="section-title">How It Works</h2>

      <div className="how-grid">
        {steps.map((s, i) => (
          <div className="how-card" key={i}>
            <div className="step-number">{i + 1}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
