import useSWR from "swr";

interface Template {
  id: string;
  name: string;
  thumbnail: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const TEMPLATES_KEY = "/api/templates";

export function useTemplates() {
  return useSWR<Template[]>(TEMPLATES_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });
}
