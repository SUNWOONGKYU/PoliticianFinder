"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// NProgress 설정
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 300,
  trickleSpeed: 200,
});

function ProgressBarHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

export default function ProgressBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        #nprogress {
          pointer-events: none;
        }

        #nprogress .bar {
          background: #3b82f6;
          position: fixed;
          z-index: 9999;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }

        #nprogress .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px #3b82f6, 0 0 5px #3b82f6;
          opacity: 1;
          transform: rotate(3deg) translate(0px, -4px);
        }

        .dark #nprogress .bar {
          background: #60a5fa;
        }

        .dark #nprogress .peg {
          box-shadow: 0 0 10px #60a5fa, 0 0 5px #60a5fa;
        }
      `}</style>
      <ProgressBarHandler />
      {children}
    </>
  );
}

// 페이지 이동 시 호출할 함수 (Link 클릭 시 사용)
export function startProgress() {
  NProgress.start();
}

export function stopProgress() {
  NProgress.done();
}
