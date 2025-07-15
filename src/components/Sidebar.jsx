"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Settings, 
  Hash, 
  FileText, 
  Calendar, 
  LayoutDashboard, 
  Plus, 
  LogOut, 
  Home,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  Palette
} from "lucide-react";
import { getUserInitials, getUserDisplayName, getUserEmail, getUserProfileImage } from "@/utils/userProfile";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AppSidebar() {
  const { user, isAuthenticated, supabase, refreshTokensFromDatabase, fbAccessToken, instagramAccessToken, youtubeAccessToken, logout } = useAuth();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const connectFacebook = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const scope =
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_read_user_content,public_profile,email";
    window.location.href = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=token&auth_type=rerequest`;
  };

  const connectInstagram = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope =
      "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";
    console.log("Using Instagram App ID:", appId);
    console.log("Redirect URI:", redirectUri);
    const state = crypto.randomUUID();
    localStorage.setItem("instagram_state", state);
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("force_reauth", "true");
    authUrl.searchParams.set("state", state);

    console.log("Instagram authorization URL:", authUrl);
    window.location.href = authUrl.toString();
  };

  // Wrapper component for tooltips when collapsed
  const ConditionalTooltip = ({ children, content, asChild = false }) => {
    if (!isCollapsed) return children;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild={asChild}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {content}
        </TooltipContent>
      </Tooltip>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <Sidebar 
        className={`border-r-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`} 
        style={{ flexShrink: 0 }}
        collapsible="icon"
      >
        <SidebarHeader className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`bg-gradient-to-br from-blue-600 to-purple-600 text-white flex ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} items-center justify-center rounded-xl shadow-lg`}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Social Studio
                  </h1>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className={`${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-8 transition-all duration-300`}>
          {/* Main Navigation */}
          <div className={`space-y-3 ${isCollapsed ? 'space-y-2' : ''}`}>
            <SidebarMenu>
              <SidebarMenuItem>
                <ConditionalTooltip content="Dashboard" asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard"}
                    className={`group ${isCollapsed ? 'h-10 w-10 p-0 justify-center' : 'h-12'} rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 transition-all duration-300 border-0`}
                  >
                    <Link href="/dashboard" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'}`}>
                      <div className="relative">
                        <LayoutDashboard className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        {pathname === "/dashboard" && (
                          <div className="absolute -inset-1 bg-blue-600/20 rounded-lg blur-sm"></div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            Dashboard
                          </span>
                          <Badge variant="secondary" className="ml-auto text-xs bg-slate-100 dark:bg-slate-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </ConditionalTooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Create Post Section */}
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide">CREATE</h3>
                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 flex-1 ml-3"></div>
              </div>
            )}
            
            <SidebarMenu className={`space-y-2 ${isCollapsed ? 'space-y-1' : ''}`}>
              <SidebarMenuItem>
                <ConditionalTooltip content="New Post" asChild>
                  <SidebarMenuButton className={`group ${isCollapsed ? 'h-10 w-10 p-0 justify-center' : 'h-11'} rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 transition-all duration-300`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} w-full`}>
                      <div className="relative">
                        <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <div className="absolute -inset-1 bg-emerald-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-slate-700 dark:text-slate-200">New Post</span>
                          <div className="ml-auto flex items-center gap-1">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-slate-500">AI</span>
                          </div>
                        </>
                      )}
                    </div>
                  </SidebarMenuButton>
                </ConditionalTooltip>
                
                {!isCollapsed && (
                  <SidebarMenuSub className="mt-3 space-y-1 ml-6">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/facebook"}
                        className="group h-9 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200"
                      >
                        <Link href="/facebook" className="flex items-center gap-3 px-3">
                          <div className="relative">
                            <Facebook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            {fbAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">Facebook</span>
                          
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/instagram"}
                        className="group h-9 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all duration-200"
                      >
                        <Link href="/instagram" className="flex items-center gap-3 px-3">
                          <div className="relative">
                            <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            {instagramAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">Instagram</span>
                          
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/youtube"}
                        className="group h-9 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                      >
                        <Link href="/youtube" className="flex items-center gap-3 px-3">
                          <div className="relative">
                            <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                            {youtubeAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">YouTube</span>
                          
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* Individual Platform Icons when collapsed */}
              {isCollapsed && (
                <>
                  <SidebarMenuItem>
                    <ConditionalTooltip content="Facebook" asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/facebook"}
                        className="group h-10 w-10 p-0 justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200"
                      >
                        <Link href="/facebook">
                          <div className="relative">
                            <Facebook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            {fbAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </ConditionalTooltip>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <ConditionalTooltip content="Instagram" asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/instagram"}
                        className="group h-10 w-10 p-0 justify-center rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all duration-200"
                      >
                        <Link href="/instagram">
                          <div className="relative">
                            <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            {instagramAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </ConditionalTooltip>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <ConditionalTooltip content="YouTube" asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/youtube"}
                        className="group h-10 w-10 p-0 justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                      >
                        <Link href="/youtube">
                          <div className="relative">
                            <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                            {youtubeAccessToken && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </ConditionalTooltip>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </div>

          {/* Tools Section */}
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide">TOOLS</h3>
                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 flex-1 ml-3"></div>
              </div>
            )}
            
            <SidebarMenu className={`space-y-2 ${isCollapsed ? 'space-y-1' : ''}`}>
              <SidebarMenuItem>
                <ConditionalTooltip content="Schedule" asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/scheduled"}
                    className={`group ${isCollapsed ? 'h-10 w-10 p-0 justify-center' : 'h-11'} rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 dark:hover:from-purple-950/50 dark:hover:to-violet-950/50 transition-all duration-300`}
                  >
                    <Link href="/scheduled" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}>
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-slate-700 dark:text-slate-200">Schedule</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            3
                          </Badge>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </ConditionalTooltip>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <ConditionalTooltip content="Hashtags" asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/hashtags"}
                    className={`group ${isCollapsed ? 'h-10 w-10 p-0 justify-center' : 'h-11'} rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 dark:hover:from-orange-950/50 dark:hover:to-amber-950/50 transition-all duration-300`}
                  >
                    <Link href="/hashtags" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}>
                      <Hash className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-slate-700 dark:text-slate-200">Hashtags</span>
                          <Badge variant="outline" className="ml-auto text-xs text-orange-600 border-orange-200">AI</Badge>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </ConditionalTooltip>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <ConditionalTooltip content="Templates" asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/settings" && new URLSearchParams(window.location.search).get("tab") === "templates"}
                    className={`group ${isCollapsed ? 'h-10 w-10 p-0 justify-center' : 'h-11'} rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-950/50 dark:hover:to-cyan-950/50 transition-all duration-300`}
                  >
                    <Link href="/settings?tab=templates" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}>
                      <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-slate-700 dark:text-slate-200">Templates</span>
                          <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </ConditionalTooltip>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <ConditionalTooltip content="Theme" asChild>
                  <div className={`group ${isCollapsed ? 'h-10 w-10 flex justify-center items-center' : 'h-11 px-3 flex items-center'} rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950/50 dark:hover:to-purple-950/50 transition-all duration-300`}>
                    {isCollapsed ? (
                      <ThemeToggle />
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">Theme</span>
                        <div className="ml-auto">
                          <ThemeToggle />
                        </div>
                      </div>
                    )}
                  </div>
                </ConditionalTooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className={`${isCollapsed ? 'p-2' : 'p-6'} border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-slate-50/80 to-transparent dark:from-slate-900/80 transition-all duration-300`}>
          {/* User Profile */}
          <div className={`${isCollapsed ? 'p-2' : 'p-4'} rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300`}>
            {isCollapsed ? (
              <ConditionalTooltip content={getUserDisplayName(user)} asChild>
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-700 shadow-md">
                      <AvatarImage src={getUserProfileImage(user)} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>
                </div>
              </ConditionalTooltip>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-md">
                      <AvatarImage src={getUserProfileImage(user)} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {getUserEmail(user)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href="/settings" className="flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50 transition-all duration-200"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
