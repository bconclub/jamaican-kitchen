import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingCart, ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Order Online", href: "/order" },
  { label: "Catering", href: "/catering" },
  { label: "Locations", href: "/locations" },
];

const moreItems = [
  { label: "Rewards / Login", href: "/rewards" },
  { label: "Download Mobile App", href: "/app" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/our-story" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { totalItems, openCart } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Left: mobile hamburger + logo */}
          <div className="flex items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-background p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center p-4 border-b border-border">
                    <img src={logo} alt="Jamaican Kitchen" className="h-9" />
                  </div>
                  <nav className="flex-1 py-2 overflow-y-auto">
                    {navItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <Link
                          to={item.href}
                          className="flex items-center px-6 py-4 text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-6 py-4 text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50">
                        <span>More</span>
                        {moreOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="bg-muted/30">
                        {moreItems.map((item) => (
                          <SheetClose key={item.href} asChild>
                            <Link
                              to={item.href}
                              className="flex items-center px-8 py-3 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/30"
                            >
                              {item.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </nav>
                  <div className="p-4 border-t border-border bg-muted/50">
                    <p className="text-xs text-muted-foreground text-center">Authentic Jamaican Cuisine in CT</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center shrink-0">
              <img src={logo} alt="Jamaican Kitchen" className="h-10 md:h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 py-2 text-sm font-semibold text-foreground/80 hover:text-primary transition-colors rounded-md"
              >
                {item.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-foreground/80 hover:text-primary transition-colors rounded-md">
                  More <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="cursor-pointer">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right: Order Now + cart */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center">
              <Link to="/order">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-3 md:px-5 shadow-sm rounded-r-none border-r border-primary-foreground/20">
                  Order Now
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 shadow-sm rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/order" className="flex items-center gap-2 cursor-pointer">
                      <UtensilsCrossed className="h-4 w-4" /> Order Online
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/catering" className="flex items-center gap-2 cursor-pointer">
                      <UtensilsCrossed className="h-4 w-4" /> Catering
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="ghost" size="icon" className="relative" onClick={openCart} aria-label="Open cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
