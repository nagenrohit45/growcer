
import Hero from "../Components/Home/Hero";
import CategorySection from "../Components/Home/CategorySection";
import FeaturedProducts from "../Components/Home/FeaturedProducts";
import WhyChooseUs from "../Components/Home/WhyChooseUs";
import OfferBanner from "../Components/Home/OfferBanner";




const Home = ({ addToCart }) => {

  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts addToCart={addToCart} />

      <WhyChooseUs />
      <OfferBanner />

    </>
  );
};

export default Home;
