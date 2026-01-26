"use client";

import Feature from "@/components/home/feature";
import Footer from "@/components/home/footer";
import Header from "@/components/home/header";
import Hero from "@/components/home/hero";
import Preview from "@/components/home/preview";
import Image from "next/image";

const Home = () => {
    return (
        <>
            <div>
                <div className="absolute top-0 -z-1 w-full overflow-x-hidden">
                    <Image
                        src="/hero-banner.svg"
                        alt="hero"
                        width={1000}
                        height={800}
                        className="w-full h-[80vh] sm:h-auto scale-y-150 sm:scale-y-100 scale-x-125 origin-center"
                        priority
                    />
                </div>
                <div className="hidden sm:block absolute w-[500px] h-[500px] -left-[250px] -top-[150px]">
                    <Image
                        src="/particles.svg"
                        alt="particles"
                        fill
                        className="object-cover pointer-events-none"
                        priority
                    />
                </div>
                <div className="hidden sm:block absolute w-[500px] h-[500px] -right-[250px] -top-[150px]">
                    <Image
                        src="/particles.svg"
                        alt="particles"
                        fill
                        className="object-cover pointer-events-none"
                        priority
                    />
                </div>


                <Header />
                <Hero />
                <Preview />
                <Feature />
                <Footer />
    
            </div>
        </>
    );
};

export default Home;
