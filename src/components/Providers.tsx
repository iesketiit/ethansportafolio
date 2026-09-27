"use client";

import Cursor from "./Cursor";
import Effects from "./Effects";
import Nav from "./Nav";
import Preloader from "./Preloader";
import SmoothScroll from "./SmoothScroll";
import TransitionProvider from "./TransitionProvider";
import WebGLBackground from "./WebGLBackground";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <TransitionProvider>
        <WebGLBackground />
        <Preloader />
        <Nav />
        {children}
        <Effects />
        <Cursor />
      </TransitionProvider>
    </SmoothScroll>
  );
}
