// components/RouteGuard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAuthenticated } from "@/lib/authenticate";

const PROTECTED = ["/favourites", "/history"];

export default function RouteGuard({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const path = router.pathname;

    if (!PROTECTED.includes(path)) {
      setOk(true);
      return;
    }

    if (isAuthenticated()) {
      setOk(true);
    } else {
      setOk(false);
      router.replace("/login");
    }
  }, [router.pathname]);

  if (!ok && PROTECTED.includes(router.pathname)) {
    return null; 
  }

  return children;
}
