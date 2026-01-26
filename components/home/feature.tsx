import Image from 'next/image'
import React from 'react'
import {
  Users,
  Infinity,
  PencilRuler,
  History,
  MonitorSmartphone,
  Share2,
} from "lucide-react";


export const features = [
  {
    title: "Real-Time Collaboration",
    description:
      "Work together on the same canvas with live cursors, instant updates, and seamless teamwork.",
    icon: Users,
  },
  {
    title: "Infinite Canvas",
    description:
      "Think without limits with an infinite whiteboard designed for deep visual thinking.",
    icon: Infinity,
  },
  {
    title: "Smart Drawing Tools",
    description:
      "Create diagrams, flows, and sketches using intelligent tools that keep everything clean and structured.",
    icon: PencilRuler,
  },
  {
    title: "Version History & Restore",
    description:
      "Track changes automatically and restore previous versions of your board anytime with confidence.",
    icon: History,
  },
  {
    title: "Multi-Device Access",
    description:
      "Access your boards anywhere with a seamless experience across desktop, tablet, and mobile.",
    icon: MonitorSmartphone,
  },
  {
    title: "Easy Sharing & Export",
    description:
      "Share boards instantly or export them as images or PDFs to keep everyone aligned.",
    icon: Share2,
  },
];

const Feature = () => {
  return (
    <div className='h-fit w-full bg-[#F1FEE1] relative z-10'>
      <div className='w-full absolute top-0 h-fit overflow-hidden'>
        <Image
          src={'/features-bg.svg'}
          alt='background'
          width={800}
          height={800}
          className='w-full scale-125 relative top-0'
        />
      </div>

      <div className='w-full h-full flex flex-col gap-4 items-center relative z-1 py-24 text-center px-4 sm:px-6 lg:px-0'>
        <div className='px-6 py-2 rounded-full xs:text-xs text-[16px] w-fit bg-[#B9FB6A] border-[1px] font-semibold text-[#0E0E0E]'>
          Core MindSketch Features
        </div>

        <div className='text-2xl xs:text-4xl font-bold'>
          Powerful Features For Visual Collaboration
        </div>

        <div className='text-sm xs:text-lg text-[#696969] max-w-xl'>
          Everything you need to brainstorm, plan, and collaborate visually in real time, without friction.
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-12 max-w-7xl mt-12">
          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="
              w-full h-[330px] rounded-xl bg-white
              px-6 sm:px-10 lg:px-16
              gap-5 flex flex-col justify-center
              text-center lg:text-left
            "
              >
                <div className="p-3 w-fit mx-auto lg:mx-0 rounded-xl border border-[#0E0E0E12] bg-gradient-to-b from-lime-200/70 to-white">
                  <Icon size={40} className="text-black" strokeWidth={1.25} />
                </div>

                <div className='text-xl font-semibold'>
                  {item.title}
                </div>

                <div className='text-[#696969]'>
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

  )
}

export default Feature
