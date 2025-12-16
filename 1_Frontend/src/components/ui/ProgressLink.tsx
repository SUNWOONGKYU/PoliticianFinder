"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { startProgress } from "@/components/providers/ProgressBarProvider";

interface ProgressLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function ProgressLink({
  children,
  className,
  target,
  rel,
  onClick,
  ...props
}: ProgressLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 외부 링크거나 새 탭에서 열리는 경우 프로그레스 바 시작하지 않음
    if (target === "_blank") {
      onClick?.(e);
      return;
    }

    // 같은 페이지 내 앵커 링크인 경우 프로그레스 바 시작하지 않음
    const href = props.href.toString();
    if (href.startsWith("#")) {
      onClick?.(e);
      return;
    }

    // 프로그레스 바 시작
    startProgress();
    onClick?.(e);
  };

  return (
    <Link {...props} className={className} target={target} rel={rel} onClick={handleClick}>
      {children}
    </Link>
  );
}
