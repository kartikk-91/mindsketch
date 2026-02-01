"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-stroke bg-white">
      <div className="mx-auto max-w-c-1390 px-4 sm:px-6 md:px-8 2xl:px-0">
                <div className="py-16 sm:py-20 lg:py-25">
          <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-0">
                        <motion.div
              variants={{
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
              className="w-full text-center lg:w-1/4 lg:text-left"
            >
              <Link href="/" className="relative inline-block">
                <Image
                  width={200}
                  height={80}
                  src="/logo.png"
                  alt="Logo"
                />
              </Link>

              <p className="mt-5 max-w-sm mx-auto lg:mx-0">
                Why Wait? Let&apos;s Create!
              </p>
            </motion.div>

                        <div className="flex w-full flex-col gap-12 md:flex-row md:justify-between lg:w-2/3 xl:w-7/12">
                            <motion.div
                variants={{
                  hidden: { opacity: 0, y: -20 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 1, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center md:text-left"
              >
                <h4 className="mb-6 text-itemtitle2 font-medium text-black">
                  Quick Links
                </h4>

                <ul>
                  {["Home", "Product", "Careers", "Pricing"].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="mb-3 inline-block hover:text-primary"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

                            <motion.div
                variants={{
                  hidden: { opacity: 0, y: -20 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 1, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center md:text-left"
              >
                <h4 className="mb-6 text-itemtitle2 font-medium text-black">
                  Support
                </h4>

                <ul>
                  {["Company", "Press Media", "Our Blog", "Contact Us"].map(
                    (item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="mb-3 inline-block hover:text-primary"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </motion.div>

                            <motion.div
                variants={{
                  hidden: { opacity: 0, y: -20 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 1, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center md:text-left"
              >
                <h4 className="mb-6 text-itemtitle2 font-medium text-black">
                  Newsletter
                </h4>

                <p className="mb-4 max-w-xs mx-auto md:mx-0">
                  Subscribe to receive future updates
                </p>

                <div className="relative max-w-sm mx-auto md:mx-0">
                  <input
                    type="text"
                    placeholder="Email address"
                    className="w-full rounded-full border border-stroke px-6 py-3 focus:outline-none"
                  />
                  <button
                    aria-label="signup to newsletter"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-4"
                  >
                    →
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

                <div className="flex flex-col gap-6 border-t border-stroke py-7 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-center lg:text-left">
            &copy; {new Date().getFullYear()} MindSketch. All rights reserved
          </p>

          <ul className="flex justify-center gap-6">
            <li>
              <a href="#" className="hover:text-primary">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary">
                Support
              </a>
            </li>
          </ul>

          <ul className="flex justify-center gap-5">
            <li><a href="#">FB</a></li>
            <li><a href="#">TW</a></li>
            <li><a href="#">IN</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
