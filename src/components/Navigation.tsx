import React from 'react';
import { Layers, ArrowLeftRight, MapPin, MessageSquare, User } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  matchCount?: number;
  privateMode?: boolean;
}

export default function Navigation({ activeTab, setActiveTab, unreadCount = 0, matchCount = 0, privateMode = false }: NavigationProps) {
  const navItems = [
    { id: 'inventory', label: 'Mi Álbum', icon: Layers, badge: null },
    { id: 'swap', label: 'Matcher', icon: ArrowLeftRight, badge: matchCount > 0 ? matchCount : null },
    { id: 'safezones', label: 'Zonas Seguras', icon: MapPin, badge: null },
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile', label: 'Mi Perfil', icon: User, badge: null },
  ].filter((item) => {
    if (privateMode) {
      // Show only inventory and profile in private mode
      return item.id === 'inventory' || item.id === 'profile';
    }
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md px-2 py-1 max-w-md mx-auto sm:max-w-xl md:max-w-2xl sm:rounded-t-2xl shadow-2xl" id="bottom-navigation-bar">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 rounded-xl ${
                isActive ? 'text-emerald-400 font-medium scale-105' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id={`nav-item-${item.id}`}
            >
              <div className="relative">
                <IconComponent className={`h-5 w-5 mb-0.5 transition-all ${isActive ? 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'stroke-[2px]'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wide mt-0.5">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
