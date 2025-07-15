import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook,Trash2, Image,Upload ,Globe ,MessageSquare ,Smartphone ,ImageIcon ,FolderOpen , Calendar, Clock, Users, Save, Send, Link as LinkIcon, Link2, AlertTriangle, RefreshCw, Video, Film, Check, Shield, Lightbulb, MessageCircle, BarChart } from "lucide-react";


export default function PostTips() {
  return (
    <Card className="border-blue-100 dark:border-blue-900/30 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <span>Facebook Tips</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Best practices for effective posts</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Image className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Use engaging visuals</p>
                    <p className="text-xs text-muted-foreground">Posts with images get 2.3x more engagement</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ask questions</p>
                    <p className="text-xs text-muted-foreground">Encourage comments to boost engagement</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Post at optimal times</p>
                    <p className="text-xs text-muted-foreground">When your audience is most active</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                    <BarChart className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Track performance</p>
                    <p className="text-xs text-muted-foreground">Use Facebook Insights to optimize content</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
  );
}