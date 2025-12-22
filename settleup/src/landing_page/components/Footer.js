import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} SettleUp. All rights reserved.</p>
    </footer>
  );
}
