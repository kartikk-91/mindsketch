"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import menuData from "./menu-data";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

const Header = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // Sticky menu handler
  useEffect(() => {
    const handleStickyMenu = () => {
      setStickyMenu(window.scrollY >= 80);
    };

    window.addEventListener("scroll", handleStickyMenu);
    return () => window.removeEventListener("scroll", handleStickyMenu);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full py-7 ${
        stickyMenu
          ? "bg-white !py-4 shadow transition duration-100 dark:bg-black"
          : ""
      }`}
    >
      <div className="relative mx-auto max-w-c-1390 items-center justify-between px-4 md:px-8 xl:flex 2xl:px-0">
        {/* Logo */}
        <div className="flex w-full items-center justify-between xl:w-1/4">
          <Link href="/" className="flex items-end gap-2">
            <Image
              src="/logo.png"
              alt="logo"
              width={60}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/logo.png"
              alt="logo"
              width={60}
              height={30}
              className="hidden dark:block"
            />
            <span className={cn("font-semibold text-2xl", font.className)}>
              MindSketch
            </span>
          </Link>

          {/* Mobile toggle */}
          <button
            aria-label="Toggle Menu"
            className="block xl:hidden"
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            ☰
          </button>
        </div>

        {/* Navigation */}
        <div
          className={`${
            navigationOpen ? "block" : "hidden"
          } xl:flex xl:items-center xl:justify-between xl:w-full`}
        >
          <nav>
            <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
              {menuData.map((menuItem, key) => (
                <li key={key} className="relative">
                  {menuItem.submenu ? (
                    <>
                      <button
                        onClick={() => setDropdownToggler(!dropdownToggler)}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        {menuItem.title}
                      </button>

                      {dropdownToggler && (
                        <ul className="absolute top-full mt-2 rounded bg-white p-4 shadow">
                          {menuItem.submenu.map((item, idx) => (
                            <li key={idx}>
                              <Link
                                href={item.path || "#"}
                                className="block py-1 hover:text-primary"
                              >
                                {item.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={menuItem.path || "#"}
                      className={
                        pathname === menuItem.path
                          ? "text-primary"
                          : "hover:text-primary"
                      }
                    >
                      {menuItem.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Right actions */}
          <div className="mt-6 flex items-center gap-6 xl:mt-0">
            <Link
              href="https://github.com/kartik1809/mindsketch"
              className="text-regular font-medium text-waterloo hover:text-primary"
            >
              GitHub Repo 🌟
            </Link>

            {/* ✅ SAFE SIGN IN BUTTON */}
            <button
              onClick={() => router.push("/sign-in")}
              className="flex items-center justify-center rounded-full bg-primary px-7.5 py-2.5 text-regular text-white duration-300 hover:bg-primaryho"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
