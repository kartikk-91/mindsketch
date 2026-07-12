import useSWR from "swr";

interface Template {
  id: string;
  name: string;
  thumbnail: string;
  snapshot: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function templateKey(templateId: string): string {
  return `/api/templates/${templateId}`;
}

export function useTemplate(templateId: string | undefined) {
  return useSWR<Template>(templateId ? templateKey(templateId) : null, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });
}
