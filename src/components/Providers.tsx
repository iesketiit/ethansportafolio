"use client";

import Cursor from "./Cursor";
import Effects from "./Effects";
import LiquidTitles from "./LiquidTitles";
import Nav from "./Nav";
import Preloader from "./Preloader";
import SmoothScroll from "./SmoothScroll";
import TransitionProvider from "./TransitionProvider";
import WebGLBackground from "./WebGLBackground";
import WeatherLayer from "./WeatherLayer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <TransitionProvider>
        <WebGLBackground />
        <WeatherLayer />
        <Preloader />
        <Nav />
        {children}
        <Effects />
        <LiquidTitles />
        <Cursor />
      </TransitionProvider>
    </SmoothScroll>
  );
}
