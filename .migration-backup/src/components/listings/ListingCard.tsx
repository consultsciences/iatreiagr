import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DbListing } from "@/lib/listings";

export const ListingCard = ({ l }: { l: DbListing }) => (
  <Link to={`/listing/${l.slug}`} className="block">
    <Card className="group h-full cursor-pointer overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {l.image_url && (
          <img
            src={l.image_url}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {l.badge && (
          <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground hover:bg-accent">
            {l.badge}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {l.city}
        </div>
        <h3 className="mb-2 line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
          {l.title}
        </h3>
        {l.meta && <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">{l.meta}</p>}
        {l.price_label && <div className="text-base font-bold text-primary">{l.price_label}</div>}
      </div>
    </Card>
  </Link>
);
