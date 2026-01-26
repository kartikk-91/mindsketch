'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

const Preview = () => {
  return (
    <div className="h-fit w-full flex justify-center py-12 overflow-hidden -mt-12 sm:mt-0 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: 'easeOut',
        }}
        className="w-full max-w-7xl px-6 md:px-0"
      >
        <Image
          src="/banner.png"
          alt="mindsketch preview"
          width={800}
          height={800}
          className="w-full h-fit rounded-[40px]"
          priority
        />
      </motion.div>
    </div>
  )
}

export default Preview
