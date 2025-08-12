"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Bell, 
  Search, 
  Home, 
  LogOut, 
  Settings, 
  Sparkles,
  Command,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUserInitials, getUserDisplayName, getUserProfileImage } from "@/utils/userProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 h-16 flex items-center px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition-colors" />
        <Link href="/" className="flex items-center gap-3 lg:hidden">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white flex h-8 w-8 items-center justify-center rounded-xl shadow-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Social Studio
          </span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center max-w-md mx-auto">
        {/*<div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="search" 
            placeholder="Search posts, hashtags, insights..." 
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
              <Command className="h-2.5 w-2.5" />
              K
            </kbd>
          </div>
        </div>*/}
      </div>
      
      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <>
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] animate-pulse"
              >
                3
              </Badge>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 rounded-xl px-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-700 shadow-sm">
                        <AvatarImage src={getUserProfileImage(user)} alt={getUserDisplayName(user)} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-xs">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-white dark:border-slate-700"></div>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {getUserDisplayName(user)}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64 p-2" align="end">
                <DropdownMenuLabel className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                      <AvatarImage src={getUserProfileImage(user)} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuGroup className="py-2">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Profile</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Settings</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Preferences & integrations</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  onClick={logout}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer text-red-600 dark:text-red-400"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/50">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium">Sign out</p>
                    <p className="text-xs text-red-500 dark:text-red-400">Sign out of your account</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        
        {!isAuthenticated && (
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button size="sm" className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
