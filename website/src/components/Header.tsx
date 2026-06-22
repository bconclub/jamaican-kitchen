import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingCart, ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";
const menuItems = [{
  label: "Order Online",
  href: "/order"
}, {
  label: "Catering",
  href: "/catering"
}, {
  label: "Locations",
  href: "/locations"
}];
const moreItems = [{
  label: "Rewards / Login",
  href: "/rewards"
}, {
  label: "Download Mobile App",
  href: "/app"
}, {
  label: "FAQ",
  href: "/faq"
}, {
  label: "Contact Us",
  href: "/contact"
}, {
  label: "About Us",
  href: "/about"
}, {
  label: "Our Story",
  href: "/our-story"
}];
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const {
    totalItems
  } = useCart();
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-32 md:h-48 px-[59px]">
          {/* Left side - Hamburger Menu */}
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:h-10 md:w-10">
                  <Menu className="h-6 w-[43px]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-background p-0">
                <div className="flex flex-col h-full">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <img src={logo} alt="Jamaican Kitchen" className="h-10" />
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Menu Items */}
                  <nav className="flex-1 py-4 overflow-y-auto">
                    {menuItems.map((item, index) => <SheetClose key={item.href} asChild>
                        <Link to={item.href} className="flex items-center px-6 py-4 text-lg font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50" style={{
                      animationDelay: `${index * 50}ms`
                    }}>
                          {item.label}
                        </Link>
                      </SheetClose>)}

                    {/* More Section */}
                    <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-6 py-4 text-lg font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50">
                        <span>More</span>
                        {moreOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="bg-muted/30">
                        {moreItems.map(item => <SheetClose key={item.href} asChild>
                            <Link to={item.href} className="flex items-center px-8 py-3 text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/30">
                              {item.label}
                            </Link>
                          </SheetClose>)}
                      </CollapsibleContent>
                    </Collapsible>
                  </nav>

                  {/* Menu Footer */}
                  <div className="p-4 border-t border-border bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Authentic Jamaican Cuisine in CT
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/3 flex items-center">
            <img src={logo} alt="Jamaican Kitchen" className="h-40 md:h-44 w-auto object-contain drop-shadow-lg" />
          </Link>

          {/* Right side - Order Now + Cart */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center">
              <Link to="/order">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4 md:px-6 shadow-lg animate-pulse-glow rounded-r-none border-r border-primary-foreground/20">
                  Order Now
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 shadow-lg rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/order" className="flex items-center gap-2 cursor-pointer">
                      <UtensilsCrossed className="h-4 w-4" />
                      Order Online
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/catering" className="flex items-center gap-2 cursor-pointer">
                      <UtensilsCrossed className="h-4 w-4" />
                      Catering
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link to="/order">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>;
};