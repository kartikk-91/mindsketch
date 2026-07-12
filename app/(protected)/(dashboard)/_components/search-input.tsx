"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { ChangeEvent, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

export const SearchInput = () => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const debouncedValue = useDebounceValue(value, 500);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    const url = qs.stringifyUrl(
      {
        url: "/",
        query: {
          search: debouncedValue[0],
        },
      },
      { skipEmptyString: true, skipNull: true }
    );

    router.push(url);
  }, [debouncedValue, router]);

  return (
    <div className="w-full relative">
      <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-[#999AA1] h-4 w-4" />
      <Input
        className="w-full max-w-[516px] pl-9 border-[#EEEEEE] bg-[#FBFBFB] text-[#181C31] placeholder:text-[#999AA1] focus-visible:ring-[#20C5A8] focus-visible:ring-offset-0 rounded-xl"
        placeholder="Search boards"
        onChange={handleChange}
        value={value}
      />
    </div>
  );
};
