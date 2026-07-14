import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart, type SelectedModifier } from "@/contexts/CartContext";
import { modifierGroups, type MenuItem, type ModifierGroup } from "@/data/menuData";
import { toast } from "sonner";

// counts: group slug -> option name -> quantity chosen
type Counts = Record<string, Record<string, number>>;

interface Props {
  item: MenuItem;
  trigger: React.ReactNode;
}

/**
 * Customization dialog for items that carry modifier groups. Enforces each
 * group's required/min/max rules, tallies add-on prices, and drops a fully
 * configured line into the cart (a distinct line per option combination).
 */
export const ItemCustomizeDialog = ({ item, trigger }: Props) => {
  const { addItem, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({});

  const groups: ModifierGroup[] = useMemo(
    () => (item.modifierGroups ?? []).map((s) => modifierGroups[s]).filter(Boolean),
    [item.modifierGroups]
  );

  const totalIn = (g: ModifierGroup) =>
    Object.values(counts[g.slug] ?? {}).reduce((s, n) => s + n, 0);

  const addonTotal = useMemo(() => {
    let sum = 0;
    for (const g of groups) {
      for (const o of g.options) {
        sum += o.price * (counts[g.slug]?.[o.name] ?? 0);
      }
    }
    return sum;
  }, [groups, counts]);

  const unitPrice = item.price + addonTotal;

  // Every required group must meet its minimum.
  const satisfied = groups.every((g) => !g.required || totalIn(g) >= Math.max(1, g.min));

  const setSingle = (g: ModifierGroup, name: string) =>
    setCounts((c) => ({ ...c, [g.slug]: { [name]: 1 } }));

  const toggleMulti = (g: ModifierGroup, name: string) =>
    setCounts((c) => {
      const cur = { ...(c[g.slug] ?? {}) };
      if (cur[name]) delete cur[name];
      else {
        if (totalIn(g) >= g.max) {
          toast.info(`Choose up to ${g.max} for ${g.name}.`);
          return c;
        }
        cur[name] = 1;
      }
      return { ...c, [g.slug]: cur };
    });

  const bump = (g: ModifierGroup, name: string, delta: number) =>
    setCounts((c) => {
      const cur = { ...(c[g.slug] ?? {}) };
      const next = (cur[name] ?? 0) + delta;
      if (delta > 0 && totalIn(g) >= g.max) {
        toast.info(`Up to ${g.max} for ${g.name}.`);
        return c;
      }
      if (next <= 0) delete cur[name];
      else cur[name] = next;
      return { ...c, [g.slug]: cur };
    });

  const reset = () => setCounts({});

  const handleAdd = () => {
    if (!satisfied) {
      toast.error("Please make the required selections.");
      return;
    }
    const mods: SelectedModifier[] = [];
    for (const g of groups) {
      for (const o of g.options) {
        const n = counts[g.slug]?.[o.name] ?? 0;
        for (let i = 0; i < n; i++) mods.push({ group: g.name, name: o.name, price: o.price });
      }
    }
    const sig = mods.map((m) => `${m.group}:${m.name}`).sort().join("|");
    addItem({
      id: sig ? `${item.id}::${sig}` : item.id,
      baseId: item.id,
      name: item.name,
      price: Number(unitPrice.toFixed(2)),
      spiceLevel: item.spiceLevel,
      image: item.image,
      modifiers: mods.length ? mods : undefined,
    });
    toast.success(`${item.name} added to your order!`);
    setOpen(false);
    reset();
    openCart();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[88vh] flex-col p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="pr-6 text-left text-2xl leading-tight">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-left text-base text-muted-foreground line-clamp-3">{item.description}</p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-5 py-4">
            {groups.map((g) => {
              const single = g.max === 1;
              return (
                <div key={g.slug}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h4 className="text-base font-semibold">{g.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {g.required ? "Required" : "Optional"}
                      {g.max > 1 ? ` · up to ${g.max}` : ""}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {g.options.map((o) => {
                      const n = counts[g.slug]?.[o.name] ?? 0;
                      const selected = n > 0;
                      return (
                        <div
                          key={o.name}
                          className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                            selected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              single ? setSingle(g, o.name) : g.multiSame ? bump(g, o.name, 1) : toggleMulti(g, o.name)
                            }
                            className="flex flex-1 items-center gap-2.5 text-left"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                                single ? "rounded-full" : "rounded"
                              } ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                            >
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                            </span>
                            <span className="text-base">{o.name}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            {o.price > 0 && (
                              <span className="text-sm font-medium text-secondary">+${o.price.toFixed(2)}</span>
                            )}
                            {g.multiSame && selected && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => bump(g, o.name, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center text-sm tabular-nums">{n}</span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => bump(g, o.name, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-border p-4">
          <Button
            className="h-12 w-full bg-secondary font-semibold text-lg text-secondary-foreground hover:bg-secondary/90"
            onClick={handleAdd}
            disabled={!satisfied}
          >
            {satisfied ? `Add to Order  ·  $${unitPrice.toFixed(2)}` : "Select required options"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
