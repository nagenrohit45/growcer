import { useNavigate } from "react-router-dom";

import heroBg from "../../assets/images/hero.png";
import styles from "../../Styles/Hero.module.css";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      className="hero-section d-flex align-items-center"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "80vh",
      }}
    >
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-6">
            <h1 className="fw-bold display-4 mt-3 text-dark">
              Fresh Groceries for <br />
              <span className="text-success">Your Daily Needs</span>
            </h1>

            <p className={`${styles.heroText} ${styles.hideMobile}`}>
              Get farm-fresh vegetables, fruits, and daily essentials delivered
              to your doorstep in minutes.
            </p>

            <div className={styles.mobileFooter}>
              <div className={styles.heroButtons}>
                <button
                  className={`${styles.heroBtn} btn btn-success`}
                  onClick={() => navigate("/products/vegetables")}>
                  Shop Now
                </button>

                <button
                  className={`${styles.heroBtn} btn btn-outline-success`}
                  onClick={() => navigate("/categories")}>
                  Explore Categories
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
