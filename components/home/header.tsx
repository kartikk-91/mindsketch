'use client'

import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { ArrowRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const navItems = ['home', 'features', 'pricing', 'about', 'contact']

const Header = () => {
  const router=useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`px-6 md:px-16 lg:px-4 xl:px-16 py-4 w-full h-22 fixed top-0 z-40 flex justify-between items-center transition-all duration-300
          ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-[#0E0E0E12]' : 'bg-transparent'}
        `}
      >
        <div className="w-[50%] lg:w-[20%] xl:w-[25%]">
          <Image src="/logo.png" alt="Mindsketch" width={200} height={55} />
        </div>

        <ul className="hidden lg:flex w-full max-w-xl xl:max-w-2xl h-full border-[1px] bg-white rounded-full justify-between px-12 items-center">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="text-lg capitalize cursor-pointer transition-opacity hover:opacity-70"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="w-[15%] xl:w-[25%] h-full py-1 flex justify-end gap-4">
          <Button onClick={() => router.push("/sign-in")} className="rounded-full h-full bg-transparent border-[1px] hover:bg-transparent text-md text-black px-6 pr-2 hidden xl:flex">
            Log in
            <span className="rounded-full w-8 h-full bg-white text-black flex items-center justify-center">
              <ArrowRight />
            </span>
          </Button>

          <Button onClick={() => router.push("/sign-up")} className="rounded-full h-full border-[1px] text-md px-6 pr-2 hidden lg:flex">
            Sign Up
            <span className="rounded-full w-8 h-full bg-white text-black flex items-center justify-center">
              <ArrowRight />
            </span>
          </Button>

          <button
            className="lg:hidden flex items-center justify-center"
            onClick={() => setOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute right-0 top-0 h-full w-[280px] bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mb-6"
                onClick={() => setOpen(false)}
              >
                <X size={28} />
              </button>

              <ul className="flex flex-col gap-6">
                {navItems.map((item, index) => (
                  <li
                    key={index}
                    className="text-lg capitalize cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-4">
                <Button onClick={() => router.push("/sign-in")} className="rounded-full border">Log in</Button>
                <Button onClick={() => router.push("/sign-up")} className="rounded-full">Sign Up</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
