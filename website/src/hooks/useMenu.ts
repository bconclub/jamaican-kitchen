import { useQuery } from "@tanstack/react-query";
import { fetchMenu, fetchLocations } from "@/lib/api";
import { menuCategories as staticMenu } from "@/data/menuData";

// Set VITE_USE_STATIC_MENU=true to render the bundled menuData (preview the new
// menu locally without touching the shared Supabase). Unset to read live data.
const USE_STATIC = import.meta.env.VITE_USE_STATIC_MENU === "true";

export function useMenu() {
  return useQuery({
    queryKey: ["menu", USE_STATIC],
    queryFn: USE_STATIC ? async () => staticMenu : fetchMenu,
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
