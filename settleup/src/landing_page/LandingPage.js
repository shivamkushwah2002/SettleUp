import Navbar from "../navbar/Navbar";
import AboutSection from "./components/AboutSection";
import FeaturesSection from "./components/FeaturesSection";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";

function LandingPage(){
    return(
    <>
 <Hero />
 <FeaturesSection/> 
 <HowItWorks /> 
 <AboutSection />
 <Footer />
   </>)
}
export default LandingPage;
