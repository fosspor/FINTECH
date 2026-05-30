"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Flame, Shirt, Palette, Glasses, PackageOpen, Check, Lock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroOnboarding } from "@/components/hero-onboarding";
import { HeroAvatar3D } from "@/components/hero-avatar-3d";

type Category = "clothing" | "background" | "accessory";

type ShopItem = {
  id: string;
  name: string;
  category: Category;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  value: string; // Emoji or CSS class
};

const SHOP_ITEMS: ShopItem[] = [
  // Backgrounds
  { id: 'bg_default', name: 'Базовый', category: 'background', price: 0, rarity: 'common', value: 'bg-gradient-to-br from-primary/20 via-secondary/10 to-background' },
  { id: 'bg_neon', name: 'Киберпанк', category: 'background', price: 300, rarity: 'epic', value: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black' },
  { id: 'bg_gold', name: 'Золотой сейф', category: 'background', price: 800, rarity: 'legendary', value: 'bg-gradient-to-br from-amber-200 via-yellow-600 to-yellow-900' },
  { id: 'bg_matrix', name: 'Матрица', category: 'background', price: 150, rarity: 'rare', value: 'bg-gradient-to-br from-green-900 via-emerald-900 to-black' },
  
  // Clothing
  { id: 'cl_suit', name: 'Деловой костюм', category: 'clothing', price: 400, rarity: 'epic', value: '👔' },
  { id: 'cl_tshirt', name: 'Базовая футболка', category: 'clothing', price: 100, rarity: 'common', value: '👕' },
  { id: 'cl_coat', name: 'Пальто инвестора', category: 'clothing', price: 600, rarity: 'legendary', value: '🥼' },
  
  // Accessories
  { id: 'ac_glasses', name: 'Очки ботана', category: 'accessory', price: 150, rarity: 'common', value: '�' },
  { id: 'ac_crown', name: 'Корона крипты', category: 'accessory', price: 1000, rarity: 'legendary', value: '👑' },
  { id: 'ac_cap', name: 'Кепка стартапера', category: 'accessory', price: 200, rarity: 'rare', value: '🧢' },
];

export default function HeroPage() {
  const [activeTab, setActiveTab] = useState<Category>("clothing");
  const [crystals, setCrystals] = useState(450);
  const [inventory, setInventory] = useState<string[]>(['bg_default']);
  const [equipped, setEquipped] = useState<Record<Category, string | null>>({
    background: 'bg_default',
    clothing: null,
    accessory: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHeroCreated, setIsHeroCreated] = useState(false);

  // Load from local storage
  useEffect(() => {
    const storedCrystals = localStorage.getItem("finbro_crystals");
    const storedInv = localStorage.getItem("finbro_inventory");
    const storedEq = localStorage.getItem("finbro_equipped");
    const storedCreated = localStorage.getItem("finbro_hero_created");
    
    if (storedCrystals) setCrystals(parseInt(storedCrystals));
    if (storedInv) setInventory(JSON.parse(storedInv));
    if (storedEq) setEquipped(JSON.parse(storedEq));
    if (storedCreated === "true") setIsHeroCreated(true);
    
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("finbro_crystals", crystals.toString());
      localStorage.setItem("finbro_inventory", JSON.stringify(inventory));
      localStorage.setItem("finbro_equipped", JSON.stringify(equipped));
    }
  }, [crystals, inventory, equipped, isLoaded]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("finbro_hero_created", "true");
    setIsHeroCreated(true);
  };

  const handleBuy = (item: ShopItem) => {
    if (crystals >= item.price && !inventory.includes(item.id)) {
      setCrystals(c => c - item.price);
      setInventory(prev => [...prev, item.id]);
    }
  };

  const handleEquip = (item: ShopItem) => {
    if (inventory.includes(item.id)) {
      setEquipped(prev => {
        // Toggle off if already equipped
        if (prev[item.category] === item.id) {
          return { ...prev, [item.category]: null };
        }
        return { ...prev, [item.category]: item.id };
      });
    }
  };

  if (!isLoaded) return <div className="flex-1 flex items-center justify-center bg-background"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  if (!isHeroCreated) {
    return <HeroOnboarding onComplete={handleOnboardingComplete} />;
  }

  const currentBg = SHOP_ITEMS.find(i => i.id === equipped.background)?.value || 'bg-gradient-to-br from-primary/20 via-secondary/10 to-background';
  
  const filteredItems = SHOP_ITEMS.filter(i => i.category === activeTab);

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10 pb-20">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <h2 className="font-semibold text-xl">Мой Герой</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full font-bold text-sm border border-warning/20">
            <Flame className="w-4 h-4 fill-warning" /> 12
          </div>
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-500 px-3 py-1.5 rounded-full font-bold text-sm border border-sky-500/20">
            <Gem className="w-4 h-4 fill-sky-500" /> {crystals}
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col gap-8">
          {/* Avatar Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "w-full aspect-square rounded-[3rem] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-500",
              currentBg
            )}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 z-10"
            >
              <HeroAvatar3D />
            </motion.div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <Button 
              variant={activeTab === "clothing" ? "secondary" : "outline"} 
              className={cn("rounded-full px-5 h-10 transition-colors", activeTab === "clothing" ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-white/5 border-white/10 text-muted-foreground")}
              onClick={() => setActiveTab("clothing")}
            >
              <Shirt className="w-4 h-4 mr-2" /> Одежда
            </Button>
            <Button 
              variant={activeTab === "accessory" ? "secondary" : "outline"} 
              className={cn("rounded-full px-5 h-10 transition-colors", activeTab === "accessory" ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-white/5 border-white/10 text-muted-foreground")}
              onClick={() => setActiveTab("accessory")}
            >
              <Glasses className="w-4 h-4 mr-2" /> Аксессуары
            </Button>
            <Button 
              variant={activeTab === "background" ? "secondary" : "outline"} 
              className={cn("rounded-full px-5 h-10 transition-colors", activeTab === "background" ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-white/5 border-white/10 text-muted-foreground")}
              onClick={() => setActiveTab("background")}
            >
              <Palette className="w-4 h-4 mr-2" /> Фоны
            </Button>
          </div>

          {/* Shop Grid */}
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => {
                const isOwned = inventory.includes(item.id.toString());
                const isEquipped = equipped[item.category] === item.id.toString();
                const canAfford = crystals >= item.price;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "p-4 rounded-3xl border flex flex-col items-center text-center gap-3 relative overflow-hidden transition-colors",
                      isEquipped ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/20" : "bg-white/5 border-white/10"
                    )}
                  >
                    {item.rarity === 'legendary' && <div className="absolute inset-0 bg-gradient-to-tr from-warning/0 via-warning/10 to-transparent pointer-events-none" />}
                    {item.rarity === 'epic' && <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/10 to-transparent pointer-events-none" />}
                    
                    {/* Item Preview */}
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-1 shadow-inner", 
                      item.category === 'background' ? item.value : 'bg-black/20'
                    )}>
                      {item.category !== 'background' && item.value}
                    </div>

                    <div className="mt-auto w-full z-10">
                      <h4 className="font-bold text-sm leading-tight mb-2 h-10 flex items-center justify-center">{item.name}</h4>
                      
                      {isEquipped ? (
                        <Button size="sm" variant="secondary" className="w-full text-xs h-8 bg-primary/20 text-primary hover:bg-primary/30" onClick={() => handleEquip(item)}>
                          <Check className="w-3 h-3 mr-1" /> Надето
                        </Button>
                      ) : isOwned ? (
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-primary/50 hover:bg-primary/10 text-primary" onClick={() => handleEquip(item)}>
                          Надеть
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={!canAfford}
                          onClick={() => handleBuy(item)}
                          className="w-full text-xs h-8 gap-1.5 bg-white/10 hover:bg-white/20 text-foreground"
                        >
                          <Gem className="w-3 h-3 fill-sky-500 text-sky-500" /> {item.price}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
