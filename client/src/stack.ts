import { StackClientApp } from "@stackframe/react";
import { useLocation } from "wouter";

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACKFRAME_PROJECT_ID || "78faa00d-4fb9-415b-9070-174466d82edc",
  publishableClientKey: import.meta.env.VITE_STACKFRAME_PUBLISHABLE_KEY || "pck_x939vmxgpv9vfy7t33tgd2dpyz713e5hr8vpkh0zqn09g",
  tokenStore: "cookie",
  redirectMethod: {
    useNavigate: () => {
      const [, setLocation] = useLocation();
      return setLocation;
    },
  }
});