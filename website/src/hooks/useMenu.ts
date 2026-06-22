import { useQuery } from "@tanstack/react-query";
import { fetchMenu, fetchLocations } from "@/lib/api";
import { menuCategories as staticMenu } from "@/data/menuData";

export function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
    initialData: staticMenu,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 10,
  });
}
