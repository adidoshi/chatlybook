"use client";
import { useEffect } from "react";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
  { label: "Pricing", href: "/subscriptions" },
];

const Navbar = () => {
  const pathName = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    if (searchParams.get("signed_out") !== "1") return;

    toast.success("Signed out successfully.", {
      duration: 5000,
    });

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("signed_out");

    const nextQuery = nextSearchParams.toString();
    const nextUrl = nextQuery ? `${pathName}?${nextQuery}` : pathName;

    router.replace(nextUrl);
  }, [pathName, router, searchParams]);

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary)">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image
            src="/assets/book-icon.png"
            alt="ChatlyBook Logo"
            width={42}
            height={42}
          />
          <span className="logo-text">Chatlybook</span>
        </Link>

        <nav className="w-fit flex gap-7.5 items-center">
          {navItems.map(({ label, href }) => {
            const resolvedHref =
              label === "Add New" && !user
                ? "/sign-in?redirect_url=/books/new&fallback_redirect_url=/books/new"
                : href;
            const activePath = resolvedHref.split("?")[0];
            const isActive =
              pathName === activePath ||
              (activePath !== "/" && pathName.startsWith(activePath));
            return (
              <Link
                key={label}
                href={resolvedHref}
                className={cn(
                  "nav-link-base",
                  isActive ? "nav-link-active" : "text-black hover:opacity-70",
                  label === "Add New" && !user && "hidden sm:inline",
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="flex gap-7.5 items-center">
            <Show when="signed-out">
              <div className="flex items-center gap-3">
                <SignInButton forceRedirectUrl="/" fallbackRedirectUrl="/">
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
                  <span className="nav-user-name">{user.firstName}</span>
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
