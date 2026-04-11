import Image from "next/image";
import Link from "next/link";

const contactItems = [
  {
    label: "GitHub",
    href: "https://github.com/adidoshi",
    src: "/assets/github.png",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aditya-doshi08/",
    src: "/assets/linkedin.png",
  },
  {
    label: "adityadoshi25@gmail.com",
    href: "mailto:adityadoshi25@gmail.com",
    src: "/assets/gmail.svg",
  },
];

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-(--border-subtle) bg-(--bg-secondary)">
      <div className="wrapper py-8 md:py-10 lg:py-12">
        <div className="rounded-3xl border border-(--border-subtle) bg-(--bg-primary) p-6 md:p-10 shadow-(--shadow-soft-sm)">
          <div className="text-center space-y-2 md:space-y-3">
            <div className="flex justify-center gap-2">
              <Image
                src="/assets/book-icon.png"
                alt="Chatlybook Logo"
                width={40}
                height={40}
              />
              <h2 className="text-2xl md:text-4xl font-bold text-(--text-primary)">
                Chatlybook
              </h2>
            </div>
            <p className="text-sm md:text-base text-(--text-secondary)">
              AI powered summary and voice conversations for your books. Upload,
              chat, and listen!
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 border-t border-(--border-subtle) pt-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary)">
                Contact
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-(--text-secondary)">
                {contactItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <Image
                      src={item.src}
                      alt={item.label}
                      width={24}
                      height={24}
                    />
                    <Link
                      href={item.href}
                      className="transition-opacity hover:opacity-70"
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http") ? "noreferrer" : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-(--text-primary)">
                Built by {"</>"} Aditya Doshi
              </h3>
              <p className="mt-4 text-sm text-(--text-secondary) leading-6">
                Frontend Developer
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-(--text-primary)">
                Built with
              </h3>
              <p className="mt-4 text-sm text-(--text-secondary) leading-6">
                NextJs, MongoDB, Tailwind, Vapi, Clerk
              </p>
              <a
                href="https://github.com/adidoshi/chatlybook"
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                {"<"}Code {"/>"}
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-(--border-subtle) pt-5 text-center text-xs sm:text-sm text-(--text-secondary)">
            © 2026 All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
