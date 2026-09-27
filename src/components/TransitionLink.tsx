"use client";

import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes } from "react";
import { useNavigate } from "./TransitionProvider";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function TransitionLink({ href, onClick, onMouseEnter, children, ...rest }: Props) {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <a
      href={href}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        if (href.startsWith("/")) router.prefetch(href.split("#")[0] || "/");
      }}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
