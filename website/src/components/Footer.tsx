import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="Jamaican Kitchen" className="h-14 mb-4 brightness-0 invert" />
            <p className="text-background/70 mb-4">
              Bringing authentic Jamaican flavors to Connecticut since the beginning. Just like Nana made it.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-primary">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/order" className="text-background/70 hover:text-primary transition-colors">Order Online</Link></li>
              <li><Link to="/catering" className="text-background/70 hover:text-primary transition-colors">Catering</Link></li>
              <li><Link to="/cuisine-guide" className="text-background/70 hover:text-primary transition-colors">Cuisine Guide</Link></li>
              <li><Link to="/locations" className="text-background/70 hover:text-primary transition-colors">Locations</Link></li>
              <li><Link to="/faq" className="text-background/70 hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-primary">Our Locations</h4>
            <ul className="space-y-2 text-background/70">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Vernon, CT</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> South Windsor, CT</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Windsor Locks, CT</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Bristol, CT</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Rocky Hill, CT</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Enfield, CT</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-primary">Contact</h4>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>(860) 555-JERK</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p>Mon-Sat: 11am - 9pm</p>
                  <p>Sunday: 12pm - 8pm</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 text-center text-background/50">
          <p>© {new Date().getFullYear()} Jamaican Kitchen CT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
