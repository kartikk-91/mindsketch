"use client";
import React from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'


const Hero = () => {
  const router=useRouter();
  return (
    <div className='h-[100vh] w-full flex flex-col justify-center items-center pt-12 sm:pt-0'>
      <div className='max-w-5xl w-full h-fit flex flex-col gap-y-6 items-center text-center px-6 md:px-0'>
        <div className='px-6 py-2 rounded-full bg-[#F1FEE1] border-[1px] sm:text-xl font-semibold text-[#0E0E0E]'>Think. Sketch. Collaborate.</div>
        <div className='text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold'>Ideas Deserve Space <br />
          To Grow Together Visually</div>
        <div className='sm:text-xl text-[#696969] max-w-xl md:max-w-2xl mt-4'>MindSketch helps visual teams brainstorm ideas, sketch workflows, and collaborate in real time, all in one whiteboard.</div>
        <div className='rounded-full w-full max-w-xl h-16 hidden sm:flex gap-4 items-center justify-center border-2 p-2 bg-white'>
          <Input
            type="text"
            placeholder="Your email address"
            className="!text-[16px] border-none !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none outline-none"
          />

          <Button className="rounded-full h-full border-[1px] text-md px-6 pr-2 flex">
            Request a Demo
            <span className="rounded-full w-8 h-full bg-white text-black flex items-center justify-center">
              <ArrowRight />
            </span>
          </Button>
        </div>
        <div className='w-full max-w-lg flex sm:hidden flex-col gap-4 items-center justify-center '>
          <Input
            type="text"
            placeholder="Your email address"
            className="!text-[16px] !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none outline-none rounded-full bg-white h-16 border-2 p-4 max-w-sm"
          />

          <Button className="rounded-full h-full border-[1px] text-md px-6 pr-2 flex">
            Request a Demo
            <span className="rounded-full w-8 h-full bg-white text-black flex items-center justify-center">
              <ArrowRight />
            </span>
          </Button>
        </div>
        <Button onClick={() => router.push("/sign-in")} className="rounded-full h-8 bg-transparent border-[1px] hover:bg-transparent text-sm text-black px-4 pr-1 flex sm:hidden cursor-pointer">
            Log in
            <span className="rounded-full w-4 h-full bg-white text-black flex items-center justify-center">
              <ArrowRight size={8}/>
            </span>
          </Button>
      </div>
    </div>
  )
}

export default Hero
