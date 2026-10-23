import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLogoImg from "@/assets/AppLogo.png";
import { LayoutDashboard, Video } from "lucide-react";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  if (!user) return null;

  const navLinks = [
    {
      label: "Meetings",
      path: "/dashboard",
      icon: Video,
      active: location.pathname === "/dashboard",
    },
    {
      label: "Board",
      path: "/board",
      icon: LayoutDashboard,
      active: location.pathname.startsWith("/board"),
    },
  ];

  return (
    <>
      <nav className="h-16 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
              onClick={() => navigate("/dashboard")}
            >
              <img
                src={AppLogoImg}
                alt="IntellMeet"
                className="h-18 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ label, path, icon: Icon, active }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-full hover:bg-muted pl-1 pr-3 py-1 transition-colors outline-hidden border border-transparent hover:border-border/50 cursor-pointer"
            >
              <Avatar className="w-8 h-8 border border-border">
                {user.avatar && (
                  <AvatarImage src={user.avatar} alt={user.username} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-xs font-bold text-foreground leading-none">
                  {user.username.split(" ")[0]}
                </p>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around sm:hidden px-6 pb-safe shadow-lg">
        {navLinks.map(({ label, path, icon: Icon, active }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
