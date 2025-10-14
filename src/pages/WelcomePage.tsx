import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import "../pages/styles/WelcomePage.css";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { translate } = useLanguage();

  return (
    <section className="welcome-screen screen">
      <div className="welcome-hero surface-card">
        <div className="brand-block">
          <img src="/icons/icon-192.png" alt="Impact Centre Chretien" className="brand-logo animated-logo" />
          <div>
            <p className="tag">Impact Centre Chretien</p>
            <h1>{translate("welcome_title")}</h1>
            <p className="intro">{translate("welcome_subtitle")}</p>
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => navigate("/register")}>
            {translate("get_started")}
          </button>
          <button type="button" className="secondary" onClick={() => navigate("/login")}>
            {translate("login")}
          </button>
        </div>
      </div>

      <div className="surface-card welcome-footer">
        <p>
          Application web progressive (PWA) optimisee mobile. Ajoutez-la sur votre ecran d accueil pour un acces rapide.
        </p>
        <p>Mode clair, textes lisibles et navigation simplifiee sur tous vos appareils.</p>
      </div>
    </section>
  );
}
