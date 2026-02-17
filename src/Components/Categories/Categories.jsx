import { useNavigate } from "react-router-dom";
import styles from "../../Styles/Categories.module.css";

import vegetables from "../../assets/images/categories/vegetables.jpg";
import fruits from "../../assets/images/categories/fruits.jpg";
import dairy from "../../assets/images/categories/dairy.jpg";
import essentials from "../../assets/images/categories/essentials.jpg";


const categoryData = [
  {
    id: 1,
    name: "Vegetables",
    image: vegetables,
    route: "/products/vegetables",
  },
  {
    id: 2,
    name: "Fruits",
    image: fruits,
    route: "/products/fruits",
  },
  {
    id: 3,
    name: "Dairy",
    image: dairy,
    route: "/products/dairy",
  },
  {
    id: 4,
    name: "Daily Essentials",
    image: essentials,
    route: "/products/essentials",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.categoriesSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Shop by Category</h2>

        <div className="row">
          {categoryData.map((cat) => (
            <div key={cat.id} className="col-lg-3 col-md-6 mb-4">
              <div
                className={styles.categoryCard}
                onClick={() => navigate(cat.route)}
              >
                <img src={cat.image} alt={cat.name} />
                <div className={styles.overlay}>
                  <h5>{cat.name}</h5>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Categories;
