'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: '홈', href: '/' },
    { label: '정치인 검색', href: '/politicians' },
    { label: '커뮤니티', href: '/community' },
    { label: '로그인', href: '/login' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span style={{ color: 'var(--color-brand-primary)' }}>Politician</span>
            <span>Finder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: isActive(item.href) ? 'var(--color-brand-primary)' : '#555555',
                  fontWeight: isActive(item.href) ? 'bold' : 'normal',
                  borderBottom: isActive(item.href) ? '2px solid var(--color-brand-primary)' : 'none',
                  paddingBottom: isActive(item.href) ? '2px' : '0',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.color = 'var(--color-brand-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.color = '#555555';
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  color: isActive(item.href) ? 'var(--color-brand-primary)' : '#555555',
                  fontWeight: isActive(item.href) ? 'bold' : 'normal',
                  backgroundColor: isActive(item.href) ? 'var(--color-brand-bg-light)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
