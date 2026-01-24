"use client";

import Feature from "@/components/home/feature";
import Footer from "@/components/home/footer";
import Header from "@/components/home/header";
import Hero from "@/components/home/hero";

const Home = () => {
    return (
        <>
            <div>
                <Header />
                <Hero />
                <Feature />
                <Footer />
            </div>
        </>
    );
};

export default Home;
