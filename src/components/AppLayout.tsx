import { useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Camera, Home, Settings } from "lucide-react";

export function AppLayout() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) navigate("/nuevo", { state: { file } });
  };

  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <Outlet />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 items-center border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <NavLink to="/" end className={tab}><Home className="h-5 w-5" />Diario</NavLink>
        <div className="flex-1" />
        <NavLink to="/ajustes" className={tab}><Settings className="h-5 w-5" />Ajustes</NavLink>
        <button onClick={() => inputRef.current?.click()} aria-label="Registrar comida"
          className="absolute -top-7 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95">
          <Camera className="h-7 w-7" />
        </button>
      </nav>
    </div>
  );
}
