"use client";
import { cn } from "@/lib/utils";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
];

const Navbar = () => {
  const pathName = usePathname();
  const { user } = useUser();
  return (
    <header className="w-full fixed z-50 bg-('--bg-primary')">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image
            src="/assets/logo.png"
            alt="ChatlyBook Logo"
            width={42}
            height={26}
            // className="w-20 h-auto"
          />
          <span className="logo-text">Chatlybook</span>
        </Link>

        <nav className="w-fit flex gap-7.5 items-center">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathName === href || (href !== "/" && pathName.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "nav-link-base",
                  isActive ? "nav-link-active" : "text-black hover:opacity-70",
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="flex gap-7.5 items-center">
            <Show when="signed-out">
              <div className="flex items-center gap-3">
                <SignInButton>
                  <button className="text-sm font-medium text-(--text-primary) hover:opacity-70 cursor-pointer">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="px-3 py-1.5 rounded-md bg-(--accent-warm) text-white text-sm font-medium hover:bg-(--accent-warm-hover) transition-colors cursor-pointer">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="nav-user-link">
                <UserButton />
                {user?.firstName && (
                  <Link href="/subscriptions" className="nav-user-name">
                    {user.firstName}
                  </Link>
                )}
              </div>
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
